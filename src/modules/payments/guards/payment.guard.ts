import { Injectable, CanActivate, ExecutionContext, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Payment, PaymentDocument } from '../entities/payment.entity';
import { PaymentStatus, PAYMENT_CONSTANTS } from '../constants/payment.constants';

@Injectable()
export class PaymentGuard implements CanActivate {
  private readonly logger = new Logger(PaymentGuard.name);

  constructor(
    @InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const { user, body, params } = request;

    try {
      // For payment initiation, validate amount and payment type
      if (request.route?.path?.includes('initiate')) {
        return this.validatePaymentInitiation(body, user);
      }

      // For payment verification, validate reference
      if (request.route?.path?.includes('verify')) {
        return this.validatePaymentVerification(body);
      }

      // For refund requests, validate payment ownership
      if (request.route?.path?.includes('refund')) {
        return await this.validateRefundRequest(body, user);
      }

      // For payment retrieval, validate ownership
      if (params?.id) {
        return await this.validatePaymentAccess(params.id, user);
      }

      return true;
    } catch (error) {
      this.logger.error(`Payment guard validation failed: ${error.message}`, error.stack);
      throw new BadRequestException(error.message);
    }
  }

  /**
   * Validate payment initiation request
   */
  private validatePaymentInitiation(body: any, user: any): boolean {
    const { amount, orderId, paymentType, paymentMethod, gateway } = body;

    // Validate amount
    if (amount && (amount < PAYMENT_CONSTANTS.MIN_PAYMENT_AMOUNT || amount > PAYMENT_CONSTANTS.MAX_PAYMENT_AMOUNT)) {
      throw new BadRequestException(
        `Payment amount must be between ₦${PAYMENT_CONSTANTS.MIN_PAYMENT_AMOUNT / 100} and ₦${PAYMENT_CONSTANTS.MAX_PAYMENT_AMOUNT / 100}`
      );
    }

    // Validate required fields
    if (!orderId) {
      throw new BadRequestException('Order ID is required');
    }

    if (!paymentType) {
      throw new BadRequestException('Payment type is required');
    }

    if (!paymentMethod) {
      throw new BadRequestException('Payment method is required');
    }

    if (!gateway) {
      throw new BadRequestException('Payment gateway is required');
    }

    // Validate user context
    if (!user?.id) {
      throw new BadRequestException('User authentication required');
    }

    return true;
  }

  /**
   * Validate payment verification request
   */
  private validatePaymentVerification(body: any): boolean {
    const { reference, gateway } = body;

    if (!reference) {
      throw new BadRequestException('Payment reference is required');
    }

    if (!gateway) {
      throw new BadRequestException('Payment gateway is required');
    }

    return true;
  }

  /**
   * Validate refund request
   */
  private async validateRefundRequest(body: any, user: any): Promise<boolean> {
    const { paymentId, amount, reason } = body;

    if (!paymentId) {
      throw new BadRequestException('Payment ID is required');
    }

    if (!amount || amount <= 0) {
      throw new BadRequestException('Valid refund amount is required');
    }

    if (!reason) {
      throw new BadRequestException('Refund reason is required');
    }

    // Validate payment exists and belongs to user
    const payment = await this.paymentModel.findById(paymentId);
    if (!payment) {
      throw new BadRequestException('Payment not found');
    }

    if (payment.userId.toString() !== user.id) {
      throw new BadRequestException('Unauthorized to refund this payment');
    }

    if (payment.status !== PaymentStatus.COMPLETED) {
      throw new BadRequestException('Can only refund completed payments');
    }

    return true;
  }

  /**
   * Validate payment access for retrieval
   */
  private async validatePaymentAccess(paymentId: string, user: any): Promise<boolean> {
    // Allow admin users to access any payment
    if (user.roles?.includes('admin') || user.roles?.includes('finance')) {
      return true;
    }

    // For regular users, validate ownership
    const payment = await this.paymentModel.findById(paymentId);
    if (!payment) {
      throw new BadRequestException('Payment not found');
    }

    if (payment.userId.toString() !== user.id) {
      throw new BadRequestException('Unauthorized to access this payment');
    }

    return true;
  }
}
