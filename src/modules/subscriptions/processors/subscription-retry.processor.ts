import { Processor, Process } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Job, Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import { Model } from 'mongoose';
import { Subscription, SubscriptionDocument, SubscriptionStatus } from '../entities/subscription.entity';

export interface SubscriptionRetryJob {
  subscriptionId: string;
  userId: string;
  dropIndex: number;
  attempt: number;
  maxAttempts: number;
  reason: string;
}

@Processor('subscription-retry')
@Injectable()
export class SubscriptionRetryProcessor {
  private readonly logger = new Logger(SubscriptionRetryProcessor.name);

  constructor(
    @InjectModel(Subscription.name) private subscriptionModel: Model<SubscriptionDocument>,
    @InjectQueue('subscription-processing') private processingQueue: Queue,
    @InjectQueue('subscription-notifications') private notificationQueue: Queue,
  ) {}

  @Process('retry-payment')
  async retryPayment(job: Job<SubscriptionRetryJob>) {
    const { subscriptionId, userId, dropIndex, attempt, maxAttempts, reason } = job.data;
    
    try {
      this.logger.log(`Retrying payment for subscription ${subscriptionId}, attempt ${attempt}/${maxAttempts}`);
      
      // Process the drop
      await this.processingQueue.add('process-drop', {
        subscriptionId,
        userId,
        dropIndex,
        isAutomatic: true,
        transactionRef: `retry_${attempt}_${Date.now()}`
      });

    } catch (error) {
      this.logger.error(`Retry ${attempt} failed for subscription ${subscriptionId}:`, error.message);
      
      if (attempt >= maxAttempts) {
        // Final failure - send notification and pause subscription
        await this.handleFinalPaymentFailure(subscriptionId, userId, reason);
      } else {
        // Schedule next retry
        await this.retryQueue.add('retry-payment', {
          subscriptionId,
          userId,
          dropIndex,
          attempt: attempt + 1,
          maxAttempts,
          reason
        }, {
          delay: Math.pow(2, attempt) * 60 * 60 * 1000, // Exponential backoff
          attempts: 1
        });
      }
      
      throw error;
    }
  }

  private async handleFinalPaymentFailure(subscriptionId: string, userId: string, reason: string) {
    try {
      const subscription = await this.subscriptionModel.findById(subscriptionId);
      if (!subscription) return;

      // Pause the subscription
      subscription.status = SubscriptionStatus.PAUSED;
      await subscription.save();

      // Send final failure notification
      await this.notificationQueue.add('send-notification', {
        subscriptionId,
        userId,
        type: 'payment_failed_final',
        data: {
          reason,
          actionRequired: 'Please top up your wallet and contact support',
        }
      });

      this.logger.log(`Paused subscription ${subscriptionId} due to final payment failure`);

    } catch (error) {
      this.logger.error(`Error handling final payment failure for subscription ${subscriptionId}:`, error.message);
    }
  }

  private get retryQueue(): Queue {
    return this.processingQueue; // Use same queue for retry scheduling
  }
}
