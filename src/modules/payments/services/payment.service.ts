import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Payment, PaymentDocument } from '../entities/payment.entity';
import { Refund, RefundDocument } from '../entities/refund.entity';
import { PaymentPlanEntity, PaymentPlanDocument } from '../entities/payment-plan.entity';
import { PaymentStrategyFactory } from '../strategies/payment-strategy.factory';
import { 
  PaymentInitiationDto, 
  PaymentVerificationDto, 
  RefundRequestDto,
  PaymentQueryDto,
  PaymentAnalyticsDto
} from '../dto/payment.dto';
import { 
  PaymentStatus, 
  PaymentType, 
  PaymentMethod,
  PaymentGateway,
  RefundStatus,
  PAYMENT_CONSTANTS
} from '../constants/payment.constants';
import {
  IPaymentRequest,
  IPaymentResponse,
  IPaymentVerification,
  IRefundRequest,
  IRefundResponse,
  IPaymentAnalytics,
  IPaymentStrategy
} from '../interfaces/payment.interface';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    @InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>,
    @InjectModel(Refund.name) private refundModel: Model<RefundDocument>,
    @InjectModel(PaymentPlanEntity.name) private paymentPlanModel: Model<PaymentPlanDocument>,
    private readonly configService: ConfigService,
    private readonly eventEmitter: EventEmitter2,
    private readonly strategyFactory: PaymentStrategyFactory,
  ) {}

  /**
   * Initiate a payment
   */
  async initiatePayment(userId: string, dto: PaymentInitiationDto): Promise<IPaymentResponse> {
    try {
      this.logger.log(`Initiating payment for user ${userId} with order ${dto.orderId}`);

      // Validate order exists and get details
      const orderDetails = await this.validateAndGetOrderDetails(dto.orderId, userId);
      
      // Calculate payment amount based on payment type
      const paymentAmount = await this.calculatePaymentAmount(orderDetails, dto);
      
      // Generate unique payment reference
      const paymentReference = this.generatePaymentReference();
      
      // Create payment record
      const paymentData: Partial<Payment> = {
        reference: paymentReference,
        userId: new Types.ObjectId(userId),
        amount: paymentAmount,
        paymentType: dto.paymentType,
        paymentMethod: dto.paymentMethod,
        gateway: dto.gateway,
        status: PaymentStatus.PENDING,
        currency: PAYMENT_CONSTANTS.DEFAULT_CURRENCY,
        netAmount: paymentAmount, // Will be updated after fee calculation
        metadata: {
          orderId: dto.orderId,
          additional: dto.metadata || {},
        },
      };

      const payment = new this.paymentModel(paymentData);
      await payment.save();

      // Get appropriate payment strategy
      let strategy: IPaymentStrategy;
      
      try {
        strategy = this.strategyFactory.getGatewayStrategy(dto.gateway);
      } catch (error) {
        // If gateway strategy not available, return mock response for now
        this.logger.warn(`Gateway strategy not available for ${dto.gateway}, returning mock response`);
        return {
          transactionId: payment._id.toString(),
          reference: paymentReference,
          status: PaymentStatus.PENDING,
          gateway: dto.gateway,
          authorizationUrl: `https://mock-gateway.com/pay/${paymentReference}`,
          message: 'Payment initiation successful',
          fees: this.calculateFees(paymentAmount, dto.gateway),
          netAmount: paymentAmount - this.calculateFees(paymentAmount, dto.gateway),
        };
      }

      // Prepare payment request
      const paymentRequest: IPaymentRequest = {
        orderId: dto.orderId,
        userId,
        amount: paymentAmount,
        currency: PAYMENT_CONSTANTS.DEFAULT_CURRENCY,
        paymentMethod: dto.paymentMethod,
        paymentType: dto.paymentType,
        metadata: {
          ...dto.metadata,
          paymentReference,
          customerEmail: orderDetails.customerEmail,
          customerPhone: orderDetails.customerPhone,
          customerName: orderDetails.customerName,
        },
      };

      const response = await strategy.initializePayment(paymentRequest);

      // Update payment with gateway response
      await this.paymentModel.findByIdAndUpdate(payment._id, {
        gatewayResponse: {
          gatewayTransactionId: response.transactionId,
          gatewayReference: response.reference,
          authorizationUrl: response.authorizationUrl,
          message: response.message,
          rawResponse: response,
        },
        fees: {
          gatewayFee: response.fees || 0,
          serviceFee: 0,
          otherFees: 0,
          totalFees: response.fees || 0,
        },
        netAmount: response.netAmount || (paymentAmount - (response.fees || 0)),
      });

      // Handle payment plan creation for applicable types
      if (this.requiresPaymentPlan(dto.paymentType)) {
        await this.createPaymentPlan(payment._id as Types.ObjectId, dto, paymentAmount, orderDetails.totalAmount);
      }

      // Emit payment initiated event
      this.eventEmitter.emit('payment.initiated', {
        paymentId: payment._id,
        userId,
        orderId: dto.orderId,
        amount: paymentAmount,
        reference: paymentReference,
      });

      return response;
    } catch (error) {
      this.logger.error(`Error initiating payment: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Verify payment status
   */
  async verifyPayment(dto: PaymentVerificationDto): Promise<IPaymentVerification> {
    try {
      this.logger.log(`Verifying payment with reference: ${dto.reference}`);

      // Find payment record
      const payment = await this.paymentModel.findOne({ reference: dto.reference });
      if (!payment) {
        throw new NotFoundException(`Payment with reference ${dto.reference} not found`);
      }

      // If already verified, return cached result
      if (payment.status === PaymentStatus.COMPLETED) {
        return {
          transactionId: payment.gatewayResponse?.gatewayTransactionId || payment._id.toString(),
          reference: dto.reference,
          status: payment.status,
          amount: payment.amount,
          currency: payment.currency,
          paidAt: payment.completedAt,
          gateway: payment.gateway,
          gatewayResponse: payment.gatewayResponse?.rawResponse || {},
          fees: payment.fees?.totalFees || 0,
          netAmount: payment.netAmount,
        };
      }

      // Get strategy and verify with gateway
      try {
        const strategy = this.strategyFactory.getGatewayStrategy(dto.gateway);
        const verificationResult = await strategy.verifyPayment(dto.reference);

        // Update payment status
        const updateData: Partial<Payment> = {
          status: verificationResult.status,
          completedAt: verificationResult.status === PaymentStatus.COMPLETED ? new Date() : undefined,
          fees: {
            gatewayFee: verificationResult.fees,
            serviceFee: 0,
            otherFees: 0,
            totalFees: verificationResult.fees,
          },
          netAmount: verificationResult.netAmount,
        };

        if (verificationResult.status === PaymentStatus.COMPLETED) {
          updateData.gatewayResponse = {
            ...payment.gatewayResponse,
            gatewayTransactionId: verificationResult.transactionId,
            gatewayReference: verificationResult.reference,
            message: 'Payment verified successfully',
            rawResponse: verificationResult.gatewayResponse,
          };
        }

        await this.paymentModel.findByIdAndUpdate(payment._id, updateData);

        // Handle payment plan updates if applicable
        if (verificationResult.status === PaymentStatus.COMPLETED && payment.metadata?.orderId) {
          // Find payment plan by order ID if exists
          const paymentPlan = await this.paymentPlanModel.findOne({ 
            orderId: payment.metadata.orderId,
            userId: payment.userId 
          });
          if (paymentPlan) {
            await this.updatePaymentPlan(paymentPlan._id as Types.ObjectId, payment.amount);
          }
        }

        // Emit verification event
        this.eventEmitter.emit('payment.verified', {
          paymentId: payment._id,
          verified: verificationResult.status === PaymentStatus.COMPLETED,
          userId: payment.userId,
          orderId: payment.metadata?.orderId,
          amount: payment.amount,
          reference: dto.reference,
        });

        return verificationResult;
      } catch (strategyError) {
        this.logger.warn(`Strategy verification failed, returning mock result: ${strategyError.message}`);
        
        // Return mock verification for development
        const mockVerification: IPaymentVerification = {
          transactionId: payment._id.toString(),
          reference: dto.reference,
          status: PaymentStatus.COMPLETED,
          amount: payment.amount,
          currency: payment.currency,
          paidAt: new Date(),
          gateway: payment.gateway,
          gatewayResponse: {},
          fees: this.calculateFees(payment.amount, payment.gateway),
          netAmount: payment.amount - this.calculateFees(payment.amount, payment.gateway),
        };

        // Update payment status for mock
        await this.paymentModel.findByIdAndUpdate(payment._id, {
          status: PaymentStatus.COMPLETED,
          fees: mockVerification.fees,
        });

        return mockVerification;
      }
    } catch (error) {
      this.logger.error(`Error verifying payment: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Process refund request
   */
  async processRefund(userId: string, dto: RefundRequestDto): Promise<IRefundResponse> {
    try {
      this.logger.log(`Processing refund for payment ${dto.paymentId} by user ${userId}`);

      // Find and validate payment
      const payment = await this.paymentModel.findById(dto.paymentId);
      if (!payment) {
        throw new NotFoundException('Payment not found');
      }

      if (payment.userId.toString() !== userId) {
        throw new BadRequestException('Unauthorized to refund this payment');
      }

      if (payment.status !== PaymentStatus.COMPLETED) {
        throw new BadRequestException('Can only refund successful payments');
      }

      // Check if refund amount is valid
      if (dto.amount > payment.amount) {
        throw new BadRequestException('Refund amount exceeds payment amount');
      }

      // Check for existing refunds
      const existingRefunds = await this.refundModel.find({ paymentId: payment._id });
      const totalRefunded = existingRefunds.reduce((sum, refund) => 
        refund.status === RefundStatus.APPROVED ? sum + refund.amount : sum, 0);

      if (totalRefunded + dto.amount > payment.amount) {
        throw new BadRequestException('Total refund amount would exceed payment amount');
      }

      // Generate refund reference
      const refundReference = this.generateRefundReference();

      // Create refund record
      const refundData: Partial<Refund> = {
        refundReference,
        paymentId: payment._id as Types.ObjectId,
        userId: new Types.ObjectId(userId),
        amount: dto.amount,
        reason: dto.reason,
        status: RefundStatus.PENDING,
        gateway: payment.gateway,
        isPartialRefund: dto.isPartialRefund || false,
      };

      const refund = new this.refundModel(refundData);
      await refund.save();

      // For now, return success response as gateway strategies are not implemented
      const refundResult: IRefundResponse = {
        refundId: refundReference,
        transactionId: payment.gatewayResponse?.gatewayTransactionId || payment._id.toString(),
        amount: dto.amount,
        status: RefundStatus.PROCESSING,
        gateway: payment.gateway,
        message: 'Refund request submitted successfully',
        gatewayResponse: {
          estimatedProcessingTime: '3-5 business days',
        },
      };

      // Update refund record
      await this.refundModel.findByIdAndUpdate(refund._id, {
        status: RefundStatus.PROCESSING,
        processedAt: new Date(),
      });

      // Emit refund event
      this.eventEmitter.emit('refund.processed', {
        refundId: refund._id as Types.ObjectId,
        paymentId: payment._id as Types.ObjectId,
        userId,
        amount: dto.amount,
        success: true,
      });

      return refundResult;
    } catch (error) {
      this.logger.error(`Error processing refund: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get payment by ID
   */
  async getPaymentById(paymentId: string, userId?: string): Promise<Payment> {
    const query: any = { _id: paymentId };
    if (userId) {
      query.userId = userId;
    }

    const payment = await this.paymentModel.findOne(query);
    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    return payment;
  }

  /**
   * Get payments with pagination and filters
   */
  async getPayments(dto: PaymentQueryDto, userId?: string): Promise<{ payments: Payment[]; total: number; pages: number }> {
    const query: any = {};
    
    if (userId) query.userId = userId;
    if (dto.userId) query.userId = dto.userId;
    if (dto.orderId) query.orderId = dto.orderId;
    if (dto.status) query.status = dto.status;
    if (dto.paymentType) query.paymentType = dto.paymentType;
    if (dto.paymentMethod) query.paymentMethod = dto.paymentMethod;
    if (dto.gateway) query.gateway = dto.gateway;

    if (dto.startDate || dto.endDate) {
      query.createdAt = {};
      if (dto.startDate) query.createdAt.$gte = new Date(dto.startDate);
      if (dto.endDate) query.createdAt.$lte = new Date(dto.endDate);
    }

    const page = dto.page || 1;
    const limit = dto.limit || 20;
    const skip = (page - 1) * limit;

    const [payments, total] = await Promise.all([
      this.paymentModel
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.paymentModel.countDocuments(query),
    ]);

    return {
      payments,
      total,
      pages: Math.ceil(total / limit),
    };
  }

  /**
   * Get payment analytics
   */
  async getPaymentAnalytics(dto: PaymentAnalyticsDto): Promise<IPaymentAnalytics> {
    try {
      const startDate = dto.startDate ? new Date(dto.startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = dto.endDate ? new Date(dto.endDate) : new Date();

      const matchStage: any = {
        createdAt: { $gte: startDate, $lte: endDate },
        status: PaymentStatus.COMPLETED,
      };

      if (dto.paymentTypes?.length) {
        matchStage.paymentType = { $in: dto.paymentTypes };
      }

      if (dto.gateways?.length) {
        matchStage.gateway = { $in: dto.gateways };
      }

      const totalStats = await this.paymentModel.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: '$amount' },
            totalTransactions: { $sum: 1 },
            averageAmount: { $avg: '$amount' },
          },
        },
      ]);

      return {
        period: `${startDate.toISOString()} - ${endDate.toISOString()}`,
        totalAmount: totalStats[0]?.totalAmount || 0,
        totalTransactions: totalStats[0]?.totalTransactions || 0,
        totalFees: 0, // Calculate from aggregation
        successRate: 100, // Calculate based on success vs total
        averageTransactionValue: totalStats[0]?.averageAmount || 0,
        paymentMethodBreakdown: {} as Record<PaymentMethod, number>,
        gatewayBreakdown: {} as Record<PaymentGateway, number>,
        failureReasons: {},
      };
    } catch (error) {
      this.logger.error(`Error getting payment analytics: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Private helper methods
   */
  private generatePaymentReference(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    return `PAY_${timestamp}_${random}`.toUpperCase();
  }

  private generateRefundReference(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    return `REF_${timestamp}_${random}`.toUpperCase();
  }

  private async validateAndGetOrderDetails(orderId: string, userId: string): Promise<any> {
    // This would typically fetch from the orders service/module
    // For now, return mock data structure
    return {
      id: orderId,
      userId,
      totalAmount: 50000, // 500 Naira
      customerEmail: 'user@example.com',
      customerPhone: '+2348012345678',
      customerName: 'John Doe',
    };
  }

  private async calculatePaymentAmount(orderDetails: any, dto: PaymentInitiationDto): Promise<number> {
    switch (dto.paymentType) {
      case PaymentType.PAY_NOW:
        return orderDetails.totalAmount;
      case PaymentType.PAY_SMALL_SMALL:
        if (!dto.installments || dto.installments < 2) {
          throw new BadRequestException('PAY Small-Small requires at least 2 installments');
        }
        return Math.ceil(orderDetails.totalAmount / dto.installments);
      case PaymentType.PAY_LATER:
        return 0; // No immediate payment required
      case PaymentType.PRICE_LOCK:
        return dto.amount || Math.ceil(orderDetails.totalAmount * 0.1); // 10% deposit
      case PaymentType.EXCLUSIVE_YEAR_PAYMENT:
        return orderDetails.totalAmount;
      default:
        return dto.amount || orderDetails.totalAmount;
    }
  }

  private requiresPaymentPlan(paymentType: PaymentType): boolean {
    return [
      PaymentType.PAY_SMALL_SMALL,
      PaymentType.PAY_LATER,
      PaymentType.PRICE_LOCK,
    ].includes(paymentType);
  }

  private async createPaymentPlan(
    paymentId: Types.ObjectId,
    dto: PaymentInitiationDto,
    paidAmount: number,
    totalAmount: number
  ): Promise<void> {
    const planData: Partial<PaymentPlanEntity> = {
      planType: dto.paymentType,
      orderId: new Types.ObjectId(dto.orderId),
      userId: new Types.ObjectId(), // Would get from context
      totalAmount,
      paidAmount,
      isActive: true,
      isCompleted: false,
    };

    if (dto.paymentType === PaymentType.PAY_SMALL_SMALL) {
      planData.installments = dto.installments;
      planData.currentInstallment = 1;
      planData.installmentAmount = Math.ceil(totalAmount / dto.installments!);
    }

    const paymentPlan = new this.paymentPlanModel(planData);
    await paymentPlan.save();

    // Link payment to plan
    await this.paymentModel.findByIdAndUpdate(paymentId, {
      paymentPlanId: paymentPlan._id,
    });
  }

  private async updatePaymentPlan(paymentPlanId: Types.ObjectId, paidAmount: number): Promise<void> {
    const plan = await this.paymentPlanModel.findById(paymentPlanId);
    if (!plan) return;

    const updatedPaidAmount = plan.paidAmount + paidAmount;
    const isCompleted = updatedPaidAmount >= plan.totalAmount;

    await this.paymentPlanModel.findByIdAndUpdate(paymentPlanId, {
      paidAmount: updatedPaidAmount,
      isCompleted,
      ...(plan.planType === PaymentType.PAY_SMALL_SMALL && {
        currentInstallment: (plan.currentInstallment || 1) + 1,
      }),
    });
  }

  private calculateFees(amount: number, gateway: PaymentGateway): number {
    switch (gateway) {
      case PaymentGateway.PAYSTACK:
        return Math.min(
          Math.ceil(amount * PAYMENT_CONSTANTS.PAYSTACK_FEE_PERCENTAGE / 100),
          PAYMENT_CONSTANTS.PAYSTACK_FEE_CAP
        );
      case PaymentGateway.FLUTTERWAVE:
        return Math.min(
          Math.ceil(amount * PAYMENT_CONSTANTS.FLUTTERWAVE_FEE_PERCENTAGE / 100),
          PAYMENT_CONSTANTS.FLUTTERWAVE_FEE_CAP
        );
      case PaymentGateway.INTERNAL_WALLET:
        return PAYMENT_CONSTANTS.INTERNAL_TRANSFER_FEE;
      default:
        return 0;
    }
  }
}
