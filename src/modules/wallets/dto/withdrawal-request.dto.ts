import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  Min,
  Max,
  IsString,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { WithdrawalStatus } from '../entities/withdrawal-request.entity';

export class CreateWithdrawalRequestDto {
  @ApiProperty({
    description: 'Nibia amount to withdraw',
    example: 1000.0,
    minimum: 1,
    maximum: 100000,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1, { message: 'Minimum withdrawal amount is 1 Nibia' })
  @Max(100000, { message: 'Maximum withdrawal amount is 100,000 Nibia per request' })
  @IsNotEmpty()
  nibiaAmount: number;

  @ApiProperty({
    description: 'Optional reason for withdrawal',
    example: 'Emergency cash needed',
    required: false,
  })
  @IsString()
  @IsOptional()
  userReason?: string;
}

export class ProcessWithdrawalRequestDto {
  @ApiProperty({
    description: 'Action to take on withdrawal request',
    enum: [WithdrawalStatus.APPROVED, WithdrawalStatus.REJECTED],
    example: WithdrawalStatus.APPROVED,
  })
  @IsEnum([WithdrawalStatus.APPROVED, WithdrawalStatus.REJECTED])
  @IsNotEmpty()
  action: WithdrawalStatus.APPROVED | WithdrawalStatus.REJECTED;

  @ApiProperty({
    description: 'Admin notes for the action',
    example: 'User verified, withdrawal approved',
    required: false,
  })
  @IsString()
  @IsOptional()
  adminNotes?: string;

  @ApiProperty({
    description: 'Admin password for security',
    example: 'admin_password_123',
  })
  @IsString()
  @IsNotEmpty()
  adminPassword: string;
}

export class GetWithdrawalRequestsDto {
  @ApiProperty({
    description: 'Filter by status',
    enum: WithdrawalStatus,
    required: false,
  })
  @IsEnum(WithdrawalStatus)
  @IsOptional()
  status?: WithdrawalStatus;

  @ApiProperty({
    description: 'Page number',
    example: 1,
    minimum: 1,
    required: false,
  })
  @IsNumber()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiProperty({
    description: 'Items per page',
    example: 20,
    minimum: 1,
    maximum: 100,
    required: false,
  })
  @IsNumber()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number = 20;

  @ApiProperty({
    description: 'User ID to filter by (admin only)',
    required: false,
  })
  @IsString()
  @IsOptional()
  userId?: string;
}

export class WithdrawalStatsDto {
  @ApiProperty({ description: 'Total pending requests' })
  totalPending: number;

  @ApiProperty({ description: 'Total approved requests' })
  totalApproved: number;

  @ApiProperty({ description: 'Total rejected requests' })
  totalRejected: number;

  @ApiProperty({ description: 'Total completed requests' })
  totalCompleted: number;

  @ApiProperty({ description: 'Total Nibia amount pending withdrawal' })
  totalNibiaPending: number;

  @ApiProperty({ description: 'Total NGN amount pending' })
  totalNgnPending: number;

  @ApiProperty({ description: 'Total Nibia withdrawn (completed)' })
  totalNibiaWithdrawn: number;

  @ApiProperty({ description: 'Total NGN disbursed' })
  totalNgnDisbursed: number;

  @ApiProperty({ description: 'Average processing time in hours' })
  avgProcessingTimeHours: number;
}
