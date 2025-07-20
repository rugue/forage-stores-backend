import {
  IsNumber,
  IsString,
  IsNotEmpty,
  IsOptional,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LockFundsDto {
  @ApiProperty({
    description: 'Amount to lock in food safe',
    example: 200.00,
    minimum: 0.01,
    maximum: 100000,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01, { message: 'Lock amount must be at least 0.01' })
  @Max(100000, { message: 'Lock amount cannot exceed 100,000' })
  amount: number;

  @ApiProperty({
    description: 'Reason for locking funds',
    example: 'Saving for emergency food expenses',
    required: false,
  })
  @IsString()
  @IsOptional()
  reason?: string;
}

export class UnlockFundsDto {
  @ApiProperty({
    description: 'Amount to unlock from food safe',
    example: 100.00,
    minimum: 0.01,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01, { message: 'Unlock amount must be at least 0.01' })
  amount: number;

  @ApiProperty({
    description: 'Reason for unlocking funds',
    example: 'Emergency food purchase',
    required: false,
  })
  @IsString()
  @IsOptional()
  reason?: string;
}
