import { Injectable, NotFoundException, BadRequestException, Logger, forwardRef, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Referral,
  ReferralDocument,
  ReferralStatus,
  CommissionType,
  CommissionHistory,
} from '../../entities/referral.entity';
import { User, UserDocument, UserRole } from '../../entities/user.entity';
import { Wallet, WalletDocument } from '../../entities/wallet.entity';
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
  ) {}

  async create(createReferralDto: CreateReferralDto): Promise<Referral> {
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

  async findAll(filterDto: ReferralFilterDto): Promise<Referral[]> {
    const { referrerId, referredUserId, status, isCommissionCompleted } = filterDto;
    const filter: any = {};
    
    if (referrerId) filter.referrerId = new Types.ObjectId(referrerId);
    if (referredUserId) filter.referredUserId = new Types.ObjectId(referredUserId);
    if (status) filter.status = status;
    if (isCommissionCompleted !== undefined) filter.isCommissionCompleted = isCommissionCompleted;
    
    return this.referralModel.find(filter).sort({ createdAt: -1 }).exec();
  }

  async findAllByReferrer(referrerId: string): Promise<Referral[]> {
    return this.referralModel
      .find({ referrerId: new Types.ObjectId(referrerId) })
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOne(id: string): Promise<Referral> {
    const referral = await this.referralModel.findById(id);
    if (!referral) {
      throw new NotFoundException('Referral not found');
    }
    return referral;
  }

  async update(id: string, updateReferralDto: UpdateReferralDto): Promise<Referral> {
    const referral = await this.referralModel.findById(id);
    
    if (!referral) {
      throw new NotFoundException('Referral not found');
    }
    
    Object.assign(referral, updateReferralDto);
    return referral.save();
  }

  async processCommission(referredUserId: string, processDto: ProcessCommissionDto): Promise<Referral> {
    // Find the referral for this user
    const referral = await this.referralModel.findOne({ 
      referredUserId: new Types.ObjectId(referredUserId) 
    });
    
    if (!referral) {
      this.logger.log(`No referral found for user ${referredUserId}`);
      return null;
    }

    // Check if this is a duplicate order commission
    const duplicateCommission = referral.commissionHistory.find(
      history => history.orderId.toString() === processDto.orderId
    );
    
    if (duplicateCommission) {
      this.logger.log(`Commission already processed for order ${processDto.orderId}`);
      return referral;
    }

    // Get the referrer to check their role
    const referrer = await this.userModel.findById(referral.referrerId);
    if (!referrer) {
      throw new NotFoundException('Referrer user not found');
    }

    // If referrer is not a pro-affiliate and already completed commissions, no more commissions
    const isProAffiliate = referrer.role === UserRole.PRO_AFFILIATE;
    if (!isProAffiliate && referral.isCommissionCompleted) {
      this.logger.log(`Regular user ${referrer._id} has already reached max commissions`);
      return referral;
    }

    // If regular user and purchase count >= MAX_REGULAR_USER_COMMISSIONS, mark as completed
    if (!isProAffiliate && referral.purchaseCount >= this.MAX_REGULAR_USER_COMMISSIONS - 1) {
      referral.isCommissionCompleted = true;
    }

    // Calculate commission amount
    const commissionPercentage = processDto.commissionPercentage || this.DEFAULT_COMMISSION_PERCENTAGE;
    const commissionAmount = (processDto.orderAmount * commissionPercentage) / 100;

    // Create commission history entry
    const commissionHistory: CommissionHistory = {
      orderId: new Types.ObjectId(processDto.orderId),
      amount: commissionAmount,
      type: processDto.commissionType,
      date: new Date(),
      orderAmount: processDto.orderAmount,
      commissionPercentage,
    };

    // Add to referral
    referral.commissionHistory.push(commissionHistory);
    referral.totalCommissionsEarned += commissionAmount;
    referral.purchaseCount += 1;

    // Update wallet
    const wallet = await this.walletModel.findOne({ userId: referral.referrerId });
    if (!wallet) {
      throw new NotFoundException('Referrer wallet not found');
    }

    // Add commission to appropriate wallet balance
    if (processDto.commissionType === CommissionType.FOOD_MONEY) {
      wallet.foodMoney += commissionAmount;
    } else {
      wallet.foodPoints += commissionAmount;
    }

    // Save both referral and wallet
    await Promise.all([
      referral.save(),
      wallet.save(),
    ]);

    this.logger.log(`Processed commission of ${commissionAmount} for referrer ${referrer._id}`);
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
    
    // Calculate total earnings by type
    const totalFoodMoneyEarned = referrals.reduce((sum, referral) => {
      const foodMoneyCommissions = referral.commissionHistory
        .filter(c => c.type === CommissionType.FOOD_MONEY)
        .reduce((total, commission) => total + commission.amount, 0);
      return sum + foodMoneyCommissions;
    }, 0);

    const totalFoodPointsEarned = referrals.reduce((sum, referral) => {
      const foodPointsCommissions = referral.commissionHistory
        .filter(c => c.type === CommissionType.FOOD_POINTS)
        .reduce((total, commission) => total + commission.amount, 0);
      return sum + foodPointsCommissions;
    }, 0);

    return {
      totalReferrals,
      activeReferrals,
      completedReferrals,
      totalCommissionsEarned: totalFoodMoneyEarned + totalFoodPointsEarned,
      totalFoodMoneyEarned,
      totalFoodPointsEarned,
    };
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
