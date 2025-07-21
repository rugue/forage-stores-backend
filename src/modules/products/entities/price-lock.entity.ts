import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from '../../users/entities/user.entity';
import { Product } from './product.entity';

export enum PriceLockStatus {
  ACTIVE = 'ACTIVE',
  USED = 'USED',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
}

export type PriceLockDocument = PriceLock & Document;

@Schema({ timestamps: true })
export class PriceLock {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  userId: User;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Product', required: true })
  productId: Product;

  @Prop({ required: true })
  price: number;

  @Prop({ 
    type: String, 
    enum: Object.values(PriceLockStatus), 
    default: PriceLockStatus.ACTIVE 
  })
  status: PriceLockStatus;

  @Prop({ required: true })
  expiryDate: Date;

  @Prop({ required: true })
  maxQuantity: number;

  @Prop({ default: 0 })
  usedQuantity: number;
}

export const PriceLockSchema = SchemaFactory.createForClass(PriceLock);
