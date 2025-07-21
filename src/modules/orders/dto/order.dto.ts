import {
  IsString,
  IsNotEmpty,
  IsNumber,
  Min,
  IsOptional,
  IsArray,
  IsEnum,
  IsDateString,
  ValidateNested,
  IsObject,
  Max,
  ArrayMinSize,
  ArrayMaxSize,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { Types } from 'mongoose';
import {
  OrderStatus,
  PaymentPlan,
  DeliveryMethod,
  PaymentFrequency,
  PaymentMethod,
  PaymentStatus,
} from '../entities/order.entity';

export class CreateCartItemDto {
  @ApiProperty({ description: 'Product ID' })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ description: 'Quantity of the product', minimum: 1 })
  @IsNumber()
  @Min(1)
  quantity: number;
}

export class CreateDeliveryAddressDto {
  @ApiProperty({ description: 'Street address' })
  @IsString()
  @IsNotEmpty()
  street: string;

  @ApiProperty({ description: 'City' })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({ description: 'State/Province' })
  @IsString()
  @IsNotEmpty()
  state: string;

  @ApiProperty({ description: 'Postal/ZIP code', required: false })
  @IsOptional()
  @IsString()
  postalCode?: string;

  @ApiProperty({ description: 'Country', default: 'Nigeria' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiProperty({ description: 'Additional delivery instructions', required: false })
  @IsOptional()
  @IsString()
  instructions?: string;
}

export class CreateOrderDto {
  @ApiProperty({ description: 'Items in the order', type: [CreateCartItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => CreateCartItemDto)
  items: CreateCartItemDto[];

  @ApiProperty({ description: 'Payment plan selected', enum: PaymentPlan })
  @IsEnum(PaymentPlan)
  paymentPlan: PaymentPlan;

  @ApiProperty({ description: 'Delivery method', enum: DeliveryMethod })
  @IsEnum(DeliveryMethod)
  deliveryMethod: DeliveryMethod;

  @ApiProperty({ 
    description: 'Delivery address (required for home delivery)', 
    type: CreateDeliveryAddressDto,
    required: false 
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateDeliveryAddressDto)
  deliveryAddress?: CreateDeliveryAddressDto;

  @ApiProperty({ description: 'Order notes or special instructions', required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ description: 'Payment frequency for installments', enum: PaymentFrequency, required: false })
  @IsOptional()
  @IsEnum(PaymentFrequency)
  paymentFrequency?: PaymentFrequency;

  @ApiProperty({ description: 'Number of installments', minimum: 1, maximum: 24, required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(24)
  totalInstallments?: number;
}

export class UpdateOrderStatusDto {
  @ApiProperty({ description: 'New order status', enum: OrderStatus })
  @IsEnum(OrderStatus)
  status: OrderStatus;

  @ApiProperty({ description: 'Status update notes', required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ description: 'Tracking number for shipment', required: false })
  @IsOptional()
  @IsString()
  trackingNumber?: string;

  @ApiProperty({ description: 'Expected delivery date', required: false })
  @IsOptional()
  @IsDateString()
  expectedDeliveryDate?: string;
}

export class CancelOrderDto {
  @ApiProperty({ description: 'Reason for cancellation' })
  @IsString()
  @IsNotEmpty()
  cancellationReason: string;

  @ApiProperty({ description: 'Whether to process refund if payment was made', default: true })
  @IsOptional()
  @IsBoolean()
  processRefund?: boolean;
}

export class ProcessPaymentDto {
  @ApiProperty({ description: 'Payment amount', minimum: 0 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  amount: number;

  @ApiProperty({ description: 'Payment method', enum: PaymentMethod })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiProperty({ description: 'Transaction reference/ID', required: false })
  @IsOptional()
  @IsString()
  transactionRef?: string;

  @ApiProperty({ description: 'Payment notes', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateDeliveryAddressDto {
  @ApiProperty({ description: 'Street address' })
  @IsString()
  @IsNotEmpty()
  street: string;

  @ApiProperty({ description: 'City' })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({ description: 'State/Province' })
  @IsString()
  @IsNotEmpty()
  state: string;

  @ApiProperty({ description: 'Postal/ZIP code', required: false })
  @IsOptional()
  @IsString()
  postalCode?: string;

  @ApiProperty({ description: 'Country', default: 'Nigeria' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiProperty({ description: 'Additional delivery instructions', required: false })
  @IsOptional()
  @IsString()
  instructions?: string;
}

export class OrderSearchDto {
  @ApiProperty({ description: 'User ID to filter by', required: false })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiProperty({ description: 'Order status to filter by', enum: OrderStatus, required: false })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @ApiProperty({ description: 'Payment plan to filter by', enum: PaymentPlan, required: false })
  @IsOptional()
  @IsEnum(PaymentPlan)
  paymentPlan?: PaymentPlan;

  @ApiProperty({ description: 'Delivery method to filter by', enum: DeliveryMethod, required: false })
  @IsOptional()
  @IsEnum(DeliveryMethod)
  deliveryMethod?: DeliveryMethod;

  @ApiProperty({ description: 'Start date for date range filter', required: false })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ description: 'End date for date range filter', required: false })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({ description: 'Page number', minimum: 1, default: 1, required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiProperty({ description: 'Items per page', minimum: 1, maximum: 100, default: 20, required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiProperty({ description: 'Sort field', required: false })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiProperty({ description: 'Sort order', enum: ['asc', 'desc'], default: 'desc', required: false })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';
}

export class OrderAnalyticsDto {
  @ApiProperty({ description: 'Start date for analytics', required: false })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ description: 'End date for analytics', required: false })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({ description: 'Group by period', enum: ['day', 'week', 'month'], default: 'day', required: false })
  @IsOptional()
  @IsEnum(['day', 'week', 'month'])
  groupBy?: 'day' | 'week' | 'month';

  @ApiProperty({ description: 'Include product analytics', default: true, required: false })
  @IsOptional()
  @IsBoolean()
  includeProducts?: boolean;

  @ApiProperty({ description: 'Include customer analytics', default: true, required: false })
  @IsOptional()
  @IsBoolean()
  includeCustomers?: boolean;
}

export class OrderExportDto {
  @ApiProperty({ description: 'Export format', enum: ['csv', 'excel', 'pdf'], default: 'csv' })
  @IsEnum(['csv', 'excel', 'pdf'])
  format: 'csv' | 'excel' | 'pdf';

  @ApiProperty({ description: 'Start date for export', required: false })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ description: 'End date for export', required: false })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({ description: 'Order status to filter by', enum: OrderStatus, required: false })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @ApiProperty({ description: 'Include customer details', default: true, required: false })
  @IsOptional()
  @IsBoolean()
  includeCustomerDetails?: boolean;

  @ApiProperty({ description: 'Include payment details', default: true, required: false })
  @IsOptional()
  @IsBoolean()
  includePaymentDetails?: boolean;
}
