import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsMongoId,
  IsNumber,
  IsDate,
  IsArray,
  ValidateNested,
  Min,
  Max,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { DeliveryStatus, PaymentStatus } from '../../../shared/enums';

export class DeliveryLocationDto {
  @ApiProperty({ description: 'Street address' })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiProperty({ description: 'City' })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({ description: 'State/Province' })
  @IsString()
  @IsNotEmpty()
  state: string;

  @ApiProperty({ description: 'Coordinates [longitude, latitude]', required: false })
  @IsOptional()
  @IsArray()
  coordinates?: number[];

  @ApiProperty({ description: 'Additional instructions', required: false })
  @IsOptional()
  @IsString()
  instructions?: string;
}

export class CreateDeliveryDto {
  @ApiProperty({ description: 'Order ID associated with this delivery' })
  @IsMongoId()
  @IsNotEmpty()
  orderId: string;

  @ApiProperty({ description: 'Customer ID (user who placed the order)' })
  @IsMongoId()
  @IsNotEmpty()
  customerId: string;

  @ApiProperty({ description: 'Pickup location (store/warehouse)' })
  @ValidateNested()
  @Type(() => DeliveryLocationDto)
  pickupLocation: DeliveryLocationDto;

  @ApiProperty({ description: 'Delivery location (customer address)' })
  @ValidateNested()
  @Type(() => DeliveryLocationDto)
  deliveryLocation: DeliveryLocationDto;

  @ApiProperty({ description: 'Estimated delivery distance (km)' })
  @IsNumber()
  @Min(0)
  distance: number;

  @ApiProperty({ description: 'Delivery fee amount (NGN)' })
  @IsNumber()
  @Min(0)
  deliveryFee: number;

  @ApiProperty({ description: 'Rider payment amount (NGN)' })
  @IsNumber()
  @Min(0)
  riderPayment: number;

  @ApiProperty({ description: 'Notes or additional information', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class AssignRiderDto {
  @ApiProperty({ description: 'Rider ID to assign to the delivery' })
  @IsMongoId()
  @IsNotEmpty()
  riderId: string;
}

export class RiderResponseDto {
  @ApiProperty({ description: 'Whether the rider accepts the delivery' })
  @IsBoolean()
  accept: boolean;

  @ApiProperty({ description: 'Reason for declining (if applicable)', required: false })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class UpdateDeliveryStatusDto {
  @ApiProperty({ description: 'New delivery status', enum: DeliveryStatus })
  @IsEnum(DeliveryStatus)
  status: DeliveryStatus;

  @ApiProperty({ description: 'Notes about the status change', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class ReleasePaymentDto {
  @ApiProperty({ description: 'Payment reference ID', required: false })
  @IsOptional()
  @IsString()
  paymentRef?: string;

  @ApiProperty({ description: 'Notes about the payment', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class RateDeliveryDto {
  @ApiProperty({ description: 'Rating for the delivery (1-5)' })
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiProperty({ description: 'Feedback/review for the delivery', required: false })
  @IsOptional()
  @IsString()
  feedback?: string;
}

export class DeliveryFilterDto {
  @ApiProperty({ description: 'Filter by status', required: false, enum: DeliveryStatus })
  @IsOptional()
  @IsEnum(DeliveryStatus)
  status?: DeliveryStatus;

  @ApiProperty({ description: 'Filter by rider ID', required: false })
  @IsOptional()
  @IsMongoId()
  riderId?: string;

  @ApiProperty({ description: 'Filter by customer ID', required: false })
  @IsOptional()
  @IsMongoId()
  customerId?: string;

  @ApiProperty({ description: 'Filter by order ID', required: false })
  @IsOptional()
  @IsMongoId()
  orderId?: string;

  @ApiProperty({ description: 'Filter by city', required: false })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiProperty({ description: 'Filter by payment status', required: false, enum: PaymentStatus })
  @IsOptional()
  @IsEnum(PaymentStatus)
  paymentStatus?: PaymentStatus;

  @ApiProperty({ description: 'Only get unassigned deliveries', required: false })
  @IsOptional()
  @IsBoolean()
  unassignedOnly?: boolean;

  @ApiProperty({ description: 'Only get deliveries pending rider acceptance', required: false })
  @IsOptional()
  @IsBoolean()
  pendingAcceptanceOnly?: boolean;

  @ApiProperty({ description: 'Only get completed deliveries pending payment', required: false })
  @IsOptional()
  @IsBoolean()
  pendingPaymentOnly?: boolean;
}
