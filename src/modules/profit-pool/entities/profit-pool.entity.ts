import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  Min,
  IsArray,
  IsDate,
  IsEnum,
  ValidateNested,
  IsOptional,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export type ProfitPoolDocument = ProfitPool & Document;

export enum ProfitPoolStatus {
  CALCULATED = 'calculated',
  DISTRIBUTED = 'distributed',
  FAILED = 'failed',
}

@Schema()
export class ProfitDistribution {
  @ApiProperty({ description: 'Growth Elite user ID' })
  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  @IsString()
  @IsNotEmpty()
  userId: Types.ObjectId;

  @ApiProperty({ description: 'GE user name for reference' })
  @Prop({ required: true, maxlength: 255 })
  @IsString()
  @IsNotEmpty()
  userName: string;

  @ApiProperty({ description: 'GE user email for reference' })
  @Prop({ required: true, maxlength: 255 })
  @IsString()
  @IsNotEmpty()
  userEmail: string;

  @ApiProperty({ description: 'Nibia amount credited to this GE' })
  @Prop({ required: true, type: Number, min: 0 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  nibiaAmount: number;

  @ApiProperty({ description: 'Date when Nibia was credited' })
  @Prop({ required: false, type: Date })
  @IsDate()
  @IsOptional()
  creditedAt?: Date;

  @ApiProperty({ description: 'Transaction reference for the credit' })
  @Prop({ required: false, maxlength: 100 })
  @IsString()
  @IsOptional()
  transactionRef?: string;

  @ApiProperty({ description: 'Whether the credit was successful' })
  @Prop({ required: true, type: Boolean, default: false })
  credited: boolean;

  @ApiProperty({ description: 'Error message if credit failed' })
  @Prop({ required: false, maxlength: 500 })
  @IsString()
  @IsOptional()
  errorMessage?: string;
}

@Schema({ timestamps: true })
export class ProfitPool {
  @ApiProperty({ description: 'Profit pool ID' })
  id: string;

  @ApiProperty({ description: 'City name', example: 'Lagos' })
  @Prop({ required: true, maxlength: 100, index: true })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({ description: 'Month in YYYY-MM format', example: '2025-08' })
  @Prop({ required: true, maxlength: 7, index: true })
  @IsString()
  @IsNotEmpty()
  month: string;

  @ApiProperty({ description: 'Total revenue for the city in that month (NGN)' })
  @Prop({ required: true, type: Number, min: 0 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  totalRevenue: number;

  @ApiProperty({ description: 'Pool amount (1% of totalRevenue) in Nibia' })
  @Prop({ required: true, type: Number, min: 0 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  poolAmount: number;

  @ApiProperty({ description: 'Number of Growth Elites in the city' })
  @Prop({ required: true, type: Number, min: 0 })
  @IsNumber()
  @Min(0)
  geCount: number;

  @ApiProperty({ description: 'Amount per GE (poolAmount / geCount)' })
  @Prop({ required: true, type: Number, min: 0 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  amountPerGE: number;

  @ApiProperty({ description: 'Distribution details for each GE' })
  @Prop({ required: true, type: [ProfitDistribution] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProfitDistribution)
  distributedTo: ProfitDistribution[];

  @ApiProperty({ description: 'Status of the profit pool distribution' })
  @Prop({
    required: true,
    enum: Object.values(ProfitPoolStatus),
    default: ProfitPoolStatus.CALCULATED,
  })
  @IsEnum(ProfitPoolStatus)
  status: ProfitPoolStatus;

  @ApiProperty({ description: 'Date when distribution was completed' })
  @Prop({ required: false, type: Date })
  @IsDate()
  @IsOptional()
  distributedAt?: Date;

  @ApiProperty({ description: 'Admin who processed the distribution' })
  @Prop({ required: false, type: Types.ObjectId, ref: 'User' })
  @IsString()
  @IsOptional()
  processedBy?: Types.ObjectId;

  @ApiProperty({ description: 'Notes about the distribution process' })
  @Prop({ required: false, maxlength: 1000 })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({ description: 'Total amount successfully distributed' })
  @Prop({ required: true, type: Number, default: 0 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  totalDistributed: number;

  @ApiProperty({ description: 'Number of successful distributions' })
  @Prop({ required: true, type: Number, default: 0 })
  @IsNumber()
  @Min(0)
  successfulDistributions: number;

  @ApiProperty({ description: 'Number of failed distributions' })
  @Prop({ required: true, type: Number, default: 0 })
  @IsNumber()
  @Min(0)
  failedDistributions: number;

  @ApiProperty({ description: 'Calculation metadata' })
  @Prop({ required: false, type: Object })
  @IsOptional()
  metadata?: {
    orderCount: number;
    averageOrderValue: number;
    revenueGrowthPercent: number;
    calculationDuration: number;
  };
}

export const ProfitDistributionSchema = SchemaFactory.createForClass(ProfitDistribution);
export const ProfitPoolSchema = SchemaFactory.createForClass(ProfitPool);

// Indexes for performance
ProfitPoolSchema.index({ city: 1, month: 1 }, { unique: true });
ProfitPoolSchema.index({ status: 1, createdAt: -1 });
ProfitPoolSchema.index({ distributedAt: 1 });
ProfitPoolSchema.index({ 'distributedTo.userId': 1 });
