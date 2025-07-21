import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  Min,
  IsOptional,
  IsArray,
  IsEnum,
  IsDateString,
  IsBoolean,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PaymentPlan, PaymentFrequency } from '../../orders/entities/order.entity';

export type SubscriptionDocument = Subscription & Document;

export enum SubscriptionStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Schema({ timestamps: true, _id: false })
export class DropScheduleItem {
  @ApiProperty({ description: 'Scheduled date for the drop' })
  @Prop({ required: true, type: Date })
  @IsDateString()
  scheduledDate: Date;

  @ApiProperty({ description: 'Next drop date for delivery' })
  @Prop({ required: false, type: Date })
  @IsOptional()
  @IsDateString()
  nextDropDate?: Date;

  @ApiProperty({ description: 'Products in this drop' })
  @Prop({ required: false, type: [Types.ObjectId], ref: 'Product', default: [] })
  @IsOptional()
  @IsArray()
  products?: Types.ObjectId[];

  @ApiProperty({ description: 'Amount for this drop' })
  @Prop({ required: true, type: Number, min: 0 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  amount: number;

  @ApiProperty({ description: 'Whether this drop has been paid' })
  @Prop({ required: true, type: Boolean, default: false })
  @IsBoolean()
  isPaid: boolean;

  @ApiProperty({ description: 'Date when this drop was paid' })
  @Prop({ required: false, type: Date })
  @IsOptional()
  @IsDateString()
  paidDate?: Date;

  @ApiProperty({ description: 'Transaction reference for this payment' })
  @Prop({ required: false, type: String })
  @IsOptional()
  @IsString()
  transactionRef?: string;
}

@Schema({ timestamps: true })
export class Subscription {
  @ApiProperty({ description: 'Subscription name/title' })
  @Prop({ required: false, type: String })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ description: 'User who owns the subscription' })
  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  @IsString()
  @IsNotEmpty()
  userId: Types.ObjectId;

  @ApiProperty({ description: 'Order associated with this subscription' })
  @Prop({ required: true, type: Types.ObjectId, ref: 'Order' })
  @IsString()
  @IsNotEmpty()
  orderId: Types.ObjectId;

  @ApiProperty({ description: 'Subscription plan type', enum: PaymentPlan })
  @Prop({ required: true, enum: [PaymentPlan.PAY_SMALL_SMALL, PaymentPlan.PRICE_LOCK] })
  @IsEnum(PaymentPlan)
  paymentPlan: PaymentPlan;

  @ApiProperty({ description: 'Total subscription amount' })
  @Prop({ required: true, type: Number, min: 0 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  totalAmount: number;

  @ApiProperty({ description: 'Amount per drop/payment' })
  @Prop({ required: true, type: Number, min: 0 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  dropAmount: number;

  @ApiProperty({ description: 'Frequency of payments', enum: PaymentFrequency })
  @Prop({ required: true, enum: Object.values(PaymentFrequency) })
  @IsEnum(PaymentFrequency)
  frequency: PaymentFrequency;

  @ApiProperty({ description: 'Total number of drops in the subscription' })
  @Prop({ required: true, type: Number, min: 1 })
  @IsNumber()
  @Min(1)
  totalDrops: number;

  @ApiProperty({ description: 'Number of drops already paid' })
  @Prop({ required: true, type: Number, min: 0, default: 0 })
  @IsNumber()
  @Min(0)
  dropsPaid: number;

  @ApiProperty({ description: 'Amount already paid' })
  @Prop({ required: true, type: Number, min: 0, default: 0 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  amountPaid: number;

  @ApiProperty({ description: 'Drop schedule with dates and status', type: [DropScheduleItem] })
  @Prop({ required: true, type: [Object], default: [] })
  @IsArray()
  dropSchedule: DropScheduleItem[];

  @ApiProperty({ description: 'Next drop date' })
  @Prop({ required: false, type: Date })
  @IsOptional()
  @IsDateString()
  nextDropDate?: Date;

  @ApiProperty({ description: 'Subscription status', enum: SubscriptionStatus })
  @Prop({ 
    required: true, 
    enum: Object.values(SubscriptionStatus), 
    default: SubscriptionStatus.ACTIVE 
  })
  @IsEnum(SubscriptionStatus)
  status: SubscriptionStatus;

  @ApiProperty({ description: 'Whether the subscription is completed' })
  @Prop({ required: true, type: Boolean, default: false })
  @IsBoolean()
  isCompleted: boolean;

  @ApiProperty({ description: 'Start date of the subscription' })
  @Prop({ required: true, type: Date, default: Date.now })
  @IsDateString()
  startDate: Date;

  @ApiProperty({ description: 'End date of the subscription (when completed or planned to complete)' })
  @Prop({ required: false, type: Date })
  @IsOptional()
  @IsDateString()
  endDate?: Date;

  @ApiProperty({ description: 'Subscription notes' })
  @Prop({ required: false, type: String })
  @IsOptional()
  @IsString()
  notes?: string;
}

export const DropScheduleItemSchema = SchemaFactory.createForClass(DropScheduleItem);
export const SubscriptionSchema = SchemaFactory.createForClass(Subscription);

// Middleware to update isCompleted status based on dropsPaid and totalDrops
SubscriptionSchema.pre('save', function (next) {
  // Mark as completed if all drops are paid
  this.isCompleted = this.dropsPaid >= this.totalDrops;
  
  // Update status if completed
  if (this.isCompleted && this.status === SubscriptionStatus.ACTIVE) {
    this.status = SubscriptionStatus.COMPLETED;
    this.endDate = new Date();
  }
  
  // Find and set the next drop date
  if (!this.isCompleted) {
    const nextUnpaidDrop = this.dropSchedule.find(drop => !drop.isPaid);
    if (nextUnpaidDrop) {
      this.nextDropDate = nextUnpaidDrop.scheduledDate;
    }
  } else {
    this.nextDropDate = undefined;
  }
  
  next();
});

// Add indexes for better query performance
SubscriptionSchema.index({ userId: 1 });
SubscriptionSchema.index({ orderId: 1 });
SubscriptionSchema.index({ status: 1 });
SubscriptionSchema.index({ isCompleted: 1 });
SubscriptionSchema.index({ nextDropDate: 1 });
SubscriptionSchema.index({ paymentPlan: 1 });
