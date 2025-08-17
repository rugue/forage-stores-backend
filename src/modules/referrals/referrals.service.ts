import { Injectable, NotFoundException, BadRequestException, Logger, forwardRef, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Referral,
  ReferralDocument,
  ReferralStatus,
  CommissionType as LegacyCommissionType,
} from '../referrals/entities/referral.entity';
import { ICommissionHistory } from '../referrals/interfaces/referral.interface';
import { User, UserDocument, UserRole } from '../users/entities/user.entity';
import { Wallet, WalletDocument } from '../wallets/entities/wallet.entity';
import { Commission, CommissionDocument, CommissionType } from './entities/commission.entity';
import { CommissionService } from './services/commission.service';
import { GrowthManagementService } from './services/growth-management.service';
import {
  CreateReferralDto,
  ProcessCommissionDto,
  ReferralFilterDto,
  UpdateReferralDto,
} from './dto';

@Injectable()
export class ReferralsService {
  private readonly logger = new Logger(ReferralsService.name);
  private readonly DEFAULT_COMMISSION_PERCENTAGE = 5; // 5% commission
  private readonly MAX_REGULAR_USER_COMMISSIONS = 3; // Regular users get commissions for first 3 purchases

  constructor(
    @InjectModel(Referral.name) private referralModel: Model<ReferralDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Wallet.name) private walletModel: Model<WalletDocument>,
    @InjectModel(Commission.name) private commissionModel: Model<CommissionDocument>,
    private commissionService: CommissionService,
    private growthManagementService: GrowthManagementService,
  ) {}

  async create(createReferralDto: CreateReferralDto): Promise<ReferralDocument> {
    const { referralCode, referrerId, referredUserId } = createReferralDto;
    
    // Check if referral already exists for this referred user
    const existingReferral = await this.referralModel.findOne({ 
      referredUserId: new Types.ObjectId(referredUserId) 
    });
    
    if (existingReferral) {
      throw new BadRequestException('User has already been referred');
    }

    // Determine referrer from code or direct ID
    let actualReferrerId = referrerId;
    
    if (referralCode && !referrerId) {
      const referrer = await this.userModel.findOne({ referralCode });
      if (!referrer) {
        throw new NotFoundException('Invalid referral code');
      }
      actualReferrerId = referrer._id.toString();
    } else if (!referralCode && !referrerId) {
      throw new BadRequestException('Either referralCode or referrerId must be provided');
    }

    // Validate both users exist
    const [referrerUser, referredUser] = await Promise.all([
      this.userModel.findById(actualReferrerId),
      this.userModel.findById(referredUserId),
    ]);

    if (!referrerUser) {
      throw new NotFoundException('Referrer user not found');
    }

    if (!referredUser) {
      throw new NotFoundException('Referred user not found');
    }

    // Set referrerId in referred user for easy lookup
    referredUser.referrerId = new Types.ObjectId(actualReferrerId);
    await referredUser.save();

    // Create the referral
    const referral = new this.referralModel({
      referrerId: new Types.ObjectId(actualReferrerId),
      referredUserId: new Types.ObjectId(referredUserId),
      referralDate: new Date(),
      signUpDate: new Date(), // Use current date instead of createdAt
      status: ReferralStatus.ACTIVE,
      referralCode: referralCode || referrerUser.referralCode,
      totalCommissionsEarned: 0,
      purchaseCount: 0,
      isCommissionCompleted: false,
      commissionHistory: [],
    });

    return referral.save();
  }

  async findAll(filterDto: ReferralFilterDto): Promise<ReferralDocument[]> {
    const { referrerId, referredUserId, status, isCommissionCompleted } = filterDto;
    const filter: any = {};
    
    if (referrerId) filter.referrerId = new Types.ObjectId(referrerId);
    if (referredUserId) filter.referredUserId = new Types.ObjectId(referredUserId);
    if (status) filter.status = status;
    if (isCommissionCompleted !== undefined) filter.isCommissionCompleted = isCommissionCompleted;
    
    return this.referralModel.find(filter).sort({ createdAt: -1 }).exec();
  }

  async findAllByReferrer(referrerId: string): Promise<ReferralDocument[]> {
    return this.referralModel
      .find({ referrerId: new Types.ObjectId(referrerId) })
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOne(id: string): Promise<ReferralDocument> {
    const referral = await this.referralModel.findById(id);
    if (!referral) {
      throw new NotFoundException('Referral not found');
    }
    return referral;
  }

  async update(id: string, updateReferralDto: UpdateReferralDto): Promise<ReferralDocument> {
    const referral = await this.referralModel.findById(id);
    
    if (!referral) {
      throw new NotFoundException('Referral not found');
    }
    
    Object.assign(referral, updateReferralDto);
    return referral.save();
  }

  async processCommission(referredUserId: string, processDto: ProcessCommissionDto): Promise<ReferralDocument> {
    // Find the referral for this user
    const referral = await this.referralModel.findOne({ 
      referredUserId: new Types.ObjectId(referredUserId) 
    });
    
    if (!referral) {
      this.logger.log(`No referral found for user ${referredUserId}`);
      return null;
    }

    // Use the new commission service to process commissions
    const commissions = await this.commissionService.processCommissionsForOrder(processDto.orderId);
    
    if (commissions.length > 0) {
      // Update legacy referral for backward compatibility
      const commission = commissions[0];
      const commissionHistory: ICommissionHistory = {
        orderId: new Types.ObjectId(processDto.orderId),
        amount: commission.amount,
        type: processDto.commissionType,
        date: new Date(),
        orderAmount: processDto.orderAmount,
        commissionPercentage: commission.rate,
        isProcessed: false,
      };

      referral.commissionHistory.push(commissionHistory);
      referral.totalCommissionsEarned += commission.amount;
      referral.purchaseCount += 1;

      // Check if this is a regular user and has reached the limit
      const referrer = await this.userModel.findById(referral.referrerId);
      if (referrer && 
          (referrer.role === UserRole.USER || referrer.role === UserRole.PRO_AFFILIATE) && 
          referral.purchaseCount >= this.MAX_REGULAR_USER_COMMISSIONS) {
        referral.isCommissionCompleted = true;
      }

      await referral.save();
    }

    return referral;
  }

  async getReferralStats(referrerId: string) {
    const referrals = await this.referralModel.find({ 
      referrerId: new Types.ObjectId(referrerId) 
    });

    // Calculate stats
    const totalReferrals = referrals.length;
    const activeReferrals = referrals.filter(r => r.status === ReferralStatus.ACTIVE).length;
    const completedReferrals = referrals.filter(r => r.isCommissionCompleted).length;
    
    // Get commission stats from the new commission service
    const commissionStats = await this.commissionService.getCommissionStats(referrerId);

    return {
      totalReferrals,
      activeReferrals,
      completedReferrals,
      totalCommissionsEarned: commissionStats.totalEarned,
      totalFoodMoneyEarned: commissionStats.totalProcessed,
      totalFoodPointsEarned: 0, // Legacy field
      newCommissionSystem: commissionStats,
    };
  }

  async getGrowthQualification(userId: string) {
    return this.growthManagementService.checkGrowthQualification(userId);
  }

  async promoteToGrowthAssociate(userId: string) {
    return this.growthManagementService.promoteToGrowthAssociate(userId);
  }

  async promoteToGrowthElite(userId: string) {
    return this.growthManagementService.promoteToGrowthElite(userId);
  }

  async getCommissions(userId: string, filters?: any) {
    return this.commissionService.getCommissionsByUser(userId, filters);
  }

  async generateReferralCode(userId: string): Promise<string> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.referralCode) {
      return user.referralCode;
    }

    // Generate a random alphanumeric code
    const generateCode = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let result = '';
      for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    };

    // Ensure uniqueness
    let isUnique = false;
    let newCode;
    
    while (!isUnique) {
      newCode = generateCode();
      const existingUser = await this.userModel.findOne({ referralCode: newCode });
      isUnique = !existingUser;
    }

    // Update user with new code
    user.referralCode = newCode;
    await user.save();

    return newCode;
  }
}
