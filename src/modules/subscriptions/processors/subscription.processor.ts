import { Processor, Process } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Job, Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import { Model } from 'mongoose';
import { Subscription, SubscriptionDocument, SubscriptionStatus } from '../entities/subscription.entity';
import { Wallet, WalletDocument } from '../../wallets/entities/wallet.entity';
import { Order, OrderDocument, PaymentStatus, PaymentMethod } from '../../orders/entities/order.entity';
import { NotificationsService } from '../../notifications/notifications.service';

export interface DropProcessingJob {
  subscriptionId: string;
  userId: string;
  dropIndex?: number;
  isAutomatic: boolean;
  transactionRef?: string;
}

@Processor('subscription-processing')
@Injectable()
export class SubscriptionProcessor {
  private readonly logger = new Logger(SubscriptionProcessor.name);

  constructor(
    @InjectModel(Subscription.name) private subscriptionModel: Model<SubscriptionDocument>,
    @InjectModel(Wallet.name) private walletModel: Model<WalletDocument>,
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectQueue('subscription-retry') private retryQueue: Queue,
    @InjectQueue('subscription-notifications') private notificationQueue: Queue,
    private readonly notificationsService: NotificationsService,
  ) {}

  @Process('process-drop')
  async processDrop(job: Job<DropProcessingJob>) {
    const { subscriptionId, userId, dropIndex, isAutomatic, transactionRef } = job.data;
    
    try {
      this.logger.log(`Processing drop for subscription ${subscriptionId}`);
      
      const subscription = await this.subscriptionModel.findById(subscriptionId);
      if (!subscription) {
        throw new Error(`Subscription ${subscriptionId} not found`);
      }

      // Find the next unpaid drop or use specified dropIndex
      const targetDropIndex = dropIndex !== undefined 
        ? dropIndex 
        : subscription.dropSchedule.findIndex(drop => !drop.isPaid);

      if (targetDropIndex === -1) {
        throw new Error('No pending drops found');
      }

      const dropToProcess = subscription.dropSchedule[targetDropIndex];
      const wallet = await this.walletModel.findOne({ userId });
      
      if (!wallet) {
        throw new Error(`Wallet not found for user ${userId}`);
      }

      // Check balance
      if (wallet.foodMoney < dropToProcess.amount) {
        // Add to retry queue if automatic processing
        if (isAutomatic) {
          await this.retryQueue.add('retry-payment', {
            subscriptionId,
            userId,
            dropIndex: targetDropIndex,
            attempt: 1,
            maxAttempts: 3,
            reason: 'insufficient_balance'
          }, {
            delay: 24 * 60 * 60 * 1000, // Retry after 24 hours
            attempts: 1
          });
        }
        throw new Error(`Insufficient balance. Required: ${dropToProcess.amount}, Available: ${wallet.foodMoney}`);
      }

      // Process payment
      wallet.foodMoney -= dropToProcess.amount;
      await wallet.save();

      // Update subscription
      subscription.dropSchedule[targetDropIndex].isPaid = true;
      subscription.dropSchedule[targetDropIndex].paidDate = new Date();
      subscription.dropSchedule[targetDropIndex].transactionRef = transactionRef || `drop_${Date.now()}`;
      subscription.dropsPaid += 1;
      subscription.amountPaid += dropToProcess.amount;

      // Check if completed
      const isCompleted = subscription.dropsPaid >= subscription.totalDrops;
      if (isCompleted) {
        subscription.isCompleted = true;
        subscription.status = SubscriptionStatus.COMPLETED;
        subscription.endDate = new Date();
      } else {
        // Update next drop date
        const nextUnpaidIndex = subscription.dropSchedule.findIndex(drop => !drop.isPaid);
        if (nextUnpaidIndex !== -1) {
          subscription.nextDropDate = subscription.dropSchedule[nextUnpaidIndex].scheduledDate;
        }
      }

      await subscription.save();

      // Update associated order
      const order = await this.orderModel.findById(subscription.orderId);
      if (order) {
        order.paymentHistory.push({
          amount: dropToProcess.amount,
          paymentMethod: PaymentMethod.FOOD_MONEY,
          status: PaymentStatus.COMPLETED,
          paymentDate: new Date(),
          transactionRef: subscription.dropSchedule[targetDropIndex].transactionRef,
          notes: `Subscription drop ${subscription.dropsPaid}/${subscription.totalDrops}`,
        });
        order.amountPaid += dropToProcess.amount;
        order.remainingAmount = Math.max(0, order.finalTotal - order.amountPaid);
        await order.save();
      }

      // Send notification
      await this.notificationQueue.add('send-notification', {
        subscriptionId,
        userId,
        type: isCompleted ? 'subscription_completed' : 'payment_success',
        data: {
          dropNumber: subscription.dropsPaid,
          totalDrops: subscription.totalDrops,
          amount: dropToProcess.amount,
          nextDropDate: subscription.nextDropDate,
        }
      });

      this.logger.log(`Successfully processed drop for subscription ${subscriptionId}`);
      
      return {
        success: true,
        subscriptionId,
        dropNumber: subscription.dropsPaid,
        isCompleted,
        nextDropDate: subscription.nextDropDate
      };

    } catch (error) {
      this.logger.error(`Error processing drop for subscription ${subscriptionId}:`, error.message);
      
      // Add to retry queue if automatic and not already a retry
      if (job.data.isAutomatic && job.attemptsMade < 3) {
        await this.retryQueue.add('retry-payment', {
          subscriptionId,
          userId,
          dropIndex,
          attempt: job.attemptsMade + 1,
          maxAttempts: 3,
          reason: error.message
        }, {
          delay: Math.pow(2, job.attemptsMade) * 60 * 60 * 1000, // Exponential backoff
          attempts: 1
        });
      }
      
      throw error;
    }
  }
}
