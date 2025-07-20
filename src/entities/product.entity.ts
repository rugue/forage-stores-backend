import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  Min,
  IsOptional,
  IsArray,
  IsEnum,
  IsInt,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export type ProductDocument = Product & Document;

export enum DeliveryType {
  FREE = 'free',
  PAID = 'paid',
}

export enum ProductCategory {
  FRUITS = 'fruits',
  VEGETABLES = 'vegetables',
  GRAINS = 'grains',
  DAIRY = 'dairy',
  MEAT = 'meat',
  BEVERAGES = 'beverages',
  SNACKS = 'snacks',
  SPICES = 'spices',
  SEAFOOD = 'seafood',
  OTHERS = 'others',
}

@Schema({ timestamps: true })
export class Product {
  @ApiProperty({ description: 'Product name', example: 'Fresh Tomatoes' })
  @Prop({ required: true, type: String, trim: true })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Product description',
    example: 'Fresh organic tomatoes grown locally',
  })
  @Prop({ required: true, type: String, trim: true })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    description: 'Product price in Nigerian Naira (NGN)',
    example: 500.00,
    minimum: 0,
  })
  @Prop({ required: true, type: Number, min: 0 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price: number;

  @ApiProperty({
    description: 'Product price in Nibia points',
    example: 125.50,
    minimum: 0,
  })
  @Prop({ required: true, type: Number, min: 0 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  priceInNibia: number;

  @ApiProperty({
    description: 'Product weight in grams',
    example: 1000,
    minimum: 1,
  })
  @Prop({ required: true, type: Number, min: 1 })
  @IsNumber()
  @Min(1)
  weight: number;

  @ApiProperty({
    description: 'City where product is available',
    example: 'Lagos',
  })
  @Prop({ required: true, type: String, trim: true })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({
    description: 'Product category',
    example: 'vegetables',
    enum: ProductCategory,
  })
  @Prop({
    required: true,
    type: String,
    enum: Object.values(ProductCategory),
  })
  @IsEnum(ProductCategory)
  category: ProductCategory;

  @ApiProperty({
    description: 'Seller ID (optional for admin-managed products)',
    example: '507f1f77bcf86cd799439011',
    required: false,
  })
  @Prop({ required: false, type: Types.ObjectId, ref: 'User' })
  @IsOptional()
  @IsString()
  sellerId?: Types.ObjectId;

  @ApiProperty({
    description: 'Product tags for search and filtering',
    example: ['organic', 'fresh', 'local'],
    type: [String],
  })
  @Prop({ required: true, type: [String], default: [] })
  @IsArray()
  @IsString({ each: true })
  tags: string[];

  @ApiProperty({
    description: 'Delivery type',
    example: 'free',
    enum: DeliveryType,
  })
  @Prop({
    required: true,
    type: String,
    enum: Object.values(DeliveryType),
    default: DeliveryType.PAID,
  })
  @IsEnum(DeliveryType)
  deliveryType: DeliveryType;

  @ApiProperty({
    description: 'Available stock quantity',
    example: 50,
    minimum: 0,
  })
  @Prop({ required: true, type: Number, min: 0, default: 0 })
  @IsInt()
  @Min(0)
  stock: number;

  @ApiProperty({
    description: 'Product availability status',
    example: true,
  })
  @Prop({ required: true, type: Boolean, default: true })
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({
    description: 'Product images URLs',
    example: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
    type: [String],
    required: false,
  })
  @Prop({ required: false, type: [String], default: [] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];
}

export const ProductSchema = SchemaFactory.createForClass(Product);

// Add indexes for better query performance
ProductSchema.index({ name: 'text', description: 'text', tags: 'text' });
ProductSchema.index({ city: 1 });
ProductSchema.index({ category: 1 });
ProductSchema.index({ sellerId: 1 });
ProductSchema.index({ deliveryType: 1 });
ProductSchema.index({ price: 1 });
ProductSchema.index({ priceInNibia: 1 });
ProductSchema.index({ isActive: 1 });
ProductSchema.index({ createdAt: -1 });
