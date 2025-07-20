import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  Min,
  IsOptional,
  IsEnum,
  IsDate,
  IsBoolean,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export type ReferralDocument = Referral & Document;

export enum CommissionType {
  FOOD_MONEY = 'food_money',
  FOOD_POINTS = 'food_points',
}

export enum ReferralStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  COMPLETED = 'completed',
}

@Schema({ timestamps: true, _id: false })
export class CommissionHistory {
  @ApiProperty({ description: 'Order ID that generated the commission' })
  @Prop({ required: true, type: Types.ObjectId, ref: 'Order' })
  orderId: Types.ObjectId;

  @ApiProperty({ description: 'Amount of commission' })
  @Prop({ required: true, type: Number, min: 0 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  amount: number;

  @ApiProperty({ description: 'Type of commission (food money or food points)', enum: CommissionType })
  @Prop({ required: true, enum: Object.values(CommissionType) })
  @IsEnum(CommissionType)
  type: CommissionType;

  @ApiProperty({ description: 'Date commission was earned' })
  @Prop({ required: true, type: Date, default: Date.now })
  @IsDate()
  date: Date;

  @ApiProperty({ description: 'Order amount that generated this commission' })
  @Prop({ required: true, type: Number, min: 0 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  orderAmount: number;

  @ApiProperty({ description: 'Commission percentage applied' })
  @Prop({ required: true, type: Number, min: 0, max: 100 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  commissionPercentage: number;
}

@Schema({ timestamps: true })
export class Referral {
  @ApiProperty({ description: 'Referrer user ID (who referred)' })
  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  @IsString()
  @IsNotEmpty()
  referrerId: Types.ObjectId;

  @ApiProperty({ description: 'Referred user ID (who was referred)' })
  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  @IsString()
  @IsNotEmpty()
  referredUserId: Types.ObjectId;

  @ApiProperty({ description: 'Referral date' })
  @Prop({ required: true, type: Date, default: Date.now })
  @IsDate()
  referralDate: Date;

  @ApiProperty({ description: 'Sign-up date of referred user' })
  @Prop({ required: false, type: Date })
  @IsOptional()
  @IsDate()
  signUpDate?: Date;

  @ApiProperty({ description: 'Referral status', enum: ReferralStatus })
  @Prop({ required: true, enum: Object.values(ReferralStatus), default: ReferralStatus.PENDING })
  @IsEnum(ReferralStatus)
  status: ReferralStatus;

  @ApiProperty({ description: 'Referral code used' })
  @Prop({ required: false, type: String })
  @IsOptional()
  @IsString()
  referralCode?: string;

  @ApiProperty({ description: 'Total commissions earned' })
  @Prop({ required: true, type: Number, default: 0, min: 0 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  totalCommissionsEarned: number;

  @ApiProperty({ description: 'Number of purchases made by referred user' })
  @Prop({ required: true, type: Number, default: 0, min: 0 })
  @IsNumber()
  @Min(0)
  purchaseCount: number;

  @ApiProperty({ description: 'Is commission completed (3 purchases for regular users)' })
  @Prop({ required: true, type: Boolean, default: false })
  @IsBoolean()
  isCommissionCompleted: boolean;

  @ApiProperty({ description: 'Commission history', type: [CommissionHistory] })
  @Prop({ required: true, type: [Object], default: [] })
  commissionHistory: CommissionHistory[];
}

export const CommissionHistorySchema = SchemaFactory.createForClass(CommissionHistory);
export const ReferralSchema = SchemaFactory.createForClass(Referral);

// Add indexes for better query performance
ReferralSchema.index({ referrerId: 1 });
ReferralSchema.index({ referredUserId: 1 }, { unique: true });
ReferralSchema.index({ status: 1 });
ReferralSchema.index({ referralDate: -1 });
ReferralSchema.index({ isCommissionCompleted: 1 });
