import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import {
  WithdrawalRequest,
  WithdrawalRequestDocument,
  WithdrawalStatus,
} from '../entities/withdrawal-request.entity';
import { Wallet, WalletDocument } from '../entities/wallet.entity';
import { User, UserDocument, UserRole } from '../../users/entities/user.entity';
import {
  CreateWithdrawalRequestDto,
  ProcessWithdrawalRequestDto,
  GetWithdrawalRequestsDto,
  WithdrawalStatsDto,
} from '../dto/withdrawal-request.dto';
import { WALLET_CONSTANTS } from '../constants/wallet.constants';

@Injectable()
export class WithdrawalService {
  constructor(
    @InjectModel(WithdrawalRequest.name)
    private withdrawalRequestModel: Model<WithdrawalRequestDocument>,
    @InjectModel(Wallet.name)
    private walletModel: Model<WalletDocument>,
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
  ) {}

  /**
   * Create a new withdrawal request (GA/GE users only)
   */
  async createWithdrawalRequest(
    userId: string,
    createDto: CreateWithdrawalRequestDto,
  ): Promise<WithdrawalRequest> {
    // Validate user exists and has GA/GE role
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!this.isEligibleForWithdrawal(user.role)) {
      throw new ForbiddenException(
        'Only Growth Associates and Growth Elites can withdraw Nibia',
      );
    }

    // Get user's wallet
    const wallet = await this.walletModel.findOne({ userId: new Types.ObjectId(userId) });
    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    // Check if withdrawal is enabled for the user
    if (!wallet.nibiaWithdrawEnabled) {
      throw new ForbiddenException(
        'Nibia withdrawal is not enabled for your account. Please contact support.',
      );
    }

    // Check if user has sufficient Nibia balance
    if (wallet.foodPoints < createDto.nibiaAmount) {
      throw new BadRequestException(
        `Insufficient Nibia balance. Available: ${wallet.foodPoints}, Requested: ${createDto.nibiaAmount}`,
      );
    }

    // Validate withdrawal limits
    await this.validateWithdrawalLimits(userId, createDto.nibiaAmount);

    // Calculate equivalent NGN (1:1 rate as per requirements)
    const ngnAmount = createDto.nibiaAmount * WALLET_CONSTANTS.NIBIA_TO_NGN_RATE;

    // Determine priority based on user role
    const priority = this.getUserPriority(user.role);

    // Create withdrawal request
    const withdrawalRequest = new this.withdrawalRequestModel({
      userId: new Types.ObjectId(userId),
      walletId: wallet._id,
      nibiaAmount: createDto.nibiaAmount,
      ngnAmount,
      status: WithdrawalStatus.PENDING,
      userReason: createDto.userReason,
      userRole: user.role,
      priority,
    });

    return await withdrawalRequest.save();
  }

  /**
   * Get withdrawal requests for a user
   */
  async getUserWithdrawalRequests(
    userId: string,
    queryDto: GetWithdrawalRequestsDto,
  ): Promise<{
    requests: WithdrawalRequest[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { status, page = 1, limit = 20 } = queryDto;
    const skip = (page - 1) * limit;

    const filter: any = { userId: new Types.ObjectId(userId) };
    if (status) {
      filter.status = status;
    }

    const [requests, total] = await Promise.all([
      this.withdrawalRequestModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('processedBy', 'name email')
        .exec(),
      this.withdrawalRequestModel.countDocuments(filter),
    ]);

    return { requests, total, page, limit };
  }

  /**
   * Get a single withdrawal request by ID
   */
  async getWithdrawalRequestById(
    requestId: string,
    requestingUserId: string,
    requestingUserRole: string,
  ): Promise<WithdrawalRequest> {
    const request = await this.withdrawalRequestModel
      .findById(requestId)
      .populate('userId', 'name email role')
      .populate('processedBy', 'name email')
      .exec();

    if (!request) {
      throw new NotFoundException('Withdrawal request not found');
    }

    // Users can only see their own requests, admins can see all
    if (requestingUserRole !== UserRole.ADMIN && request.userId.toString() !== requestingUserId) {
      throw new ForbiddenException('Access denied');
    }

    return request;
  }

  /**
   * Get all withdrawal requests (Admin only)
   */
  async getAllWithdrawalRequests(
    queryDto: GetWithdrawalRequestsDto,
  ): Promise<{
    requests: WithdrawalRequest[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { status, userId, page = 1, limit = 20 } = queryDto;
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (status) filter.status = status;
    if (userId) filter.userId = new Types.ObjectId(userId);

    const [requests, total] = await Promise.all([
      this.withdrawalRequestModel
        .find(filter)
        .sort({ priority: -1, createdAt: 1 }) // Higher priority first, then oldest first
        .skip(skip)
        .limit(limit)
        .populate('userId', 'name email role')
        .populate('processedBy', 'name email')
        .exec(),
      this.withdrawalRequestModel.countDocuments(filter),
    ]);

    return { requests, total, page, limit };
  }

  /**
   * Process withdrawal request (Admin only)
   */
  async processWithdrawalRequest(
    requestId: string,
    adminId: string,
    processDto: ProcessWithdrawalRequestDto,
  ): Promise<WithdrawalRequest> {
    // Verify admin password
    const admin = await this.userModel.findById(adminId);
    if (!admin || admin.role !== UserRole.ADMIN) {
      throw new UnauthorizedException('Admin access required');
    }

    const isValidPassword = await bcrypt.compare(processDto.adminPassword, admin.password);
    if (!isValidPassword) {
      throw new UnauthorizedException('Invalid admin password');
    }

    // Get withdrawal request
    const withdrawalRequest = await this.withdrawalRequestModel
      .findById(requestId)
      .populate('userId');

    if (!withdrawalRequest) {
      throw new NotFoundException('Withdrawal request not found');
    }

    if (withdrawalRequest.status !== WithdrawalStatus.PENDING) {
      throw new BadRequestException(
        `Cannot process request with status: ${withdrawalRequest.status}`,
      );
    }

    // If approved, process the withdrawal
    if (processDto.action === WithdrawalStatus.APPROVED) {
      await this.executeWithdrawal(withdrawalRequest);
    }

    // Update request status
    withdrawalRequest.status = processDto.action;
    withdrawalRequest.adminNotes = processDto.adminNotes;
    withdrawalRequest.processedBy = new Types.ObjectId(adminId);
    withdrawalRequest.processedAt = new Date();

    if (processDto.action === WithdrawalStatus.APPROVED) {
      withdrawalRequest.status = WithdrawalStatus.COMPLETED;
      withdrawalRequest.transactionRef = `WTH_${Date.now()}_${withdrawalRequest._id.toString().slice(-6).toUpperCase()}`;
    }

    return await withdrawalRequest.save();
  }

  /**
   * Get withdrawal statistics (Admin only)
   */
  async getWithdrawalStats(): Promise<WithdrawalStatsDto> {
    const stats = await this.withdrawalRequestModel.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalNibia: { $sum: '$nibiaAmount' },
          totalNgn: { $sum: '$ngnAmount' },
        },
      },
    ]);

    // Calculate processing time
    const processingTimes = await this.withdrawalRequestModel.aggregate([
      {
        $match: {
          status: { $in: [WithdrawalStatus.APPROVED, WithdrawalStatus.COMPLETED] },
          processedAt: { $exists: true },
        },
      },
      {
        $project: {
          processingTime: {
            $divide: [
              { $subtract: ['$processedAt', '$createdAt'] },
              1000 * 60 * 60, // Convert to hours
            ],
          },
        },
      },
      {
        $group: {
          _id: null,
          avgProcessingTime: { $avg: '$processingTime' },
        },
      },
    ]);

    // Initialize stats
    const result: WithdrawalStatsDto = {
      totalPending: 0,
      totalApproved: 0,
      totalRejected: 0,
      totalCompleted: 0,
      totalNibiaPending: 0,
      totalNgnPending: 0,
      totalNibiaWithdrawn: 0,
      totalNgnDisbursed: 0,
      avgProcessingTimeHours: processingTimes[0]?.avgProcessingTime || 0,
    };

    // Process aggregation results
    stats.forEach((stat) => {
      switch (stat._id) {
        case WithdrawalStatus.PENDING:
          result.totalPending = stat.count;
          result.totalNibiaPending = stat.totalNibia;
          result.totalNgnPending = stat.totalNgn;
          break;
        case WithdrawalStatus.APPROVED:
          result.totalApproved = stat.count;
          break;
        case WithdrawalStatus.REJECTED:
          result.totalRejected = stat.count;
          break;
        case WithdrawalStatus.COMPLETED:
          result.totalCompleted = stat.count;
          result.totalNibiaWithdrawn = stat.totalNibia;
          result.totalNgnDisbursed = stat.totalNgn;
          break;
      }
    });

    return result;
  }

  /**
   * Enable withdrawal for GA/GE users (called when user is promoted)
   */
  async enableWithdrawalForUser(userId: string): Promise<void> {
    await this.walletModel.findOneAndUpdate(
      { userId: new Types.ObjectId(userId) },
      { nibiaWithdrawEnabled: true },
    );
  }

  /**
   * Disable withdrawal for demoted users
   */
  async disableWithdrawalForUser(userId: string): Promise<void> {
    await this.walletModel.findOneAndUpdate(
      { userId: new Types.ObjectId(userId) },
      { nibiaWithdrawEnabled: false },
    );
  }

  // Private helper methods

  private isEligibleForWithdrawal(role: UserRole): boolean {
    return role === UserRole.GROWTH_ASSOCIATE || role === UserRole.GROWTH_ELITE;
  }

  private getUserPriority(role: UserRole): number {
    switch (role) {
      case UserRole.GROWTH_ELITE:
        return 2; // Highest priority
      case UserRole.GROWTH_ASSOCIATE:
        return 1; // Higher priority
      default:
        return 0; // Normal priority
    }
  }

  private async validateWithdrawalLimits(userId: string, amount: number): Promise<void> {
    // Check single transaction limit
    if (amount > WALLET_CONSTANTS.MAX_WITHDRAWAL_AMOUNT) {
      throw new BadRequestException(
        `Amount exceeds maximum withdrawal limit of ${WALLET_CONSTANTS.MAX_WITHDRAWAL_AMOUNT} Nibia per request`,
      );
    }

    // Check daily limit
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayWithdrawals = await this.withdrawalRequestModel.aggregate([
      {
        $match: {
          userId: new Types.ObjectId(userId),
          status: { $in: [WithdrawalStatus.APPROVED, WithdrawalStatus.COMPLETED] },
          createdAt: { $gte: today, $lt: tomorrow },
        },
      },
      { $group: { _id: null, total: { $sum: '$nibiaAmount' } } },
    ]);

    const todayTotal = todayWithdrawals[0]?.total || 0;
    if (todayTotal + amount > WALLET_CONSTANTS.DAILY_WITHDRAWAL_LIMIT) {
      throw new BadRequestException(
        `Amount exceeds daily withdrawal limit. Used: ${todayTotal}, Limit: ${WALLET_CONSTANTS.DAILY_WITHDRAWAL_LIMIT}`,
      );
    }

    // Check monthly limit
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 1);

    const monthlyWithdrawals = await this.withdrawalRequestModel.aggregate([
      {
        $match: {
          userId: new Types.ObjectId(userId),
          status: { $in: [WithdrawalStatus.APPROVED, WithdrawalStatus.COMPLETED] },
          createdAt: { $gte: monthStart, $lt: monthEnd },
        },
      },
      { $group: { _id: null, total: { $sum: '$nibiaAmount' } } },
    ]);

    const monthlyTotal = monthlyWithdrawals[0]?.total || 0;
    if (monthlyTotal + amount > WALLET_CONSTANTS.MONTHLY_WITHDRAWAL_LIMIT) {
      throw new BadRequestException(
        `Amount exceeds monthly withdrawal limit. Used: ${monthlyTotal}, Limit: ${WALLET_CONSTANTS.MONTHLY_WITHDRAWAL_LIMIT}`,
      );
    }
  }

  private async executeWithdrawal(withdrawalRequest: WithdrawalRequest): Promise<void> {
    // Deduct Nibia from user's wallet
    const wallet = await this.walletModel.findById(withdrawalRequest.walletId);
    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    if (wallet.foodPoints < withdrawalRequest.nibiaAmount) {
      throw new BadRequestException('Insufficient Nibia balance for withdrawal');
    }

    // Deduct Nibia and credit equivalent NGN
    wallet.foodPoints -= withdrawalRequest.nibiaAmount;
    wallet.foodMoney += withdrawalRequest.ngnAmount;
    wallet.lastTransactionAt = new Date();

    await wallet.save();
  }
}
