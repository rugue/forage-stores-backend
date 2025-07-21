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

export type RiderDocument = Rider & Document;

export enum RiderStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING_VERIFICATION = 'pending_verification',
}

export enum VehicleType {
  MOTORCYCLE = 'motorcycle',
  BICYCLE = 'bicycle',
  CAR = 'car',
  VAN = 'van',
  FOOT = 'foot',
}

@Schema({ timestamps: true, _id: false })
export class Vehicle {
  @ApiProperty({ description: 'Vehicle type', enum: VehicleType })
  @Prop({ required: true, enum: Object.values(VehicleType) })
  @IsEnum(VehicleType)
  type: VehicleType;

  @ApiProperty({ description: 'Vehicle model' })
  @Prop({ required: false, type: String })
  @IsOptional()
  @IsString()
  model?: string;

  @ApiProperty({ description: 'License plate number' })
  @Prop({ required: false, type: String })
  @IsOptional()
  @IsString()
  licensePlate?: string;

  @ApiProperty({ description: 'Year of manufacture' })
  @Prop({ required: false, type: Number })
  @IsOptional()
  @IsNumber()
  year?: number;

  @ApiProperty({ description: 'Vehicle color' })
  @Prop({ required: false, type: String })
  @IsOptional()
  @IsString()
  color?: string;
}

@Schema({ timestamps: true, _id: false })
export class VerificationDocument {
  @ApiProperty({ description: 'Document type (ID, License, etc)' })
  @Prop({ required: true, type: String })
  @IsString()
  @IsNotEmpty()
  documentType: string;

  @ApiProperty({ description: 'Document number' })
  @Prop({ required: true, type: String })
  @IsString()
  @IsNotEmpty()
  documentNumber: string;

  @ApiProperty({ description: 'Document issue date' })
  @Prop({ required: false, type: Date })
  @IsOptional()
  @IsDateString()
  issueDate?: Date;

  @ApiProperty({ description: 'Document expiry date' })
  @Prop({ required: false, type: Date })
  @IsOptional()
  @IsDateString()
  expiryDate?: Date;

  @ApiProperty({ description: 'Verification status (pending, verified, rejected)' })
  @Prop({ required: true, type: String, default: 'pending' })
  @IsString()
  status: string;

  @ApiProperty({ description: 'Document URL or reference' })
  @Prop({ required: false, type: String })
  @IsOptional()
  @IsString()
  documentUrl?: string;
}

@Schema({ timestamps: true, _id: false })
export class DeliveryStats {
  @ApiProperty({ description: 'Total number of deliveries completed' })
  @Prop({ required: true, type: Number, default: 0 })
  @IsNumber()
  @Min(0)
  completedDeliveries: number;

  @ApiProperty({ description: 'Total number of deliveries cancelled' })
  @Prop({ required: true, type: Number, default: 0 })
  @IsNumber()
  @Min(0)
  cancelledDeliveries: number;

  @ApiProperty({ description: 'Total number of deliveries rejected' })
  @Prop({ required: true, type: Number, default: 0 })
  @IsNumber()
  @Min(0)
  rejectedDeliveries: number;

  @ApiProperty({ description: 'Average delivery time (minutes)' })
  @Prop({ required: true, type: Number, default: 0 })
  @IsNumber()
  @Min(0)
  averageDeliveryTime: number;

  @ApiProperty({ description: 'Average rating from customers (1-5)' })
  @Prop({ required: true, type: Number, default: 0 })
  @IsNumber()
  @Min(0)
  averageRating: number;

  @ApiProperty({ description: 'Total number of ratings received' })
  @Prop({ required: true, type: Number, default: 0 })
  @IsNumber()
  @Min(0)
  totalRatings: number;

  @ApiProperty({ description: 'Total earnings from deliveries' })
  @Prop({ required: true, type: Number, default: 0 })
  @IsNumber()
  @Min(0)
  totalEarnings: number;
}

@Schema({ timestamps: true })
export class Rider {
  @ApiProperty({ description: 'User ID of the rider' })
  @Prop({ required: true, type: Types.ObjectId, ref: 'User', unique: true })
  userId: Types.ObjectId;

  @ApiProperty({ description: 'Rider status', enum: RiderStatus })
  @Prop({ required: true, enum: Object.values(RiderStatus), default: RiderStatus.PENDING_VERIFICATION })
  @IsEnum(RiderStatus)
  status: RiderStatus;

  @ApiProperty({ description: 'Vehicle information', type: Vehicle })
  @Prop({ required: true, type: Vehicle })
  vehicle: Vehicle;

  @ApiProperty({ description: 'Rider\'s current location coordinates [longitude, latitude]' })
  @Prop({ required: false, type: [Number] })
  @IsOptional()
  @IsArray()
  currentLocation?: number[];

  @ApiProperty({ description: 'Rider\'s preferred service areas (city names)' })
  @Prop({ required: false, type: [String], default: [] })
  @IsArray()
  serviceAreas: string[];

  @ApiProperty({ description: 'Maximum delivery distance (km)' })
  @Prop({ required: true, type: Number, default: 10 })
  @IsNumber()
  @Min(0)
  maxDeliveryDistance: number;

  @ApiProperty({ description: 'Whether rider is currently available for deliveries' })
  @Prop({ required: true, type: Boolean, default: false })
  @IsBoolean()
  isAvailable: boolean;

  @ApiProperty({ description: 'Whether rider is currently on a delivery' })
  @Prop({ required: true, type: Boolean, default: false })
  @IsBoolean()
  isOnDelivery: boolean;

  @ApiProperty({ description: 'Verification documents', type: [VerificationDocument] })
  @Prop({ required: true, type: [VerificationDocument], default: [] })
  @IsArray()
  verificationDocuments: VerificationDocument[];

  @ApiProperty({ description: 'Delivery statistics', type: DeliveryStats })
  @Prop({ required: true, type: DeliveryStats, default: {} })
  deliveryStats: DeliveryStats;

  @ApiProperty({ description: 'Security deposit amount (NGN)' })
  @Prop({ required: true, type: Number, default: 0 })
  @IsNumber()
  @Min(0)
  securityDeposit: number;

  @ApiProperty({ description: 'Account number for payment' })
  @Prop({ required: false, type: String })
  @IsOptional()
  @IsString()
  accountNumber?: string;

  @ApiProperty({ description: 'Bank name for payment' })
  @Prop({ required: false, type: String })
  @IsOptional()
  @IsString()
  bankName?: string;

  @ApiProperty({ description: 'Account name for payment' })
  @Prop({ required: false, type: String })
  @IsOptional()
  @IsString()
  accountName?: string;

  @ApiProperty({ description: 'Notes or additional information' })
  @Prop({ required: false, type: String })
  @IsOptional()
  @IsString()
  notes?: string;
}

export const VehicleSchema = SchemaFactory.createForClass(Vehicle);
export const VerificationDocumentSchema = SchemaFactory.createForClass(VerificationDocument);
export const DeliveryStatsSchema = SchemaFactory.createForClass(DeliveryStats);
export const RiderSchema = SchemaFactory.createForClass(Rider);

// Add indexes for better query performance
RiderSchema.index({ userId: 1 }, { unique: true });
RiderSchema.index({ status: 1 });
RiderSchema.index({ isAvailable: 1 });
RiderSchema.index({ isOnDelivery: 1 });
RiderSchema.index({ securityDeposit: 1 });
RiderSchema.index({ serviceAreas: 1 });
RiderSchema.index({ 'vehicle.type': 1 });
RiderSchema.index({ currentLocation: '2dsphere' });
