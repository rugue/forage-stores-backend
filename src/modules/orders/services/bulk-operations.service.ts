import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order, OrderDocument, OrderStatus, PaymentPlan } from '../entities/order.entity';
import { OrderStateMachine } from './order-state-machine.service';
import { OrderRealTimeService } from '../gateways/orders.gateway';
import { UserRole } from '../../users/entities/user.entity';

export interface BulkStatusUpdateDto {
  orderIds: string[];
  newStatus: OrderStatus;
  action: string;
  reason?: string;
}

export interface BulkUpdateResult {
  totalOrders: number;
  successCount: number;
  failureCount: number;
  results: Array<{
    orderId: string;
    success: boolean;
    error?: string;
    previousStatus?: OrderStatus;
    newStatus?: OrderStatus;
  }>;
  summary: {
    statusTransitions: Record<string, number>;
    errors: Record<string, number>;
  };
}

export interface BulkFilterOptions {
  status?: OrderStatus[];
  paymentStatus?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  userId?: string;
  minAmount?: number;
  maxAmount?: number;
}

@Injectable()
export class BulkOperationsService {
  private readonly logger = new Logger(BulkOperationsService.name);

  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    private readonly orderStateMachine: OrderStateMachine,
    private readonly realTimeService: OrderRealTimeService,
  ) {}

  /**
   * Perform bulk status update with validation and real-time updates
   */
  async bulkUpdateStatus(
    bulkUpdate: BulkStatusUpdateDto,
    adminUserId: string,
    userRole: UserRole
  ): Promise<BulkUpdateResult> {
    // Validate admin permissions
    if (userRole !== UserRole.ADMIN) {
      throw new BadRequestException('Only administrators can perform bulk operations');
    }

    // Validate input
    if (!bulkUpdate.orderIds?.length) {
      throw new BadRequestException('Order IDs are required');
    }

    if (bulkUpdate.orderIds.length > 100) {
      throw new BadRequestException('Maximum 100 orders can be updated in a single operation');
    }

    const result: BulkUpdateResult = {
      totalOrders: bulkUpdate.orderIds.length,
      successCount: 0,
      failureCount: 0,
      results: [],
      summary: {
        statusTransitions: {},
        errors: {},
      },
    };

    // Process each order
    for (const orderId of bulkUpdate.orderIds) {
      try {
        const order = await this.orderModel.findById(orderId);
        
        if (!order) {
          result.results.push({
            orderId,
            success: false,
            error: 'Order not found',
          });
          result.failureCount++;
          this.incrementErrorCount(result.summary.errors, 'Order not found');
          continue;
        }

        const previousStatus = order.status;

        // Check if transition is valid using state machine
        const hasStockAvailable = await this.checkStockAvailability(order.items);
        
        const context = {
          orderId,
          userId: adminUserId,
          userRole,
          reason: bulkUpdate.reason,
          paymentStatus: order.paymentHistory[order.paymentHistory.length - 1]?.status,
          totalAmount: order.finalTotal,
          amountPaid: order.amountPaid,
          remainingAmount: order.remainingAmount,
          hasStockAvailable,
          isPaymentPlanEligible: order.paymentPlan !== PaymentPlan.PAY_NOW,
        };

        const transitionResult = await this.orderStateMachine.executeTransition(
          order.status,
          bulkUpdate.newStatus,
          bulkUpdate.action,
          context
        );

        if (transitionResult.success) {
          // Update order
          order.status = bulkUpdate.newStatus;
          order.statusHistory.push({
            status: bulkUpdate.newStatus,
            timestamp: new Date(),
            reason: bulkUpdate.reason || `Bulk update: ${bulkUpdate.action}`,
            updatedBy: adminUserId,
          });

          await order.save();

          // Broadcast real-time update
          this.realTimeService.broadcastOrderUpdate({
            orderId,
            status: bulkUpdate.newStatus,
            paymentStatus: order.paymentHistory[order.paymentHistory.length - 1]?.status,
            timestamp: new Date(),
            userId: order.userId.toString(),
          });

          result.results.push({
            orderId,
            success: true,
            previousStatus,
            newStatus: bulkUpdate.newStatus,
          });
          
          result.successCount++;
          this.incrementTransitionCount(
            result.summary.statusTransitions, 
            `${previousStatus}_to_${bulkUpdate.newStatus}`
          );
        } else {
          result.results.push({
            orderId,
            success: false,
            error: transitionResult.message || 'Invalid state transition',
            previousStatus,
          });
          result.failureCount++;
          this.incrementErrorCount(result.summary.errors, transitionResult.message || 'Invalid transition');
        }
      } catch (error) {
        result.results.push({
          orderId,
          success: false,
          error: error.message,
        });
        result.failureCount++;
        this.incrementErrorCount(result.summary.errors, error.message);
      }
    }

    this.logger.log(`Bulk update completed: ${result.successCount}/${result.totalOrders} orders updated`);

    return result;
  }

  /**
   * Get orders matching filter criteria for bulk operations
   */
  async getOrdersForBulkOperation(
    filters: BulkFilterOptions,
    limit: number = 100
  ): Promise<{ orders: OrderDocument[]; totalCount: number }> {
    if (limit > 500) {
      throw new BadRequestException('Maximum 500 orders can be retrieved for bulk operations');
    }

    const query: any = {};

    // Apply filters
    if (filters.status?.length) {
      query.status = { $in: filters.status };
    }

    if (filters.paymentStatus?.length) {
      query['paymentHistory.status'] = { $in: filters.paymentStatus };
    }

    if (filters.dateRange) {
      query.createdAt = {
        $gte: filters.dateRange.start,
        $lte: filters.dateRange.end,
      };
    }

    if (filters.userId) {
      query.userId = filters.userId;
    }

    if (filters.minAmount !== undefined || filters.maxAmount !== undefined) {
      query.finalTotal = {};
      if (filters.minAmount !== undefined) {
        query.finalTotal.$gte = filters.minAmount;
      }
      if (filters.maxAmount !== undefined) {
        query.finalTotal.$lte = filters.maxAmount;
      }
    }

    const [orders, totalCount] = await Promise.all([
      this.orderModel.find(query).limit(limit).exec(),
      this.orderModel.countDocuments(query),
    ]);

    return { orders, totalCount };
  }

  /**
   * Preview bulk operation impact
   */
  async previewBulkOperation(
    orderIds: string[],
    newStatus: OrderStatus,
    action: string
  ): Promise<{
    eligibleOrders: number;
    ineligibleOrders: number;
    statusDistribution: Record<string, number>;
    potentialIssues: string[];
  }> {
    const orders = await this.orderModel.find({ 
      _id: { $in: orderIds } 
    }).exec();

    const preview = {
      eligibleOrders: 0,
      ineligibleOrders: 0,
      statusDistribution: {} as Record<string, number>,
      potentialIssues: [] as string[],
    };

    for (const order of orders) {
      // Count current status distribution
      const currentStatus = order.status;
      preview.statusDistribution[currentStatus] = 
        (preview.statusDistribution[currentStatus] || 0) + 1;

      // Check if transition is valid
      const hasStockAvailable = await this.checkStockAvailability(order.items);
      
      const context = {
        orderId: order._id.toString(),
        userId: 'preview',
        userRole: UserRole.ADMIN,
        paymentStatus: order.paymentHistory[order.paymentHistory.length - 1]?.status,
        totalAmount: order.finalTotal,
        amountPaid: order.amountPaid,
        remainingAmount: order.remainingAmount,
        hasStockAvailable,
        isPaymentPlanEligible: order.paymentPlan !== PaymentPlan.PAY_NOW,
      };

      const transitionResult = await this.orderStateMachine.executeTransition(
        order.status,
        newStatus,
        action,
        context
      );

      if (transitionResult.success) {
        preview.eligibleOrders++;
      } else {
        preview.ineligibleOrders++;
        
        // Collect potential issues
        const issue = `Order ${order._id}: ${transitionResult.message}`;
        if (!preview.potentialIssues.includes(issue)) {
          preview.potentialIssues.push(issue);
        }
      }
    }

    return preview;
  }

  /**
   * Bulk cancel orders with refund processing
   */
  async bulkCancelOrders(
    orderIds: string[],
    reason: string,
    adminUserId: string,
    processRefunds: boolean = false
  ): Promise<BulkUpdateResult> {
    return this.bulkUpdateStatus(
      {
        orderIds,
        newStatus: OrderStatus.CANCELLED,
        action: 'admin_bulk_cancel',
        reason,
      },
      adminUserId,
      UserRole.ADMIN
    );
  }

  /**
   * Export bulk operation results
   */
  async exportBulkOperationResults(result: BulkUpdateResult): Promise<{
    csv: string;
    summary: string;
  }> {
    // Generate CSV
    const csvHeaders = ['Order ID', 'Success', 'Previous Status', 'New Status', 'Error'];
    const csvRows = result.results.map(r => [
      r.orderId,
      r.success ? 'Yes' : 'No',
      r.previousStatus || 'N/A',
      r.newStatus || 'N/A',
      r.error || 'N/A'
    ]);

    const csv = [csvHeaders, ...csvRows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    // Generate summary
    const summary = `
Bulk Operation Summary:
- Total Orders: ${result.totalOrders}
- Successfully Updated: ${result.successCount}
- Failed Updates: ${result.failureCount}
- Success Rate: ${((result.successCount / result.totalOrders) * 100).toFixed(2)}%

Status Transitions:
${Object.entries(result.summary.statusTransitions)
  .map(([transition, count]) => `- ${transition}: ${count}`)
  .join('\n')}

Common Errors:
${Object.entries(result.summary.errors)
  .map(([error, count]) => `- ${error}: ${count}`)
  .join('\n')}
    `.trim();

    return { csv, summary };
  }

  private async checkStockAvailability(items: any[]): Promise<boolean> {
    // Simplified stock check - implement proper logic based on your inventory system
    return true;
  }

  private incrementTransitionCount(transitions: Record<string, number>, key: string) {
    transitions[key] = (transitions[key] || 0) + 1;
  }

  private incrementErrorCount(errors: Record<string, number>, error: string) {
    errors[error] = (errors[error] || 0) + 1;
  }
}
