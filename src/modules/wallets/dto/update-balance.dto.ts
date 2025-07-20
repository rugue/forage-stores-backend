import {
  IsNumber,
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum TransactionType {
  CREDIT = 'credit',
  DEBIT = 'debit',
  TRANSFER = 'transfer',
  LOCK = 'lock',
  UNLOCK = 'unlock',
}

export enum WalletType {
  FOOD_MONEY = 'foodMoney',
  FOOD_POINTS = 'foodPoints',
  FOOD_SAFE = 'foodSafe',
}

export class UpdateBalanceDto {
  @ApiProperty({
    description: 'Amount to add or subtract',
    example: 100.50,
    minimum: 0.01,
    maximum: 1000000,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01, { message: 'Amount must be at least 0.01' })
  @Max(1000000, { message: 'Amount cannot exceed 1,000,000' })
  amount: number;

  @ApiProperty({
    description: 'Type of wallet to update',
    enum: WalletType,
    example: WalletType.FOOD_MONEY,
  })
  @IsEnum(WalletType)
  walletType: WalletType;

  @ApiProperty({
    description: 'Type of transaction',
    enum: TransactionType,
    example: TransactionType.CREDIT,
  })
  @IsEnum(TransactionType)
  transactionType: TransactionType;

  @ApiProperty({
    description: 'Description of the transaction',
    example: 'Wallet top-up via bank transfer',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Reference ID for the transaction',
    example: 'TXN_123456789',
    required: false,
  })
  @IsString()
  @IsOptional()
  reference?: string;
}
