import {
  IsString,
  IsNotEmpty,
  IsNumber,
  Min,
  IsOptional,
  IsEnum,
  IsDateString,
  ValidateNested,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { PaymentFrequency, PaymentPlan } from '../../orders/entities/order.entity';

export class PayNowPlanDto {
  // No additional fields needed for Pay Now
}

export class PriceLockPlanDto {
  @ApiProperty({ 
    description: 'Desired delivery date (must be 30-45 days in the future)',
    example: '2025-09-05T00:00:00.000Z'
  })
  @IsDateString()
  @IsNotEmpty()
  preferredDeliveryDate: string;
}

export class PaySmallSmallPlanDto {
  @ApiProperty({ 
    description: 'Payment frequency', 
    enum: PaymentFrequency,
    example: PaymentFrequency.MONTHLY 
  })
  @IsEnum(PaymentFrequency)
  frequency: PaymentFrequency;

  @ApiProperty({ 
    description: 'Total number of installments',
    minimum: 2,
    example: 3
  })
  @IsNumber()
  @Min(2)
  totalInstallments: number;
}

export class PayLaterPlanDto {
  @ApiProperty({ 
    description: 'Customer\'s monthly income',
    minimum: 0,
    example: 150000
  })
  @IsNumber()
  @Min(0)
  monthlyIncome: number;

  @ApiProperty({ 
    description: 'Employment status',
    example: 'Full-time'
  })
  @IsString()
  @IsNotEmpty()
  employmentStatus: string;

  @ApiProperty({ 
    description: 'Bank Verification Number (BVN) - required for credit check',
    example: '12345678901'
  })
  @IsString()
  @MinLength(11)
  bvn: string;

  @ApiProperty({ 
    description: 'Additional information for credit check',
    required: false
  })
  @IsOptional()
  @IsString()
  additionalInfo?: string;
}

export class PaymentPlanDetailsDto {
  @ApiProperty({ 
    description: 'Payment plan type', 
    enum: PaymentPlan,
    example: PaymentPlan.PAY_NOW
  })
  @IsEnum(PaymentPlan)
  type: PaymentPlan;

  @ApiProperty({ 
    description: 'Pay Now plan details',
    type: PayNowPlanDto,
    required: false
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => PayNowPlanDto)
  payNowDetails?: PayNowPlanDto;

  @ApiProperty({ 
    description: 'Price Lock plan details',
    type: PriceLockPlanDto,
    required: false
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => PriceLockPlanDto)
  priceLockDetails?: PriceLockPlanDto;

  @ApiProperty({ 
    description: 'Pay Small-Small plan details',
    type: PaySmallSmallPlanDto,
    required: false
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => PaySmallSmallPlanDto)
  paySmallSmallDetails?: PaySmallSmallPlanDto;

  @ApiProperty({ 
    description: 'Pay Later plan details',
    type: PayLaterPlanDto,
    required: false
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => PayLaterPlanDto)
  payLaterDetails?: PayLaterPlanDto;
}
