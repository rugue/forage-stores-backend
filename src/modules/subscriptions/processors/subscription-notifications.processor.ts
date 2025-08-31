import { Processor, Process } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Job } from 'bull';
import { Model } from 'mongoose';
import { Subscription, SubscriptionDocument } from '../entities/subscription.entity';
import { User, UserDocument } from '../../users/entities/user.entity';
import { NotificationsService } from '../../notifications/notifications.service';

export interface SubscriptionNotificationJob {
  subscriptionId: string;
  userId: string;
  type: 'payment_reminder' | 'payment_failed' | 'subscription_completed' | 'subscription_cancelled' | 'payment_success' | 'payment_failed_final';
  data: any;
}

@Processor('subscription-notifications')
@Injectable()
export class SubscriptionNotificationProcessor {
  private readonly logger = new Logger(SubscriptionNotificationProcessor.name);

  constructor(
    @InjectModel(Subscription.name) private subscriptionModel: Model<SubscriptionDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly notificationsService: NotificationsService,
  ) {}

  @Process('send-notification')
  async sendNotification(job: Job<SubscriptionNotificationJob>) {
    const { subscriptionId, userId, type, data } = job.data;
    
    try {
      this.logger.log(`Sending ${type} notification for subscription ${subscriptionId}`);
      
      const subscription = await this.subscriptionModel.findById(subscriptionId);
      if (!subscription) {
        throw new Error(`Subscription ${subscriptionId} not found`);
      }

      const user = await this.userModel.findById(userId);
      if (!user) {
        throw new Error(`User ${userId} not found`);
      }

      switch (type) {
        case 'payment_reminder':
          await this.notificationsService.sendEmail({
            recipientEmail: user.email,
            type: 'EMAIL' as any,
            title: 'Subscription Payment Reminder',
            message: `Your subscription payment of ${data.amount} is due on ${data.dueDate}`,
            metadata: {
              template: 'subscription-payment-reminder',
              userName: user.name || 'User',
              amount: data.amount,
              dueDate: data.dueDate,
              subscriptionId: subscriptionId.slice(-8),
            }
          });
          break;

        case 'payment_success':
          await this.notificationsService.sendEmail({
            recipientEmail: user.email,
            type: 'EMAIL' as any,
            title: 'Subscription Payment Successful',
            message: `Payment of ${data.amount} processed successfully for drop ${data.dropNumber}/${data.totalDrops}`,
            metadata: {
              template: 'subscription-payment-success',
              userName: user.name || 'User',
              amount: data.amount,
              dropNumber: data.dropNumber,
              totalDrops: data.totalDrops,
              nextDropDate: data.nextDropDate,
              subscriptionId: subscriptionId.slice(-8),
            }
          });
          break;

        case 'payment_failed':
          await this.notificationsService.sendEmail({
            recipientEmail: user.email,
            type: 'EMAIL' as any,
            title: 'Subscription Payment Failed',
            message: `Payment of ${data.amount} failed: ${data.reason}. Will retry on ${data.retryDate}`,
            metadata: {
              template: 'subscription-payment-failed',
              userName: user.name || 'User',
              amount: data.amount,
              reason: data.reason,
              retryDate: data.retryDate,
              subscriptionId: subscriptionId.slice(-8),
            }
          });
          break;

        case 'subscription_completed':
          await this.notificationsService.sendEmail({
            recipientEmail: user.email,
            type: 'EMAIL' as any,
            title: 'Subscription Completed Successfully',
            message: `Your subscription has been completed successfully. Total amount: ${data.totalAmount || subscription.totalAmount}`,
            metadata: {
              template: 'subscription-completed',
              userName: user.name || 'User',
              totalAmount: data.totalAmount || subscription.totalAmount,
              completionDate: new Date(),
              subscriptionId: subscriptionId.slice(-8),
            }
          });
          break;

        case 'subscription_cancelled':
          await this.notificationsService.sendEmail({
            recipientEmail: user.email,
            type: 'EMAIL' as any,
            title: 'Subscription Cancelled',
            message: `Your subscription has been cancelled. Refund amount: ${data.refundAmount || 0}`,
            metadata: {
              template: 'subscription-cancelled',
              userName: user.name || 'User',
              reason: data.reason,
              refundAmount: data.refundAmount,
              subscriptionId: subscriptionId.slice(-8),
            }
          });
          break;

        case 'payment_failed_final':
          await this.notificationsService.sendEmail({
            recipientEmail: user.email,
            type: 'EMAIL' as any,
            title: 'Subscription Payment Failed - Action Required',
            message: `Payment failed after multiple attempts. ${data.actionRequired}`,
            metadata: {
              template: 'subscription-payment-final-failure',
              userName: user.name || 'User',
              subscriptionId: subscriptionId.slice(-8),
              reason: data.reason,
              actionRequired: data.actionRequired,
            }
          });
          break;
      }

      this.logger.log(`Successfully sent ${type} notification for subscription ${subscriptionId}`);

    } catch (error) {
      this.logger.error(`Error sending ${type} notification for subscription ${subscriptionId}:`, error.message);
      throw error;
    }
  }
}
