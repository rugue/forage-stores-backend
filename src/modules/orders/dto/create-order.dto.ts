import {
  IsString,
  IsNotEmpty,
  IsNumber,
  Min,
  IsOptional,
  IsArray,
  IsEnum,
  ValidateNested,
  IsMongoId,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { Types } from 'mongoose';
import { PaymentPlan, DeliveryMethod, PaymentMethod } from '../../orders/entities/order.entity';
import { PaymentPlanDetailsDto } from './payment-plan.dto';

export class AddToCartDto {
  @ApiProperty({ description: 'Product ID to add to cart' })
  @IsMongoId()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ description: 'Quantity to add', minimum: 1 })
  @IsNumber()
  @Min(1)
  quantity: number;
}

export class UpdateCartItemDto {
  @ApiProperty({ description: 'New quantity for the cart item', minimum: 1 })
  @IsNumber()
  @Min(1)
  quantity: number;
}

export class RemoveFromCartDto {
  @ApiProperty({ description: 'Product ID to remove from cart' })
  @IsMongoId()
  @IsNotEmpty()
  productId: string;
}

export class DeliveryAddressDto {
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
  @IsString()
  @IsOptional()
  country?: string;

  @ApiProperty({ description: 'Additional delivery instructions', required: false })
  @IsOptional()
  @IsString()
  instructions?: string;
}

export class CheckoutDto {
  @ApiProperty({ 
    description: 'Payment plan details', 
    type: PaymentPlanDetailsDto 
  })
  @ValidateNested()
  @Type(() => PaymentPlanDetailsDto)
  paymentPlan: PaymentPlanDetailsDto;

  @ApiProperty({ description: 'Delivery method', enum: DeliveryMethod })
  @IsEnum(DeliveryMethod)
  deliveryMethod: DeliveryMethod;

  @ApiProperty({ 
    description: 'Delivery address (required for home delivery)', 
    type: DeliveryAddressDto,
    required: false 
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => DeliveryAddressDto)
  deliveryAddress?: DeliveryAddressDto;

  @ApiProperty({ description: 'Order notes or special instructions', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class PaymentDto {
  @ApiProperty({ description: 'Payment amount' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
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
