import { IsString, IsOptional, IsArray } from 'class-validator';
import { NotificationDto } from './notification.dto';

export class WhatsAppNotificationDto extends NotificationDto {
  @IsString()
  phoneNumber: string;
  
  @IsOptional()
  @IsString()
  templateName?: string;
  
  @IsOptional()
  @IsArray()
  templateParams?: string[];
  
  @IsOptional()
  @IsString()
  mediaUrl?: string;
}
