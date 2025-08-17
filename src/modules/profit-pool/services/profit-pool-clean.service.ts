import { Injectable, Logger, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Cron } from '@nestjs/schedule';
import { ProfitPool, ProfitPoolDocument, ProfitPoolStatus } from '../entities/profit-pool.entity';
import { User, UserDocument, UserRole } from '../../users/entities/user.entity';
import { WalletsService } from '../../wallets/wallets.service';
import { TransactionType, WalletType } from '../../wallets/dto/update-balance.dto';
import { RevenueCalculationService } from './revenue-calculation.service';
import { PROFIT_POOL_CONSTANTS } from '../constants/profit-pool.constants';
import {
  CreateProfitPoolDto,
  DistributeProfitPoolDto,
  GetProfitPoolsDto,
  ProfitPoolStatsDto,
  ProcessDistributionDto,
} from '../dto/profit-pool.dto';
import * as moment from 'moment';

@Injectable()
export class ProfitPoolService {
  private readonly logger = new Logger(ProfitPoolService.name);

  constructor(
    @InjectModel(ProfitPool.name) private profitPoolModel: Model<ProfitPoolDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly walletsService: WalletsService,
    private readonly revenueCalculationService: RevenueCalculationService,
  ) {}

  /**
   * Monthly cron job to calculate profit pools for all cities
   */
  @Cron(PROFIT_POOL_CONSTANTS.MONTHLY_CALCULATION_CRON)
  async calculateMonthlyProfitPools() {
    const month = this.revenueCalculationService.getPreviousMonth();
    this.logger.log(`Running monthly profit pool calculation for ${month}`);

    try {
      // Get revenue for all cities
      const citiesRevenue = await this.revenueCalculationService.getAllCitiesRevenue(month);

      // Create profit pools for cities with sufficient revenue
      const createdPools = [];
      for (const [city, revenueData] of Object.entries(citiesRevenue)) {
        if (revenueData.totalRevenue >= PROFIT_POOL_CONSTANTS.MIN_POOL_AMOUNT / PROFIT_POOL_CONSTANTS.POOL_PERCENTAGE) {
          try {
            const pool = await this.createProfitPool({ city, month }, true);
            createdPools.push(pool);
          } catch (error) {
            this.logger.error(`Failed to create profit pool for ${city}:`, error);
          }
        } else {
          this.logger.log(`Skipping ${city}: insufficient revenue (₦${revenueData.totalRevenue})`);
        }
      }

      this.logger.log(`Created ${createdPools.length} profit pools for ${month}`);
    } catch (error) {
      this.logger.error(`Failed to calculate monthly profit pools:`, error);
    }
  }

  /**
   * Monthly cron job to distribute calculated profit pools
   */
  @Cron(PROFIT_POOL_CONSTANTS.DISTRIBUTION_CRON)
  async distributeMonthlyProfitPools() {
    const month = this.revenueCalculationService.getPreviousMonth();
    this.logger.log(`Running monthly profit pool distribution for ${month}`);

    try {
      // Find all calculated pools for the month
      const pools = await this.profitPoolModel.find({
        month,
        status: ProfitPoolStatus.CALCULATED,
      });

      // Distribute each pool
      for (const pool of pools) {
        try {
          await this.distributeProfitPool({ poolId: pool.id });
        } catch (error) {
          this.logger.error(`Failed to distribute pool ${pool.id}:`, error);
        }
      }

      this.logger.log(`Distributed ${pools.length} profit pools for ${month}`);
    } catch (error) {
      this.logger.error(`Failed to distribute monthly profit pools:`, error);
    }
  }

  /**
   * Create a profit pool for a city and month
   */
  async createProfitPool(dto: CreateProfitPoolDto, isAutomated = false): Promise<ProfitPool> {
    const { city, month } = dto;

    if (!this.revenueCalculationService.validateMonth(month)) {
      throw new ConflictException(PROFIT_POOL_CONSTANTS.ERRORS.INVALID_MONTH);
    }

    // Check if pool already exists
    const existingPool = await this.profitPoolModel.findOne({ city, month });
    if (existingPool && !dto.force) {
      throw new ConflictException(PROFIT_POOL_CONSTANTS.ERRORS.POOL_EXISTS);
    }

    try {
      // Calculate revenue for the city and month
      const revenueData = await this.revenueCalculationService.calculateCityRevenue(city, month);
      
      if (revenueData.totalRevenue === 0) {
        throw new ConflictException(PROFIT_POOL_CONSTANTS.ERRORS.INSUFFICIENT_REVENUE);
      }

      // Get Growth Elites in the city
      const growthElites = await this.getGrowthElitesInCity(city);
      if (growthElites.length === 0) {
        throw new ConflictException(PROFIT_POOL_CONSTANTS.ERRORS.NO_GES_FOUND);
      }

      // Calculate pool amount (1% of revenue converted to Nibia at 1:1 rate)
      const poolAmount = revenueData.totalRevenue * PROFIT_POOL_CONSTANTS.POOL_PERCENTAGE;
      const amountPerGE = poolAmount / growthElites.length;

      // Create distribution array
      const distributedTo = growthElites.map((ge) => ({
        userId: ge._id,
        userName: ge.name || 'Unknown GE',
        userEmail: ge.email,
        nibiaAmount: amountPerGE,
        credited: false,
      }));

      const profitPoolData = {
        city,
        month,
        totalRevenue: revenueData.totalRevenue,
        poolAmount,
        geCount: growthElites.length,
        amountPerGE,
        distributedTo,
        status: ProfitPoolStatus.CALCULATED,
        totalDistributed: 0,
        successfulDistributions: 0,
        failedDistributions: 0,
        metadata: {
          orderCount: revenueData.orderCount,
          averageOrderValue: revenueData.averageOrderValue,
          revenueGrowthPercent: 0, // TODO: Calculate based on previous month
          calculationDuration: revenueData.calculationTime,
        },
      };

      // Delete existing pool if force is true
      if (existingPool && dto.force) {
        await this.profitPoolModel.findByIdAndDelete(existingPool._id);
      }

      const pool = new this.profitPoolModel(profitPoolData);
      await pool.save();

      this.logger.log(
        `Created profit pool for ${city} in ${month}: ₦${poolAmount.toLocaleString()} for ${growthElites.length} GEs`,
      );

      return pool.toObject();
    } catch (error) {
      this.logger.error(`Failed to create profit pool for ${city} in ${month}:`, error);
      throw error;
    }
  }

  /**
   * Distribute a profit pool to Growth Elites
   */
  async distributeProfitPool(dto: DistributeProfitPoolDto): Promise<ProfitPool> {
    const pool = await this.profitPoolModel.findById(dto.poolId);
    if (!pool) {
      throw new NotFoundException(PROFIT_POOL_CONSTANTS.ERRORS.POOL_NOT_FOUND);
    }

    if (pool.status === ProfitPoolStatus.DISTRIBUTED) {
      throw new ConflictException(PROFIT_POOL_CONSTANTS.ERRORS.ALREADY_DISTRIBUTED);
    }

    try {
      let successfulDistributions = 0;
      let failedDistributions = 0;
      let totalDistributed = 0;

      // Process each distribution
      for (const distribution of pool.distributedTo) {
        if (distribution.credited) {
          successfulDistributions++;
          totalDistributed += distribution.nibiaAmount;
          continue; // Skip already credited distributions
        }

        try {
          // Credit Nibia to user's wallet using updateBalance method
          const transactionRef = `${PROFIT_POOL_CONSTANTS.TRANSACTION_PREFIX}_${pool.city}_${pool.month}_${distribution.userId}`;
          
          await this.walletsService.updateBalance(
            distribution.userId.toString(),
            {
              amount: distribution.nibiaAmount,
              walletType: WalletType.FOOD_POINTS, // Nibia is stored in foodPoints
              transactionType: TransactionType.CREDIT,
              description: `Profit pool distribution for ${pool.city} - ${pool.month}`,
            }
          );

          // Update distribution record
          distribution.credited = true;
          distribution.creditedAt = new Date();
          distribution.transactionRef = transactionRef;

          successfulDistributions++;
          totalDistributed += distribution.nibiaAmount;

          this.logger.log(
            `Credited ${distribution.nibiaAmount} Nibia to ${distribution.userEmail} for ${pool.city} ${pool.month}`,
          );

        } catch (error) {
          this.logger.error(`Failed to credit ${distribution.userEmail}:`, error);
          distribution.errorMessage = error.message;
          failedDistributions++;
        }
      }

      // Update pool status
      pool.successfulDistributions = successfulDistributions;
      pool.failedDistributions = failedDistributions;
      pool.totalDistributed = totalDistributed;
      pool.status = failedDistributions === 0 ? ProfitPoolStatus.DISTRIBUTED : ProfitPoolStatus.FAILED;
      pool.distributedAt = new Date();
      
      if (dto.notes) {
        pool.notes = dto.notes;
      }

      await pool.save();

      this.logger.log(
        `Distributed profit pool ${pool.id}: ${successfulDistributions} successful, ${failedDistributions} failed`,
      );

      return pool.toObject();
    } catch (error) {
      this.logger.error(`Failed to distribute profit pool ${dto.poolId}:`, error);
      throw error;
    }
  }

  /**
   * Get Growth Elites in a specific city
   */
  private async getGrowthElitesInCity(city: string): Promise<UserDocument[]> {
    return this.userModel.find({
      city: new RegExp(city, 'i'),
      role: UserRole.GROWTH_ELITE,
      isActive: true,
      'referralInfo.isGE': true,
    }).select('_id name email city role referralInfo');
  }

  /**
   * Get profit pools with pagination and filters
   */
  async getProfitPools(dto: GetProfitPoolsDto) {
    const {
      page = 1,
      limit = PROFIT_POOL_CONSTANTS.DEFAULT_PAGE_SIZE,
      city,
      month,
      status,
      fromDate,
      toDate,
    } = dto;

    // Build filter object
    const filter: any = {};
    if (city) filter.city = new RegExp(city, 'i');
    if (month) filter.month = month;
    if (status) filter.status = status;
    
    if (fromDate || toDate) {
      filter.createdAt = {};
      if (fromDate) filter.createdAt.$gte = new Date(fromDate);
      if (toDate) filter.createdAt.$lte = new Date(toDate);
    }

    // Get total count and data
    const [total, data] = await Promise.all([
      this.profitPoolModel.countDocuments(filter),
      this.profitPoolModel
        .find(filter)
        .sort({ createdAt: -1 })
        .limit(Math.min(limit, PROFIT_POOL_CONSTANTS.MAX_PAGE_SIZE))
        .skip((page - 1) * limit)
        .exec(),
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get profit pool statistics
   */
  async getProfitPoolStats(dto: ProfitPoolStatsDto) {
    const filter: any = {};
    
    if (dto.city) {
      filter.city = new RegExp(dto.city, 'i');
    }
    
    if (dto.month) {
      filter.month = dto.month;
    } else if (dto.year) {
      filter.month = new RegExp(`^${dto.year}-`);
    }

    const stats = await this.profitPoolModel.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalPools: { $sum: 1 },
          totalRevenue: { $sum: '$totalRevenue' },
          totalPoolAmount: { $sum: '$poolAmount' },
          totalDistributed: { $sum: '$totalDistributed' },
          totalGEs: { $sum: '$geCount' },
          avgAmountPerGE: { $avg: '$amountPerGE' },
          distributedPools: {
            $sum: {
              $cond: [{ $eq: ['$status', ProfitPoolStatus.DISTRIBUTED] }, 1, 0],
            },
          },
          failedPools: {
            $sum: {
              $cond: [{ $eq: ['$status', ProfitPoolStatus.FAILED] }, 1, 0],
            },
          },
        },
      },
    ]);

    return stats.length > 0 ? stats[0] : {
      totalPools: 0,
      totalRevenue: 0,
      totalPoolAmount: 0,
      totalDistributed: 0,
      totalGEs: 0,
      avgAmountPerGE: 0,
      distributedPools: 0,
      failedPools: 0,
    };
  }

  /**
   * Retry failed distributions in a profit pool
   */
  async retryFailedDistributions(dto: ProcessDistributionDto): Promise<ProfitPool> {
    const pool = await this.profitPoolModel.findById(dto.poolId);
    if (!pool) {
      throw new NotFoundException(PROFIT_POOL_CONSTANTS.ERRORS.POOL_NOT_FOUND);
    }

    // Reset failed distributions for retry
    if (dto.retryFailedOnly) {
      pool.distributedTo.forEach((distribution) => {
        if (!distribution.credited && distribution.errorMessage) {
          distribution.errorMessage = undefined;
        }
      });
    }

    // Set status back to calculated to allow redistribution
    pool.status = ProfitPoolStatus.CALCULATED;
    await pool.save();

    // Redistribute
    return this.distributeProfitPool({ poolId: dto.poolId });
  }

  /**
   * Get profit pool by ID
   */
  async getProfitPoolById(poolId: string): Promise<ProfitPool> {
    const pool = await this.profitPoolModel.findById(poolId);
    if (!pool) {
      throw new NotFoundException(PROFIT_POOL_CONSTANTS.ERRORS.POOL_NOT_FOUND);
    }
    return pool.toObject();
  }
}
