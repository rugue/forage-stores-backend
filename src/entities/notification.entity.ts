import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from './user.entity';

export enum NotificationChannel {
  EMAIL = 'EMAIL',
  PUSH = 'PUSH',
  WHATSAPP = 'WHATSAPP',
}

export enum NotificationType {
  ORDER_UPDATE = 'ORDER_UPDATE',
  PAYMENT_REMINDER = 'PAYMENT_REMINDER',
  AUCTION_EVENT = 'AUCTION_EVENT',
  RIDER_ASSIGNMENT = 'RIDER_ASSIGNMENT',
  GENERAL = 'GENERAL',
  DROP_REMINDER = 'DROP_REMINDER',
  PRICE_LOCK_EXPIRED = 'PRICE_LOCK_EXPIRED',
  AUCTION_WIN = 'AUCTION_WIN',
  AUCTION_REFUND = 'AUCTION_REFUND',
}

export type NotificationDocument = Notification & Document;

@Schema({ timestamps: true })
export class Notification {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  recipientId: User;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  message: string;

  @Prop({ 
    type: String, 
    enum: Object.values(NotificationType),
    required: true,
  })
  type: NotificationType;

  @Prop({ 
    type: String, 
    enum: Object.values(NotificationChannel),
    required: true,
  })
  channel: NotificationChannel;

  @Prop({ type: Boolean, default: false })
  read: boolean;

  @Prop({ type: Date })
  readAt: Date;

  @Prop({ type: MongooseSchema.Types.Mixed })
  metadata: Record<string, any>;

  @Prop({ type: Boolean, default: true })
  success: boolean;

  @Prop({ type: String })
  errorMessage: string;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
