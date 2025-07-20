import { ApiProperty } from '@nestjs/swagger';
import { 
  IsString, 
  IsNotEmpty, 
  IsOptional, 
  IsEnum,
  IsMongoId,
  IsNumber,
  Min,
  Max,
  IsBoolean,
} from 'class-validator';

// Define enums directly in the DTO file to avoid circular dependencies
export enum CommissionType {
  FOOD_MONEY = 'food_money',
  FOOD_POINTS = 'food_points',
}

export enum ReferralStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  COMPLETED = 'completed',
}

export class CreateReferralDto {
  @ApiProperty({
    description: 'Referral code used',
    required: false,
  })
  @IsString()
  @IsOptional()
  referralCode?: string;

  @ApiProperty({
    description: 'Referrer user ID (who referred)',
    required: false,
  })
  @IsMongoId()
  @IsOptional()
  referrerId?: string;

  @ApiProperty({
    description: 'Referred user ID (who was referred)',
    required: true,
  })
  @IsMongoId()
  @IsNotEmpty()
  referredUserId: string;
}

export class ProcessCommissionDto {
  @ApiProperty({
    description: 'Order ID that generated the commission',
    required: true,
  })
  @IsMongoId()
  @IsNotEmpty()
  orderId: string;

  @ApiProperty({
    description: 'Amount of the order',
    required: true,
  })
  @IsNumber()
  @Min(0)
  orderAmount: number;

  @ApiProperty({
    description: 'Type of commission (food money or food points)',
    required: true,
    enum: CommissionType,
  })
  @IsEnum(CommissionType)
  @IsNotEmpty()
  commissionType: CommissionType;

  @ApiProperty({
    description: 'Commission percentage to apply',
    required: false,
    default: 5,
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  commissionPercentage?: number;
}

export class ReferralFilterDto {
  @ApiProperty({
    description: 'Referrer user ID',
    required: false,
  })
  @IsMongoId()
  @IsOptional()
  referrerId?: string;

  @ApiProperty({
    description: 'Referred user ID',
    required: false,
  })
  @IsMongoId()
  @IsOptional()
  referredUserId?: string;

  @ApiProperty({
    description: 'Referral status',
    required: false,
    enum: ReferralStatus,
  })
  @IsEnum(ReferralStatus)
  @IsOptional()
  status?: ReferralStatus;

  @ApiProperty({
    description: 'Is commission completed',
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isCommissionCompleted?: boolean;
}

export class UpdateReferralDto {
  @ApiProperty({
    description: 'Referral status',
    required: false,
    enum: ReferralStatus,
  })
  @IsEnum(ReferralStatus)
  @IsOptional()
  status?: ReferralStatus;

  @ApiProperty({
    description: 'Is commission completed',
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isCommissionCompleted?: boolean;
}
