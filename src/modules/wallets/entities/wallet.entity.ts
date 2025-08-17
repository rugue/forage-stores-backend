import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  Min,
  IsOptional,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export type WalletDocument = Wallet & Document;

export enum WalletStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  FROZEN = 'frozen',
}

@Schema({ timestamps: true })
export class Wallet {
  @ApiProperty({ description: 'User ID that owns this wallet' })
  @Prop({ required: true, type: Types.ObjectId, ref: 'User', unique: true })
  @IsString()
  @IsNotEmpty()
  userId: Types.ObjectId;

  @ApiProperty({
    description: 'Food money balance in Nigerian Naira (NGN)',
    example: 5000.50,
    minimum: 0,
  })
  @Prop({ required: true, type: Number, default: 0.0, min: 0 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  foodMoney: number;

  @ApiProperty({
    description: 'Food points balance in Nibia',
    example: 1250.75,
    minimum: 0,
  })
  @Prop({ required: true, type: Number, default: 0.0, min: 0 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  foodPoints: number;

  @ApiProperty({
    description: 'Food safe balance - locked funds in NGN',
    example: 2000.00,
    minimum: 0,
  })
  @Prop({ required: true, type: Number, default: 0.0, min: 0 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  foodSafe: number;

  @ApiProperty({
    description: 'Total balance (foodMoney + foodSafe) in NGN',
    example: 7000.50,
  })
  @Prop({ required: false, type: Number, default: 0.0 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsOptional()
  totalBalance?: number;

  @ApiProperty({
    description: 'Wallet status',
    example: 'active',
    enum: WalletStatus,
  })
  @Prop({
    required: true,
    type: String,
    enum: Object.values(WalletStatus),
    default: WalletStatus.ACTIVE,
  })
  @IsString()
  status: WalletStatus;

  @ApiProperty({
    description: 'Last transaction timestamp',
    example: '2023-12-25T10:30:00Z',
  })
  @Prop({ required: false, type: Date })
  @IsOptional()
  lastTransactionAt?: Date;

  @ApiProperty({
    description: 'Whether Nibia withdrawal is enabled (GA/GE users only)',
    example: false,
  })
  @Prop({ required: true, type: Boolean, default: false })
  @IsOptional()
  nibiaWithdrawEnabled: boolean;
}

export const WalletSchema = SchemaFactory.createForClass(Wallet);

// Pre-save middleware to calculate total balance
WalletSchema.pre('save', function (next) {
  this.totalBalance = this.foodMoney + this.foodSafe;
  next();
});

// Pre-update middleware to calculate total balance
WalletSchema.pre('findOneAndUpdate', function (next) {
  const update = this.getUpdate() as any;
  if (update.foodMoney !== undefined || update.foodSafe !== undefined) {
    const foodMoney = update.foodMoney ?? 0;
    const foodSafe = update.foodSafe ?? 0;
    update.totalBalance = foodMoney + foodSafe;
  }
  next();
});

// Add index for faster queries
WalletSchema.index({ userId: 1 }, { unique: true });
WalletSchema.index({ status: 1 });
