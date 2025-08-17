import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument, UserRole } from '../users/entities/user.entity';
import { Referral, ReferralDocument } from '../referrals/entities/referral.entity';
import { Order, OrderDocument } from '../orders/entities/order.entity';
import { Subscription, SubscriptionDocument } from '../subscriptions/entities/subscription.entity';
import { Wallet, WalletDocument } from '../wallets/entities/wallet.entity';
import { WithdrawalRequest, WithdrawalRequestDocument } from '../wallets/entities/withdrawal-request.entity';
import { ProfitPoolService } from '../profit-pool/profit-pool.service';
import { NotificationsService } from '../notifications/notifications.service';

interface QualificationResult {
  userId: string;
  currentRole: UserRole;
  qualifiedRole: UserRole;
  referralCount: number;
  totalSpend: number;
  city: string;
  promoted: boolean;
  reason?: string;
}

interface CityCapLimits {
  [city: string]: {
    maxGrowthAssociates: number;
    maxGrowthElites: number;
    currentGA: number;
    currentGE: number;
  };
}

@Injectable()
export class ScheduledJobsService {
  private readonly logger = new Logger(ScheduledJobsService.name);

  // City capacity limits - can be moved to config
  private readonly CITY_CAPS: Record<string, { maxGA: number; maxGE: number }> = {
    'Lagos': { maxGA: 50, maxGE: 20 },
    'Abuja': { maxGA: 30, maxGE: 15 },
    'Port Harcourt': { maxGA: 25, maxGE: 12 },
    'Kano': { maxGA: 20, maxGE: 10 },
    'Ibadan': { maxGA: 20, maxGE: 10 },
    'Benin': { maxGA: 15, maxGE: 8 },
    'Jos': { maxGA: 15, maxGE: 8 },
    'Calabar': { maxGA: 12, maxGE: 6 },
    'Uyo': { maxGA: 12, maxGE: 6 },
    'Warri': { maxGA: 10, maxGE: 5 },
  };

  // Qualification thresholds
  private readonly QUALIFICATION_THRESHOLDS = {
    GROWTH_ASSOCIATE: {
      minReferrals: 10,
      minTotalSpend: 50000, // 50,000 Naira
    },
    GROWTH_ELITE: {
      minReferrals: 25,
      minTotalSpend: 150000, // 150,000 Naira
    },
  };

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Referral.name) private referralModel: Model<ReferralDocument>,
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(Subscription.name) private subscriptionModel: Model<SubscriptionDocument>,
    @InjectModel(Wallet.name) private walletModel: Model<WalletDocument>,
    @InjectModel(WithdrawalRequest.name) private withdrawalRequestModel: Model<WithdrawalRequestDocument>,
    private profitPoolService: ProfitPoolService,
    private notificationsService: NotificationsService,
  ) {}

  /**
   * NIGHTLY JOB: Check GA/GE qualifications and promote eligible users
   * Runs every night at 2:00 AM
   */
  @Cron('0 2 * * *', {
    name: 'check-ga-ge-qualifications',
    timeZone: 'Africa/Lagos',
  })
  async checkGrowthUserQualifications(): Promise<void> {
    this.logger.log('🌙 NIGHTLY JOB: Starting GA/GE qualification check...');
    
    try {
      // Get current city capacities
      const cityCapacities = await this.getCurrentCityCapacities();
      
      // Get all regular users and current GA/GE users for evaluation
      const users = await this.userModel.find({
        role: { $in: [UserRole.USER, UserRole.GROWTH_ASSOCIATE, UserRole.GROWTH_ELITE] },
        isVerified: true,
      }).exec();

      this.logger.log(`📊 Found ${users.length} users to evaluate for promotion`);

      const qualificationResults: QualificationResult[] = [];

      // Check each user's qualification
      for (const user of users) {
        const result = await this.evaluateUserQualification(user, cityCapacities);
        qualificationResults.push(result);
      }

      // Process promotions
      const promotions = qualificationResults.filter(result => result.promoted);
      const demotions = qualificationResults.filter(result => 
        !result.promoted && 
        result.currentRole !== UserRole.USER && 
        result.qualifiedRole === UserRole.USER
      );

      this.logger.log(`✅ Promotions: ${promotions.length}, Demotions: ${demotions.length}`);

      // Apply promotions and demotions
      await this.applyRoleChanges(promotions, demotions);

      // Send summary report
      await this.sendQualificationSummary(qualificationResults);

      this.logger.log('🌙 NIGHTLY JOB: GA/GE qualification check completed successfully');

    } catch (error) {
      this.logger.error('❌ Error in nightly GA/GE qualification check:', error);
      // TODO: Send admin alert about errors
      // await this.notificationsService.sendEmail({
      //   recipientEmail: 'admin@forage.com',
      //   type: NotificationType.SYSTEM_ERROR,
      //   title: 'System Error: GA/GE Qualification Check Failed',
      //   message: `Nightly GA/GE qualification check failed: ${error.message}`,
      //   metadata: {
      //     type: 'SYSTEM_ERROR',
      //     details: error.message,
      //   },
      // });
    }
  }

  /**
   * MONTHLY JOB: Run profit pool distribution per city
   * Runs on the 1st of every month at 3:00 AM
   */
  @Cron('0 3 1 * *', {
    name: 'monthly-profit-pool-distribution',
    timeZone: 'Africa/Lagos',
  })
  async runMonthlyProfitPoolDistribution(): Promise<void> {
    this.logger.log('📅 MONTHLY JOB: Starting profit pool distribution...');
    
    try {
      // Calculate previous month
      const now = new Date();
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const monthString = `${lastMonth.getFullYear()}-${(lastMonth.getMonth() + 1).toString().padStart(2, '0')}`;

      this.logger.log(`💰 Processing profit pools for month: ${monthString}`);

      // Trigger automated monthly profit pool calculation and distribution
      await this.profitPoolService.calculateMonthlyProfitPools();
      
      // Wait a few seconds for pools to be created
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Trigger automated distribution
      await this.profitPoolService.distributeMonthlyProfitPools();

      // Send distribution summary to admin
      const distributionSummary = await this.getMonthlyDistributionSummary(monthString);
      await this.sendProfitPoolSummary(distributionSummary);

      this.logger.log('📅 MONTHLY JOB: Profit pool distribution completed successfully');

    } catch (error) {
      this.logger.error('❌ Error in monthly profit pool distribution:', error);
      // TODO: Send admin alert about errors
      // await this.notificationsService.sendEmail({
      //   recipientEmail: 'admin@forage.com',
      //   type: NotificationType.SYSTEM_ERROR,
      //   title: 'System Error: Monthly Profit Pool Distribution Failed',
      //   message: `Monthly profit pool distribution failed: ${error.message}`,
      // });
    }
  }

  /**
   * DAILY JOB: Send notifications to GA/GE users with updates
   * Runs every day at 9:00 AM
   */
  @Cron('0 9 * * *', {
    name: 'daily-ga-ge-notifications',
    timeZone: 'Africa/Lagos',
  })
  async sendDailyGrowthUserNotifications(): Promise<void> {
    this.logger.log('🔔 DAILY JOB: Starting GA/GE daily notifications...');
    
    try {
      // Get all GA/GE users
      const growthUsers = await this.userModel.find({
        role: { $in: [UserRole.GROWTH_ASSOCIATE, UserRole.GROWTH_ELITE] },
        isVerified: true,
      }).exec();

      this.logger.log(`📧 Sending daily updates to ${growthUsers.length} GA/GE users`);

      // Process notifications for each user
      const notificationPromises = growthUsers.map(user => this.sendUserDailyUpdate(user));
      await Promise.allSettled(notificationPromises);

      this.logger.log('🔔 DAILY JOB: GA/GE daily notifications completed');

    } catch (error) {
      this.logger.error('❌ Error in daily GA/GE notifications:', error);
      // TODO: Send admin alert about errors
      // await this.notificationsService.sendEmail({
      //   recipientEmail: 'admin@forage.com',
      //   type: NotificationType.SYSTEM_ERROR,
      //   title: 'System Error: Daily GA/GE Notifications Failed',
      //   message: `Daily GA/GE notifications failed: ${error.message}`,
      // });
    }
  }

  /**
   * Get current city capacities
   */
  private async getCurrentCityCapacities(): Promise<CityCapLimits> {
    const cityCapacities: CityCapLimits = {};

    for (const [city, limits] of Object.entries(this.CITY_CAPS)) {
      const currentGA = await this.userModel.countDocuments({
        city,
        role: UserRole.GROWTH_ASSOCIATE,
        isVerified: true,
      });

      const currentGE = await this.userModel.countDocuments({
        city,
        role: UserRole.GROWTH_ELITE,
        isVerified: true,
      });

      cityCapacities[city] = {
        maxGrowthAssociates: limits.maxGA,
        maxGrowthElites: limits.maxGE,
        currentGA,
        currentGE,
      };
    }

    return cityCapacities;
  }

  /**
   * Evaluate individual user qualification
   */
  private async evaluateUserQualification(
    user: UserDocument, 
    cityCapacities: CityCapLimits
  ): Promise<QualificationResult> {
    // Get user's referral count
    const referralCount = await this.referralModel.countDocuments({
      referrerId: user._id,
      status: 'active',
    });

    // Calculate user's total spend (orders + subscriptions)
    const orderSpend = await this.orderModel.aggregate([
      { $match: { userId: user._id, status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]);

    const subscriptionSpend = await this.subscriptionModel.aggregate([
      { $match: { userId: user._id, status: 'active' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]);

    const totalSpend = (orderSpend[0]?.total || 0) + (subscriptionSpend[0]?.total || 0);

    // Determine qualified role
    let qualifiedRole = UserRole.USER;
    
    if (referralCount >= this.QUALIFICATION_THRESHOLDS.GROWTH_ELITE.minReferrals &&
        totalSpend >= this.QUALIFICATION_THRESHOLDS.GROWTH_ELITE.minTotalSpend) {
      qualifiedRole = UserRole.GROWTH_ELITE;
    } else if (referralCount >= this.QUALIFICATION_THRESHOLDS.GROWTH_ASSOCIATE.minReferrals &&
               totalSpend >= this.QUALIFICATION_THRESHOLDS.GROWTH_ASSOCIATE.minTotalSpend) {
      qualifiedRole = UserRole.GROWTH_ASSOCIATE;
    }

    // Check city capacity constraints
    const cityLimits = cityCapacities[user.city];
    let promoted = false;
    let reason = '';

    if (user.role !== qualifiedRole) {
      if (qualifiedRole === UserRole.GROWTH_ELITE && cityLimits) {
        if (cityLimits.currentGE < cityLimits.maxGrowthElites) {
          promoted = true;
          cityLimits.currentGE++;
          reason = 'Promoted to Growth Elite';
        } else {
          reason = 'Qualified for GE but city capacity full';
        }
      } else if (qualifiedRole === UserRole.GROWTH_ASSOCIATE && cityLimits) {
        if (cityLimits.currentGA < cityLimits.maxGrowthAssociates) {
          promoted = true;
          cityLimits.currentGA++;
          reason = 'Promoted to Growth Associate';
        } else {
          reason = 'Qualified for GA but city capacity full';
        }
      } else if (qualifiedRole === UserRole.USER && user.role !== UserRole.USER) {
        promoted = true;
        reason = 'Demoted due to insufficient activity';
      }
    }

    return {
      userId: user._id.toString(),
      currentRole: user.role,
      qualifiedRole,
      referralCount,
      totalSpend,
      city: user.city,
      promoted,
      reason,
    };
  }

  /**
   * Apply role changes to users
   */
  private async applyRoleChanges(
    promotions: QualificationResult[], 
    demotions: QualificationResult[]
  ): Promise<void> {
    const allChanges = [...promotions, ...demotions];

    for (const change of allChanges) {
      try {
        await this.userModel.findByIdAndUpdate(change.userId, {
          role: change.qualifiedRole,
          updatedAt: new Date(),
        });

        // Enable/disable withdrawal capability based on role
        if (change.qualifiedRole === UserRole.GROWTH_ASSOCIATE || 
            change.qualifiedRole === UserRole.GROWTH_ELITE) {
          await this.walletModel.findOneAndUpdate(
            { userId: change.userId },
            { canWithdrawNibia: true }
          );
        } else {
          await this.walletModel.findOneAndUpdate(
            { userId: change.userId },
            { canWithdrawNibia: false }
          );
        }

        // TODO: Send notification to user (requires device token)
        // await this.notificationsService.sendPushNotification({
        //   deviceToken: 'user-device-token', // Would need to get from user profile
        //   type: NotificationType.ROLE_UPDATE,
        //   title: change.promoted ? '🎉 Congratulations! Role Upgrade' : '📢 Role Update',
        //   message: `Your account role has been updated to ${change.qualifiedRole}. ${change.reason}`,
        //   data: {
        //     type: change.promoted ? 'ROLE_PROMOTION' : 'ROLE_DEMOTION',
        //     newRole: change.qualifiedRole,
        //     previousRole: change.currentRole,
        //     reason: change.reason,
        //   },
        // });

        this.logger.log(`✅ Updated user ${change.userId}: ${change.currentRole} → ${change.qualifiedRole}`);

      } catch (error) {
        this.logger.error(`❌ Failed to update user ${change.userId}:`, error);
      }
    }
  }

  /**
   * Send qualification summary to admin
   */
  private async sendQualificationSummary(results: QualificationResult[]): Promise<void> {
    const promotions = results.filter(r => r.promoted && r.qualifiedRole !== UserRole.USER);
    const demotions = results.filter(r => r.promoted && r.qualifiedRole === UserRole.USER);
    
    const summary = {
      totalEvaluated: results.length,
      totalPromotions: promotions.length,
      totalDemotions: demotions.length,
      newGrowthElites: promotions.filter(r => r.qualifiedRole === UserRole.GROWTH_ELITE).length,
      newGrowthAssociates: promotions.filter(r => r.qualifiedRole === UserRole.GROWTH_ASSOCIATE).length,
    };

    // TODO: Send admin report
    // await this.notificationsService.sendEmail({
    //   recipientEmail: 'admin@forage.com',
    //   type: NotificationType.SYSTEM_ALERT,
    //   title: '🌙 Nightly GA/GE Qualification Report',
    //   message: `Qualification check completed. ${summary.totalPromotions} promotions, ${summary.totalDemotions} demotions.`,
    //   metadata: summary,
    // });
    
    this.logger.log(`📊 Qualification Summary: ${JSON.stringify(summary)}`);
  }

  /**
   * Get monthly distribution summary
   */
  private async getMonthlyDistributionSummary(month: string): Promise<any> {
    // This would integrate with the profit pool service to get distribution data
    // For now, return a placeholder
    return {
      month,
      totalPools: 0,
      totalDistributed: 0,
      beneficiaries: 0,
    };
  }

  /**
   * Send profit pool distribution summary
   */
  private async sendProfitPoolSummary(summary: any): Promise<void> {
    // TODO: Send admin report
    // await this.notificationsService.sendEmail({
    //   recipientEmail: 'admin@forage.com',
    //   type: NotificationType.SYSTEM_ALERT,
    //   title: '📅 Monthly Profit Pool Distribution Report',
    //   message: `Monthly profit pool distribution completed for ${summary.month}.`,
    //   metadata: summary,
    // });
    
    this.logger.log(`📊 Profit Pool Summary: ${JSON.stringify(summary)}`);
  }

  /**
   * Send daily update to individual GA/GE user
   */
  private async sendUserDailyUpdate(user: UserDocument): Promise<void> {
    try {
      // Get user's recent activity
      const recentReferrals = await this.referralModel.countDocuments({
        referrerId: user._id,
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // Last 24 hours
      });

      // Get pending withdrawals
      const pendingWithdrawals = await this.withdrawalRequestModel.countDocuments({
        userId: user._id,
        status: 'pending',
      });

      // Get recent commission earnings (last 7 days)
      const recentCommissions = await this.referralModel.aggregate([
        {
          $match: {
            referrerId: user._id,
            createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
          },
        },
        {
          $group: {
            _id: null,
            totalCommission: { $sum: '$commissionAmount' },
          },
        },
      ]);

      const weeklyCommissions = recentCommissions[0]?.totalCommission || 0;

      // Prepare notification content
      const notificationData = {
        recentReferrals,
        pendingWithdrawals,
        weeklyCommissions,
        role: user.role,
      };

      // TODO: Send personalized daily update (requires device token)
      // await this.notificationsService.sendPushNotification({
      //   deviceToken: 'user-device-token', // Would need to get from user profile
      //   type: NotificationType.DAILY_UPDATE,
      //   title: `🌟 Daily Update for ${user.role}`,
      //   message: this.generateDailyUpdateMessage(notificationData),
      //   data: {
      //     type: 'DAILY_UPDATE',
      //     ...notificationData,
      //   },
      // });
      
      this.logger.log(`📱 Daily update prepared for user ${user._id} (${user.role})`);

    } catch (error) {
      this.logger.error(`Failed to send daily update to user ${user._id}:`, error);
    }
  }

  /**
   * Generate personalized daily update message
   */
  private generateDailyUpdateMessage(data: any): string {
    const messages = [];

    if (data.recentReferrals > 0) {
      messages.push(`🎉 ${data.recentReferrals} new referral(s) in the last 24 hours!`);
    }

    if (data.weeklyCommissions > 0) {
      messages.push(`💰 You earned ₦${data.weeklyCommissions.toLocaleString()} in commissions this week.`);
    }

    if (data.pendingWithdrawals > 0) {
      messages.push(`⏳ You have ${data.pendingWithdrawals} pending withdrawal request(s).`);
    }

    if (messages.length === 0) {
      messages.push(`Keep up the great work as a ${data.role}! 🚀`);
    }

    return messages.join(' ');
  }
}
