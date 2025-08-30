import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsEnum, IsOptional, IsDate, IsObject, Min } from 'class-validator';
import { PaymentType, PaymentMethod, PaymentStatus, PaymentGateway, TransactionType } from '../constants/payment.constants';

export type PaymentDocument = Payment & Document;

@Schema({ _id: false })
export class PaymentMetadata {
  @ApiProperty({ description: 'Order ID associated with payment' })
  @Prop({ required: false, type: String })
  @IsOptional()
  @IsString()
  orderId?: string;

  @ApiProperty({ description: 'Bundle ID if payment is for bundle' })
  @Prop({ required: false, type: String })
  @IsOptional()
  @IsString()
  bundleId?: string;

  @ApiProperty({ description: 'Subscription ID if payment is for subscription' })
  @Prop({ required: false, type: String })
  @IsOptional()
  @IsString()
  subscriptionId?: string;

  @ApiProperty({ description: 'Additional metadata' })
  @Prop({ required: false, type: Object })
  @IsOptional()
  @IsObject()
  additional?: Record<string, any>;
}

@Schema({ _id: false })
export class GatewayResponse {
  @ApiProperty({ description: 'Gateway transaction ID' })
  @Prop({ required: true, type: String })
  @IsString()
  gatewayTransactionId: string;

  @ApiProperty({ description: 'Gateway reference' })
  @Prop({ required: false, type: String })
  @IsOptional()
  @IsString()
  gatewayReference?: string;

  @ApiProperty({ description: 'Authorization URL for card payments' })
  @Prop({ required: false, type: String })
  @IsOptional()
  @IsString()
  authorizationUrl?: string;

  @ApiProperty({ description: 'Gateway status code' })
  @Prop({ required: false, type: String })
  @IsOptional()
  @IsString()
  statusCode?: string;

  @ApiProperty({ description: 'Gateway message' })
  @Prop({ required: false, type: String })
  @IsOptional()
  @IsString()
  message?: string;

  @ApiProperty({ description: 'Full gateway response' })
  @Prop({ required: false, type: Object })
  @IsOptional()
  @IsObject()
  rawResponse?: Record<string, any>;
}

@Schema({ _id: false })
export class FeeBreakdown {
  @ApiProperty({ description: 'Gateway processing fee' })
  @Prop({ required: true, type: Number, min: 0, default: 0 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  gatewayFee: number;

  @ApiProperty({ description: 'Platform service fee' })
  @Prop({ required: true, type: Number, min: 0, default: 0 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  serviceFee: number;

  @ApiProperty({ description: 'Other applicable fees' })
  @Prop({ required: true, type: Number, min: 0, default: 0 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  otherFees: number;

  @ApiProperty({ description: 'Total fees charged' })
  @Prop({ required: true, type: Number, min: 0, default: 0 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  totalFees: number;
}

@Schema({ timestamps: true })
export class Payment {
  @ApiProperty({ description: 'Unique payment reference' })
  @Prop({ required: true, type: String, unique: true })
  @IsString()
  reference: string;

  @ApiProperty({ description: 'User making the payment' })
  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  userId: Types.ObjectId;

  @ApiProperty({ description: 'Payment amount in kobo/smallest currency unit' })
  @Prop({ required: true, type: Number, min: 0 })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({ description: 'Currency code' })
  @Prop({ required: true, type: String, default: 'NGN' })
  @IsString()
  currency: string;

  @ApiProperty({ description: 'Payment type', enum: PaymentType })
  @Prop({ required: true, type: String, enum: PaymentType })
  @IsEnum(PaymentType)
  paymentType: PaymentType;

  @ApiProperty({ description: 'Payment method', enum: PaymentMethod })
  @Prop({ required: true, type: String, enum: PaymentMethod })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiProperty({ description: 'Payment status', enum: PaymentStatus })
  @Prop({ required: true, type: String, enum: PaymentStatus, default: PaymentStatus.PENDING })
  @IsEnum(PaymentStatus)
  status: PaymentStatus;

  @ApiProperty({ description: 'Payment gateway used', enum: PaymentGateway })
  @Prop({ required: true, type: String, enum: PaymentGateway })
  @IsEnum(PaymentGateway)
  gateway: PaymentGateway;

  @ApiProperty({ description: 'Payment metadata' })
  @Prop({ required: false, type: PaymentMetadata })
  @IsOptional()
  metadata?: PaymentMetadata;

  @ApiProperty({ description: 'Gateway response details' })
  @Prop({ required: false, type: GatewayResponse })
  @IsOptional()
  gatewayResponse?: GatewayResponse;

  @ApiProperty({ description: 'Fee breakdown' })
  @Prop({ required: false, type: FeeBreakdown })
  @IsOptional()
  fees?: FeeBreakdown;

  @ApiProperty({ description: 'Net amount after fees' })
  @Prop({ required: true, type: Number, min: 0 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  netAmount: number;

  @ApiProperty({ description: 'Payment initiation date' })
  @Prop({ required: true, type: Date, default: Date.now })
  @IsDate()
  initiatedAt: Date;

  @ApiProperty({ description: 'Payment completion date' })
  @Prop({ required: false, type: Date })
  @IsOptional()
  @IsDate()
  completedAt?: Date;

  @ApiProperty({ description: 'Payment expiry date' })
  @Prop({ required: false, type: Date })
  @IsOptional()
  @IsDate()
  expiresAt?: Date;

  @ApiProperty({ description: 'Number of retry attempts' })
  @Prop({ required: true, type: Number, min: 0, default: 0 })
  @IsNumber()
  @Min(0)
  retryCount: number;

  @ApiProperty({ description: 'Last error message' })
  @Prop({ required: false, type: String })
  @IsOptional()
  @IsString()
  lastError?: string;

  @ApiProperty({ description: 'IP address of the payment initiator' })
  @Prop({ required: false, type: String })
  @IsOptional()
  @IsString()
  ipAddress?: string;

  @ApiProperty({ description: 'User agent of the payment initiator' })
  @Prop({ required: false, type: String })
  @IsOptional()
  @IsString()
  userAgent?: string;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);

// Add indexes for better query performance
PaymentSchema.index({ reference: 1 }, { unique: true });
PaymentSchema.index({ userId: 1 });
PaymentSchema.index({ status: 1 });
PaymentSchema.index({ gateway: 1 });
PaymentSchema.index({ paymentType: 1 });
PaymentSchema.index({ paymentMethod: 1 });
PaymentSchema.index({ initiatedAt: -1 });
PaymentSchema.index({ completedAt: -1 });
PaymentSchema.index({ 'metadata.orderId': 1 });
PaymentSchema.index({ 'metadata.bundleId': 1 });
PaymentSchema.index({ 'gatewayResponse.gatewayTransactionId': 1 });

// Add virtual for transaction ID
PaymentSchema.virtual('transactionId').get(function() {
  return this._id.toString();
});
