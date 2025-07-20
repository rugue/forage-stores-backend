import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { NotificationsService } from '../notifications/notifications.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { AuctionsService } from '../auctions/auctions.service';
import { ProductsService } from '../products/products.service';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly subscriptionsService: SubscriptionsService,
    private readonly auctionsService: AuctionsService,
    private readonly productsService: ProductsService,
  ) {}

  // Run every day at 8:00 AM
  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async handlePayLaterReminders() {
    this.logger.log('Running Pay Later reminders cron job...');
    try {
      const remindersCount = await this.subscriptionsService.sendPayLaterReminders();
      this.logger.log(`Successfully sent ${remindersCount} Pay Later reminders`);
    } catch (error) {
      this.logger.error(`Error sending Pay Later reminders: ${error.message}`, error.stack);
    }
  }

  // Run every day at 9:00 AM
  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async handleSubscriptionDropReminders() {
    this.logger.log('Running subscription drop reminders cron job...');
    try {
      const remindersCount = await this.subscriptionsService.sendDropReminders();
      this.logger.log(`Successfully sent ${remindersCount} subscription drop reminders`);
    } catch (error) {
      this.logger.error(`Error sending subscription drop reminders: ${error.message}`, error.stack);
    }
  }

  // Run every hour
  @Cron(CronExpression.EVERY_HOUR)
  async handlePriceLockExpiry() {
    this.logger.log('Running price lock expiry cron job...');
    try {
      const expiredCount = await this.productsService.expirePriceLocks();
      this.logger.log(`Successfully expired ${expiredCount} price lock offers`);
    } catch (error) {
      this.logger.error(`Error expiring price locks: ${error.message}`, error.stack);
    }
  }

  // Run every 5 minutes
  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleAuctionEndStatus() {
    this.logger.log('Running auction end status update cron job...');
    try {
      const processedCount = await this.auctionsService.processEndedAuctions();
      if (processedCount > 0) {
        this.logger.log(`Successfully processed ${processedCount} ended auctions`);
      }
    } catch (error) {
      this.logger.error(`Error processing auction end statuses: ${error.message}`, error.stack);
    }
  }
}
