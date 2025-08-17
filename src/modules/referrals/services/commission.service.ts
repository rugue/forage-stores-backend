import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Commission, CommissionDocument, CommissionType, CommissionStatus } from '../entities/commission.entity';
import { User, UserDocument, UserRole } from '../../users/entities/user.entity';
import { Order, OrderDocument } from '../../orders/entities/order.entity';
import { Wallet, WalletDocument } from '../../wallets/entities/wallet.entity';
import { REFERRAL_CONSTANTS } from '../constants/referral.constants';

export interface CreateCommissionDto {
  userId: string;
  orderId?: string;
  referredUserId?: string;
  amount: number;
  type: CommissionType;
  rate: number;
  orderAmount?: number;
  city: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class CommissionService {
  private readonly logger = new Logger(CommissionService.name);

  constructor(
    @InjectModel(Commission.name) private commissionModel: Model<CommissionDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(Wallet.name) private walletModel: Model<WalletDocument>,
  ) {}

  async createCommission(dto: CreateCommissionDto): Promise<CommissionDocument> {
    const commission = new this.commissionModel({
      userId: new Types.ObjectId(dto.userId),
      orderId: dto.orderId ? new Types.ObjectId(dto.orderId) : undefined,
      referredUserId: dto.referredUserId ? new Types.ObjectId(dto.referredUserId) : undefined,
      amount: dto.amount,
      type: dto.type,
      status: CommissionStatus.PENDING,
      rate: dto.rate,
      orderAmount: dto.orderAmount,
      city: dto.city,
      earnedAt: new Date(),
      metadata: dto.metadata,
    });

    return commission.save();
  }

  async processCommissionsForOrder(orderId: string): Promise<CommissionDocument[]> {
    const order = await this.orderModel.findById(orderId).populate('userId');
    if (!order) {
      this.logger.error(`Order not found: ${orderId}`);
      return [];
    }

    const referredUser = order.userId as any;
    if (!referredUser) {
      this.logger.error(`User not found for order: ${orderId}`);
      return [];
    }

    // Find the referrer of this user
    if (!referredUser.referrerId) {
      this.logger.log(`No referrer found for user: ${referredUser._id}`);
      return [];
    }

    const referrer = await this.userModel.findById(referredUser.referrerId);
    if (!referrer) {
      this.logger.log(`Referrer not found for user: ${referredUser._id}`);
      return [];
    }

    const commissions: CommissionDocument[] = [];

    const commission = await this.calculateAndCreateCommission(
      referrer,
      order,
      referredUser,
    );
    
    if (commission) {
      commissions.push(commission);
    }

    return commissions;
  }

  private async calculateAndCreateCommission(
    referrer: UserDocument,
    order: OrderDocument,
    referredUser: UserDocument,
  ): Promise<CommissionDocument | null> {
    // Check if commission already exists for this order and referrer
    const existingCommission = await this.commissionModel.findOne({
      userId: referrer._id,
      orderId: order._id,
    });

    if (existingCommission) {
      this.logger.log(`Commission already exists for order ${order._id} and referrer ${referrer._id}`);
      return null;
    }

    let commissionType: CommissionType;
    let shouldEarnCommission = false;
    let commissionRate = 0;

    // Determine commission eligibility based on referrer role
    switch (referrer.role) {
      case UserRole.GROWTH_ASSOCIATE:
        shouldEarnCommission = true;
        commissionType = CommissionType.GA_REFERRAL;
        commissionRate = this.calculateDynamicRate(order.totalAmountInNibia);
        break;

      case UserRole.GROWTH_ELITE:
        shouldEarnCommission = true;
        commissionType = CommissionType.GE_REFERRAL;
        commissionRate = this.calculateDynamicRate(order.totalAmountInNibia);
        break;

      case UserRole.USER:
      case UserRole.PRO_AFFILIATE:
        // Check if this is within the first 3 purchases
        const previousCommissions = await this.commissionModel.countDocuments({
          userId: referrer._id,
          referredUserId: referredUser._id,
          type: CommissionType.NORMAL_REFERRAL,
        });

        if (previousCommissions < REFERRAL_CONSTANTS.NORMAL_USER.MAX_QUALIFYING_PURCHASES) {
          shouldEarnCommission = true;
          commissionType = CommissionType.NORMAL_REFERRAL;
          commissionRate = this.calculateDynamicRate(order.totalAmountInNibia);
        }
        break;

      default:
        shouldEarnCommission = false;
    }

    if (!shouldEarnCommission) {
      return null;
    }

    const commissionAmount = (order.totalAmountInNibia * commissionRate) / 100;

    return this.createCommission({
      userId: referrer._id.toString(),
      orderId: order._id.toString(),
      referredUserId: referredUser._id.toString(),
      amount: commissionAmount,
      type: commissionType,
      rate: commissionRate,
      orderAmount: order.totalAmountInNibia,
      city: referredUser.city || 'unknown',
    });
  }

  private calculateDynamicRate(orderAmount: number): number {
    // Dynamic commission rate between 0.5% and 2.5% based on order amount
    const minRate = REFERRAL_CONSTANTS.NORMAL_USER.COMMISSION_RATE_MIN;
    const maxRate = REFERRAL_CONSTANTS.NORMAL_USER.COMMISSION_RATE_MAX;
    
    // Scale rate based on order amount (higher amounts get higher rates)
    const baseAmount = 50000; // ₦50k base amount
    const scaleFactor = Math.min(orderAmount / baseAmount, 5); // Cap at 5x multiplier
    
    const rate = minRate + ((maxRate - minRate) * (scaleFactor - 1) / 4);
    return Math.min(Math.max(rate, minRate), maxRate);
  }

  async processCommission(commissionId: string): Promise<CommissionDocument> {
    const commission = await this.commissionModel.findById(commissionId);
    if (!commission || commission.status !== CommissionStatus.PENDING) {
      throw new Error(`Commission ${commissionId} not found or not pending`);
    }

    // Find user's wallet
    const wallet = await this.walletModel.findOne({ userId: commission.userId });
    if (!wallet) {
      throw new Error(`Wallet not found for user ${commission.userId}`);
    }

    // Add commission to user's Nibia balance
    wallet.foodMoney += commission.amount;

    // Update commission status
    commission.status = CommissionStatus.PROCESSED;
    commission.processedAt = new Date();

    await Promise.all([
      wallet.save(),
      commission.save(),
    ]);

    this.logger.log(`Processed commission ${commissionId}: ${commission.amount} Nibia for user ${commission.userId}`);
    return commission;
  }

  async getCommissionsByUser(
    userId: string, 
    filters?: {
      type?: CommissionType;
      status?: CommissionStatus;
      startDate?: Date;
      endDate?: Date;
    }
  ): Promise<CommissionDocument[]> {
    const query: any = { userId: new Types.ObjectId(userId) };
    
    if (filters?.type) query.type = filters.type;
    if (filters?.status) query.status = filters.status;
    if (filters?.startDate || filters?.endDate) {
      query.earnedAt = {};
      if (filters.startDate) query.earnedAt.$gte = filters.startDate;
      if (filters.endDate) query.earnedAt.$lte = filters.endDate;
    }

    return this.commissionModel
      .find(query)
      .sort({ earnedAt: -1 })
      .populate('orderId')
      .populate('referredUserId', 'name email')
      .exec();
  }

  async getCommissionStats(userId: string): Promise<{
    totalEarned: number;
    totalPending: number;
    totalProcessed: number;
    commissionsByType: Record<CommissionType, number>;
    monthlyStats: Array<{ month: string; amount: number; count: number }>;
  }> {
    const commissions = await this.commissionModel.find({ 
      userId: new Types.ObjectId(userId) 
    });

    const totalEarned = commissions.reduce((sum, c) => sum + c.amount, 0);
    const totalPending = commissions
      .filter(c => c.status === CommissionStatus.PENDING)
      .reduce((sum, c) => sum + c.amount, 0);
    const totalProcessed = commissions
      .filter(c => c.status === CommissionStatus.PROCESSED)
      .reduce((sum, c) => sum + c.amount, 0);

    const commissionsByType = commissions.reduce((acc, c) => {
      acc[c.type] = (acc[c.type] || 0) + c.amount;
      return acc;
    }, {} as Record<CommissionType, number>);

    // Calculate monthly stats for the last 12 months
    const monthlyStats = this.calculateMonthlyStats(commissions);

    return {
      totalEarned,
      totalPending,
      totalProcessed,
      commissionsByType,
      monthlyStats,
    };
  }

  private calculateMonthlyStats(commissions: CommissionDocument[]): Array<{ month: string; amount: number; count: number }> {
    const monthlyData: Record<string, { amount: number; count: number }> = {};
    
    commissions.forEach(commission => {
      const monthKey = commission.earnedAt.toISOString().substring(0, 7); // YYYY-MM
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { amount: 0, count: 0 };
      }
      monthlyData[monthKey].amount += commission.amount;
      monthlyData[monthKey].count += 1;
    });

    return Object.entries(monthlyData)
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => b.month.localeCompare(a.month))
      .slice(0, 12); // Last 12 months
  }

  async processPendingCommissions(): Promise<number> {
    const pendingCommissions = await this.commissionModel.find({
      status: CommissionStatus.PENDING,
    });

    let processedCount = 0;
    
    for (const commission of pendingCommissions) {
      try {
        await this.processCommission(commission._id.toString());
        processedCount++;
      } catch (error) {
        this.logger.error(`Failed to process commission ${commission._id}: ${error.message}`);
      }
    }

    this.logger.log(`Processed ${processedCount} pending commissions`);
    return processedCount;
  }
}
