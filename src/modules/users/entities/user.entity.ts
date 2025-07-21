import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEmail,
  IsEnum,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IUser } from '../interfaces/user.interface';

export type UserDocument = User & Document;

export enum AccountType {
  FAMILY = 'family',
  BUSINESS = 'business',
}

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  RIDER = 'rider',
  PRO_AFFILIATE = 'pro-affiliate',
  SYSTEM = 'system', // For system-triggered operations
}

@Schema({ timestamps: true })
export class User implements IUser {
  @ApiProperty({ description: 'User ID' })
  id: string;

  @ApiProperty({ description: 'User full name', example: 'John Doe' })
  @Prop({ required: true, maxlength: 255 })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'User email address',
    example: 'john.doe@example.com',
  })
  @Prop({ required: true, unique: true, maxlength: 255 })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: 'User phone number', example: '+1234567890' })
  @Prop({ required: false, maxlength: 20 })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({
    description: 'User password (hashed)',
    example: 'hashedPassword123',
  })
  @Prop({ required: true })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiProperty({
    description: 'Account type',
    enum: AccountType,
    example: AccountType.FAMILY,
  })
  @Prop({ required: true, enum: AccountType, default: AccountType.FAMILY })
  @IsEnum(AccountType)
  accountType: AccountType;

  @ApiProperty({
    description: 'User role',
    enum: UserRole,
    example: UserRole.USER,
  })
  @Prop({ required: true, enum: UserRole, default: UserRole.USER })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiProperty({ description: 'User city', example: 'Lagos' })
  @Prop({ required: false, maxlength: 100 })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiProperty({ description: 'User referral code', example: 'REF123456' })
  @Prop({ required: false, unique: true, sparse: true, maxlength: 20 })
  @IsString()
  @IsOptional()
  referralCode?: string;

  @ApiProperty({
    description: 'User credit score',
    example: 750,
    minimum: 300,
    maximum: 850,
  })
  @Prop({ required: false, min: 300, max: 850, default: 500 })
  @IsNumber()
  @IsOptional()
  @Min(300)
  @Max(850)
  creditScore?: number;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
