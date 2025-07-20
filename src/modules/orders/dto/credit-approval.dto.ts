import {
  IsString,
  IsNotEmpty,
  IsNumber,
  Min,
  IsOptional,
  IsEnum,
  IsBoolean,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CreditStatus } from '../../../entities/order.entity';

export class CreditApprovalDto {
  @ApiProperty({ 
    description: 'Whether to approve the credit check',
    example: true 
  })
  @IsBoolean()
  approve: boolean;

  @ApiProperty({ 
    description: 'Credit score (only needed for approval)',
    example: 750,
    required: false 
  })
  @IsOptional()
  @IsNumber()
  @Min(300)
  score?: number;

  @ApiProperty({ 
    description: 'Approved credit limit (only needed for approval)',
    example: 50000,
    required: false 
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  approvedLimit?: number;

  @ApiProperty({ 
    description: 'Notes on the credit decision',
    example: 'Customer has good payment history',
    required: false 
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
