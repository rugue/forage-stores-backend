import { IsEnum, IsMongoId, IsOptional, IsString, MaxLength } from 'class-validator';
import { TicketPriority, TicketStatus } from '../../../entities/support-ticket.entity';

export class UpdateTicketDto {
  @IsOptional()
  @IsEnum(TicketStatus)
  status?: TicketStatus;

  @IsOptional()
  @IsEnum(TicketPriority)
  priority?: TicketPriority;

  @IsOptional()
  @IsMongoId()
  assignedTo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  subject?: string;

  @IsOptional()
  isEscalated?: boolean;

  @IsOptional()
  metadata?: Record<string, any>;
}
