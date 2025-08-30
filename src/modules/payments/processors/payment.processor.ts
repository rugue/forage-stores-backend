import { Processor, Process } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Job } from 'bull';
import { Payment, PaymentDocument } from '../entities/payment.entity';
import { PaymentService } from '../services/payment.service';
import { PaymentStrategyFactory } from '../strategies/payment-strategy.factory';
import { 
  PaymentStatus, 
  PaymentGateway,
  PAYMENT_CONSTANTS 
} from '../constants/payment.constants';
import { IPaymentRetryJob } from '../interfaces/payment.interface';

@Processor('payment-processing')
@Injectable()
export class PaymentProcessor {
  private readonly logger = new Logger(PaymentProcessor.name);

  constructor(
    @InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>,
    private readonly paymentService: PaymentService,
    private readonly strategyFactory: PaymentStrategyFactory,
  ) {}

  @Process('retry-payment')
  async handlePaymentRetry(job: Job<IPaymentRetryJob>): Promise<void> {
    const { transactionId, retryCount, maxRetries } = job.data;

    try {
      this.logger.log(`Processing payment retry ${retryCount}/${maxRetries} for transaction ${transactionId}`);

      // Find payment by transaction ID
      const payment = await this.paymentModel.findOne({
        $or: [
          { _id: transactionId },
          { reference: transactionId },
          { 'gatewayResponse.gatewayTransactionId': transactionId }
        ]
      });
      
      if (!payment) {
        this.logger.error(`Payment ${transactionId} not found for retry`);
        return;
      }

      // Check if payment is still in retryable state
      if (payment.status !== PaymentStatus.PENDING && payment.status !== PaymentStatus.PROCESSING) {
        this.logger.log(`Payment ${transactionId} no longer needs retry, current status: ${payment.status}`);
        return;
      }

      // Check retry limit
      if (retryCount >= maxRetries) {
        await this.paymentModel.findByIdAndUpdate(payment._id, {
          status: PaymentStatus.FAILED,
          lastError: 'Maximum retry attempts exceeded',
        });
        this.logger.warn(`Payment ${transactionId} failed after ${maxRetries} retries`);
        return;
      }

      // Get strategy and retry verification
      try {
        const strategy = this.strategyFactory.getGatewayStrategy(payment.gateway);
        const verificationResult = await strategy.verifyPayment(payment.reference);

        // Update payment based on verification result
        const updateData: Partial<Payment> = {
          status: verificationResult.status,
          retryCount: payment.retryCount + 1,
        };

        if (verificationResult.status === PaymentStatus.COMPLETED) {
          updateData.completedAt = new Date();
          updateData.gatewayResponse = {
            ...payment.gatewayResponse,
            gatewayTransactionId: verificationResult.transactionId,
            message: 'Payment verified on retry',
            rawResponse: verificationResult.gatewayResponse,
          };
        } else if (verificationResult.status === PaymentStatus.FAILED) {
          updateData.lastError = 'Payment verification failed on retry';
        }

        await this.paymentModel.findByIdAndUpdate(payment._id, updateData);

        this.logger.log(`Payment retry ${retryCount} completed for ${transactionId}, status: ${verificationResult.status}`);
      } catch (strategyError) {
        this.logger.error(`Strategy error during payment retry: ${strategyError.message}`);
        
        // Update retry count and error
        await this.paymentModel.findByIdAndUpdate(payment._id, {
          $inc: { retryCount: 1 },
          lastError: `Strategy error: ${strategyError.message}`,
        });

        // Mark as failed if max retries reached
        if (retryCount >= maxRetries) {
          await this.paymentModel.findByIdAndUpdate(payment._id, {
            status: PaymentStatus.FAILED,
            lastError: `Max retries exceeded. Last error: ${strategyError.message}`,
          });
        }
      }
    } catch (error) {
      this.logger.error(`Error processing payment retry: ${error.message}`, error.stack);
      
      // Update retry count even on error
      await this.paymentModel.findByIdAndUpdate(transactionId, {
        $inc: { retryCount: 1 },
        lastError: error.message,
      });
    }
  }

  @Process('verify-pending-payments')
  async handlePendingPaymentVerification(job: Job): Promise<void> {
    try {
      this.logger.log('Processing pending payment verification job');

      // Find all pending payments older than 5 minutes
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      const pendingPayments = await this.paymentModel.find({
        status: { $in: [PaymentStatus.PENDING, PaymentStatus.PROCESSING] },
        initiatedAt: { $lte: fiveMinutesAgo },
        retryCount: { $lt: PAYMENT_CONSTANTS.RETRY_ATTEMPTS },
      }).limit(50); // Process in batches

      this.logger.log(`Found ${pendingPayments.length} pending payments to verify`);

      for (const payment of pendingPayments) {
        try {
          const strategy = this.strategyFactory.getGatewayStrategy(payment.gateway);
          const verificationResult = await strategy.verifyPayment(payment.reference);

          // Update payment based on verification
          const updateData: Partial<Payment> = {
            status: verificationResult.status,
            retryCount: payment.retryCount + 1,
          };

          if (verificationResult.status === PaymentStatus.COMPLETED) {
            updateData.completedAt = new Date();
            updateData.gatewayResponse = {
              ...payment.gatewayResponse,
              gatewayTransactionId: verificationResult.transactionId,
              message: 'Payment verified by batch job',
              rawResponse: verificationResult.gatewayResponse,
            };
          }

          await this.paymentModel.findByIdAndUpdate(payment._id, updateData);

          this.logger.log(`Batch verification completed for payment ${payment.reference}, status: ${verificationResult.status}`);
        } catch (verificationError) {
          this.logger.warn(`Batch verification failed for payment ${payment.reference}: ${verificationError.message}`);
          
          await this.paymentModel.findByIdAndUpdate(payment._id, {
            $inc: { retryCount: 1 },
            lastError: verificationError.message,
          });
        }

        // Add small delay between verifications to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      this.logger.log('Pending payment verification job completed');
    } catch (error) {
      this.logger.error(`Error in pending payment verification job: ${error.message}`, error.stack);
    }
  }

  @Process('expire-payments')
  async handlePaymentExpiry(job: Job): Promise<void> {
    try {
      this.logger.log('Processing payment expiry job');

      // Find payments that have expired (older than timeout and still pending)
      const expiryTime = new Date(Date.now() - PAYMENT_CONSTANTS.PAYMENT_TIMEOUT);
      const expiredPayments = await this.paymentModel.find({
        status: { $in: [PaymentStatus.PENDING, PaymentStatus.PROCESSING] },
        initiatedAt: { $lte: expiryTime },
      });

      this.logger.log(`Found ${expiredPayments.length} expired payments`);

      for (const payment of expiredPayments) {
        await this.paymentModel.findByIdAndUpdate(payment._id, {
          status: PaymentStatus.EXPIRED,
          lastError: 'Payment expired due to timeout',
        });

        this.logger.log(`Payment ${payment.reference} marked as expired`);
      }

      this.logger.log('Payment expiry job completed');
    } catch (error) {
      this.logger.error(`Error in payment expiry job: ${error.message}`, error.stack);
    }
  }
}
