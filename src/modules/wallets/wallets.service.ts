import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Wallet, WalletDocument } from '../wallets/entities/wallet.entity';
import {
  UpdateBalanceDto,
  TransferFundsDto,
  LockFundsDto,
  UnlockFundsDto,
  TransactionType,
  WalletType,
} from './dto';

@Injectable()
export class WalletsService {
  constructor(
    @InjectModel(Wallet.name) private walletModel: Model<WalletDocument>,
  ) {}

  // Create a new wallet for a user
  async createWallet(userId: string): Promise<Wallet> {
    try {
      const existingWallet = await this.walletModel.findOne({ userId });
      if (existingWallet) {
        throw new BadRequestException('Wallet already exists for this user');
      }

      const wallet = new this.walletModel({
        userId: new Types.ObjectId(userId),
        foodMoney: 0.0,
        foodPoints: 0.0,
        foodSafe: 0.0,
        status: 'active',
      });

      return await wallet.save();
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to create wallet');
    }
  }

  // Get wallet by user ID
  async getWalletByUserId(userId: string): Promise<Wallet> {
    const wallet = await this.walletModel
      .findOne({ userId: new Types.ObjectId(userId) })
      .populate('userId', 'name email')
      .exec();

    if (!wallet) {
      throw new NotFoundException('Wallet not found for this user');
    }

    return wallet;
  }

  // Get wallet balance summary
  async getWalletBalance(userId: string): Promise<{
    foodMoney: number;
    foodPoints: number;
    foodSafe: number;
    totalBalance: number;
    status: string;
    lastTransactionAt?: Date;
  }> {
    const wallet = await this.getWalletByUserId(userId);
    
    return {
      foodMoney: wallet.foodMoney,
      foodPoints: wallet.foodPoints,
      foodSafe: wallet.foodSafe,
      totalBalance: wallet.totalBalance || wallet.foodMoney + wallet.foodSafe,
      status: wallet.status,
      lastTransactionAt: wallet.lastTransactionAt,
    };
  }

  // Update wallet balance (Admin only)
  async updateBalance(
    userId: string,
    updateBalanceDto: UpdateBalanceDto,
  ): Promise<Wallet> {
    const wallet = await this.getWalletByUserId(userId);

    if (wallet.status !== 'active') {
      throw new ForbiddenException('Wallet is not active');
    }

    const { amount, walletType, transactionType } = updateBalanceDto;

    // Calculate new balance based on transaction type
    let newBalance: number;
    const currentBalance = wallet[walletType];

    if (transactionType === TransactionType.CREDIT) {
      newBalance = currentBalance + amount;
    } else if (transactionType === TransactionType.DEBIT) {
      if (currentBalance < amount) {
        throw new BadRequestException(
          `Insufficient ${walletType} balance. Available: ${currentBalance}, Requested: ${amount}`,
        );
      }
      newBalance = currentBalance - amount;
    } else {
      throw new BadRequestException('Invalid transaction type for balance update');
    }

    // Update the wallet
    const updateData = {
      [walletType]: newBalance,
      lastTransactionAt: new Date(),
    };

    const updatedWallet = await this.walletModel
      .findOneAndUpdate(
        { userId: new Types.ObjectId(userId) },
        updateData,
        { new: true },
      )
      .exec();

    if (!updatedWallet) {
      throw new NotFoundException('Failed to update wallet');
    }

    return updatedWallet;
  }

  // Transfer funds between users
  async transferFunds(
    fromUserId: string,
    transferFundsDto: TransferFundsDto,
  ): Promise<{ success: boolean; message: string; transactionId?: string }> {
    const { toUserId, amount, description } = transferFundsDto;

    // Validate users are different
    if (fromUserId === toUserId) {
      throw new BadRequestException('Cannot transfer funds to yourself');
    }

    // Get both wallets
    const fromWallet = await this.getWalletByUserId(fromUserId);
    const toWallet = await this.getWalletByUserId(toUserId);

    // Check wallet statuses
    if (fromWallet.status !== 'active') {
      throw new ForbiddenException('Your wallet is not active');
    }
    if (toWallet.status !== 'active') {
      throw new ForbiddenException('Recipient wallet is not active');
    }

    // Check sufficient balance
    if (fromWallet.foodMoney < amount) {
      throw new BadRequestException(
        `Insufficient food money balance. Available: ${fromWallet.foodMoney}, Requested: ${amount}`,
      );
    }

    // Perform transfer
    const session = await this.walletModel.db.startSession();
    session.startTransaction();

    try {
      // Debit from sender
      await this.walletModel
        .findOneAndUpdate(
          { userId: new Types.ObjectId(fromUserId) },
          {
            $inc: { foodMoney: -amount },
            lastTransactionAt: new Date(),
          },
        )
        .session(session);

      // Credit to recipient
      await this.walletModel
        .findOneAndUpdate(
          { userId: new Types.ObjectId(toUserId) },
          {
            $inc: { foodMoney: amount },
            lastTransactionAt: new Date(),
          },
        )
        .session(session);

      await session.commitTransaction();

      return {
        success: true,
        message: `Successfully transferred ₦${amount} to recipient`,
        transactionId: `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      };
    } catch (error) {
      await session.abortTransaction();
      throw new BadRequestException('Transfer failed. Please try again.');
    } finally {
      session.endSession();
    }
  }

  // Lock funds (move from foodMoney to foodSafe)
  async lockFunds(
    userId: string,
    lockFundsDto: LockFundsDto,
  ): Promise<{ success: boolean; message: string }> {
    const { amount, reason } = lockFundsDto;
    const wallet = await this.getWalletByUserId(userId);

    if (wallet.status !== 'active') {
      throw new ForbiddenException('Wallet is not active');
    }

    if (wallet.foodMoney < amount) {
      throw new BadRequestException(
        `Insufficient food money balance. Available: ${wallet.foodMoney}, Requested: ${amount}`,
      );
    }

    // Move funds from foodMoney to foodSafe
    await this.walletModel
      .findOneAndUpdate(
        { userId: new Types.ObjectId(userId) },
        {
          $inc: { 
            foodMoney: -amount, 
            foodSafe: amount 
          },
          lastTransactionAt: new Date(),
        },
        { new: true },
      )
      .exec();

    return {
      success: true,
      message: `Successfully locked ₦${amount} in food safe${reason ? ` for: ${reason}` : ''}`,
    };
  }

  // Unlock funds (move from foodSafe to foodMoney)
  async unlockFunds(
    userId: string,
    unlockFundsDto: UnlockFundsDto,
  ): Promise<{ success: boolean; message: string }> {
    const { amount, reason } = unlockFundsDto;
    const wallet = await this.getWalletByUserId(userId);

    if (wallet.status !== 'active') {
      throw new ForbiddenException('Wallet is not active');
    }

    if (wallet.foodSafe < amount) {
      throw new BadRequestException(
        `Insufficient food safe balance. Available: ${wallet.foodSafe}, Requested: ${amount}`,
      );
    }

    // Move funds from foodSafe to foodMoney
    await this.walletModel
      .findOneAndUpdate(
        { userId: new Types.ObjectId(userId) },
        {
          $inc: { 
            foodSafe: -amount, 
            foodMoney: amount 
          },
          lastTransactionAt: new Date(),
        },
        { new: true },
      )
      .exec();

    return {
      success: true,
      message: `Successfully unlocked ₦${amount} from food safe${reason ? ` for: ${reason}` : ''}`,
    };
  }

  // Admin functions
  async getAllWallets(): Promise<Wallet[]> {
    return this.walletModel
      .find()
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .exec();
  }

  async getWalletById(walletId: string): Promise<Wallet> {
    const wallet = await this.walletModel
      .findById(walletId)
      .populate('userId', 'name email')
      .exec();

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    return wallet;
  }

  async updateWalletStatus(
    walletId: string,
    status: 'active' | 'suspended' | 'frozen',
  ): Promise<Wallet> {
    const wallet = await this.walletModel
      .findByIdAndUpdate(walletId, { status }, { new: true })
      .exec();

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    return wallet;
  }

  async getWalletStats(): Promise<{
    totalWallets: number;
    activeWallets: number;
    totalFoodMoney: number;
    totalFoodPoints: number;
    totalFoodSafe: number;
    totalBalance: number;
  }> {
    const stats = await this.walletModel.aggregate([
      {
        $group: {
          _id: null,
          totalWallets: { $sum: 1 },
          activeWallets: {
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] },
          },
          totalFoodMoney: { $sum: '$foodMoney' },
          totalFoodPoints: { $sum: '$foodPoints' },
          totalFoodSafe: { $sum: '$foodSafe' },
          totalBalance: { $sum: { $add: ['$foodMoney', '$foodSafe'] } },
        },
      },
    ]);

    return stats[0] || {
      totalWallets: 0,
      activeWallets: 0,
      totalFoodMoney: 0,
      totalFoodPoints: 0,
      totalFoodSafe: 0,
      totalBalance: 0,
    };
  }
}
