import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsEnum, IsOptional, IsDate, IsBoolean, Min } from 'class-validator';
import { PaymentType } from '../constants/payment.constants';

export type PaymentPlanDocument = PaymentPlanEntity & Document;

@Schema({ timestamps: true })
export class PaymentPlanEntity {
  @ApiProperty({ description: 'Payment plan identifier' })
  @Prop({ required: true, type: String, enum: PaymentType })
  @IsEnum(PaymentType)
  planType: PaymentType;

  @ApiProperty({ description: 'Order ID associated with this payment plan' })
  @Prop({ required: true, type: Types.ObjectId, ref: 'Order' })
  orderId: Types.ObjectId;

  @ApiProperty({ description: 'User ID owning this payment plan' })
  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  userId: Types.ObjectId;

  @ApiProperty({ description: 'Total amount to be paid in kobo/smallest currency unit' })
  @Prop({ required: true, type: Number, min: 0 })
  @IsNumber()
  @Min(0)
  totalAmount: number;

  @ApiProperty({ description: 'Amount paid so far in kobo/smallest currency unit' })
  @Prop({ required: true, type: Number, min: 0, default: 0 })
  @IsNumber()
  @Min(0)
  paidAmount: number;

  @ApiProperty({ description: 'Remaining amount to be paid' })
  @Prop({ required: false, type: Number })
  @IsOptional()
  @IsNumber()
  remainingAmount?: number;

  @ApiProperty({ description: 'Number of installments for PAY Small-Small' })
  @Prop({ required: false, type: Number, min: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  installments?: number;

  @ApiProperty({ description: 'Current installment number' })
  @Prop({ required: false, type: Number, min: 1, default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  currentInstallment?: number;

  @ApiProperty({ description: 'Installment amount for PAY Small-Small' })
  @Prop({ required: false, type: Number, min: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  installmentAmount?: number;

  @ApiProperty({ description: 'Next payment due date for PAY Small-Small or PAY-LATER' })
  @Prop({ required: false, type: Date })
  @IsOptional()
  @IsDate()
  nextPaymentDate?: Date;

  @ApiProperty({ description: 'Price lock expiry date for PRICE-LOCK plan' })
  @Prop({ required: false, type: Date })
  @IsOptional()
  @IsDate()
  priceLockExpiry?: Date;

  @ApiProperty({ description: 'Original locked price in kobo' })
  @Prop({ required: false, type: Number, min: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  lockedPrice?: number;

  @ApiProperty({ description: 'Whether plan is currently active' })
  @Prop({ required: true, type: Boolean, default: true })
  @IsBoolean()
  isActive: boolean;

  @ApiProperty({ description: 'Whether plan is completed' })
  @Prop({ required: true, type: Boolean, default: false })
  @IsBoolean()
  isCompleted: boolean;

  @ApiProperty({ description: 'Whether plan has overdue payments' })
  @Prop({ required: true, type: Boolean, default: false })
  @IsBoolean()
  isOverdue: boolean;

  @ApiProperty({ description: 'Grace period end date for late payments' })
  @Prop({ required: false, type: Date })
  @IsOptional()
  @IsDate()
  gracePeriodEnd?: Date;

  @ApiProperty({ description: 'Additional metadata for the payment plan' })
  @Prop({ required: false, type: Object })
  @IsOptional()
  metadata?: Record<string, any>;

  @ApiProperty({ description: 'Plan creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Plan last update timestamp' })
  updatedAt: Date;
}

export const PaymentPlanSchema = SchemaFactory.createForClass(PaymentPlanEntity);

// Virtual for remaining amount calculation
PaymentPlanSchema.virtual('remainingAmount').get(function() {
  return this.totalAmount - this.paidAmount;
});

// Virtual for payment progress percentage
PaymentPlanSchema.virtual('progressPercentage').get(function() {
  return this.totalAmount > 0 ? Math.round((this.paidAmount / this.totalAmount) * 100) : 0;
});

// Virtual for next installment amount (for PAY Small-Small)
PaymentPlanSchema.virtual('nextInstallmentAmount').get(function() {
  if (this.planType === PaymentType.PAY_SMALL_SMALL && this.installmentAmount) {
    const remaining = this.totalAmount - this.paidAmount;
    const remainingInstallments = this.installments - (this.currentInstallment - 1);
    return Math.min(this.installmentAmount, remaining);
  }
  return null;
});

// Add indexes for better query performance
PaymentPlanSchema.index({ planType: 1 });
PaymentPlanSchema.index({ orderId: 1 });
PaymentPlanSchema.index({ userId: 1 });
PaymentPlanSchema.index({ isActive: 1 });
PaymentPlanSchema.index({ isCompleted: 1 });
PaymentPlanSchema.index({ isOverdue: 1 });
PaymentPlanSchema.index({ nextPaymentDate: 1 });
PaymentPlanSchema.index({ priceLockExpiry: 1 });
PaymentPlanSchema.index({ createdAt: -1 });
PaymentPlanSchema.index({ userId: 1, isActive: 1 });
PaymentPlanSchema.index({ planType: 1, isActive: 1 });
PaymentPlanSchema.index({ nextPaymentDate: 1, isActive: 1 });
