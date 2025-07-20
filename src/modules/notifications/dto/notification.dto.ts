import { IsString, IsNotEmpty, IsEnum, IsOptional, IsObject } from 'class-validator';
import { NotificationType } from '../../../entities/notification.entity';

export class NotificationDto {
  @IsEnum(NotificationType)
  @IsNotEmpty()
  type: NotificationType;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsString()
  @IsOptional()
  recipientId?: string;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}
