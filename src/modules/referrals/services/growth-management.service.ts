import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument, UserRole } from '../../users/entities/user.entity';
import { Order, OrderDocument } from '../../orders/entities/order.entity';
import { Commission, CommissionDocument, CommissionType } from '../entities/commission.entity';
import { REFERRAL_CONSTANTS } from '../constants/referral.constants';

export interface GrowthQualificationResult {
  userId: string;
  currentRole: UserRole;
  qualifiesForGA: boolean;
  qualifiesForGE: boolean;
  gaMetrics: {
    referralCount: number;
    totalSpend: number;
    requiredReferrals: number;
    requiredSpend: number;
  };
  geMetrics: {
    referralCount: number;
    averageAnnualSpend: number;
    consecutiveYears: number;
    requiredReferrals: number;
    requiredAnnualSpend: number;
  };
}

@Injectable()
export class GrowthManagementService {
  private readonly logger = new Logger(GrowthManagementService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(Commission.name) private commissionModel: Model<CommissionDocument>,
  ) {}

  async checkGrowthQualification(userId: string): Promise<GrowthQualificationResult> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new Error(`User ${userId} not found`);
    }

    // Get all users referred by this user
    const referredUsers = await this.userModel.find({
      referrerId: user._id,
    });

    const referralIds = referredUsers.map(u => u._id as Types.ObjectId);

    // Calculate metrics for GA qualification
    const gaMetrics = await this.calculateGAMetrics(referralIds, user.city);
    
    // Calculate metrics for GE qualification
    const geMetrics = await this.calculateGEMetrics(referralIds, user.city);

    const qualifiesForGA = await this.checkGAQualification(gaMetrics, user.city, referralIds.length);
    const qualifiesForGE = await this.checkGEQualification(geMetrics, user.city, referralIds.length);

    return {
      userId: user._id.toString(),
      currentRole: user.role,
      qualifiesForGA,
      qualifiesForGE,
      gaMetrics: {
        referralCount: referralIds.length,
        totalSpend: gaMetrics.totalSpend,
        requiredReferrals: REFERRAL_CONSTANTS.GA_QUALIFICATION.MIN_REFERRALS,
        requiredSpend: REFERRAL_CONSTANTS.GA_QUALIFICATION.MIN_TOTAL_SPEND,
      },
      geMetrics: {
        referralCount: referralIds.length,
        averageAnnualSpend: geMetrics.averageAnnualSpend,
        consecutiveYears: geMetrics.consecutiveYears,
        requiredReferrals: REFERRAL_CONSTANTS.GE_QUALIFICATION.MIN_REFERRALS,
        requiredAnnualSpend: REFERRAL_CONSTANTS.GE_QUALIFICATION.MIN_ANNUAL_SPEND_PER_REFERRAL,
      },
    };
  }

  private async calculateGAMetrics(referralIds: Types.ObjectId[], city: string): Promise<{
    totalSpend: number;
  }> {
    if (referralIds.length === 0) {
      return { totalSpend: 0 };
    }

    // Calculate total spend by referred users in their first year
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const pipeline = [
      {
        $match: {
          userId: { $in: referralIds },
          createdAt: { $gte: oneYearAgo },
        },
      },
      {
        $group: {
          _id: null,
          totalSpend: { $sum: '$totalAmountInNibia' },
        },
      },
    ];

    const result = await this.orderModel.aggregate(pipeline);
    const totalSpend = result.length > 0 ? result[0].totalSpend : 0;

    return { totalSpend };
  }

  private async calculateGEMetrics(referralIds: Types.ObjectId[], city: string): Promise<{
    averageAnnualSpend: number;
    consecutiveYears: number;
  }> {
    if (referralIds.length === 0) {
      return { averageAnnualSpend: 0, consecutiveYears: 0 };
    }

    // Calculate annual spend for each of the last 3 years
    const currentYear = new Date().getFullYear();
    const years = [currentYear - 2, currentYear - 1, currentYear];
    
    const yearlySpends = await Promise.all(
      years.map(async (year) => {
        const startDate = new Date(year, 0, 1);
        const endDate = new Date(year + 1, 0, 1);

        const pipeline = [
          {
            $match: {
              userId: { $in: referralIds },
              createdAt: { $gte: startDate, $lt: endDate },
            },
          },
          {
            $group: {
              _id: null,
              totalSpend: { $sum: '$totalAmountInNibia' },
            },
          },
        ];

        const result = await this.orderModel.aggregate(pipeline);
        return result.length > 0 ? result[0].totalSpend : 0;
      })
    );

    // Calculate average annual spend per referral
    const totalReferrals = referralIds.length;
    const averageAnnualSpend = totalReferrals > 0 
      ? yearlySpends.reduce((sum, spend) => sum + spend, 0) / (years.length * totalReferrals)
      : 0;

    // Check for consecutive years meeting the requirement
    let consecutiveYears = 0;
    const requiredAnnualSpendPerReferral = REFERRAL_CONSTANTS.GE_QUALIFICATION.MIN_ANNUAL_SPEND_PER_REFERRAL;
    
    for (let i = yearlySpends.length - 1; i >= 0; i--) {
      const yearlySpendPerReferral = totalReferrals > 0 ? yearlySpends[i] / totalReferrals : 0;
      if (yearlySpendPerReferral >= requiredAnnualSpendPerReferral) {
        consecutiveYears++;
      } else {
        break;
      }
    }

    return { averageAnnualSpend, consecutiveYears };
  }

  private async checkGAQualification(
    metrics: { totalSpend: number }, 
    city: string,
    referralCount: number
  ): Promise<boolean> {
    // Check basic requirements
    const hasMinReferrals = referralCount >= REFERRAL_CONSTANTS.GA_QUALIFICATION.MIN_REFERRALS;
    const hasMinSpend = metrics.totalSpend >= REFERRAL_CONSTANTS.GA_QUALIFICATION.MIN_TOTAL_SPEND;

    if (!hasMinReferrals || !hasMinSpend) {
      return false;
    }

    // Check city limit
    const currentGACount = await this.userModel.countDocuments({
      role: UserRole.GROWTH_ASSOCIATE,
      city: city,
    });

    return currentGACount < REFERRAL_CONSTANTS.GA_QUALIFICATION.MAX_PER_CITY;
  }

  private async checkGEQualification(
    metrics: { averageAnnualSpend: number; consecutiveYears: number }, 
    city: string,
    referralCount: number
  ): Promise<boolean> {
    // Check basic requirements
    const hasMinReferrals = referralCount >= REFERRAL_CONSTANTS.GE_QUALIFICATION.MIN_REFERRALS;
    const hasMinConsecutiveYears = metrics.consecutiveYears >= REFERRAL_CONSTANTS.GE_QUALIFICATION.CONSECUTIVE_YEARS;
    const hasMinAnnualSpend = metrics.averageAnnualSpend >= REFERRAL_CONSTANTS.GE_QUALIFICATION.MIN_ANNUAL_SPEND_PER_REFERRAL;

    if (!hasMinReferrals || !hasMinConsecutiveYears || !hasMinAnnualSpend) {
      return false;
    }

    // Check city limit
    const currentGECount = await this.userModel.countDocuments({
      role: UserRole.GROWTH_ELITE,
      city: city,
    });

    return currentGECount < REFERRAL_CONSTANTS.GE_QUALIFICATION.MAX_PER_CITY;
  }

  async promoteToGrowthAssociate(userId: string): Promise<UserDocument> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new Error(`User ${userId} not found`);
    }

    const qualification = await this.checkGrowthQualification(userId);
    if (!qualification.qualifiesForGA) {
      throw new Error(`User ${userId} does not qualify for Growth Associate`);
    }

    user.role = UserRole.GROWTH_ASSOCIATE;
    await user.save();

    this.logger.log(`Promoted user ${userId} to Growth Associate`);
    return user;
  }

  async promoteToGrowthElite(userId: string): Promise<UserDocument> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new Error(`User ${userId} not found`);
    }

    const qualification = await this.checkGrowthQualification(userId);
    if (!qualification.qualifiesForGE) {
      throw new Error(`User ${userId} does not qualify for Growth Elite`);
    }

    user.role = UserRole.GROWTH_ELITE;
    await user.save();

    this.logger.log(`Promoted user ${userId} to Growth Elite`);
    return user;
  }

  async checkAndPromoteAllEligibleUsers(): Promise<{
    promotedToGA: number;
    promotedToGE: number;
    errors: string[];
  }> {
    const users = await this.userModel.find({
      role: { $in: [UserRole.USER, UserRole.PRO_AFFILIATE, UserRole.GROWTH_ASSOCIATE] },
    });

    let promotedToGA = 0;
    let promotedToGE = 0;
    const errors: string[] = [];

    for (const user of users) {
      try {
        const qualification = await this.checkGrowthQualification(user._id.toString());

        // Promote to GE if qualified (highest priority)
        if (qualification.qualifiesForGE && user.role !== UserRole.GROWTH_ELITE) {
          await this.promoteToGrowthElite(user._id.toString());
          promotedToGE++;
        }
        // Promote to GA if qualified and not already GE
        else if (qualification.qualifiesForGA && user.role === UserRole.USER) {
          await this.promoteToGrowthAssociate(user._id.toString());
          promotedToGA++;
        }
      } catch (error) {
        errors.push(`Failed to process user ${user._id}: ${error.message}`);
        this.logger.error(`Failed to process user ${user._id}: ${error.message}`);
      }
    }

    this.logger.log(`Promotion check completed: ${promotedToGA} GA, ${promotedToGE} GE, ${errors.length} errors`);

    return { promotedToGA, promotedToGE, errors };
  }

  async calculateCityRevenue(city: string, startDate: Date, endDate: Date): Promise<number> {
    // Calculate total revenue from orders in the city
    const pipeline = [
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user',
        },
      },
      {
        $unwind: '$user',
      },
      {
        $match: {
          'user.city': city,
          createdAt: { $gte: startDate, $lte: endDate },
          status: { $in: ['delivered', 'completed'] }, // Only completed orders
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalAmountInNibia' },
        },
      },
    ];

    const result = await this.orderModel.aggregate(pipeline);
    return result.length > 0 ? result[0].totalRevenue : 0;
  }

  async distributeCityRevenueToGE(city: string): Promise<void> {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const endOfMonth = new Date(startOfMonth);
    endOfMonth.setMonth(endOfMonth.getMonth() + 1);
    endOfMonth.setDate(0);
    endOfMonth.setHours(23, 59, 59, 999);

    // Calculate city revenue for the month
    const cityRevenue = await this.calculateCityRevenue(city, startOfMonth, endOfMonth);
    const revenueShare = (cityRevenue * REFERRAL_CONSTANTS.GE_QUALIFICATION.CITY_REVENUE_SHARE) / 100;

    // Get all Growth Elites in the city
    const growthElites = await this.userModel.find({
      role: UserRole.GROWTH_ELITE,
      city: city,
    });

    if (growthElites.length === 0) {
      this.logger.log(`No Growth Elites found in ${city}`);
      return;
    }

    // Distribute equally among all GEs in the city
    const sharePerGE = revenueShare / growthElites.length;

    const commissionPromises = growthElites.map(ge => 
      this.commissionModel.create({
        userId: ge._id,
        amount: sharePerGE,
        type: CommissionType.GE_CITY_REVENUE,
        rate: REFERRAL_CONSTANTS.GE_QUALIFICATION.CITY_REVENUE_SHARE,
        city: city,
        earnedAt: new Date(),
        metadata: {
          month: startOfMonth.toISOString().substring(0, 7),
          totalCityRevenue: cityRevenue,
          totalGEs: growthElites.length,
        },
      })
    );

    await Promise.all(commissionPromises);

    this.logger.log(`Distributed ${revenueShare} Nibia city revenue share to ${growthElites.length} Growth Elites in ${city}`);
  }

  async getGrowthStats(): Promise<{
    totalGA: number;
    totalGE: number;
    gaByCity: Record<string, number>;
    geByCity: Record<string, number>;
  }> {
    const [gaPipeline, gePipeline] = await Promise.all([
      this.userModel.aggregate([
        { $match: { role: UserRole.GROWTH_ASSOCIATE } },
        { $group: { _id: '$city', count: { $sum: 1 } } },
      ]),
      this.userModel.aggregate([
        { $match: { role: UserRole.GROWTH_ELITE } },
        { $group: { _id: '$city', count: { $sum: 1 } } },
      ]),
    ]);

    const gaByCity = gaPipeline.reduce((acc, item) => {
      acc[item._id || 'unknown'] = item.count as number;
      return acc;
    }, {} as Record<string, number>);

    const geByCity = gePipeline.reduce((acc, item) => {
      acc[item._id || 'unknown'] = item.count as number;
      return acc;
    }, {} as Record<string, number>);

    const totalGA: number = Object.values(gaByCity).reduce<number>((sum: number, count: number) => sum + count, 0);
    const totalGE: number = Object.values(geByCity).reduce<number>((sum: number, count: number) => sum + count, 0);

    return { totalGA, totalGE, gaByCity, geByCity };
  }
}
