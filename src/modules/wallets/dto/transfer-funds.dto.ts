import {
  IsNumber,
  IsString,
  IsNotEmpty,
  IsOptional,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TransferFundsDto {
  @ApiProperty({
    description: 'User ID to transfer funds to',
    example: '60f1b2b3b3b3b3b3b3b3b3b3',
  })
  @IsString()
  @IsNotEmpty()
  toUserId: string;

  @ApiProperty({
    description: 'Amount to transfer',
    example: 50.00,
    minimum: 0.01,
    maximum: 50000,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01, { message: 'Transfer amount must be at least 0.01' })
  @Max(50000, { message: 'Transfer amount cannot exceed 50,000' })
  amount: number;

  @ApiProperty({
    description: 'Description of the transfer',
    example: 'Food money transfer to friend',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;
}
