import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from '../../users/entities/user.entity';

export enum MessageSender {
  USER = 'USER',
  ADMIN = 'ADMIN',
  SYSTEM = 'SYSTEM',
}

export type TicketMessageDocument = TicketMessage & Document;

@Schema({ timestamps: true })
export class TicketMessage {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'SupportTicket', required: true })
  ticketId: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  senderId: User;

  @Prop({ 
    type: String, 
    enum: Object.values(MessageSender),
    required: true,
  })
  senderType: MessageSender;

  @Prop({ required: true })
  message: string;

  @Prop({ type: [String] })
  attachments: string[];

  @Prop({ type: Boolean, default: false })
  isInternal: boolean; // For admin-only notes

  @Prop({ type: Boolean, default: false })
  isRead: boolean;

  @Prop({ type: Date })
  readAt: Date;
}

export const TicketMessageSchema = SchemaFactory.createForClass(TicketMessage);
