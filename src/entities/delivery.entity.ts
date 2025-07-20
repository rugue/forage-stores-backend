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
  IsArray,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export type DeliveryDocument = Delivery & Document;

export enum DeliveryStatus {
  PENDING_ASSIGNMENT = 'pending_assignment',  // Waiting for admin to assign rider
  PENDING_ACCEPTANCE = 'pending_acceptance',  // Waiting for rider to accept
  ACCEPTED = 'accepted',                     // Rider accepted, waiting for pickup
  PICKED_UP = 'picked_up',                   // Rider has picked up the order
  IN_TRANSIT = 'in_transit',                 // Rider is delivering the order
  DELIVERED = 'delivered',                   // Order has been delivered
  COMPLETED = 'completed',                   // Delivery confirmed by customer
  CANCELLED = 'cancelled',                   // Delivery was cancelled
  DECLINED = 'declined',                     // Rider declined the delivery
  EXPIRED = 'expired',                       // Rider didn't respond in time
}

export enum PaymentStatus {
  PENDING = 'pending',
  RELEASED = 'released',
  CANCELLED = 'cancelled',
}

@Schema({ timestamps: true, _id: false })
export class DeliveryLocation {
  @ApiProperty({ description: 'Street address' })
  @Prop({ required: true, type: String })
  @IsString()
  @IsNotEmpty()
  address: string;

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

  @ApiProperty({ description: 'Coordinates [longitude, latitude]' })
  @Prop({ required: false, type: [Number] })
  @IsOptional()
  @IsArray()
  coordinates?: number[];

  @ApiProperty({ description: 'Additional instructions' })
  @Prop({ required: false, type: String })
  @IsOptional()
  @IsString()
  instructions?: string;
}

@Schema({ timestamps: true, _id: false })
export class TimeLog {
  @ApiProperty({ description: 'Time when delivery was assigned to rider' })
  @Prop({ required: false, type: Date })
  @IsOptional()
  @IsDateString()
  assignedAt?: Date;

  @ApiProperty({ description: 'Time when rider accepted/declined the delivery' })
  @Prop({ required: false, type: Date })
  @IsOptional()
  @IsDateString()
  respondedAt?: Date;

  @ApiProperty({ description: 'Time when rider picked up the order' })
  @Prop({ required: false, type: Date })
  @IsOptional()
  @IsDateString()
  pickedUpAt?: Date;

  @ApiProperty({ description: 'Time when delivery was completed' })
  @Prop({ required: false, type: Date })
  @IsOptional()
  @IsDateString()
  deliveredAt?: Date;

  @ApiProperty({ description: 'Time when customer confirmed delivery' })
  @Prop({ required: false, type: Date })
  @IsOptional()
  @IsDateString()
  confirmedAt?: Date;

  @ApiProperty({ description: 'Time when payment was released to rider' })
  @Prop({ required: false, type: Date })
  @IsOptional()
  @IsDateString()
  paymentReleasedAt?: Date;
}

@Schema({ timestamps: true, _id: false })
export class StatusHistory {
  @ApiProperty({ description: 'Delivery status', enum: DeliveryStatus })
  @Prop({ required: true, enum: Object.values(DeliveryStatus) })
  @IsEnum(DeliveryStatus)
  status: DeliveryStatus;

  @ApiProperty({ description: 'Timestamp for the status update' })
  @Prop({ required: true, type: Date, default: Date.now })
  @IsDateString()
  timestamp: Date;

  @ApiProperty({ description: 'Notes about the status change' })
  @Prop({ required: false, type: String })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ description: 'User ID who updated the status' })
  @Prop({ required: false, type: Types.ObjectId, ref: 'User' })
  @IsOptional()
  updatedBy?: Types.ObjectId;
}

@Schema({ timestamps: true })
export class Delivery {
  @ApiProperty({ description: 'Order ID associated with this delivery' })
  @Prop({ required: true, type: Types.ObjectId, ref: 'Order' })
  orderId: Types.ObjectId;

  @ApiProperty({ description: 'Rider assigned to the delivery' })
  @Prop({ required: false, type: Types.ObjectId, ref: 'Rider' })
  @IsOptional()
  riderId?: Types.ObjectId;

  @ApiProperty({ description: 'Customer ID (user who placed the order)' })
  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  customerId: Types.ObjectId;

  @ApiProperty({ description: 'Delivery status', enum: DeliveryStatus })
  @Prop({ 
    required: true, 
    enum: Object.values(DeliveryStatus), 
    default: DeliveryStatus.PENDING_ASSIGNMENT 
  })
  @IsEnum(DeliveryStatus)
  status: DeliveryStatus;

  @ApiProperty({ description: 'Pickup location (store/warehouse)', type: DeliveryLocation })
  @Prop({ required: true, type: DeliveryLocation })
  pickupLocation: DeliveryLocation;

  @ApiProperty({ description: 'Delivery location (customer address)', type: DeliveryLocation })
  @Prop({ required: true, type: DeliveryLocation })
  deliveryLocation: DeliveryLocation;

  @ApiProperty({ description: 'Estimated delivery distance (km)' })
  @Prop({ required: true, type: Number })
  @IsNumber()
  @Min(0)
  distance: number;

  @ApiProperty({ description: 'Delivery fee amount (NGN)' })
  @Prop({ required: true, type: Number })
  @IsNumber()
  @Min(0)
  deliveryFee: number;

  @ApiProperty({ description: 'Rider payment amount (NGN)' })
  @Prop({ required: true, type: Number })
  @IsNumber()
  @Min(0)
  riderPayment: number;

  @ApiProperty({ description: 'Payment status for rider', enum: PaymentStatus })
  @Prop({ 
    required: true, 
    enum: Object.values(PaymentStatus), 
    default: PaymentStatus.PENDING 
  })
  @IsEnum(PaymentStatus)
  paymentStatus: PaymentStatus;

  @ApiProperty({ description: 'Payment reference ID' })
  @Prop({ required: false, type: String })
  @IsOptional()
  @IsString()
  paymentRef?: string;

  @ApiProperty({ description: 'Time logs for delivery events', type: TimeLog })
  @Prop({ required: true, type: TimeLog, default: {} })
  timeLogs: TimeLog;

  @ApiProperty({ description: 'Status history', type: [StatusHistory] })
  @Prop({ required: true, type: [StatusHistory], default: [] })
  @IsArray()
  statusHistory: StatusHistory[];

  @ApiProperty({ description: 'Customer rating for delivery (1-5)' })
  @Prop({ required: false, type: Number, min: 1, max: 5 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  rating?: number;

  @ApiProperty({ description: 'Customer feedback/review' })
  @Prop({ required: false, type: String })
  @IsOptional()
  @IsString()
  feedback?: string;

  @ApiProperty({ description: 'Expiry time for rider acceptance' })
  @Prop({ required: false, type: Date })
  @IsOptional()
  @IsDateString()
  acceptanceExpiryTime?: Date;

  @ApiProperty({ description: 'Whether the delivery has been seen by the rider' })
  @Prop({ required: true, type: Boolean, default: false })
  @IsBoolean()
  seenByRider: boolean;

  @ApiProperty({ description: 'Notes or additional information' })
  @Prop({ required: false, type: String })
  @IsOptional()
  @IsString()
  notes?: string;
}

export const DeliveryLocationSchema = SchemaFactory.createForClass(DeliveryLocation);
export const TimeLogSchema = SchemaFactory.createForClass(TimeLog);
export const StatusHistorySchema = SchemaFactory.createForClass(StatusHistory);
export const DeliverySchema = SchemaFactory.createForClass(Delivery);

// Add indexes for better query performance
DeliverySchema.index({ orderId: 1 }, { unique: true });
DeliverySchema.index({ riderId: 1 });
DeliverySchema.index({ customerId: 1 });
DeliverySchema.index({ status: 1 });
DeliverySchema.index({ paymentStatus: 1 });
DeliverySchema.index({ createdAt: -1 });
DeliverySchema.index({ 'acceptanceExpiryTime': 1 });
DeliverySchema.index({ 'pickupLocation.city': 1 });
DeliverySchema.index({ 'deliveryLocation.city': 1 });

// Pre-save middleware to handle status history updates
DeliverySchema.pre('save', function(next) {
  const delivery = this as DeliveryDocument;
  
  // If it's a new document or the status has changed
  if (delivery.isNew || delivery.isModified('status')) {
    const status = delivery.status;
    const statusUpdate = {
      status,
      timestamp: new Date(),
      notes: `Status changed to ${status}`
    };
    
    // Add to status history
    delivery.statusHistory.push(statusUpdate);
    
    // Update time logs based on status
    const now = new Date();
    
    if (status === DeliveryStatus.PENDING_ACCEPTANCE && !delivery.timeLogs.assignedAt) {
      delivery.timeLogs.assignedAt = now;
      
      // Set acceptance expiry time (3 minutes from now)
      const expiryTime = new Date(now);
      expiryTime.setMinutes(expiryTime.getMinutes() + 3);
      delivery.acceptanceExpiryTime = expiryTime;
    }
    else if (status === DeliveryStatus.ACCEPTED || status === DeliveryStatus.DECLINED) {
      delivery.timeLogs.respondedAt = now;
    }
    else if (status === DeliveryStatus.PICKED_UP) {
      delivery.timeLogs.pickedUpAt = now;
    }
    else if (status === DeliveryStatus.DELIVERED) {
      delivery.timeLogs.deliveredAt = now;
    }
    else if (status === DeliveryStatus.COMPLETED) {
      delivery.timeLogs.confirmedAt = now;
    }
  }
  
  // If payment status has changed to RELEASED
  if (delivery.isModified('paymentStatus') && delivery.paymentStatus === PaymentStatus.RELEASED) {
    delivery.timeLogs.paymentReleasedAt = new Date();
  }
  
  next();
});
