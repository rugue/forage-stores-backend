import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
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
  GROWTH_ASSOCIATE = 'growth_associate', // GA: at least 100 referrals with ₦600k total spend
  GROWTH_ELITE = 'growth_elite', // GE: at least 1000 referrals with ₦600k/year for 2 years
  SYSTEM = 'system', // For system-triggered operations
}

export enum AccountStatus {
  PENDING = 'pending', // Email verification pending
  ACTIVE = 'active',   // Account verified and active
  SUSPENDED = 'suspended', // Account temporarily suspended
  DEACTIVATED = 'deactivated', // Account deactivated by user
  BANNED = 'banned',   // Account permanently banned
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

  @ApiProperty({ description: 'User first name', example: 'John' })
  @Prop({ maxlength: 100 })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiProperty({ description: 'User last name', example: 'Doe' })
  @Prop({ maxlength: 100 })
  @IsString()
  @IsOptional()
  lastName?: string;

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

  @ApiProperty({
    description: 'Account status',
    enum: AccountStatus,
    example: AccountStatus.PENDING,
  })
  @Prop({ required: true, enum: AccountStatus, default: AccountStatus.PENDING })
  @IsEnum(AccountStatus)
  accountStatus: AccountStatus;

  @ApiProperty({ description: 'User city', example: 'Lagos' })
  @Prop({ required: false, maxlength: 100 })
  @IsString()
  @IsOptional()
  city?: string;

  // Business Account Specific Fields
  @ApiProperty({ description: 'Company name (for business accounts)', example: 'Acme Food Services Ltd' })
  @Prop({ required: false, maxlength: 255 })
  @IsString()
  @IsOptional()
  companyName?: string;

  @ApiProperty({ description: 'Business category', example: 'Restaurant' })
  @Prop({ required: false, maxlength: 100 })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiProperty({ description: 'Company address', example: '123 Business District, Victoria Island, Lagos' })
  @Prop({ required: false, maxlength: 500 })
  @IsString()
  @IsOptional()
  companyAddress?: string;

  @ApiProperty({ description: 'Role in company', example: 'CEO' })
  @Prop({ required: false, maxlength: 100 })
  @IsString()
  @IsOptional()
  roleInCompany?: string;

  @ApiProperty({ description: 'Office phone number', example: '+2341234567890' })
  @Prop({ required: false, maxlength: 20 })
  @IsString()
  @IsOptional()
  officePhoneNumber?: string;

  @ApiProperty({ description: 'Office email address', example: 'info@company.com' })
  @Prop({ required: false, maxlength: 255 })
  @IsEmail()
  @IsOptional()
  officeEmailAddress?: string;

  @ApiProperty({ description: 'User referral code', example: 'REF123456' })
  @Prop({ required: false, unique: true, sparse: true, maxlength: 20 })
  @IsString()
  @IsOptional()
  referralCode?: string;

  @ApiProperty({ description: 'ID of the user who referred this user' })
  @Prop({ required: false, type: Types.ObjectId, ref: 'User', index: true })
  @IsOptional()
  referrerId?: Types.ObjectId;

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

  @ApiProperty({ description: 'Whether email has been verified' })
  @Prop({ required: true, type: Boolean, default: false })
  @IsOptional()
  emailVerified?: boolean;

  @ApiProperty({ description: 'Email verification token' })
  @Prop({ required: false, type: String })
  @IsOptional()
  @IsString()
  emailVerificationToken?: string;

  @ApiProperty({ description: 'Email verification token expiry' })
  @Prop({ required: false, type: Date })
  @IsOptional()
  emailVerificationExpiry?: Date;

  @ApiProperty({ description: '4-digit email verification code' })
  @Prop({ required: false, type: String, length: 4 })
  @IsOptional()
  @IsString()
  emailVerificationCode?: string;

  @ApiProperty({ description: '4-digit email verification code expiry' })
  @Prop({ required: false, type: Date })
  @IsOptional()
  emailVerificationCodeExpiry?: Date;

  @ApiProperty({ description: 'Password reset token' })
  @Prop({ required: false, type: String })
  @IsOptional()
  @IsString()
  passwordResetToken?: string;

  @ApiProperty({ description: 'Password reset token expiry' })
  @Prop({ required: false, type: Date })
  @IsOptional()
  passwordResetExpiry?: Date;

  @ApiProperty({ description: 'Profile image URL', required: false })
  @Prop({ required: false, type: String })
  @IsOptional()
  @IsString()
  profileImage?: string;

  @ApiProperty({ description: 'User address', required: false })
  @Prop({ required: false, type: String, maxlength: 255 })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
