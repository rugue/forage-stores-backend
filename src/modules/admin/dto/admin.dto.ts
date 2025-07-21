import { IsString, IsEmail, IsEnum, IsOptional, IsNumber, Min, IsBoolean, IsArray, ValidateNested, IsDate, IsMongoId, IsNotEmpty, IsObject, MinLength, Matches, ArrayUnique } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { AdminRole, AdminPermission } from '../interfaces/admin.interface';
import { ADMIN_VALIDATION } from '../constants/admin.constants';

// ====== ADMIN AUTHENTICATION & MANAGEMENT DTOs ======

/**
 * Admin login DTO
 */
export class AdminLoginDto {
  @ApiProperty({ 
    description: 'Admin email address',
    example: 'admin@forage.com'
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty()
  email: string;

  @ApiProperty({ 
    description: 'Admin password',
    example: 'SecurePassword123!'
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}

/**
 * Create admin DTO
 */
export class CreateAdminDto {
  @ApiProperty({ 
    description: 'Admin email address',
    example: 'admin@forage.com'
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty()
  email: string;

  @ApiProperty({ 
    description: 'Admin full name',
    example: 'John Admin'
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(ADMIN_VALIDATION.NAME_MIN_LENGTH)
  name: string;

  @ApiProperty({ 
    description: 'Admin password',
    example: 'SecurePassword123!'
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @Matches(ADMIN_VALIDATION.PASSWORD_REGEX, {
    message: 'Password must contain at least 8 characters with uppercase, lowercase, number and special character'
  })
  password: string;

  @ApiProperty({ 
    description: 'Admin role',
    enum: AdminRole,
    example: AdminRole.ADMIN
  })
  @IsEnum(AdminRole)
  role: AdminRole;

  @ApiProperty({ 
    description: 'Admin permissions',
    enum: AdminPermission,
    isArray: true,
    example: [AdminPermission.VIEW_USERS, AdminPermission.EDIT_USERS]
  })
  @IsArray()
  @IsEnum(AdminPermission, { each: true })
  @ArrayUnique()
  permissions: AdminPermission[];

  @ApiPropertyOptional({ 
    description: 'Admin active status',
    default: true
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

/**
 * Update admin DTO
 */
export class UpdateAdminDto extends PartialType(CreateAdminDto) {
  @ApiPropertyOptional({ 
    description: 'Admin full name',
    example: 'John Updated Admin'
  })
  @IsOptional()
  @IsString()
  @MinLength(ADMIN_VALIDATION.NAME_MIN_LENGTH)
  name?: string;

  @ApiPropertyOptional({ 
    description: 'Admin role',
    enum: AdminRole
  })
  @IsOptional()
  @IsEnum(AdminRole)
  role?: AdminRole;

  @ApiPropertyOptional({ 
    description: 'Admin permissions',
    enum: AdminPermission,
    isArray: true
  })
  @IsOptional()
  @IsArray()
  @IsEnum(AdminPermission, { each: true })
  @ArrayUnique()
  permissions?: AdminPermission[];

  @ApiPropertyOptional({ 
    description: 'Admin active status'
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

/**
 * Change admin password DTO
 */
export class ChangeAdminPasswordDto {
  @ApiProperty({ 
    description: 'Current password',
    example: 'OldPassword123!'
  })
  @IsString()
  @IsNotEmpty()
  currentPassword: string;

  @ApiProperty({ 
    description: 'New password',
    example: 'NewSecurePassword123!'
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @Matches(ADMIN_VALIDATION.PASSWORD_REGEX, {
    message: 'Password must contain at least 8 characters with uppercase, lowercase, number and special character'
  })
  newPassword: string;
}

/**
 * Admin query filters DTO
 */
export class AdminQueryDto {
  @ApiPropertyOptional({ 
    description: 'Filter by admin role',
    enum: AdminRole
  })
  @IsOptional()
  @IsEnum(AdminRole)
  role?: AdminRole;

  @ApiPropertyOptional({ 
    description: 'Filter by active status'
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isActive?: boolean;

  @ApiPropertyOptional({ 
    description: 'Search by name or email'
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ 
    description: 'Filter by permissions',
    enum: AdminPermission,
    isArray: true
  })
  @IsOptional()
  @IsArray()
  @IsEnum(AdminPermission, { each: true })
  permissions?: AdminPermission[];

  @ApiPropertyOptional({ 
    description: 'Page number',
    default: 1,
    minimum: 1
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({ 
    description: 'Number of items per page',
    default: 20,
    minimum: 1,
    maximum: 100
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  limit?: number;
}

// ====== WALLET MANAGEMENT DTOs ======

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
