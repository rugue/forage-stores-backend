import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, IsEnum, IsDateString, Min, Max } from 'class-validator';
import { CommissionType, CommissionStatus } from '../entities/commission.entity';

export class CreateCommissionDto {
  @ApiProperty({ description: 'User ID who earned the commission' })
  @IsString()
  userId: string;

  @ApiProperty({ description: 'Order ID (optional)', required: false })
  @IsOptional()
  @IsString()
  orderId?: string;

  @ApiProperty({ description: 'Referred user ID (optional)', required: false })
  @IsOptional()
  @IsString()
  referredUserId?: string;

  @ApiProperty({ description: 'Commission amount in Nibia', minimum: 0 })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({ description: 'Commission type', enum: CommissionType })
  @IsEnum(CommissionType)
  type: CommissionType;

  @ApiProperty({ description: 'Commission rate percentage', minimum: 0, maximum: 100 })
  @IsNumber()
  @Min(0)
  @Max(100)
  rate: number;

  @ApiProperty({ description: 'Order amount (optional)', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  orderAmount?: number;

  @ApiProperty({ description: 'City where commission was earned' })
  @IsString()
  city: string;
}

export class CommissionQueryDto {
  @ApiProperty({ description: 'Commission type filter', enum: CommissionType, required: false })
  @IsOptional()
  @IsEnum(CommissionType)
  type?: CommissionType;

  @ApiProperty({ description: 'Commission status filter', enum: CommissionStatus, required: false })
  @IsOptional()
  @IsEnum(CommissionStatus)
  status?: CommissionStatus;

  @ApiProperty({ description: 'Start date filter', required: false })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ description: 'End date filter', required: false })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({ description: 'City filter', required: false })
  @IsOptional()
  @IsString()
  city?: string;
}

export class GrowthQualificationDto {
  @ApiProperty({ description: 'User ID to check qualification for' })
  @IsString()
  userId: string;
}

export class PromoteUserDto {
  @ApiProperty({ description: 'User ID to promote' })
  @IsString()
  userId: string;

  @ApiProperty({ description: 'Reason for promotion', required: false })
  @IsOptional()
  @IsString()
  reason?: string;
}
