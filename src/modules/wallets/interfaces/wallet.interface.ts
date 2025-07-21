import { Types } from 'mongoose';
import { WalletStatus } from '../entities/wallet.entity';

export interface IWallet {
  _id?: Types.ObjectId;
  userId: Types.ObjectId;
  foodMoney: number;
  foodPoints: number;
  foodSafe: number;
  totalBalance?: number;
  status: WalletStatus;
  lastTransactionAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface WalletTransaction {
  walletId: Types.ObjectId;
  userId: Types.ObjectId;
  type: TransactionType;
  amount: number;
  currency: WalletCurrency;
  description: string;
  reference?: string;
  balanceBefore: number;
  balanceAfter: number;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export enum TransactionType {
  CREDIT = 'credit',
  DEBIT = 'debit',
  TRANSFER = 'transfer',
  REFUND = 'refund',
  CASHBACK = 'cashback',
  BONUS = 'bonus',
  PENALTY = 'penalty',
}

export enum WalletCurrency {
  FOOD_MONEY = 'food_money',
  FOOD_POINTS = 'food_points',
  FOOD_SAFE = 'food_safe',
}

export interface WalletBalance {
  foodMoney: number;
  foodPoints: number;
  foodSafe: number;
  totalBalance: number;
}

export interface TransferRequest {
  fromUserId: Types.ObjectId;
  toUserId: Types.ObjectId;
  amount: number;
  currency: WalletCurrency;
  description?: string;
  reference?: string;
}

export interface WalletSummary {
  totalWallets: number;
  totalFoodMoney: number;
  totalFoodPoints: number;
  totalFoodSafe: number;
  averageBalance: number;
  activeWallets: number;
  suspendedWallets: number;
  frozenWallets: number;
}

export interface WalletAnalytics {
  transactionVolume: Array<{
    date: string;
    count: number;
    volume: number;
  }>;
  topUsers: Array<{
    userId: Types.ObjectId;
    totalBalance: number;
    transactionCount: number;
  }>;
  currencyDistribution: {
    foodMoney: number;
    foodPoints: number;
    foodSafe: number;
  };
}

export interface WalletLimits {
  dailyTransactionLimit: number;
  monthlyTransactionLimit: number;
  maxBalance: number;
  minTransactionAmount: number;
  maxTransactionAmount: number;
}

export interface WalletSearchParams {
  userId?: Types.ObjectId;
  status?: WalletStatus;
  minBalance?: number;
  maxBalance?: number;
  hasRecentActivity?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
