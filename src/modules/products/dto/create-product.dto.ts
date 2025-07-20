import {
  IsString,
  IsNotEmpty,
  IsNumber,
  Min,
  IsOptional,
  IsArray,
  IsEnum,
  IsInt,
  IsUrl,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { DeliveryType, ProductCategory } from '../../../entities/product.entity';

export class CreateProductDto {
  @ApiProperty({ description: 'Product name', example: 'Fresh Tomatoes' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Product description',
    example: 'Fresh organic tomatoes grown locally',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    description: 'Product price in Nigerian Naira (NGN)',
    example: 500.00,
    minimum: 0,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price: number;

  @ApiProperty({
    description: 'Product price in Nibia points',
    example: 125.50,
    minimum: 0,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  priceInNibia: number;

  @ApiProperty({
    description: 'Product weight in grams',
    example: 1000,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  weight: number;

  @ApiProperty({
    description: 'City where product is available',
    example: 'Lagos',
  })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({
    description: 'Product category',
    example: 'vegetables',
    enum: ProductCategory,
  })
  @IsEnum(ProductCategory)
  category: ProductCategory;

  @ApiProperty({
    description: 'Seller ID (optional for admin-managed products)',
    example: '507f1f77bcf86cd799439011',
    required: false,
  })
  @IsOptional()
  @IsString()
  sellerId?: string;

  @ApiProperty({
    description: 'Product tags for search and filtering',
    example: ['organic', 'fresh', 'local'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  tags: string[];

  @ApiProperty({
    description: 'Delivery type',
    example: 'free',
    enum: DeliveryType,
  })
  @IsEnum(DeliveryType)
  deliveryType: DeliveryType;

  @ApiProperty({
    description: 'Available stock quantity',
    example: 50,
    minimum: 0,
  })
  @IsInt()
  @Min(0)
  stock: number;

  @ApiProperty({
    description: 'Product images URLs',
    example: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  images?: string[];
}
