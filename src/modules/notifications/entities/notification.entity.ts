import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, Schema as MongooseSchema } from 'mongoose';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsObject,
  IsDate,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum NotificationChannel {
  EMAIL = 'EMAIL',
  PUSH = 'PUSH',
  WHATSAPP = 'WHATSAPP',
  SMS = 'SMS',
  IN_APP = 'IN_APP',
}

export enum NotificationType {
  ORDER_UPDATE = 'ORDER_UPDATE',
  PAYMENT_REMINDER = 'PAYMENT_REMINDER',
  DELIVERY_UPDATE = 'DELIVERY_UPDATE',
  AUCTION_EVENT = 'AUCTION_EVENT',
  RIDER_ASSIGNMENT = 'RIDER_ASSIGNMENT',
  GENERAL = 'GENERAL',
  DROP_REMINDER = 'DROP_REMINDER',
  PRICE_LOCK_EXPIRED = 'PRICE_LOCK_EXPIRED',
  AUCTION_WIN = 'AUCTION_WIN',
  AUCTION_REFUND = 'AUCTION_REFUND',
  WALLET_TRANSACTION = 'WALLET_TRANSACTION',
  ACCOUNT_UPDATE = 'ACCOUNT_UPDATE',
  PROMOTION = 'PROMOTION',
  SECURITY_ALERT = 'SECURITY_ALERT',
}

export enum NotificationPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum NotificationStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  READ = 'READ',
  FAILED = 'FAILED',
}

export type NotificationDocument = Notification & Document;

@Schema({ timestamps: true })
export class Notification {
  @ApiProperty({ description: 'Recipient user ID' })
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  @IsString()
  @IsNotEmpty()
  recipientId: Types.ObjectId;

  @ApiProperty({ description: 'Notification title' })
  @Prop({ required: true, maxlength: 255 })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'Notification message' })
  @Prop({ required: true, maxlength: 1000 })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiProperty({ description: 'Notification type', enum: NotificationType })
  @Prop({ 
    type: String, 
    enum: Object.values(NotificationType),
    required: true,
  })
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiProperty({ description: 'Notification channel', enum: NotificationChannel })
  @Prop({ 
    type: String, 
    enum: Object.values(NotificationChannel),
    required: true,
  })
  @IsEnum(NotificationChannel)
  channel: NotificationChannel;

  @ApiProperty({ description: 'Notification priority', enum: NotificationPriority })
  @Prop({ 
    type: String, 
    enum: Object.values(NotificationPriority),
    default: NotificationPriority.MEDIUM,
  })
  @IsEnum(NotificationPriority)
  priority: NotificationPriority;

  @ApiProperty({ description: 'Notification status', enum: NotificationStatus })
  @Prop({ 
    type: String, 
    enum: Object.values(NotificationStatus),
    default: NotificationStatus.PENDING,
  })
  @IsEnum(NotificationStatus)
  status: NotificationStatus;

  @ApiProperty({ description: 'Whether notification has been read' })
  @Prop({ type: Boolean, default: false })
  @IsBoolean()
  read: boolean;

  @ApiProperty({ description: 'When notification was read' })
  @Prop({ type: Date })
  @IsOptional()
  @IsDate()
  readAt?: Date;

  @ApiProperty({ description: 'When notification was sent' })
  @Prop({ type: Date })
  @IsOptional()
  @IsDate()
  sentAt?: Date;

  @ApiProperty({ description: 'When notification was delivered' })
  @Prop({ type: Date })
  @IsOptional()
  @IsDate()
  deliveredAt?: Date;

  @ApiProperty({ description: 'Additional metadata' })
  @Prop({ type: MongooseSchema.Types.Mixed })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @ApiProperty({ description: 'Whether notification was sent successfully' })
  @Prop({ type: Boolean, default: true })
  @IsBoolean()
  success: boolean;

  @ApiProperty({ description: 'Error message if sending failed' })
  @Prop({ type: String })
  @IsOptional()
  @IsString()
  errorMessage?: string;

  @ApiProperty({ description: 'Number of retry attempts' })
  @Prop({ type: Number, default: 0 })
  @IsOptional()
  retryCount?: number;

  @ApiProperty({ description: 'Scheduled send time' })
  @Prop({ type: Date })
  @IsOptional()
  @IsDate()
  scheduledAt?: Date;

  @ApiProperty({ description: 'Notification expiry time' })
  @Prop({ type: Date })
  @IsOptional()
  @IsDate()
  expiresAt?: Date;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);

// Add indexes for better query performance
NotificationSchema.index({ recipientId: 1 });
NotificationSchema.index({ type: 1 });
NotificationSchema.index({ channel: 1 });
NotificationSchema.index({ status: 1 });
NotificationSchema.index({ read: 1 });
NotificationSchema.index({ createdAt: -1 });
NotificationSchema.index({ scheduledAt: 1 });
NotificationSchema.index({ expiresAt: 1 });
