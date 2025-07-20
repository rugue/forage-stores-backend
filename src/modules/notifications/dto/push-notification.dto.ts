import { IsString, IsOptional, IsObject } from 'class-validator';
import { NotificationDto } from './notification.dto';

export class PushNotificationDto extends NotificationDto {
  @IsString()
  deviceToken: string;

  @IsString()
  @IsOptional()
  image?: string;

  @IsObject()
  @IsOptional()
  data?: Record<string, any>;

  @IsObject()
  @IsOptional()
  android?: {
    priority?: 'high' | 'normal';
    ttl?: number;
    notification?: {
      icon?: string;
      color?: string;
      sound?: string;
    };
  };

  @IsObject()
  @IsOptional()
  ios?: {
    badge?: number;
    sound?: string;
    criticalSound?: {
      name: string;
      volume: number;
    };
  };
}
