import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsMongoId,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PaymentPlan, PaymentFrequency } from '../../orders/entities/order.entity';

export class CreateSubscriptionDto {
  @ApiProperty({
    description: 'Order ID to create subscription for',
    example: '60d21b4667d0d8992e610c85'
  })
  @IsMongoId()
  @IsNotEmpty()
  orderId: string;
  
  @ApiProperty({
    description: 'Payment frequency for drops',
    enum: PaymentFrequency,
    example: PaymentFrequency.WEEKLY
  })
  @IsEnum(PaymentFrequency)
  frequency: PaymentFrequency;
  
  @ApiProperty({
    description: 'Notes for the subscription',
    example: 'Customer prefers Monday drops',
    required: false
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
