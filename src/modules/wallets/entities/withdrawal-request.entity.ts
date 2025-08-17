import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  Min,
  IsEnum,
  IsOptional,
  IsDate,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export type WithdrawalRequestDocument = WithdrawalRequest & Document;

export enum WithdrawalStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  COMPLETED = 'completed',
}

@Schema({ timestamps: true })
export class WithdrawalRequest {
  @ApiProperty({ description: 'Withdrawal request ID' })
  id: string;

  @ApiProperty({ description: 'User ID who requested withdrawal' })
  @Prop({ required: true, type: Types.ObjectId, ref: 'User', index: true })
  @IsString()
  @IsNotEmpty()
  userId: Types.ObjectId;

  @ApiProperty({ description: 'User wallet ID' })
  @Prop({ required: true, type: Types.ObjectId, ref: 'Wallet', index: true })
  @IsString()
  @IsNotEmpty()
  walletId: Types.ObjectId;

  @ApiProperty({
    description: 'Nibia amount to withdraw',
    example: 1000.0,
    minimum: 1,
  })
  @Prop({ required: true, type: Number, min: 1 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1)
  nibiaAmount: number;

  @ApiProperty({
    description: 'Equivalent NGN amount (1:1 rate)',
    example: 1000.0,
  })
  @Prop({ required: true, type: Number, min: 1 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1)
  ngnAmount: number;

  @ApiProperty({
    description: 'Withdrawal status',
    enum: WithdrawalStatus,
    example: WithdrawalStatus.PENDING,
  })
  @Prop({
    required: true,
    enum: Object.values(WithdrawalStatus),
    default: WithdrawalStatus.PENDING,
  })
  @IsEnum(WithdrawalStatus)
  status: WithdrawalStatus;

  @ApiProperty({ description: 'User reason for withdrawal', required: false })
  @Prop({ required: false, maxlength: 500 })
  @IsString()
  @IsOptional()
  userReason?: string;

  @ApiProperty({ description: 'Admin notes/reason for approval/rejection', required: false })
  @Prop({ required: false, maxlength: 500 })
  @IsString()
  @IsOptional()
  adminNotes?: string;

  @ApiProperty({ description: 'Admin who processed the request', required: false })
  @Prop({ required: false, type: Types.ObjectId, ref: 'User' })
  @IsString()
  @IsOptional()
  processedBy?: Types.ObjectId;

  @ApiProperty({ description: 'Date when request was processed', required: false })
  @Prop({ required: false, type: Date })
  @IsDate()
  @IsOptional()
  processedAt?: Date;

  @ApiProperty({ description: 'Transaction reference for NGN credit', required: false })
  @Prop({ required: false, maxlength: 100 })
  @IsString()
  @IsOptional()
  transactionRef?: string;

  @ApiProperty({ description: 'User current role at time of request' })
  @Prop({ required: true, maxlength: 50 })
  @IsString()
  @IsNotEmpty()
  userRole: string;

  @ApiProperty({ description: 'Request priority based on user tier' })
  @Prop({ required: true, type: Number, default: 0 })
  @IsNumber()
  priority: number; // 0 = normal, 1 = GA (higher priority), 2 = GE (highest priority)
}

export const WithdrawalRequestSchema = SchemaFactory.createForClass(WithdrawalRequest);

// Indexes for performance
WithdrawalRequestSchema.index({ userId: 1, status: 1 });
WithdrawalRequestSchema.index({ status: 1, createdAt: -1 });
WithdrawalRequestSchema.index({ processedAt: 1 });
WithdrawalRequestSchema.index({ priority: -1, createdAt: 1 }); // Higher priority first, then oldest first
