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
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export type BundleDocument = Bundle & Document;

export enum BundleType {
  FAMILY_RESTOCK = 'family_restock',
  CHRISTMAS_BUNDLE = 'christmas_bundle',
  LOVE_BOX = 'love_box',
  STAFF_GIFT_BOX = 'staff_gift_box',
  SEND_FOOD = 'send_food',
  CUSTOM = 'custom',
}

export enum BundleStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SEASONAL = 'seasonal',
  DRAFT = 'draft',
}

export enum SeasonalType {
  CHRISTMAS = 'christmas',
  VALENTINE = 'valentine',
  EASTER = 'easter',
  RAMADAN = 'ramadan',
  NEW_YEAR = 'new_year',
  MOTHERS_DAY = 'mothers_day',
  FATHERS_DAY = 'fathers_day',
  NONE = 'none',
}

@Schema({ timestamps: true, _id: false })
export class BundleProduct {
  @ApiProperty({ description: 'Product ID' })
  @Prop({ required: true, type: Types.ObjectId, ref: 'Product' })
  productId: Types.ObjectId;

  @ApiProperty({ description: 'Quantity of this product in the bundle' })
  @Prop({ required: true, type: Number, min: 1 })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty({ description: 'Whether this product is required in the bundle' })
  @Prop({ required: true, type: Boolean, default: true })
  @IsBoolean()
  isRequired: boolean;

  @ApiProperty({ description: 'Alternative products that can substitute this item' })
  @Prop({ required: false, type: [Types.ObjectId], ref: 'Product', default: [] })
  @IsOptional()
  @IsArray()
  alternatives?: Types.ObjectId[];
}

@Schema({ timestamps: true, _id: false })
export class SeasonalAvailability {
  @ApiProperty({ description: 'Seasonal type', enum: SeasonalType })
  @Prop({ required: true, enum: Object.values(SeasonalType) })
  @IsEnum(SeasonalType)
  seasonalType: SeasonalType;

  @ApiProperty({ description: 'Start date for seasonal availability' })
  @Prop({ required: true, type: Date })
  @IsDateString()
  startDate: Date;

  @ApiProperty({ description: 'End date for seasonal availability' })
  @Prop({ required: true, type: Date })
  @IsDateString()
  endDate: Date;

  @ApiProperty({ description: 'Year for this seasonal period' })
  @Prop({ required: true, type: Number })
  @IsNumber()
  year: number;

  @ApiProperty({ description: 'Whether the bundle is currently available for this season' })
  @Prop({ required: true, type: Boolean, default: false })
  @IsBoolean()
  isCurrentlyActive: boolean;
}

@Schema({ timestamps: true, _id: false })
export class BundlePricing {
  @ApiProperty({ description: 'Bundle base price in NGN' })
  @Prop({ required: true, type: Number, min: 0 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  basePrice: number;

  @ApiProperty({ description: 'Bundle price in Nibia points' })
  @Prop({ required: true, type: Number, min: 0 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  priceInNibia: number;

  @ApiProperty({ description: 'Discount percentage applied to bundle' })
  @Prop({ required: false, type: Number, min: 0, max: 100 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  discountPercentage?: number;

  @ApiProperty({ description: 'Final discounted price' })
  @Prop({ required: false, type: Number, min: 0 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  discountedPrice?: number;

  @ApiProperty({ description: 'Savings amount compared to individual product purchases' })
  @Prop({ required: false, type: Number, min: 0 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  savingsAmount?: number;
}

@Schema({ timestamps: true, _id: false })
export class GiftSettings {
  @ApiProperty({ description: 'Whether this bundle can be sent as a gift' })
  @Prop({ required: true, type: Boolean, default: false })
  @IsBoolean()
  canBeGifted: boolean;

  @ApiProperty({ description: 'Custom gift message template' })
  @Prop({ required: false, type: String })
  @IsOptional()
  @IsString()
  giftMessageTemplate?: string;

  @ApiProperty({ description: 'Whether gift wrapping is available' })
  @Prop({ required: true, type: Boolean, default: false })
  @IsBoolean()
  giftWrappingAvailable: boolean;

  @ApiProperty({ description: 'Gift wrapping fee in NGN' })
  @Prop({ required: false, type: Number, min: 0 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  giftWrappingFee?: number;
}

@Schema({ timestamps: true })
export class Bundle {
  @ApiProperty({ description: 'Bundle name', example: 'Family Restock Bundle' })
  @Prop({ required: true, type: String, trim: true })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Bundle description', example: 'Complete family groceries for a week' })
  @Prop({ required: true, type: String, trim: true })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ description: 'Bundle type', enum: BundleType })
  @Prop({ required: true, enum: Object.values(BundleType) })
  @IsEnum(BundleType)
  type: BundleType;

  @ApiProperty({ description: 'Bundle status', enum: BundleStatus })
  @Prop({ required: true, enum: Object.values(BundleStatus), default: BundleStatus.DRAFT })
  @IsEnum(BundleStatus)
  status: BundleStatus;

  @ApiProperty({ description: 'Products included in this bundle', type: [BundleProduct] })
  @Prop({ required: true, type: [Object] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BundleProduct)
  products: BundleProduct[];

  @ApiProperty({ description: 'Bundle pricing information', type: BundlePricing })
  @Prop({ required: true, type: Object })
  @ValidateNested()
  @Type(() => BundlePricing)
  pricing: BundlePricing;

  @ApiProperty({ description: 'Seasonal availability settings', type: SeasonalAvailability })
  @Prop({ required: false, type: Object })
  @IsOptional()
  @ValidateNested()
  @Type(() => SeasonalAvailability)
  seasonalAvailability?: SeasonalAvailability;

  @ApiProperty({ description: 'Gift settings for this bundle', type: GiftSettings })
  @Prop({ required: true, type: Object })
  @ValidateNested()
  @Type(() => GiftSettings)
  giftSettings: GiftSettings;

  @ApiProperty({ description: 'Cities where this bundle is available' })
  @Prop({ required: true, type: [String] })
  @IsArray()
  @IsString({ each: true })
  availableCities: string[];

  @ApiProperty({ description: 'Bundle images URLs' })
  @Prop({ required: false, type: [String], default: [] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @ApiProperty({ description: 'Bundle tags for search and filtering' })
  @Prop({ required: true, type: [String], default: [] })
  @IsArray()
  @IsString({ each: true })
  tags: string[];

  @ApiProperty({ description: 'Maximum number of this bundle that can be ordered per customer' })
  @Prop({ required: false, type: Number, min: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxOrderQuantity?: number;

  @ApiProperty({ description: 'Minimum customer order history required to purchase this bundle' })
  @Prop({ required: false, type: Number, min: 0, default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minOrderHistory?: number;

  @ApiProperty({ description: 'Whether this bundle requires admin approval' })
  @Prop({ required: true, type: Boolean, default: false })
  @IsBoolean()
  requiresAdminApproval: boolean;

  @ApiProperty({ description: 'Creator of the bundle (admin ID)' })
  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  createdBy: Types.ObjectId;

  @ApiProperty({ description: 'Last updated by (admin ID)' })
  @Prop({ required: false, type: Types.ObjectId, ref: 'User' })
  @IsOptional()
  updatedBy?: Types.ObjectId;

  @ApiProperty({ description: 'Bundle availability start date' })
  @Prop({ required: false, type: Date })
  @IsOptional()
  @IsDateString()
  availableFrom?: Date;

  @ApiProperty({ description: 'Bundle availability end date' })
  @Prop({ required: false, type: Date })
  @IsOptional()
  @IsDateString()
  availableUntil?: Date;

  @ApiProperty({ description: 'Number of times this bundle has been purchased' })
  @Prop({ required: true, type: Number, min: 0, default: 0 })
  @IsNumber()
  @Min(0)
  purchaseCount: number;

  @ApiProperty({ description: 'Total revenue generated by this bundle' })
  @Prop({ required: true, type: Number, min: 0, default: 0 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  totalRevenue: number;

  @ApiProperty({ description: 'Whether the bundle is active and available for purchase' })
  @Prop({ required: true, type: Boolean, default: true })
  @IsBoolean()
  isActive: boolean;

  @ApiProperty({ description: 'Whether the bundle is seasonally active (for seasonal bundles)' })
  @Prop({ required: true, type: Boolean, default: true })
  @IsBoolean()
  isSeasonallyActive: boolean;

  @ApiProperty({ description: 'ID of the admin who last modified this bundle' })
  @Prop({ required: false, type: String })
  @IsOptional()
  @IsString()
  lastModifiedBy?: string;
}

export const BundleProductSchema = SchemaFactory.createForClass(BundleProduct);
export const SeasonalAvailabilitySchema = SchemaFactory.createForClass(SeasonalAvailability);
export const BundlePricingSchema = SchemaFactory.createForClass(BundlePricing);
export const GiftSettingsSchema = SchemaFactory.createForClass(GiftSettings);
export const BundleSchema = SchemaFactory.createForClass(Bundle);

// Pre-save middleware to calculate pricing
BundleSchema.pre('save', function (next) {
  // Calculate discounted price if discount percentage is provided
  if (this.pricing.discountPercentage > 0) {
    this.pricing.discountedPrice = this.pricing.basePrice * (1 - this.pricing.discountPercentage / 100);
  } else {
    this.pricing.discountedPrice = this.pricing.basePrice;
  }
  
  // Update seasonal availability status
  if (this.seasonalAvailability) {
    const now = new Date();
    this.seasonalAvailability.isCurrentlyActive = 
      now >= this.seasonalAvailability.startDate && 
      now <= this.seasonalAvailability.endDate;
  }
  
  next();
});

// Add indexes for better query performance
BundleSchema.index({ type: 1 });
BundleSchema.index({ status: 1 });
BundleSchema.index({ availableCities: 1 });
BundleSchema.index({ 'seasonalAvailability.seasonalType': 1 });
BundleSchema.index({ 'seasonalAvailability.isCurrentlyActive': 1 });
BundleSchema.index({ createdBy: 1 });
BundleSchema.index({ name: 'text', description: 'text', tags: 'text' });
BundleSchema.index({ createdAt: -1 });
BundleSchema.index({ purchaseCount: -1 });
