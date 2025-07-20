import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsEmail } from 'class-validator';
import { IStore } from '../interfaces/store.interface';

export type StoreDocument = Store & Document;

@Schema({ timestamps: true })
export class Store implements IStore {
  @ApiProperty({ description: 'Store ID' })
  id: string;

  @ApiProperty({ description: 'Store name', example: 'My Awesome Store' })
  @Prop({ required: true, maxlength: 255 })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'Store description' })
  @Prop({ required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Store address', example: '123 Main St, City' })
  @Prop({ required: true, maxlength: 500 })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiPropertyOptional({ description: 'Store phone number' })
  @Prop({ required: false, maxlength: 20 })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ description: 'Store email address' })
  @Prop({ required: false, maxlength: 255 })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;
}

export const StoreSchema = SchemaFactory.createForClass(Store);
