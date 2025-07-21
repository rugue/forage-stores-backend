import { IsEnum, IsMongoId, IsOptional, IsString } from 'class-validator';
import { TicketCategory, TicketPriority, TicketStatus } from '../../support/entities/support-ticket.entity';

export class TicketQueryDto {
  @IsOptional()
  @IsEnum(TicketStatus)
  status?: TicketStatus;

  @IsOptional()
  @IsEnum(TicketPriority)
  priority?: TicketPriority;

  @IsOptional()
  @IsEnum(TicketCategory)
  category?: TicketCategory;

  @IsOptional()
  @IsMongoId()
  userId?: string;

  @IsOptional()
  @IsMongoId()
  assignedTo?: string;

  @IsOptional()
  @IsString()
  searchTerm?: string; // For searching in subject or messages

  @IsOptional()
  isEscalated?: boolean;

  @IsOptional()
  limit?: number;

  @IsOptional()
  page?: number;
}
