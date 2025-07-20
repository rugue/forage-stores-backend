import { IsString, IsEmail, IsEnum, IsOptional, IsNumber, Min, IsBoolean, IsArray, ValidateNested, IsDate, IsMongoId, IsNotEmpty, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AdminWalletFundDto {
  @ApiProperty({ description: 'User ID whose wallet will be funded' })
  @IsMongoId()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ description: 'Amount to fund wallet with' })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({ description: 'Currency type (foodMoney or foodPoints)' })
  @IsString()
  @IsEnum(['foodMoney', 'foodPoints'])
  currencyType: string;

  @ApiProperty({ description: 'Admin password for verification' })
  @IsString()
  @IsNotEmpty()
  adminPassword: string;

  @ApiProperty({ description: 'Reason for the transaction' })
  @IsString()
  @IsNotEmpty()
  reason: string;
}

export class AdminWalletWipeDto {
  @ApiProperty({ description: 'User ID whose wallet will be wiped' })
  @IsMongoId()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ description: 'Currency type (foodMoney, foodPoints, or both)' })
  @IsString()
  @IsEnum(['foodMoney', 'foodPoints', 'both'])
  currencyType: string;

  @ApiProperty({ description: 'Admin password for verification' })
  @IsString()
  @IsNotEmpty()
  adminPassword: string;

  @ApiProperty({ description: 'Reason for the action' })
  @IsString()
  @IsNotEmpty()
  reason: string;
}

export class CreateCategoryDto {
  @ApiProperty({ description: 'Category name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Category description' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ description: 'Category icon or image URL', required: false })
  @IsString()
  @IsOptional()
  iconUrl?: string;

  @ApiProperty({ description: 'Parent category ID', required: false })
  @IsMongoId()
  @IsOptional()
  parentCategoryId?: string;
}

export class UpdateCategoryDto {
  @ApiProperty({ description: 'Category name', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ description: 'Category description', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Category icon or image URL', required: false })
  @IsString()
  @IsOptional()
  iconUrl?: string;

  @ApiProperty({ description: 'Parent category ID', required: false })
  @IsMongoId()
  @IsOptional()
  parentCategoryId?: string;

  @ApiProperty({ description: 'Category active status', required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class DateRangeDto {
  @ApiProperty({ description: 'Start date for the filter' })
  @IsDate()
  @Type(() => Date)
  startDate: Date;

  @ApiProperty({ description: 'End date for the filter' })
  @IsDate()
  @Type(() => Date)
  endDate: Date;
}

export class PriceHistoryDto {
  @ApiProperty({ description: 'Product ID' })
  @IsMongoId()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ description: 'New price' })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ description: 'Effective date of the new price' })
  @IsDate()
  @Type(() => Date)
  effectiveDate: Date;

  @ApiProperty({ description: 'Reason for price change' })
  @IsString()
  @IsNotEmpty()
  reason: string;
}

export class AnalyticsFilterDto {
  @ApiPropertyOptional({ description: 'Filter by date range' })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => DateRangeDto)
  dateRange?: DateRangeDto;

  @ApiPropertyOptional({ description: 'Filter by product category' })
  @IsOptional()
  @IsMongoId()
  categoryId?: string;

  @ApiPropertyOptional({ description: 'Filter by product ID' })
  @IsOptional()
  @IsMongoId()
  productId?: string;

  @ApiPropertyOptional({ description: 'Filter by city' })
  @IsOptional()
  @IsString()
  city?: string;
}
