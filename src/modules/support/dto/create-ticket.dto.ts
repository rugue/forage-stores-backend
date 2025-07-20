import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { TicketCategory, TicketPriority } from '../../../entities/support-ticket.entity';

export class CreateTicketDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  subject: string;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsEnum(TicketCategory)
  @IsNotEmpty()
  category: TicketCategory;

  @IsEnum(TicketPriority)
  @IsOptional()
  priority?: TicketPriority;

  @IsOptional()
  @IsString({ each: true })
  attachments?: string[];

  @IsOptional()
  metadata?: Record<string, any>;
}
