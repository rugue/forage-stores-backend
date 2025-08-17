import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { NotificationsService } from '../notifications/notifications.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { AuctionsService } from '../auctions/auctions.service';
import { ProductsService } from '../products/products.service';
import { ReferralsService } from '../referrals/referrals.service';
import { GrowthManagementService } from '../referrals/services/growth-management.service';
import { CommissionService } from '../referrals/services/commission.service';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly subscriptionsService: SubscriptionsService,
    private readonly auctionsService: AuctionsService,
    private readonly productsService: ProductsService,
    private readonly referralsService: ReferralsService,
    private readonly growthManagementService: GrowthManagementService,
    private readonly commissionService: CommissionService,
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

  // Run daily at 2:00 AM to check for Growth Associate and Growth Elite qualifications
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async handleGrowthPromotions() {
    this.logger.log('Running growth promotions check...');
    try {
      const results = await this.growthManagementService.checkAndPromoteAllEligibleUsers();
      this.logger.log(`Growth promotion results: ${results.promotedToGA} GA, ${results.promotedToGE} GE promoted. ${results.errors.length} errors.`);
      
      if (results.errors.length > 0) {
        this.logger.warn(`Growth promotion errors: ${results.errors.join(', ')}`);
      }
    } catch (error) {
      this.logger.error(`Error during growth promotions: ${error.message}`, error.stack);
    }
  }

  // Run monthly on the 1st day at 3:00 AM to distribute city revenue to Growth Elites
  @Cron('0 3 1 * *') // At 03:00 on day-of-month 1
  async handleGECityRevenueDistribution() {
    this.logger.log('Running Growth Elite city revenue distribution...');
    try {
      // Get all cities with Growth Elites
      const stats = await this.growthManagementService.getGrowthStats();
      const cities = Object.keys(stats.geByCity);
      
      for (const city of cities) {
        if (stats.geByCity[city] > 0) {
          await this.growthManagementService.distributeCityRevenueToGE(city);
          this.logger.log(`Distributed city revenue for ${city} to ${stats.geByCity[city]} Growth Elites`);
        }
      }
    } catch (error) {
      this.logger.error(`Error distributing GE city revenue: ${error.message}`, error.stack);
    }
  }

  // Run every hour to process pending commissions
  @Cron(CronExpression.EVERY_HOUR)
  async handlePendingCommissions() {
    this.logger.log('Processing pending commissions...');
    try {
      const processedCount = await this.commissionService.processPendingCommissions();
      if (processedCount > 0) {
        this.logger.log(`Successfully processed ${processedCount} pending commissions`);
      }
    } catch (error) {
      this.logger.error(`Error processing pending commissions: ${error.message}`, error.stack);
    }
  }
}
