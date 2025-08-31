import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { User, UserDocument } from '../../users/entities/user.entity';
import { Wallet, WalletDocument } from '../../wallets/entities/wallet.entity';
import { Order, OrderDocument } from '../../orders/entities/order.entity';
import { WalletType, TransactionType } from '../../wallets/dto/update-balance.dto';
import { WalletsService } from '../../wallets/wallets.service';
import { 
  DefaultRecoveryRequest, 
  DefaultRecoveryResult 
} from '../interfaces/credit-qualification.interface';
import { CREDIT_QUALIFICATION_CONSTANTS } from '../constants/credit-qualification.constants';

@Injectable()
export class DefaultRecoveryService {
  private readonly logger = new Logger(DefaultRecoveryService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Wallet.name) private walletModel: Model<WalletDocument>,
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    private walletsService: WalletsService,
    private eventEmitter: EventEmitter2,
  ) {}

  /**
   * Process default recovery for an order
   */
  async processDefaultRecovery(
    request: DefaultRecoveryRequest
  ): Promise<DefaultRecoveryResult> {
    this.logger.log(`Processing default recovery for user ${request.userId}, order ${request.orderId}`);

    // Check grace period first
    if (request.daysOverdue <= CREDIT_QUALIFICATION_CONSTANTS.DEFAULT_GRACE_PERIOD_DAYS) {
      this.logger.warn(`Grace period active for order ${request.orderId}: ${request.daysOverdue} days overdue`);
      return {
        success: false,
        recoveredAmount: 0,
        recoveryMethod: request.recoveryMethod,
        remainingDefault: request.defaultAmount,
        updatedFoodSafeBalance: 0,
        recoveryTransactionId: '',
        message: `Grace period active: ${request.daysOverdue}/${CREDIT_QUALIFICATION_CONSTANTS.DEFAULT_GRACE_PERIOD_DAYS} days`,
      };
    }

    // Route to appropriate recovery method
    switch (request.recoveryMethod) {
      case 'foodsafe_deduction':
        return this.recoverFromFoodSafe(request.userId, request);
      case 'payment_plan':
        // TODO: Implement payment plan recovery
        throw new BadRequestException('Payment plan recovery not yet implemented');
      case 'manual_collection':
        // TODO: Implement manual collection
        throw new BadRequestException('Manual collection not yet implemented');
      default:
        throw new BadRequestException(`Unsupported recovery method: ${request.recoveryMethod}`);
    }
  }

  /**
   * Attempt automatic recovery from FoodSafe balance
   */
  async recoverFromFoodSafe(
    userId: string,
    request: DefaultRecoveryRequest
  ): Promise<DefaultRecoveryResult> {
    this.logger.log(`Starting FoodSafe recovery for user ${userId}, order ${request.orderId}`);

    // Get user, wallet, and order
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const wallet = await this.walletModel.findOne({ userId: new Types.ObjectId(userId) });
    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    const order = await this.orderModel.findById(request.orderId);
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Calculate maximum recovery amount
    const maxFoodSafeDeduction = request.maxFoodSafeDeduction || 
      Math.min(
        wallet.foodSafe * CREDIT_QUALIFICATION_CONSTANTS.FOODSAFE_RECOVERY_PERCENTAGE,
        request.defaultAmount
      );

    const recoveryAmount = Math.min(
      maxFoodSafeDeduction,
      wallet.foodSafe,
      request.defaultAmount
    );

    // Check if we can recover anything
    if (recoveryAmount <= 0) {
      this.logger.warn(`Cannot recover from FoodSafe for user ${userId}: insufficient balance`);
      return {
        success: false,
        recoveredAmount: 0,
        recoveryMethod: 'foodsafe_deduction',
        remainingDefault: request.defaultAmount,
        updatedFoodSafeBalance: wallet.foodSafe,
        recoveryTransactionId: '',
        message: 'Insufficient FoodSafe balance for recovery',
      };
    }

    // Create recovery transaction
    const recoveryTransactionId = `recovery_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      // Use wallets service to handle the deduction and transaction
      await this.walletsService.updateBalance(userId, {
        amount: recoveryAmount,
        walletType: WalletType.FOOD_SAFE,
        transactionType: TransactionType.DEBIT,
        description: `Default recovery for order ${order._id}`,
        reference: recoveryTransactionId,
      });

      // Update order status
      const remainingDefault = request.defaultAmount - recoveryAmount;
      await this.orderModel.findByIdAndUpdate(
        order._id,
        {
          defaultRecoveryStatus: remainingDefault > 0 ? 'partial_recovery' : 'recovered',
          recoveredAmount: (order.recoveredAmount || 0) + recoveryAmount,
          remainingDefault,
          lastRecoveryDate: new Date(),
        }
      );

      // Emit recovery event
      this.eventEmitter.emit('default.recovered', {
        userId: user._id,
        orderId: order._id,
        recoveredAmount: recoveryAmount,
        remainingDefault,
        recoveryMethod: 'foodsafe_deduction',
        transactionId: recoveryTransactionId,
      });

      this.logger.log(`Successfully recovered ₦${recoveryAmount} from FoodSafe for user ${user._id}, order ${order._id}`);

      return {
        success: true,
        recoveredAmount: recoveryAmount,
        recoveryMethod: 'foodsafe_deduction',
        remainingDefault,
        updatedFoodSafeBalance: wallet.foodSafe - recoveryAmount,
        recoveryTransactionId,
        message: remainingDefault > 0 
          ? `Partial recovery: ₦${recoveryAmount} recovered, ₦${remainingDefault} remaining`
          : `Full recovery: ₦${recoveryAmount} recovered`,
      };

    } catch (error) {
      this.logger.error(`Failed to recover from FoodSafe for user ${userId}, order ${request.orderId}:`, error);
      throw error;
    }
  }

  /**
   * Check if user is eligible for FoodSafe deduction
   */
  async checkFoodSafeEligibility(
    userId: string,
    defaultAmount: number
  ): Promise<{
    eligible: boolean;
    availableBalance: number;
    maxDeductible: number;
    reason?: string;
  }> {
    const wallet = await this.walletModel.findOne({ userId: new Types.ObjectId(userId) });
    if (!wallet) {
      return {
        eligible: false,
        availableBalance: 0,
        maxDeductible: 0,
        reason: 'Wallet not found',
      };
    }

    const maxDeductible = Math.min(
      wallet.foodSafe * CREDIT_QUALIFICATION_CONSTANTS.FOODSAFE_RECOVERY_PERCENTAGE,
      defaultAmount
    );

    return {
      eligible: maxDeductible > 0,
      availableBalance: wallet.foodSafe,
      maxDeductible,
      reason: maxDeductible === 0 ? 'Insufficient FoodSafe balance' : undefined,
    };
  }

  /**
   * Get default recovery analytics
   */
  async getRecoveryAnalytics(
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    totalRecovered: number;
    totalDefaults: number;
    recoveryRate: number;
    averageRecoveryAmount: number;
    recoveryMethods: Record<string, number>;
  }> {
    const dateFilter: any = {};
    if (startDate || endDate) {
      dateFilter.lastRecoveryDate = {};
      if (startDate) dateFilter.lastRecoveryDate.$gte = startDate;
      if (endDate) dateFilter.lastRecoveryDate.$lte = endDate;
    }

    const recoveryAggregation = await this.orderModel.aggregate([
      {
        $match: {
          defaultRecoveryStatus: { $in: ['partial_recovery', 'recovered'] },
          ...dateFilter,
        },
      },
      {
        $group: {
          _id: null,
          totalRecovered: { $sum: '$recoveredAmount' },
          totalOrders: { $sum: 1 },
          averageRecovery: { $avg: '$recoveredAmount' },
        },
      },
    ]);

    const defaultsAggregation = await this.orderModel.aggregate([
      {
        $match: {
          paymentPlan: 'pay_later',
          defaultRecoveryStatus: { $exists: true },
          ...dateFilter,
        },
      },
      {
        $group: {
          _id: null,
          totalDefaults: { $sum: 1 },
        },
      },
    ]);

    const recovery = recoveryAggregation[0] || { totalRecovered: 0, totalOrders: 0, averageRecovery: 0 };
    const defaults = defaultsAggregation[0] || { totalDefaults: 0 };

    return {
      totalRecovered: recovery.totalRecovered,
      totalDefaults: defaults.totalDefaults,
      recoveryRate: defaults.totalDefaults > 0 ? (recovery.totalOrders / defaults.totalDefaults) * 100 : 0,
      averageRecoveryAmount: recovery.averageRecovery,
      recoveryMethods: {
        foodsafe_deduction: recovery.totalOrders,
        payment_plan: 0, // TODO: Implement when payment plan is added
        manual_collection: 0, // TODO: Implement when manual collection is added
      },
    };
  }

  /**
   * Automatic daily recovery process
   */
  @Cron(CronExpression.EVERY_DAY_AT_6AM)
  async processAutomaticRecovery(): Promise<void> {
    this.logger.log('Starting automatic default recovery process');

    try {
      // Find orders with payment defaults
      const overdueOrders = await this.orderModel.find({
        paymentPlan: 'pay_later',
        defaultRecoveryStatus: { $in: ['pending', 'processing'] },
        paymentDueDate: { $lt: new Date() },
      });

      this.logger.log(`Found ${overdueOrders.length} orders eligible for automatic recovery`);

      for (const order of overdueOrders) {
        try {
          const daysOverdue = Math.floor(
            (Date.now() - new Date(order.paymentDueDate!).getTime()) / (1000 * 60 * 60 * 24)
          );

          const recoveryRequest: DefaultRecoveryRequest = {
            userId: order.userId.toString(),
            orderId: order._id.toString(),
            defaultAmount: order.remainingAmount,
            dueDate: order.paymentDueDate!,
            daysOverdue,
            recoveryMethod: 'foodsafe_deduction',
          };

          await this.recoverFromFoodSafe(order.userId.toString(), recoveryRequest);

        } catch (error) {
          this.logger.error(`Failed to process automatic recovery for order ${order._id}:`, error);
        }
      }

      this.logger.log('Completed automatic default recovery process');

    } catch (error) {
      this.logger.error('Failed to run automatic recovery process:', error);
    }
  }

  /**
   * Get orders pending recovery
   */
  async getOrdersPendingRecovery(userId?: string): Promise<OrderDocument[]> {
    const filter: any = {
      paymentPlan: 'pay_later',
      defaultRecoveryStatus: { $in: ['pending', 'processing'] },
      paymentDueDate: { $lt: new Date() },
    };

    if (userId) {
      filter.userId = new Types.ObjectId(userId);
    }

    return this.orderModel.find(filter).sort({ paymentDueDate: 1 });
  }

  /**
   * Calculate recovery metrics for a user
   */
  async calculateUserRecoveryMetrics(userId: string): Promise<{
    totalDefaults: number;
    totalRecovered: number;
    recoveryRate: number;
    averageDaysToRecovery: number;
  }> {
    const userOrders = await this.orderModel.find({
      userId: new Types.ObjectId(userId),
      paymentPlan: 'pay_later',
      defaultRecoveryStatus: { $exists: true },
    });

    const totalDefaults = userOrders.length;
    const recoveredOrders = userOrders.filter(order => 
      ['partial_recovery', 'recovered'].includes(order.defaultRecoveryStatus!)
    );

    const totalRecovered = recoveredOrders.reduce((sum, order) => sum + (order.recoveredAmount || 0), 0);
    const recoveryRate = totalDefaults > 0 ? (recoveredOrders.length / totalDefaults) * 100 : 0;

    // Calculate average days to recovery
    const daysToRecovery = recoveredOrders
      .filter(order => order.paymentDueDate && order.lastRecoveryDate)
      .map(order => {
        const dueDate = new Date(order.paymentDueDate!);
        const recoveryDate = new Date(order.lastRecoveryDate!);
        return Math.floor((recoveryDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
      });

    const averageDaysToRecovery = daysToRecovery.length > 0 
      ? daysToRecovery.reduce((sum, days) => sum + days, 0) / daysToRecovery.length 
      : 0;

    return {
      totalDefaults,
      totalRecovered,
      recoveryRate,
      averageDaysToRecovery,
    };
  }
}
