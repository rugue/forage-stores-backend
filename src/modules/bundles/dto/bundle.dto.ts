import {
  IsString,
  IsNotEmpty,
  IsNumber,
  Min,
  Max,
  IsOptional,
  IsArray,
  IsEnum,
  IsBoolean,
  ValidateNested,
  IsDateString,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';
import { 
  BundleType, 
  BundleStatus, 
  SeasonalType,
  BundleProduct,
  BundlePricing,
  SeasonalAvailability,
  GiftSettings,
} from '../entities/bundle.entity';
import {
  RecipientInfo,
  GiftMessage,
} from '../entities/bundle-order.entity';

export class CreateBundleProductDto {
  @ApiProperty({ description: 'Product ID' })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ description: 'Quantity of this product in the bundle' })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty({ description: 'Whether this product is required in the bundle' })
  @IsOptional()
  @IsBoolean()
  isRequired?: boolean = true;

  @ApiProperty({ description: 'Alternative product IDs that can substitute this item' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  alternatives?: string[];
}

export class CreateBundlePricingDto {
  @ApiProperty({ description: 'Bundle base price in NGN' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  basePrice: number;

  @ApiProperty({ description: 'Discount percentage applied to bundle' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  discountPercentage?: number = 0;
}

export class CreateSeasonalAvailabilityDto {
  @ApiProperty({ description: 'Seasonal type', enum: SeasonalType })
  @IsEnum(SeasonalType)
  seasonalType: SeasonalType;

  @ApiProperty({ description: 'Start date for seasonal availability' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ description: 'End date for seasonal availability' })
  @IsDateString()
  endDate: string;

  @ApiProperty({ description: 'Year for this seasonal period' })
  @IsNumber()
  year: number;
}

export class CreateGiftSettingsDto {
  @ApiProperty({ description: 'Whether this bundle can be sent as a gift' })
  @IsOptional()
  @IsBoolean()
  canBeGifted?: boolean = false;

  @ApiProperty({ description: 'Custom gift message template' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  giftMessageTemplate?: string;

  @ApiProperty({ description: 'Whether gift wrapping is available' })
  @IsOptional()
  @IsBoolean()
  giftWrappingAvailable?: boolean = false;

  @ApiProperty({ description: 'Gift wrapping fee in NGN' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  giftWrappingFee?: number;
}

export class CreateBundleDto {
  @ApiProperty({ description: 'Bundle name', example: 'Family Restock Bundle' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Bundle description' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ description: 'Bundle type', enum: BundleType })
  @IsEnum(BundleType)
  type: BundleType;

  @ApiProperty({ description: 'Products included in this bundle', type: [CreateBundleProductDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateBundleProductDto)
  products: CreateBundleProductDto[];

  @ApiProperty({ description: 'Bundle pricing information', type: CreateBundlePricingDto })
  @ValidateNested()
  @Type(() => CreateBundlePricingDto)
  pricing: CreateBundlePricingDto;

  @ApiProperty({ description: 'Seasonal availability settings', type: CreateSeasonalAvailabilityDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateSeasonalAvailabilityDto)
  seasonalAvailability?: CreateSeasonalAvailabilityDto;

  @ApiProperty({ description: 'Gift settings for this bundle', type: CreateGiftSettingsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateGiftSettingsDto)
  giftSettings?: CreateGiftSettingsDto;

  @ApiProperty({ description: 'Cities where this bundle is available' })
  @IsArray()
  @IsString({ each: true })
  availableCities: string[];

  @ApiProperty({ description: 'Bundle tags for search and filtering' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiProperty({ description: 'Maximum number of this bundle that can be ordered per customer' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxOrderQuantity?: number;

  @ApiProperty({ description: 'Minimum customer order history required to purchase this bundle' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minOrderHistory?: number = 0;

  @ApiProperty({ description: 'Bundle availability start date' })
  @IsOptional()
  @IsDateString()
  availableFrom?: string;

  @ApiProperty({ description: 'Bundle availability end date' })
  @IsOptional()
  @IsDateString()
  availableUntil?: string;
}

export class UpdateBundleDto {
  @ApiProperty({ description: 'Bundle name' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @ApiProperty({ description: 'Bundle description' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  description?: string;

  @ApiProperty({ description: 'Bundle status', enum: BundleStatus })
  @IsOptional()
  @IsEnum(BundleStatus)
  status?: BundleStatus;

  @ApiProperty({ description: 'Products included in this bundle', type: [CreateBundleProductDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateBundleProductDto)
  products?: CreateBundleProductDto[];

  @ApiProperty({ description: 'Bundle pricing information', type: CreateBundlePricingDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateBundlePricingDto)
  pricing?: CreateBundlePricingDto;

  @ApiProperty({ description: 'Cities where this bundle is available' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  availableCities?: string[];

  @ApiProperty({ description: 'Bundle tags for search and filtering' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiProperty({ description: 'Bundle availability start date' })
  @IsOptional()
  @IsDateString()
  availableFrom?: string;

  @ApiProperty({ description: 'Bundle availability end date' })
  @IsOptional()
  @IsDateString()
  availableUntil?: string;
}

export class BundleFilterDto {
  @ApiPropertyOptional({ description: 'Filter by bundle type', enum: BundleType })
  @IsOptional()
  @IsEnum(BundleType)
  bundleType?: BundleType;

  @ApiPropertyOptional({ description: 'Filter by bundle status', enum: BundleStatus })
  @IsOptional()
  @IsEnum(BundleStatus)
  status?: BundleStatus;

  @ApiPropertyOptional({ description: 'Filter by seasonal type', enum: SeasonalType })
  @IsOptional()
  @IsEnum(SeasonalType)
  seasonalType?: SeasonalType;

  @ApiPropertyOptional({ description: 'Filter by active status' })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Filter by seasonal active status' })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  isSeasonallyActive?: boolean;

  @ApiPropertyOptional({ description: 'Filter by minimum price' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => parseFloat(value))
  minPrice?: number;

  @ApiPropertyOptional({ description: 'Filter by maximum price' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => parseFloat(value))
  maxPrice?: number;

  @ApiPropertyOptional({ description: 'Filter by city availability' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ description: 'Search query for bundle names and descriptions' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Sort field', enum: ['name', 'price', 'createdAt', 'purchaseCount'] })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({ description: 'Sort order', enum: ['asc', 'desc'] })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';

  @ApiPropertyOptional({ description: 'Page number for pagination', minimum: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Transform(({ value }) => parseInt(value))
  page?: number;

  @ApiPropertyOptional({ description: 'Number of items per page', minimum: 1, maximum: 100 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Transform(({ value }) => parseInt(value))
  limit?: number;
}

export class BulkSeasonalControlDto {
  @ApiProperty({ description: 'Seasonal type to control', enum: SeasonalType })
  @IsEnum(SeasonalType)
  seasonalType: SeasonalType;

  @ApiProperty({ description: 'Year to control bundles for' })
  @IsNumber()
  @Min(2020)
  year: number;

  @ApiProperty({ description: 'Whether to activate or deactivate bundles' })
  @IsBoolean()
  activate: boolean;
}

export class CreateRecipientInfoDto {
  @ApiProperty({ description: 'Recipient full name' })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({ description: 'Recipient phone number' })
  @IsString()
  @IsNotEmpty()
  phoneNumber: string;

  @ApiProperty({ description: 'Recipient email address' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiProperty({ description: 'Delivery address for the recipient' })
  @IsString()
  @IsNotEmpty()
  deliveryAddress: string;

  @ApiProperty({ description: 'City for delivery' })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({ description: 'State for delivery' })
  @IsOptional()
  @IsString()
  state?: string;
}

export class CreateGiftMessageDto {
  @ApiProperty({ description: 'Personal message from sender to recipient' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  message?: string;

  @ApiProperty({ description: 'Sender name to display in gift message' })
  @IsString()
  @IsNotEmpty()
  senderName: string;

  @ApiProperty({ description: 'Whether to include sender contact information' })
  @IsOptional()
  @IsBoolean()
  includeSenderContact?: boolean = false;

  @ApiProperty({ description: 'Occasion for the gift' })
  @IsOptional()
  @IsString()
  occasion?: string;
}

export class OrderBundleDto {
  @ApiProperty({ description: 'Bundle ID' })
  @IsString()
  @IsNotEmpty()
  bundleId: string;

  @ApiProperty({ description: 'Quantity of bundles to order' })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty({ description: 'Whether this is a gift order' })
  @IsOptional()
  @IsBoolean()
  isGift?: boolean = false;

  @ApiProperty({ description: 'Recipient information for gift orders', type: CreateRecipientInfoDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateRecipientInfoDto)
  recipientInfo?: CreateRecipientInfoDto;

  @ApiProperty({ description: 'Gift message details', type: CreateGiftMessageDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateGiftMessageDto)
  giftMessage?: CreateGiftMessageDto;

  @ApiProperty({ description: 'Whether to include gift wrapping' })
  @IsOptional()
  @IsBoolean()
  includeGiftWrapping?: boolean = false;

  @ApiProperty({ description: 'Special instructions for the bundle order' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  specialInstructions?: string;
}

export class BundleAnalyticsDto {
  @ApiProperty({ description: 'Start date for analytics period' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ description: 'End date for analytics period' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({ description: 'Bundle type to analyze', enum: BundleType })
  @IsOptional()
  @IsEnum(BundleType)
  bundleType?: BundleType;

  @ApiProperty({ description: 'City to analyze' })
  @IsOptional()
  @IsString()
  city?: string;
}

export class SeasonalControlDto {
  @ApiProperty({ description: 'Seasonal type to activate/deactivate', enum: SeasonalType })
  @IsEnum(SeasonalType)
  seasonalType: SeasonalType;

  @ApiProperty({ description: 'Year for seasonal control' })
  @IsNumber()
  year: number;

  @ApiProperty({ description: 'Whether to activate or deactivate seasonal bundles' })
  @IsBoolean()
  activate: boolean;
}
