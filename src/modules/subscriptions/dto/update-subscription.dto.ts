import {
  IsEnum,
  IsOptional,
  IsString,
  IsBoolean,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { SubscriptionStatus } from '../../subscriptions/entities/subscription.entity';
import { ValidateStateTransition } from '../decorators/subscription.decorators';

export class UpdateSubscriptionDto {
  @ApiProperty({
    description: 'Status of the subscription',
    enum: SubscriptionStatus,
    required: false
  })
  @IsOptional()
  @IsEnum(SubscriptionStatus)
  @ValidateStateTransition()
  status?: SubscriptionStatus;
  
  @ApiProperty({
    description: 'Notes for the subscription',
    required: false
  })
  @IsOptional()
  @IsString()
  notes?: string;

  // Internal property to hold current status for validation
  currentStatus?: SubscriptionStatus;
}
