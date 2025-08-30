import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsEnum, IsOptional, IsDate, IsBoolean, Min } from 'class-validator';
import { RefundStatus, PaymentGateway } from '../constants/payment.constants';

export type RefundDocument = Refund & Document;

@Schema({ timestamps: true })
export class Refund {
  @ApiProperty({ description: 'Unique refund reference' })
  @Prop({ required: true, type: String, unique: true })
  @IsString()
  refundReference: string;

  @ApiProperty({ description: 'Original payment transaction ID' })
  @Prop({ required: true, type: Types.ObjectId, ref: 'Payment' })
  paymentId: Types.ObjectId;

  @ApiProperty({ description: 'User requesting the refund' })
  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  userId: Types.ObjectId;

  @ApiProperty({ description: 'Refund amount in kobo/smallest currency unit' })
  @Prop({ required: true, type: Number, min: 0 })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({ description: 'Reason for refund' })
  @Prop({ required: true, type: String })
  @IsString()
  reason: string;

  @ApiProperty({ description: 'Refund status', enum: RefundStatus })
  @Prop({ required: true, type: String, enum: RefundStatus, default: RefundStatus.PENDING })
  @IsEnum(RefundStatus)
  status: RefundStatus;

  @ApiProperty({ description: 'Payment gateway handling refund', enum: PaymentGateway })
  @Prop({ required: true, type: String, enum: PaymentGateway })
  @IsEnum(PaymentGateway)
  gateway: PaymentGateway;

  @ApiProperty({ description: 'Gateway refund ID' })
  @Prop({ required: false, type: String })
  @IsOptional()
  @IsString()
  gatewayRefundId?: string;

  @ApiProperty({ description: 'Admin who approved/rejected the refund' })
  @Prop({ required: false, type: Types.ObjectId, ref: 'User' })
  @IsOptional()
  approvedBy?: Types.ObjectId;

  @ApiProperty({ description: 'Approval/rejection date' })
  @Prop({ required: false, type: Date })
  @IsOptional()
  @IsDate()
  processedAt?: Date;

  @ApiProperty({ description: 'Admin notes for approval/rejection' })
  @Prop({ required: false, type: String })
  @IsOptional()
  @IsString()
  adminNotes?: string;

  @ApiProperty({ description: 'Whether this is a partial refund' })
  @Prop({ required: true, type: Boolean, default: false })
  @IsBoolean()
  isPartialRefund: boolean;

  @ApiProperty({ description: 'Gateway response for refund processing' })
  @Prop({ required: false, type: Object })
  @IsOptional()
  gatewayResponse?: Record<string, any>;

  @ApiProperty({ description: 'Estimated processing time in days' })
  @Prop({ required: false, type: Number, min: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  estimatedProcessingDays?: number;
}

export const RefundSchema = SchemaFactory.createForClass(Refund);

// Add indexes for better query performance
RefundSchema.index({ refundReference: 1 }, { unique: true });
RefundSchema.index({ paymentId: 1 });
RefundSchema.index({ userId: 1 });
RefundSchema.index({ status: 1 });
RefundSchema.index({ gateway: 1 });
RefundSchema.index({ createdAt: -1 });
RefundSchema.index({ processedAt: -1 });
RefundSchema.index({ approvedBy: 1 });
