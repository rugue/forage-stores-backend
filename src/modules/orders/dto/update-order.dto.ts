import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  IsMongoId,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { OrderStatus, PaymentPlan, DeliveryMethod } from '../../../entities/order.entity';

export class UpdateOrderDto {
  @ApiProperty({ description: 'Order status', enum: OrderStatus, required: false })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @ApiProperty({ description: 'Expected delivery date', required: false })
  @IsOptional()
  @IsDateString()
  expectedDeliveryDate?: string;

  @ApiProperty({ description: 'Actual delivery date', required: false })
  @IsOptional()
  @IsDateString()
  actualDeliveryDate?: string;

  @ApiProperty({ description: 'Tracking number', required: false })
  @IsOptional()
  @IsString()
  trackingNumber?: string;

  @ApiProperty({ description: 'Order notes', required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ description: 'Cancellation reason', required: false })
  @IsOptional()
  @IsString()
  cancellationReason?: string;
}
