import {
  IsBoolean,
  IsOptional,
  IsNumber,
  IsString,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ProcessDropDto {
  @ApiProperty({
    description: 'Whether to manually mark the drop as paid',
    example: true,
    required: false
  })
  @IsOptional()
  @IsBoolean()
  markAsPaid?: boolean;
  
  @ApiProperty({
    description: 'Optional transaction reference',
    example: 'txn_123456789',
    required: false
  })
  @IsOptional()
  @IsString()
  transactionRef?: string;
  
  @ApiProperty({
    description: 'Custom amount for this drop (overrides the default drop amount)',
    example: 5000,
    required: false
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;
}
