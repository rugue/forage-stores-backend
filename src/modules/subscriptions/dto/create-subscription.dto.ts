import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsMongoId,
  IsNumber,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PaymentPlan, PaymentFrequency } from '../../orders/entities/order.entity';
import { 
  IsValidSubscriptionAmount, 
  IsValidPaymentFrequency, 
  IsValidSubscriptionBusinessRules 
} from '../decorators/subscription.decorators';

export class CreateSubscriptionDto {
  @ApiProperty({
    description: 'Order ID to create subscription for',
    example: '60d21b4667d0d8992e610c85'
  })
  @IsMongoId()
  @IsNotEmpty()
  orderId: string;
  
  @ApiProperty({
    description: 'Payment plan for the subscription',
    enum: PaymentPlan,
    example: PaymentPlan.PAY_SMALL_SMALL
  })
  @IsEnum(PaymentPlan)
  @IsNotEmpty()
  paymentPlan: PaymentPlan;
  
  @ApiProperty({
    description: 'Total subscription amount',
    example: 25000,
    minimum: 1000
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1000)
  @IsValidSubscriptionAmount()
  totalAmount: number;
  
  @ApiProperty({
    description: 'Payment frequency for drops',
    enum: PaymentFrequency,
    example: PaymentFrequency.WEEKLY
  })
  @IsEnum(PaymentFrequency)
  @IsValidPaymentFrequency()
  frequency: PaymentFrequency;
  
  @ApiProperty({
    description: 'Notes for the subscription',
    example: 'Customer prefers Monday drops',
    required: false
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @IsValidSubscriptionBusinessRules()
  private _businessRulesValidator?: any; // Internal validator property
}
