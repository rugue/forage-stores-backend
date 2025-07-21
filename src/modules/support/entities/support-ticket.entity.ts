import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from '../../users/entities/user.entity';

export enum TicketStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
  ESCALATED = 'ESCALATED',
  CLOSED = 'CLOSED',
}

export enum TicketPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum TicketCategory {
  ACCOUNT = 'ACCOUNT',
  ORDER = 'ORDER',
  PAYMENT = 'PAYMENT',
  DELIVERY = 'DELIVERY',
  PRODUCT = 'PRODUCT',
  TECHNICAL = 'TECHNICAL',
  FEEDBACK = 'FEEDBACK',
  OTHER = 'OTHER',
}

export type SupportTicketDocument = SupportTicket & Document;

@Schema({ timestamps: true })
export class SupportTicket {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  userId: User;

  @Prop({ required: true })
  subject: string;

  @Prop({ 
    type: String, 
    enum: Object.values(TicketStatus),
    default: TicketStatus.OPEN,
  })
  status: TicketStatus;

  @Prop({ 
    type: String, 
    enum: Object.values(TicketPriority),
    default: TicketPriority.MEDIUM,
  })
  priority: TicketPriority;

  @Prop({ 
    type: String, 
    enum: Object.values(TicketCategory),
    required: true,
  })
  category: TicketCategory;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  assignedTo: User;

  @Prop({ type: Date })
  lastUpdatedAt: Date;

  @Prop({ type: Boolean, default: false })
  isEscalated: boolean;

  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'TicketMessage' }] })
  messages: MongooseSchema.Types.ObjectId[];

  @Prop({ type: MongooseSchema.Types.Mixed })
  metadata: Record<string, any>;
}

export const SupportTicketSchema = SchemaFactory.createForClass(SupportTicket);
