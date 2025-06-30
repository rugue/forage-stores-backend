import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { IsString, IsNotEmpty, IsOptional, IsEmail } from 'class-validator';

export type StoreDocument = Store & Document;

@Schema({ timestamps: true })
export class Store {
  @Prop({ required: true, maxlength: 255 })
  @IsString()
  @IsNotEmpty()
  name: string;

  @Prop({ required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @Prop({ required: true, maxlength: 500 })
  @IsString()
  @IsNotEmpty()
  address: string;

  @Prop({ required: false, maxlength: 20 })
  @IsString()
  @IsOptional()
  phone?: string;

  @Prop({ required: false, maxlength: 255 })
  @IsEmail()
  @IsOptional()
  email?: string;
}

export const StoreSchema = SchemaFactory.createForClass(Store);
