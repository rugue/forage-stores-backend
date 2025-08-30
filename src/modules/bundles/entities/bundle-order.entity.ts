import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  Min,
  IsOptional,
  IsEnum,
  IsDateString,
  IsBoolean,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export type BundleOrderDocument = BundleOrder & Document;

export enum BundleOrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

export enum GiftDeliveryStatus {
  PENDING = 'pending',
  GIFT_MESSAGE_SENT = 'gift_message_sent',
  RECIPIENT_NOTIFIED = 'recipient_notified',
  DELIVERED = 'delivered',
  FAILED = 'failed',
}

@Schema({ timestamps: true, _id: false })
export class RecipientInfo {
  @ApiProperty({ description: 'Recipient full name' })
  @Prop({ required: true, type: String, trim: true })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({ description: 'Recipient phone number' })
  @Prop({ required: true, type: String, trim: true })
  @IsString()
  @IsNotEmpty()
  phoneNumber: string;

  @ApiProperty({ description: 'Recipient email address' })
  @Prop({ required: false, type: String, trim: true })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiProperty({ description: 'Delivery address for the recipient' })
  @Prop({ required: true, type: String })
  @IsString()
  @IsNotEmpty()
  deliveryAddress: string;

  @ApiProperty({ description: 'City for delivery' })
  @Prop({ required: true, type: String })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({ description: 'State for delivery' })
  @Prop({ required: false, type: String })
  @IsOptional()
  @IsString()
  state?: string;
}

@Schema({ timestamps: true, _id: false })
export class GiftMessage {
  @ApiProperty({ description: 'Personal message from sender to recipient' })
  @Prop({ required: false, type: String, maxlength: 500 })
  @IsOptional()
  @IsString()
  message?: string;

  @ApiProperty({ description: 'Sender name to display in gift message' })
  @Prop({ required: true, type: String, trim: true })
  @IsString()
  @IsNotEmpty()
  senderName: string;

  @ApiProperty({ description: 'Whether to include sender contact information' })
  @Prop({ required: true, type: Boolean, default: false })
  @IsBoolean()
  includeSenderContact: boolean;

  @ApiProperty({ description: 'Occasion for the gift' })
  @Prop({ required: false, type: String })
  @IsOptional()
  @IsString()
  occasion?: string;
}

@Schema({ timestamps: true })
export class BundleOrder {
  @ApiProperty({ description: 'Bundle order number' })
  @Prop({ required: true, type: String, unique: true })
  @IsString()
  @IsNotEmpty()
  orderNumber: string;

  @ApiProperty({ description: 'Bundle ID' })
  @Prop({ required: true, type: Types.ObjectId, ref: 'Bundle' })
  bundleId: Types.ObjectId;

  @ApiProperty({ description: 'User who placed the order' })
  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  userId: Types.ObjectId;

  @ApiProperty({ description: 'Quantity of bundles ordered' })
  @Prop({ required: true, type: Number, min: 1 })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty({ description: 'Total amount for the bundle order' })
  @Prop({ required: true, type: Number, min: 0 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  totalAmount: number;

  @ApiProperty({ description: 'Total amount in Nibia points' })
  @Prop({ required: true, type: Number, min: 0 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  totalAmountInNibia: number;

  @ApiProperty({ description: 'Bundle order status', enum: BundleOrderStatus })
  @Prop({ required: true, enum: Object.values(BundleOrderStatus), default: BundleOrderStatus.PENDING })
  @IsEnum(BundleOrderStatus)
  status: BundleOrderStatus;

  @ApiProperty({ description: 'Whether this is a gift order' })
  @Prop({ required: true, type: Boolean, default: false })
  @IsBoolean()
  isGift: boolean;

  @ApiProperty({ description: 'Recipient information for gift orders', type: RecipientInfo })
  @Prop({ required: false, type: Object })
  @IsOptional()
  @ValidateNested()
  @Type(() => RecipientInfo)
  recipientInfo?: RecipientInfo;

  @ApiProperty({ description: 'Gift message details', type: GiftMessage })
  @Prop({ required: false, type: Object })
  @IsOptional()
  @ValidateNested()
  @Type(() => GiftMessage)
  giftMessage?: GiftMessage;

  @ApiProperty({ description: 'Gift delivery status', enum: GiftDeliveryStatus })
  @Prop({ required: false, enum: Object.values(GiftDeliveryStatus) })
  @IsOptional()
  @IsEnum(GiftDeliveryStatus)
  giftDeliveryStatus?: GiftDeliveryStatus;

  @ApiProperty({ description: 'Expected delivery date' })
  @Prop({ required: false, type: Date })
  @IsOptional()
  @IsDateString()
  expectedDeliveryDate?: Date;

  @ApiProperty({ description: 'Actual delivery date' })
  @Prop({ required: false, type: Date })
  @IsOptional()
  @IsDateString()
  deliveredAt?: Date;

  @ApiProperty({ description: 'Payment method used' })
  @Prop({ required: false, type: String })
  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @ApiProperty({ description: 'Transaction reference' })
  @Prop({ required: false, type: String })
  @IsOptional()
  @IsString()
  transactionRef?: string;

  @ApiProperty({ description: 'Special instructions for the bundle order' })
  @Prop({ required: false, type: String })
  @IsOptional()
  @IsString()
  specialInstructions?: string;

  @ApiProperty({ description: 'Admin who approved the order (for staff gift boxes)' })
  @Prop({ required: false, type: Types.ObjectId, ref: 'User' })
  @IsOptional()
  approvedBy?: Types.ObjectId;

  @ApiProperty({ description: 'Date when the order was approved' })
  @Prop({ required: false, type: Date })
  @IsOptional()
  @IsDateString()
  approvedAt?: Date;
}

export const RecipientInfoSchema = SchemaFactory.createForClass(RecipientInfo);
export const GiftMessageSchema = SchemaFactory.createForClass(GiftMessage);
export const BundleOrderSchema = SchemaFactory.createForClass(BundleOrder);

// Pre-save middleware to generate order number
BundleOrderSchema.pre('save', function (next) {
  if (!this.orderNumber) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.orderNumber = `BDL-${timestamp}-${random}`;
  }
  next();
});

// Add indexes for better query performance
BundleOrderSchema.index({ orderNumber: 1 }, { unique: true });
BundleOrderSchema.index({ bundleId: 1 });
BundleOrderSchema.index({ userId: 1 });
BundleOrderSchema.index({ status: 1 });
BundleOrderSchema.index({ isGift: 1 });
BundleOrderSchema.index({ giftDeliveryStatus: 1 });
BundleOrderSchema.index({ expectedDeliveryDate: 1 });
BundleOrderSchema.index({ createdAt: -1 });
BundleOrderSchema.index({ approvedBy: 1 });
