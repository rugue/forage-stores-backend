import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsObject,
  IsArray,
  IsDateString,
  IsNumber,
  Min,
  Max,
  ArrayMaxSize,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import {
  NotificationChannel,
  NotificationType,
  NotificationPriority,
  NotificationStatus,
} from '../entities/notification.entity';

export class CreateNotificationDto {
  @ApiProperty({ description: 'Recipient user ID' })
  @IsString()
  @IsNotEmpty()
  recipientId: string;

  @ApiProperty({ description: 'Notification title', maxLength: 255 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @ApiProperty({ description: 'Notification message', maxLength: 1000 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  message: string;

  @ApiProperty({ description: 'Notification type', enum: NotificationType })
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiProperty({ description: 'Notification channel', enum: NotificationChannel })
  @IsEnum(NotificationChannel)
  channel: NotificationChannel;

  @ApiProperty({ description: 'Notification priority', enum: NotificationPriority, required: false })
  @IsOptional()
  @IsEnum(NotificationPriority)
  priority?: NotificationPriority;

  @ApiProperty({ description: 'Additional metadata', required: false })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @ApiProperty({ description: 'Scheduled send time', required: false })
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @ApiProperty({ description: 'Notification expiry time', required: false })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}

export class BulkNotificationDto {
  @ApiProperty({ description: 'Recipient user IDs', type: [String] })
  @IsArray()
  @ArrayMaxSize(1000)
  @IsString({ each: true })
  recipientIds: string[];

  @ApiProperty({ description: 'Notification title', maxLength: 255 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @ApiProperty({ description: 'Notification message', maxLength: 1000 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  message: string;

  @ApiProperty({ description: 'Notification type', enum: NotificationType })
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiProperty({ description: 'Notification channel', enum: NotificationChannel })
  @IsEnum(NotificationChannel)
  channel: NotificationChannel;

  @ApiProperty({ description: 'Notification priority', enum: NotificationPriority, required: false })
  @IsOptional()
  @IsEnum(NotificationPriority)
  priority?: NotificationPriority;

  @ApiProperty({ description: 'Additional metadata', required: false })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @ApiProperty({ description: 'Scheduled send time', required: false })
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @ApiProperty({ description: 'Notification expiry time', required: false })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}

export class UpdateNotificationDto {
  @ApiProperty({ description: 'Notification title', maxLength: 255, required: false })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @ApiProperty({ description: 'Notification message', maxLength: 1000, required: false })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  message?: string;

  @ApiProperty({ description: 'Notification status', enum: NotificationStatus, required: false })
  @IsOptional()
  @IsEnum(NotificationStatus)
  status?: NotificationStatus;

  @ApiProperty({ description: 'Additional metadata', required: false })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @ApiProperty({ description: 'Scheduled send time', required: false })
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @ApiProperty({ description: 'Notification expiry time', required: false })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}

export class MarkAsReadDto {
  @ApiProperty({ description: 'Notification IDs to mark as read', type: [String] })
  @IsArray()
  @IsString({ each: true })
  notificationIds: string[];
}

export class NotificationSearchDto {
  @ApiProperty({ description: 'Recipient user ID', required: false })
  @IsOptional()
  @IsString()
  recipientId?: string;

  @ApiProperty({ description: 'Notification type', enum: NotificationType, required: false })
  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType;

  @ApiProperty({ description: 'Notification channel', enum: NotificationChannel, required: false })
  @IsOptional()
  @IsEnum(NotificationChannel)
  channel?: NotificationChannel;

  @ApiProperty({ description: 'Notification status', enum: NotificationStatus, required: false })
  @IsOptional()
  @IsEnum(NotificationStatus)
  status?: NotificationStatus;

  @ApiProperty({ description: 'Notification priority', enum: NotificationPriority, required: false })
  @IsOptional()
  @IsEnum(NotificationPriority)
  priority?: NotificationPriority;

  @ApiProperty({ description: 'Read status filter', required: false })
  @IsOptional()
  @IsBoolean()
  read?: boolean;

  @ApiProperty({ description: 'Start date for filtering', required: false })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ description: 'End date for filtering', required: false })
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

export class NotificationPreferencesDto {
  @ApiProperty({ description: 'Enable email notifications', default: true })
  @IsBoolean()
  emailEnabled: boolean;

  @ApiProperty({ description: 'Enable push notifications', default: true })
  @IsBoolean()
  pushEnabled: boolean;

  @ApiProperty({ description: 'Enable WhatsApp notifications', default: false })
  @IsBoolean()
  whatsappEnabled: boolean;

  @ApiProperty({ description: 'Enable SMS notifications', default: false })
  @IsBoolean()
  smsEnabled: boolean;

  @ApiProperty({ description: 'Enable in-app notifications', default: true })
  @IsBoolean()
  inAppEnabled: boolean;

  @ApiProperty({ description: 'Category preferences' })
  @ValidateNested()
  @Type(() => CategoryPreferencesDto)
  categories: CategoryPreferencesDto;

  @ApiProperty({ description: 'Quiet hours configuration' })
  @ValidateNested()
  @Type(() => QuietHoursDto)
  quietHours: QuietHoursDto;
}

export class CategoryPreferencesDto {
  @ApiProperty({ description: 'Enable order update notifications', default: true })
  @IsBoolean()
  orderUpdates: boolean;

  @ApiProperty({ description: 'Enable payment reminder notifications', default: true })
  @IsBoolean()
  paymentReminders: boolean;

  @ApiProperty({ description: 'Enable promotional notifications', default: false })
  @IsBoolean()
  promotions: boolean;

  @ApiProperty({ description: 'Enable security alert notifications', default: true })
  @IsBoolean()
  securityAlerts: boolean;

  @ApiProperty({ description: 'Enable auction event notifications', default: true })
  @IsBoolean()
  auctionEvents: boolean;

  @ApiProperty({ description: 'Enable general news notifications', default: false })
  @IsBoolean()
  generalNews: boolean;
}

export class QuietHoursDto {
  @ApiProperty({ description: 'Enable quiet hours', default: false })
  @IsBoolean()
  enabled: boolean;

  @ApiProperty({ description: 'Quiet hours start time (HH:mm)', default: '22:00' })
  @IsString()
  startTime: string;

  @ApiProperty({ description: 'Quiet hours end time (HH:mm)', default: '08:00' })
  @IsString()
  endTime: string;

  @ApiProperty({ description: 'Timezone', default: 'Africa/Lagos' })
  @IsString()
  timezone: string;
}

export class NotificationAnalyticsDto {
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

  @ApiProperty({ description: 'Include channel performance', default: true, required: false })
  @IsOptional()
  @IsBoolean()
  includeChannelPerformance?: boolean;

  @ApiProperty({ description: 'Include type engagement', default: true, required: false })
  @IsOptional()
  @IsBoolean()
  includeTypeEngagement?: boolean;

  @ApiProperty({ description: 'Include user engagement', default: false, required: false })
  @IsOptional()
  @IsBoolean()
  includeUserEngagement?: boolean;
}
