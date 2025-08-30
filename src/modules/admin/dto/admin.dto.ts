import { IsString, IsEmail, IsEnum, IsOptional, IsNumber, Min, Max, IsBoolean, IsArray, ValidateNested, IsDate, IsMongoId, IsNotEmpty, IsObject, MinLength, Matches, ArrayUnique } from 'class-validator';
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
  @ApiPropertyOptional({ description: 'Start date for the filter' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  startDate?: Date;

  @ApiPropertyOptional({ description: 'End date for the filter' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  endDate?: Date;
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

// ====== GA/GE MANAGEMENT DTOs ======

/**
 * Get GA/GE users by city DTO
 */
export class GetGrowthUsersByCityDto {
  @ApiProperty({ 
    description: 'City name to filter users',
    example: 'Lagos'
  })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiPropertyOptional({ 
    description: 'User role filter',
    enum: ['growth_associate', 'growth_elite'],
    example: 'growth_elite'
  })
  @IsOptional()
  @IsEnum(['growth_associate', 'growth_elite'])
  role?: string;

  @ApiPropertyOptional({ 
    description: 'Page number for pagination',
    example: 1
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ 
    description: 'Number of items per page',
    example: 20
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

/**
 * Growth user stats response DTO
 */
export class GrowthUserStatsDto {
  @ApiProperty({ description: 'User ID' })
  userId: string;

  @ApiProperty({ description: 'User name' })
  name: string;

  @ApiProperty({ description: 'User email' })
  email: string;

  @ApiProperty({ description: 'User role' })
  role: string;

  @ApiProperty({ description: 'City' })
  city: string;

  @ApiProperty({ description: 'Number of direct referrals' })
  directReferralCount: number;

  @ApiProperty({ description: 'Total referred users spend (NGN)' })
  totalReferredSpend: number;

  @ApiProperty({ description: 'Total commission earned (Nibia)' })
  totalCommissionEarned: number;

  @ApiProperty({ description: 'Active referrals this month' })
  activeReferralsThisMonth: number;

  @ApiProperty({ description: 'Join date' })
  joinDate: Date;

  @ApiProperty({ description: 'Last activity date' })
  lastActivity: Date;
}

// ====== NIBIA WITHDRAWAL MANAGEMENT DTOs ======

/**
 * Admin withdrawal decision DTO
 */
export class AdminWithdrawalDecisionDto {
  @ApiProperty({ 
    description: 'Admin password for verification',
    example: 'SecurePassword123!'
  })
  @IsString()
  @IsNotEmpty()
  adminPassword: string;

  @ApiProperty({ 
    description: 'Decision action',
    enum: ['approve', 'reject'],
    example: 'approve'
  })
  @IsEnum(['approve', 'reject'])
  action: 'approve' | 'reject';

  @ApiPropertyOptional({ 
    description: 'Admin notes for the decision',
    example: 'Approved after verification of GA status'
  })
  @IsOptional()
  @IsString()
  adminNotes?: string;

  @ApiPropertyOptional({ 
    description: 'Processing priority (1-5, 1 highest)',
    example: 2
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(5)
  priority?: number;
}

/**
 * Bulk withdrawal processing DTO
 */
export class BulkWithdrawalProcessingDto {
  @ApiProperty({ 
    description: 'Admin password for verification',
    example: 'SecurePassword123!'
  })
  @IsString()
  @IsNotEmpty()
  adminPassword: string;

  @ApiProperty({ 
    description: 'Array of withdrawal request IDs to process',
    example: ['64a7b12c8f9e4d5a6b7c8901', '64a7b12c8f9e4d5a6b7c8902']
  })
  @IsArray()
  @ArrayUnique()
  @IsMongoId({ each: true })
  withdrawalIds: string[];

  @ApiProperty({ 
    description: 'Bulk action to perform',
    enum: ['approve', 'reject'],
    example: 'approve'
  })
  @IsEnum(['approve', 'reject'])
  action: 'approve' | 'reject';

  @ApiPropertyOptional({ 
    description: 'Bulk processing notes',
    example: 'Batch processed after verification'
  })
  @IsOptional()
  @IsString()
  bulkNotes?: string;
}

// ====== REFERRAL COMMISSION OVERRIDE DTOs ======

/**
 * Override referral commission DTO
 */
export class OverrideReferralCommissionDto {
  @ApiProperty({ 
    description: 'Admin password for verification',
    example: 'SecurePassword123!'
  })
  @IsString()
  @IsNotEmpty()
  adminPassword: string;

  @ApiProperty({ 
    description: 'Referral ID to override',
    example: '64a7b12c8f9e4d5a6b7c8901'
  })
  @IsMongoId()
  referralId: string;

  @ApiProperty({ 
    description: 'New commission amount (Nibia)',
    example: 5000
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  newCommissionAmount: number;

  @ApiProperty({ 
    description: 'Override type',
    enum: ['bonus', 'penalty', 'adjustment'],
    example: 'bonus'
  })
  @IsEnum(['bonus', 'penalty', 'adjustment'])
  overrideType: 'bonus' | 'penalty' | 'adjustment';

  @ApiProperty({ 
    description: 'Reason for override',
    example: 'Performance bonus for exceptional referral quality'
  })
  @IsString()
  @IsNotEmpty()
  reason: string;

  @ApiPropertyOptional({ 
    description: 'Additional admin notes',
    example: 'Applied after quarterly review'
  })
  @IsOptional()
  @IsString()
  adminNotes?: string;
}

/**
 * Commission override history DTO
 */
export class CommissionOverrideHistoryDto {
  @ApiPropertyOptional({ 
    description: 'Filter by user ID',
    example: '64a7b12c8f9e4d5a6b7c8901'
  })
  @IsOptional()
  @IsMongoId()
  userId?: string;

  @ApiPropertyOptional({ 
    description: 'Filter by override type',
    enum: ['bonus', 'penalty', 'adjustment']
  })
  @IsOptional()
  @IsEnum(['bonus', 'penalty', 'adjustment'])
  overrideType?: string;

  @ApiPropertyOptional({ 
    description: 'Start date filter (ISO string)',
    example: '2025-08-01T00:00:00.000Z'
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startDate?: Date;

  @ApiPropertyOptional({ 
    description: 'End date filter (ISO string)',
    example: '2025-08-31T23:59:59.999Z'
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endDate?: Date;
}

// ====== PROFIT POOL MANAGEMENT DTOs ======

/**
 * Profit pool adjustment DTO
 */
export class ProfitPoolAdjustmentDto {
  @ApiProperty({ 
    description: 'Admin password for verification',
    example: 'SecurePassword123!'
  })
  @IsString()
  @IsNotEmpty()
  adminPassword: string;

  @ApiProperty({ 
    description: 'Profit pool ID to adjust',
    example: '64a7b12c8f9e4d5a6b7c8901'
  })
  @IsMongoId()
  poolId: string;

  @ApiProperty({ 
    description: 'Adjustment type',
    enum: ['increase', 'decrease', 'redistribute'],
    example: 'increase'
  })
  @IsEnum(['increase', 'decrease', 'redistribute'])
  adjustmentType: 'increase' | 'decrease' | 'redistribute';

  @ApiPropertyOptional({ 
    description: 'Adjustment amount (Nibia) - required for increase/decrease',
    example: 10000
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  adjustmentAmount?: number;

  @ApiProperty({ 
    description: 'Reason for adjustment',
    example: 'Correction for calculation error in revenue data'
  })
  @IsString()
  @IsNotEmpty()
  reason: string;

  @ApiPropertyOptional({ 
    description: 'Whether to notify affected users',
    example: true
  })
  @IsOptional()
  @IsBoolean()
  notifyUsers?: boolean = true;
}

/**
 * Monthly profit pool report DTO
 */
export class MonthlyProfitPoolReportDto {
  @ApiProperty({ 
    description: 'Month in YYYY-MM format',
    example: '2025-08'
  })
  @IsString()
  @Matches(/^\d{4}-\d{2}$/, { message: 'Month must be in YYYY-MM format' })
  month: string;

  @ApiPropertyOptional({ 
    description: 'City filter (optional)',
    example: 'Lagos'
  })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ 
    description: 'Include detailed distribution breakdown',
    example: true
  })
  @IsOptional()
  @IsBoolean()
  includeDetails?: boolean = false;
}
