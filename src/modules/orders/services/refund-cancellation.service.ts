import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Order, OrderDocument, OrderStatus, PaymentStatus, PaymentMethod } from '../../orders/entities/order.entity';
import { User, UserDocument } from '../../users/entities/user.entity';
import { Wallet, WalletDocument } from '../../wallets/entities/wallet.entity';
import { Product, ProductDocument } from '../../products/entities/product.entity';
import { OrdersService } from '../../orders/orders.service';

export enum RefundType {
  FULL = 'full',
  PARTIAL = 'partial',
  PROCESSING_FEE_DEDUCTION = 'processing_fee_deduction',
}

export enum RefundReason {
  CUSTOMER_REQUEST = 'customer_request',
  PRODUCT_UNAVAILABLE = 'product_unavailable',
  QUALITY_ISSUE = 'quality_issue',
  DELIVERY_FAILURE = 'delivery_failure',
  PAYMENT_DISPUTE = 'payment_dispute',
  ADMIN_DECISION = 'admin_decision',
  SYSTEM_ERROR = 'system_error',
}

export enum RefundStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export interface RefundRequest {
  orderId: string;
  userId: string;
  type: RefundType;
  reason: RefundReason;
  customReason?: string;
  refundAmount: number;
  processingFee?: number;
  requestedBy: string;
  adminNotes?: string;
}

export interface RefundResult {
  success: boolean;
  refundId?: string;
  refundAmount?: number;
  processingFee?: number;
  netRefund?: number;
  walletCredited?: boolean;
  stockRestored?: boolean;
  reason?: string;
  transactionRef?: string;
}

export interface CancellationRequest {
  orderId: string;
  userId: string;
  reason: RefundReason;
  customReason?: string;
  requestedBy: string;
  adminApproval?: boolean;
}

export interface CancellationResult {
  success: boolean;
  cancelled: boolean;
  refundResult?: RefundResult;
  reason?: string;
  stockRestored?: boolean;
}

@Injectable()
export class RefundCancellationService {
  private readonly logger = new Logger(RefundCancellationService.name);

  // Refund configuration
  private readonly PROCESSING_FEE_PERCENTAGE = 2.5; // 2.5% processing fee
  private readonly MIN_PROCESSING_FEE = 100; // Minimum ₦100 processing fee
  private readonly MAX_PROCESSING_FEE = 5000; // Maximum ₦5000 processing fee
  private readonly FREE_CANCELLATION_WINDOW_HOURS = 2; // 2 hours free cancellation

  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Wallet.name) private walletModel: Model<WalletDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    private ordersService: OrdersService,
  ) {}

  /**
   * Process order cancellation with automatic refund
   */
  async cancelOrder(request: CancellationRequest): Promise<CancellationResult> {
    try {
      const order = await this.orderModel.findById(request.orderId);
      if (!order) {
        return {
          success: false,
          cancelled: false,
          reason: 'Order not found',
        };
      }

      // Verify ownership
      if (order.userId.toString() !== request.userId) {
        return {
          success: false,
          cancelled: false,
          reason: 'Unauthorized: Order does not belong to user',
        };
      }

      // Check if order can be cancelled
      const canCancel = this.canCancelOrder(order);
      if (!canCancel.allowed) {
        return {
          success: false,
          cancelled: false,
          reason: canCancel.reason,
        };
      }

      // Determine refund type and amount
      const refundDetails = this.calculateRefundAmount(order, request.reason);
      
      // Process refund if payment was made
      let refundResult: RefundResult | undefined;
      if (order.amountPaid > 0) {
        const refundRequest: RefundRequest = {
          orderId: request.orderId,
          userId: request.userId,
          type: refundDetails.type,
          reason: request.reason,
          customReason: request.customReason,
          refundAmount: refundDetails.amount,
          processingFee: refundDetails.processingFee,
          requestedBy: request.requestedBy,
        };

        refundResult = await this.processRefund(refundRequest);
      }

      // Update order status to CANCELLED
      await this.ordersService.updateOrderStatus(request.orderId, OrderStatus.CANCELLED, {
        reason: `Order cancelled: ${request.reason}${request.customReason ? ` - ${request.customReason}` : ''}`,
        updatedBy: request.requestedBy,
      });

      // Restore product stock
      const stockRestored = await this.restoreProductStock(order);

      this.logger.log(`Order ${request.orderId} cancelled successfully`);

      return {
        success: true,
        cancelled: true,
        refundResult,
        stockRestored,
      };

    } catch (error) {
      this.logger.error(`Error cancelling order ${request.orderId}: ${error.message}`, error.stack);
      return {
        success: false,
        cancelled: false,
        reason: `Cancellation failed: ${error.message}`,
      };
    }
  }

  /**
   * Process refund for paid orders
   */
  async processRefund(request: RefundRequest): Promise<RefundResult> {
    try {
      const order = await this.orderModel.findById(request.orderId);
      if (!order) {
        return {
          success: false,
          reason: 'Order not found',
        };
      }

      // Validate refund amount
      if (request.refundAmount > order.amountPaid) {
        return {
          success: false,
          reason: 'Refund amount cannot exceed amount paid',
        };
      }

      // Generate refund ID
      const refundId = `REF_${Date.now()}_${order.orderNumber}`;
      
      // Calculate net refund after processing fee
      const processingFee = request.processingFee || 0;
      const netRefund = Math.max(0, request.refundAmount - processingFee);

      // Process wallet credit
      const walletCredited = await this.creditUserWallet(
        request.userId,
        netRefund,
        refundId,
        `Refund for order ${order.orderNumber}`
      );

      if (!walletCredited) {
        return {
          success: false,
          reason: 'Failed to credit user wallet',
        };
      }

      // Update order with refund information
      await this.orderModel.updateOne(
        { _id: request.orderId },
        {
          $push: {
            paymentHistory: {
              amount: -request.refundAmount, // Negative amount for refund
              paymentMethod: PaymentMethod.FOOD_MONEY, // Refunded to wallet
              status: PaymentStatus.REFUNDED,
              paymentDate: new Date(),
              transactionRef: refundId,
              notes: `Refund: ${request.reason}${request.customReason ? ` - ${request.customReason}` : ''}`,
            }
          },
          $inc: {
            amountPaid: -request.refundAmount,
            remainingAmount: request.refundAmount,
          }
        }
      );

      // Log refund transaction
      await this.logRefundTransaction(order, request, refundId, netRefund, processingFee);

      this.logger.log(`Refund processed: ${refundId} for order ${order.orderNumber}, amount: ₦${netRefund}`);

      return {
        success: true,
        refundId,
        refundAmount: request.refundAmount,
        processingFee,
        netRefund,
        walletCredited: true,
        transactionRef: refundId,
      };

    } catch (error) {
      this.logger.error(`Error processing refund for order ${request.orderId}: ${error.message}`, error.stack);
      return {
        success: false,
        reason: `Refund processing failed: ${error.message}`,
      };
    }
  }

  /**
   * Check if order can be cancelled
   */
  private canCancelOrder(order: OrderDocument): { allowed: boolean; reason?: string } {
    // Orders that cannot be cancelled
    if (order.status === OrderStatus.CANCELLED) {
      return { allowed: false, reason: 'Order is already cancelled' };
    }

    if (order.status === OrderStatus.DELIVERED) {
      return { allowed: false, reason: 'Cannot cancel delivered orders' };
    }

    // Business rules for cancellation
    const orderAge = Date.now() - (order as any).createdAt.getTime();
    const ageInHours = orderAge / (1000 * 60 * 60);

    // If order is shipped, only allow cancellation within limited time
    if (order.status === OrderStatus.SHIPPED && ageInHours > 24) {
      return { allowed: false, reason: 'Cannot cancel orders that have been shipped for more than 24 hours' };
    }

    return { allowed: true };
  }

  /**
   * Calculate refund amount based on order status and reason
   */
  private calculateRefundAmount(order: OrderDocument, reason: RefundReason): {
    type: RefundType;
    amount: number;
    processingFee: number;
  } {
    const orderAge = Date.now() - (order as any).createdAt.getTime();
    const ageInHours = orderAge / (1000 * 60 * 60);

    // Free cancellation window (no processing fee)
    if (ageInHours <= this.FREE_CANCELLATION_WINDOW_HOURS) {
      return {
        type: RefundType.FULL,
        amount: order.amountPaid,
        processingFee: 0,
      };
    }

    // System errors or product unavailability - full refund no fee
    if ([RefundReason.SYSTEM_ERROR, RefundReason.PRODUCT_UNAVAILABLE, RefundReason.QUALITY_ISSUE].includes(reason)) {
      return {
        type: RefundType.FULL,
        amount: order.amountPaid,
        processingFee: 0,
      };
    }

    // Customer-initiated cancellations with processing fee
    const processingFee = this.calculateProcessingFee(order.amountPaid);
    
    return {
      type: RefundType.PROCESSING_FEE_DEDUCTION,
      amount: order.amountPaid,
      processingFee,
    };
  }

  /**
   * Calculate processing fee for refunds
   */
  private calculateProcessingFee(amount: number): number {
    const feeAmount = amount * (this.PROCESSING_FEE_PERCENTAGE / 100);
    return Math.min(Math.max(feeAmount, this.MIN_PROCESSING_FEE), this.MAX_PROCESSING_FEE);
  }

  /**
   * Credit user's wallet with refund amount
   */
  private async creditUserWallet(
    userId: string,
    amount: number,
    transactionRef: string,
    description: string
  ): Promise<boolean> {
    try {
      const result = await this.walletModel.updateOne(
        { userId: new Types.ObjectId(userId) },
        {
          $inc: { balance: amount },
          $push: {
            transactions: {
              type: 'credit',
              amount,
              description,
              transactionRef,
              timestamp: new Date(),
              status: 'completed',
            }
          }
        }
      );

      return result.modifiedCount > 0;
    } catch (error) {
      this.logger.error(`Failed to credit wallet for user ${userId}: ${error.message}`);
      return false;
    }
  }

  /**
   * Restore product stock for cancelled orders
   */
  private async restoreProductStock(order: OrderDocument): Promise<boolean> {
    try {
      // Only restore stock if order was paid (stock was deducted)
      if (order.status !== OrderStatus.PAID && order.status !== OrderStatus.SHIPPED) {
        return true; // No stock to restore
      }

      for (const item of order.items) {
        await this.productModel.updateOne(
          { _id: item.productId },
          { $inc: { stock: item.quantity } }
        );
      }

      this.logger.log(`Stock restored for order ${order.orderNumber}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to restore stock for order ${order.orderNumber}: ${error.message}`);
      return false;
    }
  }

  /**
   * Log refund transaction for audit trail
   */
  private async logRefundTransaction(
    order: OrderDocument,
    request: RefundRequest,
    refundId: string,
    netRefund: number,
    processingFee: number
  ): Promise<void> {
    // In a real implementation, this would log to a dedicated refunds collection
    // For now, we'll just add to order history
    await this.ordersService.addStatusHistory(request.orderId, {
      status: order.status,
      reason: `Refund processed: ${refundId}, Amount: ₦${netRefund}, Fee: ₦${processingFee}`,
      updatedBy: request.requestedBy,
    });
  }

  /**
   * Get refund eligibility for an order
   */
  async getRefundEligibility(orderId: string, userId: string): Promise<{
    eligible: boolean;
    reason?: string;
    maxRefundAmount?: number;
    processingFee?: number;
    freeWindow?: boolean;
  }> {
    try {
      const order = await this.orderModel.findById(orderId);
      if (!order) {
        return { eligible: false, reason: 'Order not found' };
      }

      if (order.userId.toString() !== userId) {
        return { eligible: false, reason: 'Unauthorized' };
      }

      const canCancel = this.canCancelOrder(order);
      if (!canCancel.allowed) {
        return { eligible: false, reason: canCancel.reason };
      }

      const orderAge = Date.now() - (order as any).createdAt.getTime();
      const ageInHours = orderAge / (1000 * 60 * 60);
      const freeWindow = ageInHours <= this.FREE_CANCELLATION_WINDOW_HOURS;
      const processingFee = freeWindow ? 0 : this.calculateProcessingFee(order.amountPaid);

      return {
        eligible: true,
        maxRefundAmount: order.amountPaid,
        processingFee,
        freeWindow,
      };
    } catch (error) {
      this.logger.error(`Error checking refund eligibility: ${error.message}`);
      return { eligible: false, reason: 'Error checking eligibility' };
    }
  }

  /**
   * Get refund history for a user
   */
  async getRefundHistory(userId: string, limit: number = 20, offset: number = 0) {
    try {
      const refunds = await this.orderModel.aggregate([
        {
          $match: {
            userId: new Types.ObjectId(userId),
            'paymentHistory.status': PaymentStatus.REFUNDED
          }
        },
        {
          $unwind: '$paymentHistory'
        },
        {
          $match: {
            'paymentHistory.status': PaymentStatus.REFUNDED
          }
        },
        {
          $project: {
            orderNumber: 1,
            refundAmount: { $abs: '$paymentHistory.amount' },
            refundDate: '$paymentHistory.paymentDate',
            transactionRef: '$paymentHistory.transactionRef',
            reason: '$paymentHistory.notes',
            status: OrderStatus.CANCELLED,
          }
        },
        {
          $sort: { refundDate: -1 }
        },
        {
          $skip: offset
        },
        {
          $limit: limit
        }
      ]);

      return {
        refunds,
        total: refunds.length,
      };
    } catch (error) {
      this.logger.error(`Error getting refund history for user ${userId}: ${error.message}`);
      return { refunds: [], total: 0 };
    }
  }

  /**
   * Get refund analytics for admin
   */
  async getRefundAnalytics(timeframe: 'day' | 'week' | 'month' = 'month') {
    const now = new Date();
    const startDate = new Date();

    switch (timeframe) {
      case 'day':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
    }

    try {
      const analytics = await this.orderModel.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate },
            $or: [
              { status: OrderStatus.CANCELLED },
              { 'paymentHistory.status': PaymentStatus.REFUNDED }
            ]
          }
        },
        {
          $group: {
            _id: null,
            totalCancellations: {
              $sum: { $cond: [{ $eq: ['$status', OrderStatus.CANCELLED] }, 1, 0] }
            },
            totalRefundAmount: {
              $sum: {
                $reduce: {
                  input: '$paymentHistory',
                  initialValue: 0,
                  in: {
                    $cond: [
                      { $eq: ['$$this.status', PaymentStatus.REFUNDED] },
                      { $add: ['$$value', { $abs: '$$this.amount' }] },
                      '$$value'
                    ]
                  }
                }
              }
            },
            avgRefundAmount: {
              $avg: {
                $reduce: {
                  input: '$paymentHistory',
                  initialValue: 0,
                  in: {
                    $cond: [
                      { $eq: ['$$this.status', PaymentStatus.REFUNDED] },
                      { $abs: '$$this.amount' },
                      '$$value'
                    ]
                  }
                }
              }
            }
          }
        }
      ]);

      return analytics[0] || {
        totalCancellations: 0,
        totalRefundAmount: 0,
        avgRefundAmount: 0,
      };
    } catch (error) {
      this.logger.error(`Error getting refund analytics: ${error.message}`);
      return {
        totalCancellations: 0,
        totalRefundAmount: 0,
        avgRefundAmount: 0,
      };
    }
  }
}
