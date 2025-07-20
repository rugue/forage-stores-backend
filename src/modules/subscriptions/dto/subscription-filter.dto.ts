import {
  IsOptional,
  IsEnum,
  IsMongoId,
  IsBoolean,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { SubscriptionStatus } from '../../../entities/subscription.entity';
import { PaymentPlan } from '../../../entities/order.entity';

export class SubscriptionFilterDto {
  @ApiProperty({
    description: 'Filter by user ID',
    example: '60d21b4667d0d8992e610c85',
    required: false
  })
  @IsOptional()
  @IsMongoId()
  userId?: string;
  
  @ApiProperty({
    description: 'Filter by order ID',
    example: '60d21b4667d0d8992e610c85',
    required: false
  })
  @IsOptional()
  @IsMongoId()
  orderId?: string;
  
  @ApiProperty({
    description: 'Filter by subscription status',
    enum: SubscriptionStatus,
    required: false
  })
  @IsOptional()
  @IsEnum(SubscriptionStatus)
  status?: SubscriptionStatus;
  
  @ApiProperty({
    description: 'Filter by payment plan',
    enum: PaymentPlan,
    required: false
  })
  @IsOptional()
  @IsEnum(PaymentPlan)
  paymentPlan?: PaymentPlan;
  
  @ApiProperty({
    description: 'Filter by completion status',
    example: true,
    required: false
  })
  @IsOptional()
  @IsBoolean()
  isCompleted?: boolean;
}
