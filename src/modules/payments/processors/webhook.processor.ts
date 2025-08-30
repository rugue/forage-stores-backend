import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Payment, PaymentDocument } from '../entities/payment.entity';
import { PaymentService } from '../services/payment.service';
import { 
  PaymentStatus, 
  PaymentGateway, 
  RefundStatus,
  PAYMENT_CONSTANTS 
} from '../constants/payment.constants';
import { IWebhookEvent } from '../interfaces/payment.interface';

@Injectable()
export class WebhookProcessor {
  private readonly logger = new Logger(WebhookProcessor.name);

  constructor(
    @InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>,
    private readonly paymentService: PaymentService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Process Paystack webhook events
   */
  async processPaystackWebhook(payload: any): Promise<{ success: boolean; message: string }> {
    try {
      this.logger.log(`Processing Paystack webhook: ${payload.event}`);

      const { event, data } = payload;

      switch (event) {
        case 'charge.success':
          return await this.handlePaymentSuccess(data, PaymentGateway.PAYSTACK);
        case 'charge.failed':
          return await this.handlePaymentFailure(data, PaymentGateway.PAYSTACK);
        case 'refund.processed':
          return await this.handleRefundProcessed(data, PaymentGateway.PAYSTACK);
        default:
          this.logger.warn(`Unhandled Paystack webhook event: ${event}`);
          return { success: true, message: 'Event received but not processed' };
      }
    } catch (error) {
      this.logger.error(`Error processing Paystack webhook: ${error.message}`, error.stack);
      return { success: false, message: 'Webhook processing failed' };
    }
  }

  /**
   * Process Flutterwave webhook events
   */
  async processFlutterwaveWebhook(payload: any): Promise<{ success: boolean; message: string }> {
    try {
      this.logger.log(`Processing Flutterwave webhook: ${payload.event}`);

      const { event, data } = payload;

      switch (event) {
        case 'charge.completed':
          return await this.handlePaymentSuccess(data, PaymentGateway.FLUTTERWAVE);
        case 'charge.failed':
          return await this.handlePaymentFailure(data, PaymentGateway.FLUTTERWAVE);
        default:
          this.logger.warn(`Unhandled Flutterwave webhook event: ${event}`);
          return { success: true, message: 'Event received but not processed' };
      }
    } catch (error) {
      this.logger.error(`Error processing Flutterwave webhook: ${error.message}`, error.stack);
      return { success: false, message: 'Webhook processing failed' };
    }
  }

  /**
   * Handle successful payment webhook
   */
  private async handlePaymentSuccess(
    data: any, 
    gateway: PaymentGateway
  ): Promise<{ success: boolean; message: string }> {
    try {
      const reference = this.extractReference(data, gateway);
      const transactionId = this.extractTransactionId(data, gateway);
      const amount = this.extractAmount(data, gateway);

      // Find payment by reference
      const payment = await this.paymentModel.findOne({ reference });
      if (!payment) {
        this.logger.warn(`Payment not found for reference: ${reference}`);
        return { success: false, message: 'Payment not found' };
      }

      // Update payment status if not already completed
      if (payment.status !== PaymentStatus.COMPLETED) {
        await this.paymentModel.findByIdAndUpdate(payment._id, {
          status: PaymentStatus.COMPLETED,
          completedAt: new Date(),
          gatewayResponse: {
            ...payment.gatewayResponse,
            gatewayTransactionId: transactionId,
            message: 'Payment completed via webhook',
            rawResponse: data,
          },
        });

        // Emit payment completed event
        this.eventEmitter.emit('payment.completed', {
          paymentId: payment._id,
          userId: payment.userId,
          orderId: payment.metadata?.orderId,
          amount: payment.amount,
          reference,
          gateway,
        });

        this.logger.log(`Payment ${reference} marked as completed via webhook`);
      }

      return { success: true, message: 'Payment success webhook processed' };
    } catch (error) {
      this.logger.error(`Error handling payment success webhook: ${error.message}`, error.stack);
      return { success: false, message: 'Failed to process payment success' };
    }
  }

  /**
   * Handle failed payment webhook
   */
  private async handlePaymentFailure(
    data: any, 
    gateway: PaymentGateway
  ): Promise<{ success: boolean; message: string }> {
    try {
      const reference = this.extractReference(data, gateway);
      const failureReason = this.extractFailureReason(data, gateway);

      // Find payment by reference
      const payment = await this.paymentModel.findOne({ reference });
      if (!payment) {
        this.logger.warn(`Payment not found for reference: ${reference}`);
        return { success: false, message: 'Payment not found' };
      }

      // Update payment status
      await this.paymentModel.findByIdAndUpdate(payment._id, {
        status: PaymentStatus.FAILED,
        lastError: failureReason,
        gatewayResponse: {
          ...payment.gatewayResponse,
          message: failureReason,
          rawResponse: data,
        },
      });

      // Emit payment failed event
      this.eventEmitter.emit('payment.failed', {
        paymentId: payment._id,
        userId: payment.userId,
        orderId: payment.metadata?.orderId,
        amount: payment.amount,
        reference,
        reason: failureReason,
        gateway,
      });

      this.logger.log(`Payment ${reference} marked as failed via webhook: ${failureReason}`);
      return { success: true, message: 'Payment failure webhook processed' };
    } catch (error) {
      this.logger.error(`Error handling payment failure webhook: ${error.message}`, error.stack);
      return { success: false, message: 'Failed to process payment failure' };
    }
  }

  /**
   * Handle refund processed webhook
   */
  private async handleRefundProcessed(
    data: any, 
    gateway: PaymentGateway
  ): Promise<{ success: boolean; message: string }> {
    try {
      this.logger.log('Processing refund completion webhook');
      
      // Extract refund details
      const refundId = data.refund_id || data.id;
      const status = data.status === 'success' ? RefundStatus.COMPLETED : RefundStatus.FAILED;

      // Update refund record
      await this.paymentModel.updateOne(
        { 'gatewayResponse.gatewayRefundId': refundId },
        { $set: { refundStatus: status } }
      );

      this.logger.log(`Refund ${refundId} status updated to ${status}`);
      return { success: true, message: 'Refund webhook processed' };
    } catch (error) {
      this.logger.error(`Error handling refund webhook: ${error.message}`, error.stack);
      return { success: false, message: 'Failed to process refund webhook' };
    }
  }

  /**
   * Extract reference from webhook data based on gateway
   */
  private extractReference(data: any, gateway: PaymentGateway): string {
    switch (gateway) {
      case PaymentGateway.PAYSTACK:
        return data.reference;
      case PaymentGateway.FLUTTERWAVE:
        return data.tx_ref || data.flw_ref;
      default:
        return data.reference || data.tx_ref || data.transaction_ref;
    }
  }

  /**
   * Extract transaction ID from webhook data
   */
  private extractTransactionId(data: any, gateway: PaymentGateway): string {
    switch (gateway) {
      case PaymentGateway.PAYSTACK:
        return data.id?.toString();
      case PaymentGateway.FLUTTERWAVE:
        return data.id?.toString();
      default:
        return data.id?.toString() || data.transaction_id?.toString();
    }
  }

  /**
   * Extract amount from webhook data
   */
  private extractAmount(data: any, gateway: PaymentGateway): number {
    switch (gateway) {
      case PaymentGateway.PAYSTACK:
        return data.amount; // Paystack returns amount in kobo
      case PaymentGateway.FLUTTERWAVE:
        return Math.round(data.amount * 100); // Convert to kobo
      default:
        return data.amount;
    }
  }

  /**
   * Extract failure reason from webhook data
   */
  private extractFailureReason(data: any, gateway: PaymentGateway): string {
    switch (gateway) {
      case PaymentGateway.PAYSTACK:
        return data.gateway_response || data.message || 'Payment failed';
      case PaymentGateway.FLUTTERWAVE:
        return data.processor_response || data.message || 'Payment failed';
      default:
        return data.message || data.reason || 'Payment failed';
    }
  }
}
