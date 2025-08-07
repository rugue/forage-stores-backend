import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { IsString, IsNotEmpty, IsBoolean, IsOptional, IsArray, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export type TwoFactorAuthDocument = TwoFactorAuth & Document;

@Schema({ timestamps: true })
export class TwoFactorAuth {
  @ApiProperty({ description: 'User ID this 2FA belongs to' })
  @Prop({ required: true, type: Types.ObjectId, ref: 'User', unique: true })
  userId: Types.ObjectId;

  @ApiProperty({ description: 'Whether 2FA is enabled for this user' })
  @Prop({ required: true, type: Boolean, default: false })
  @IsBoolean()
  isEnabled: boolean;

  @ApiProperty({ description: 'Whether 2FA setup has been verified' })
  @Prop({ required: false, type: Boolean, default: false })
  @IsOptional()
  @IsBoolean()
  isVerified?: boolean;

  @ApiProperty({ description: '2FA method (app, sms, email)' })
  @Prop({ required: false, type: String })
  @IsOptional()
  @IsString()
  method?: string;

  @ApiProperty({ description: 'Phone number for SMS 2FA' })
  @Prop({ required: false, type: String })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiProperty({ description: 'Email for email-based 2FA' })
  @Prop({ required: false, type: String })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiProperty({ description: 'Base32 encoded secret for TOTP' })
  @Prop({ required: false, type: String })
  @IsOptional()
  @IsString()
  secret?: string;

  @ApiProperty({ description: 'QR code data URL for initial setup' })
  @Prop({ required: false, type: String })
  @IsOptional()
  @IsString()
  qrCodeDataUrl?: string;

  @ApiProperty({ description: 'Backup recovery codes (hashed)' })
  @Prop({ required: false, type: [String], default: [] })
  @IsOptional()
  @IsArray()
  backupCodes?: string[];

  @ApiProperty({ description: 'Number of backup codes used' })
  @Prop({ required: false, type: Number, default: 0 })
  @IsOptional()
  backupCodesUsed?: number;

  @ApiProperty({ description: 'Date when 2FA was first setup' })
  @Prop({ required: false, type: Date })
  @IsOptional()
  @IsDateString()
  setupDate?: Date;

  @ApiProperty({ description: 'Date when 2FA was verified' })
  @Prop({ required: false, type: Date })
  @IsOptional()
  @IsDateString()
  verifiedAt?: Date;

  @ApiProperty({ description: 'Last time 2FA was used' })
  @Prop({ required: false, type: Date })
  @IsOptional()
  @IsDateString()
  lastUsed?: Date;

  @ApiProperty({ description: 'Last time 2FA was verified' })
  @Prop({ required: false, type: Date })
  @IsOptional()
  @IsDateString()
  lastVerified?: Date;

  @ApiProperty({ description: 'Number of failed attempts since last success' })
  @Prop({ required: false, type: Number, default: 0 })
  @IsOptional()
  failedAttempts?: number;

  @ApiProperty({ description: 'When the account was temporarily locked due to failures' })
  @Prop({ required: false, type: Date })
  @IsOptional()
  @IsDateString()
  lockedUntil?: Date;

  @ApiProperty({ description: 'Date when 2FA was first enabled' })
  @Prop({ required: false, type: Date })
  @IsOptional()
  @IsDateString()
  enabledAt?: Date;

  @ApiProperty({ description: 'Date when 2FA was disabled (if applicable)' })
  @Prop({ required: false, type: Date })
  @IsOptional()
  @IsDateString()
  disabledAt?: Date;

  @ApiProperty({ description: 'Admin who disabled 2FA (for admin users)' })
  @Prop({ required: false, type: Types.ObjectId, ref: 'User' })
  @IsOptional()
  disabledBy?: Types.ObjectId;

  @ApiProperty({ description: 'Reason for disabling 2FA' })
  @Prop({ required: false, type: String })
  @IsOptional()
  @IsString()
  disabledReason?: string;

  @ApiProperty({ description: 'Date when backup codes were generated' })
  @Prop({ required: false, type: Date })
  @IsOptional()
  @IsDateString()
  backupCodesGeneratedAt?: Date;
}

export const TwoFactorAuthSchema = SchemaFactory.createForClass(TwoFactorAuth);

// Add indexes
TwoFactorAuthSchema.index({ userId: 1 }, { unique: true });
TwoFactorAuthSchema.index({ isEnabled: 1 });
TwoFactorAuthSchema.index({ lastVerified: -1 });
TwoFactorAuthSchema.index({ failedAttempts: 1, lockedUntil: 1 });
