import {
  IsString,
  IsNotEmpty,
  IsNumber,
  Min,
  Max,
  IsOptional,
  IsEnum,
  IsObject,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { WalletStatus } from '../entities/wallet.entity';
import { TransactionType, WalletCurrency } from '../interfaces/wallet.interface';

export class CreateWalletDto {
  @ApiProperty({ description: 'User ID for the wallet' })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ description: 'Initial food money balance', default: 0, minimum: 0 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  foodMoney?: number;

  @ApiProperty({ description: 'Initial food points balance', default: 0, minimum: 0 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  foodPoints?: number;

  @ApiProperty({ description: 'Initial food safe balance', default: 0, minimum: 0 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  foodSafe?: number;
}

export class UpdateWalletBalanceDto {
  @ApiProperty({ description: 'Amount to add/deduct', minimum: 0.01 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount: number;

  @ApiProperty({ description: 'Currency type', enum: WalletCurrency })
  @IsEnum(WalletCurrency)
  currency: WalletCurrency;

  @ApiProperty({ description: 'Transaction type', enum: TransactionType })
  @IsEnum(TransactionType)
  type: TransactionType;

  @ApiProperty({ description: 'Transaction description' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ description: 'Transaction reference', required: false })
  @IsOptional()
  @IsString()
  reference?: string;

  @ApiProperty({ description: 'Additional metadata', required: false })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class TransferFundsDto {
  @ApiProperty({ description: 'Recipient user ID' })
  @IsString()
  @IsNotEmpty()
  toUserId: string;

  @ApiProperty({ description: 'Transfer amount', minimum: 0.01 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount: number;

  @ApiProperty({ description: 'Currency to transfer', enum: WalletCurrency })
  @IsEnum(WalletCurrency)
  currency: WalletCurrency;

  @ApiProperty({ description: 'Transfer description' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ description: 'Transfer reference', required: false })
  @IsOptional()
  @IsString()
  reference?: string;
}

export class UpdateWalletStatusDto {
  @ApiProperty({ description: 'New wallet status', enum: WalletStatus })
  @IsEnum(WalletStatus)
  status: WalletStatus;

  @ApiProperty({ description: 'Reason for status change', required: false })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class LockFundsDto {
  @ApiProperty({ description: 'Amount to lock', minimum: 0.01 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount: number;

  @ApiProperty({ description: 'Lock reason' })
  @IsString()
  @IsNotEmpty()
  reason: string;

  @ApiProperty({ description: 'Lock reference', required: false })
  @IsOptional()
  @IsString()
  reference?: string;
}

export class UnlockFundsDto {
  @ApiProperty({ description: 'Amount to unlock', minimum: 0.01 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount: number;

  @ApiProperty({ description: 'Unlock reason' })
  @IsString()
  @IsNotEmpty()
  reason: string;

  @ApiProperty({ description: 'Lock reference to unlock' })
  @IsString()
  @IsNotEmpty()
  reference: string;
}

export class ConvertCurrencyDto {
  @ApiProperty({ description: 'Source currency', enum: WalletCurrency })
  @IsEnum(WalletCurrency)
  fromCurrency: WalletCurrency;

  @ApiProperty({ description: 'Target currency', enum: WalletCurrency })
  @IsEnum(WalletCurrency)
  toCurrency: WalletCurrency;

  @ApiProperty({ description: 'Amount to convert', minimum: 0.01 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount: number;
}

export class WalletSearchDto {
  @ApiProperty({ description: 'User ID to filter by', required: false })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiProperty({ description: 'Wallet status to filter by', enum: WalletStatus, required: false })
  @IsOptional()
  @IsEnum(WalletStatus)
  status?: WalletStatus;

  @ApiProperty({ description: 'Minimum total balance', minimum: 0, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minBalance?: number;

  @ApiProperty({ description: 'Maximum total balance', minimum: 0, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxBalance?: number;

  @ApiProperty({ description: 'Filter wallets with recent activity', required: false })
  @IsOptional()
  hasRecentActivity?: boolean;

  @ApiProperty({ description: 'Page number', minimum: 1, default: 1, required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiProperty({ description: 'Items per page', minimum: 1, maximum: 100, default: 20, required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiProperty({ description: 'Sort field', required: false })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiProperty({ description: 'Sort order', enum: ['asc', 'desc'], default: 'desc', required: false })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';
}

export class TransactionHistoryDto {
  @ApiProperty({ description: 'Start date for transaction history', required: false })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiProperty({ description: 'End date for transaction history', required: false })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiProperty({ description: 'Transaction type filter', enum: TransactionType, required: false })
  @IsOptional()
  @IsEnum(TransactionType)
  transactionType?: TransactionType;

  @ApiProperty({ description: 'Currency filter', enum: WalletCurrency, required: false })
  @IsOptional()
  @IsEnum(WalletCurrency)
  currency?: WalletCurrency;

  @ApiProperty({ description: 'Page number', minimum: 1, default: 1, required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiProperty({ description: 'Items per page', minimum: 1, maximum: 100, default: 20, required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;
}
