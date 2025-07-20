import { IsEmail, IsArray, IsOptional } from 'class-validator';
import { NotificationDto } from './notification.dto';

export class EmailNotificationDto extends NotificationDto {
  @IsEmail()
  recipientEmail: string;

  @IsOptional()
  @IsEmail({}, { each: true })
  cc?: string[];

  @IsOptional()
  @IsEmail({}, { each: true })
  bcc?: string[];

  @IsOptional()
  @IsArray()
  attachments?: Array<{
    filename: string;
    content: string | Buffer;
    contentType?: string;
  }>;
}
