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
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export type OrderDocument = Order & Document;

export enum OrderStatus {
  PENDING = 'pending',
  PAID = 'paid',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

export enum PaymentPlan {
  PAY_NOW = 'pay_now',            // Full payment + instant delivery
  PRICE_LOCK = 'price_lock',      // Lock price, deliver after 30-45 days
  PAY_SMALL_SMALL = 'pay_small_small', // Split into weekly/monthly payments
  PAY_LATER = 'pay_later',        // Credit check before approving
}

export enum DeliveryMethod {
  PICKUP = 'pickup',
  HOME_DELIVERY = 'home_delivery',
}

export enum PaymentFrequency {
  WEEKLY = 'weekly',
  BIWEEKLY = 'biweekly',
  MONTHLY = 'monthly',
}

export enum CreditStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PARTIAL = 'partial',
  PARTIALLY_PAID = 'partially_paid',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

export enum PaymentMethod {
  FOOD_MONEY = 'food_money',
  FOOD_POINTS = 'food_points',
  CASH = 'cash',
  CARD = 'card',
  BANK_TRANSFER = 'bank_transfer',
}

@Schema({ timestamps: true, _id: false })
export class CartItem {
  @ApiProperty({ description: 'Product ID' })
  @Prop({ required: true, type: Types.ObjectId, ref: 'Product' })
  productId: Types.ObjectId;

  @ApiProperty({ description: 'Quantity of the product' })
  @Prop({ required: true, type: Number, min: 1 })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty({ description: 'Price per unit at time of order' })
  @Prop({ required: true, type: Number, min: 0 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  unitPrice: number;

  @ApiProperty({ description: 'Price per unit in Nibia at time of order' })
  @Prop({ required: true, type: Number, min: 0 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  unitPriceInNibia: number;

  @ApiProperty({ description: 'Total price for this item (quantity * unitPrice)' })
  @Prop({ required: true, type: Number, min: 0 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  totalPrice: number;

  @ApiProperty({ description: 'Total price in Nibia for this item' })
  @Prop({ required: true, type: Number, min: 0 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  totalPriceInNibia: number;
}

@Schema({ timestamps: true, _id: false })
export class StatusHistory {
  @ApiProperty({ description: 'Order status', enum: OrderStatus })
  @Prop({ required: true, enum: Object.values(OrderStatus) })
  @IsEnum(OrderStatus)
  status: OrderStatus;

  @ApiProperty({ description: 'Timestamp when status was set' })
  @Prop({ required: true, type: Date, default: Date.now })
  @IsDateString()
  timestamp: Date;

  @ApiProperty({ description: 'Reason for status change' })
  @Prop({ required: false, type: String })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiProperty({ description: 'User who made the change' })
  @Prop({ required: false, type: String })
  @IsOptional()
  @IsString()
  updatedBy?: string;
}

@Schema({ timestamps: true, _id: false })
export class PaymentSchedule {
  @ApiProperty({ description: 'Payment frequency for installments', enum: PaymentFrequency })
  @Prop({ required: true, enum: Object.values(PaymentFrequency), default: PaymentFrequency.MONTHLY })
  @IsEnum(PaymentFrequency)
  frequency: PaymentFrequency;

  @ApiProperty({ description: 'Amount per installment' })
  @Prop({ required: true, type: Number, min: 0 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  installmentAmount: number;

  @ApiProperty({ description: 'Total number of installments' })
  @Prop({ required: true, type: Number, min: 1 })
  @IsNumber()
  @Min(1)
  totalInstallments: number;

  @ApiProperty({ description: 'Number of installments paid' })
  @Prop({ required: true, type: Number, min: 0, default: 0 })
  @IsNumber()
  @Min(0)
  installmentsPaid: number;

  @ApiProperty({ description: 'Start date of payment schedule' })
  @Prop({ required: true, type: Date })
  @IsDateString()
  startDate: Date;

  @ApiProperty({ description: 'Next payment due date' })
  @Prop({ required: true, type: Date })
  @IsDateString()
  nextPaymentDate: Date;

  @ApiProperty({ description: 'Final payment due date' })
  @Prop({ required: true, type: Date })
  @IsDateString()
  finalPaymentDate: Date;
}

@Schema({ timestamps: true, _id: false })
export class CreditCheck {
  @ApiProperty({ description: 'Credit check status', enum: CreditStatus })
  @Prop({ required: true, enum: Object.values(CreditStatus), default: CreditStatus.PENDING })
  @IsEnum(CreditStatus)
  status: CreditStatus;

  @ApiProperty({ description: 'Credit check score' })
  @Prop({ required: false, type: Number })
  @IsOptional()
  @IsNumber()
  score?: number;

  @ApiProperty({ description: 'Credit check date' })
  @Prop({ required: false, type: Date })
  @IsOptional()
  @IsDateString()
  checkDate?: Date;

  @ApiProperty({ description: 'Credit check notes' })
  @Prop({ required: false, type: String })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ description: 'Approved credit limit' })
  @Prop({ required: false, type: Number, min: 0 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  approvedLimit?: number;
}

@Schema({ timestamps: true, _id: false })
export class PaymentHistory {
  @ApiProperty({ description: 'Payment amount' })
  @Prop({ required: true, type: Number, min: 0 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  amount: number;

  @ApiProperty({ description: 'Payment method used', enum: PaymentMethod })
  @Prop({ required: true, enum: Object.values(PaymentMethod) })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiProperty({ description: 'Payment status', enum: PaymentStatus })
  @Prop({ required: true, enum: Object.values(PaymentStatus) })
  @IsEnum(PaymentStatus)
  status: PaymentStatus;

  @ApiProperty({ description: 'Payment date' })
  @Prop({ required: true, type: Date, default: Date.now })
  @IsDateString()
  paymentDate: Date;

  @ApiProperty({ description: 'Transaction reference/ID' })
  @Prop({ required: false, type: String })
  @IsOptional()
  @IsString()
  transactionRef?: string;

  @ApiProperty({ description: 'Payment notes or description' })
  @Prop({ required: false, type: String })
  @IsOptional()
  @IsString()
  notes?: string;
}

@Schema({ timestamps: true, _id: false })
export class DeliveryAddress {
  @ApiProperty({ description: 'Street address' })
  @Prop({ required: true, type: String })
  @IsString()
  @IsNotEmpty()
  street: string;

  @ApiProperty({ description: 'City' })
  @Prop({ required: true, type: String })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({ description: 'State/Province' })
  @Prop({ required: true, type: String })
  @IsString()
  @IsNotEmpty()
  state: string;

  @ApiProperty({ description: 'Postal/ZIP code' })
  @Prop({ required: false, type: String })
  @IsOptional()
  @IsString()
  postalCode?: string;

  @ApiProperty({ description: 'Country' })
  @Prop({ required: true, type: String, default: 'Nigeria' })
  @IsString()
  country: string;

  @ApiProperty({ description: 'Additional delivery instructions' })
  @Prop({ required: false, type: String })
  @IsOptional()
  @IsString()
  instructions?: string;

  @ApiProperty({ description: 'Latitude coordinate for delivery location' })
  @Prop({ required: false, type: Number })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiProperty({ description: 'Longitude coordinate for delivery location' })
  @Prop({ required: false, type: Number })
  @IsOptional()
  @IsNumber()
  longitude?: number;
}

@Schema({ timestamps: true })
export class Order {
  @ApiProperty({ description: 'Order number (unique identifier)' })
  @Prop({ required: true, type: String, unique: true })
  @IsString()
  @IsNotEmpty()
  orderNumber: string;

  @ApiProperty({ description: 'User who placed the order' })
  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  @IsString()
  @IsNotEmpty()
  userId: Types.ObjectId;

  @ApiProperty({ description: 'Items in the order', type: [CartItem] })
  @Prop({ required: true, type: [CartItem] })
  @IsArray()
  items: CartItem[];

  @ApiProperty({ description: 'Total order amount in NGN' })
  @Prop({ required: true, type: Number, min: 0 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  totalAmount: number;

  @ApiProperty({ description: 'Total order amount in Nibia' })
  @Prop({ required: true, type: Number, min: 0 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  totalAmountInNibia: number;

  @ApiProperty({ description: 'Delivery fee in NGN' })
  @Prop({ required: true, type: Number, min: 0, default: 0 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  deliveryFee: number;

  @ApiProperty({ description: 'Final total (totalAmount + deliveryFee)' })
  @Prop({ required: true, type: Number, min: 0 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  finalTotal: number;

  @ApiProperty({ description: 'Order status', enum: OrderStatus })
  @Prop({ 
    required: true, 
    enum: Object.values(OrderStatus), 
    default: OrderStatus.PENDING 
  })
  @IsEnum(OrderStatus)
  status: OrderStatus;

  @ApiProperty({ description: 'Payment plan selected', enum: PaymentPlan })
  @Prop({ required: true, enum: Object.values(PaymentPlan) })
  @IsEnum(PaymentPlan)
  paymentPlan: PaymentPlan;

  @ApiProperty({ description: 'Delivery method', enum: DeliveryMethod })
  @Prop({ required: true, enum: Object.values(DeliveryMethod) })
  @IsEnum(DeliveryMethod)
  deliveryMethod: DeliveryMethod;

  @ApiProperty({ description: 'Delivery address (required for home delivery)', type: DeliveryAddress })
  @Prop({ required: false, type: DeliveryAddress })
  @IsOptional()
  deliveryAddress?: DeliveryAddress;

  @ApiProperty({ description: 'Payment schedule for installments', type: PaymentSchedule })
  @Prop({ required: false, type: PaymentSchedule })
  @IsOptional()
  paymentSchedule?: PaymentSchedule;

  @ApiProperty({ description: 'Payment information (combined schedule and history)' })
  payment?: {
    history: PaymentHistory[];
    nextPaymentDate: Date;
    status: PaymentStatus;
  };

  @ApiProperty({ description: 'Credit check information for Pay Later option', type: CreditCheck })
  @Prop({ required: false, type: CreditCheck })
  @IsOptional()
  creditCheck?: CreditCheck;

  @ApiProperty({ description: 'Scheduled delivery date for Price Lock orders' })
  @Prop({ required: false, type: Date })
  @IsOptional()
  @IsDateString()
  scheduledDeliveryDate?: Date;

  @ApiProperty({ description: 'Payment history', type: [PaymentHistory] })
  @Prop({ required: true, type: [PaymentHistory], default: [] })
  @IsArray()
  paymentHistory: PaymentHistory[];

  @ApiProperty({ description: 'Order status change history', type: [StatusHistory] })
  @Prop({ required: true, type: [StatusHistory], default: [] })
  @IsArray()
  statusHistory: StatusHistory[];

  @ApiProperty({ description: 'Total amount paid so far' })
  @Prop({ required: true, type: Number, min: 0, default: 0 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  amountPaid: number;

  @ApiProperty({ description: 'Remaining amount to be paid' })
  @Prop({ required: true, type: Number, min: 0 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  remainingAmount: number;

  @ApiProperty({ description: 'Expected delivery date' })
  @Prop({ required: false, type: Date })
  @IsOptional()
  @IsDateString()
  expectedDeliveryDate?: Date;

  // Default Recovery Properties for Pay Later Orders
  @ApiProperty({ description: 'Payment due date for pay later orders' })
  @Prop({ required: false, type: Date })
  @IsOptional()
  @IsDateString()
  paymentDueDate?: Date;

  @ApiProperty({ description: 'Default recovery status' })
  @Prop({ 
    required: false, 
    type: String,
    enum: ['pending', 'processing', 'recovered', 'partial_recovery', 'payment_plan_active', 'manual_collection']
  })
  @IsOptional()
  @IsString()
  defaultRecoveryStatus?: string;

  @ApiProperty({ description: 'Amount recovered from defaults' })
  @Prop({ required: false, type: Number, min: 0, default: 0 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  recoveredAmount?: number;

  @ApiProperty({ description: 'Remaining default amount after recovery' })
  @Prop({ required: false, type: Number, min: 0, default: 0 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  remainingDefault?: number;

  @ApiProperty({ description: 'Last recovery attempt date' })
  @Prop({ required: false, type: Date })
  @IsOptional()
  @IsDateString()
  lastRecoveryDate?: Date;

  @ApiProperty({ description: 'Recovery transaction reference ID' })
  @Prop({ required: false, type: String })
  @IsOptional()
  @IsString()
  recoveryTransactionId?: string;

  @ApiProperty({ description: 'Recovery payment plan details for defaulted orders' })
  @Prop({ required: false, type: Object })
  @IsOptional()
  recoveryPaymentPlan?: {
    totalAmount: number;
    installmentAmount: number;
    totalInstallments: number;
    installmentsPaid: number;
    nextPaymentDate: Date;
    paymentFrequency: string;
  };

  @ApiProperty({ description: 'Actual delivery date' })
  @Prop({ required: false, type: Date })
  @IsOptional()
  @IsDateString()
  actualDeliveryDate?: Date;

  @ApiProperty({ description: 'Order notes or special instructions' })
  @Prop({ required: false, type: String })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ description: 'Cancellation reason (if cancelled)' })
  @Prop({ required: false, type: String })
  @IsOptional()
  @IsString()
  cancellationReason?: string;

  @ApiProperty({ description: 'Tracking number for shipment' })
  @Prop({ required: false, type: String })
  @IsOptional()
  @IsString()
  trackingNumber?: string;

  @ApiProperty({ description: 'Assigned rider for delivery' })
  @Prop({ required: false, type: Types.ObjectId, ref: 'Rider' })
  @IsOptional()
  assignedRider?: Types.ObjectId;

  @ApiProperty({ description: 'Date when rider was assigned' })
  @Prop({ required: false, type: Date })
  @IsOptional()
  @IsDateString()
  riderAssignedAt?: Date;
}

export const CartItemSchema = SchemaFactory.createForClass(CartItem);
export const PaymentHistorySchema = SchemaFactory.createForClass(PaymentHistory);
export const StatusHistorySchema = SchemaFactory.createForClass(StatusHistory);
export const DeliveryAddressSchema = SchemaFactory.createForClass(DeliveryAddress);
export const PaymentScheduleSchema = SchemaFactory.createForClass(PaymentSchedule);
export const CreditCheckSchema = SchemaFactory.createForClass(CreditCheck);
export const OrderSchema = SchemaFactory.createForClass(Order);

// Pre-save middleware to calculate totals and remaining amount
OrderSchema.pre('save', function (next) {
  // Calculate final total
  this.finalTotal = this.totalAmount + this.deliveryFee;
  
  // Calculate remaining amount
  this.remainingAmount = this.finalTotal - this.amountPaid;
  
  // Ensure remaining amount is not negative
  if (this.remainingAmount < 0) {
    this.remainingAmount = 0;
  }
  
  next();
});

// Pre-update middleware
OrderSchema.pre('findOneAndUpdate', function (next) {
  const update = this.getUpdate() as any;
  
  if (update.totalAmount !== undefined || update.deliveryFee !== undefined || update.amountPaid !== undefined) {
    const totalAmount = update.totalAmount ?? 0;
    const deliveryFee = update.deliveryFee ?? 0;
    const amountPaid = update.amountPaid ?? 0;
    
    update.finalTotal = totalAmount + deliveryFee;
    update.remainingAmount = Math.max(0, update.finalTotal - amountPaid);
  }
  
  next();
});

// Add indexes for better query performance
OrderSchema.index({ orderNumber: 1 }, { unique: true });
OrderSchema.index({ userId: 1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ paymentPlan: 1 });
OrderSchema.index({ deliveryMethod: 1 });
OrderSchema.index({ createdAt: -1 });
OrderSchema.index({ expectedDeliveryDate: 1 });
OrderSchema.index({ 'deliveryAddress.city': 1 });
OrderSchema.index({ assignedRider: 1 });
OrderSchema.index({ riderAssignedAt: 1 });
