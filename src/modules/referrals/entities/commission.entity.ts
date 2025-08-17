import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type CommissionDocument = Commission & Document;

export enum CommissionType {
  NORMAL_REFERRAL = 'normal_referral',
  GA_REFERRAL = 'ga_referral',
  GE_REFERRAL = 'ge_referral',
  GE_CITY_REVENUE = 'ge_city_revenue',
}

export enum CommissionStatus {
  PENDING = 'pending',
  PROCESSED = 'processed',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
}

@Schema({ 
  collection: 'commissions',
  timestamps: true,
  toJSON: {
    transform: (doc, ret) => {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
})
export class Commission extends Document {
  @ApiProperty({ description: 'Commission ID' })
  id: string;

  @ApiProperty({ description: 'User who earned the commission' })
  @Prop({ 
    required: true, 
    type: Types.ObjectId, 
    ref: 'User',
    index: true
  })
  userId: Types.ObjectId;

  @ApiProperty({ description: 'Related order (if applicable)' })
  @Prop({ 
    required: false, 
    type: Types.ObjectId, 
    ref: 'Order',
    index: true
  })
  orderId?: Types.ObjectId;

  @ApiProperty({ description: 'User who made the purchase (referred user)' })
  @Prop({ 
    required: false, 
    type: Types.ObjectId, 
    ref: 'User',
    index: true
  })
  referredUserId?: Types.ObjectId;

  @ApiProperty({ description: 'Commission amount in Nibia' })
  @Prop({ 
    required: true, 
    type: Number, 
    min: 0 
  })
  amount: number;

  @ApiProperty({ description: 'Commission type' })
  @Prop({ 
    required: true, 
    enum: Object.values(CommissionType),
    index: true
  })
  type: CommissionType;

  @ApiProperty({ description: 'Commission status' })
  @Prop({ 
    required: true, 
    enum: Object.values(CommissionStatus),
    default: CommissionStatus.PENDING,
    index: true
  })
  status: CommissionStatus;

  @ApiProperty({ description: 'Commission rate percentage' })
  @Prop({ 
    required: true, 
    type: Number, 
    min: 0, 
    max: 100 
  })
  rate: number;

  @ApiProperty({ description: 'Order amount (if applicable)' })
  @Prop({ 
    required: false, 
    type: Number, 
    min: 0 
  })
  orderAmount?: number;

  @ApiProperty({ description: 'City where the commission was earned' })
  @Prop({ 
    required: true, 
    type: String,
    index: true
  })
  city: string;

  @ApiProperty({ description: 'Date when commission was earned' })
  @Prop({ 
    required: true, 
    type: Date, 
    default: Date.now,
    index: true
  })
  earnedAt: Date;

  @ApiProperty({ description: 'Date when commission was processed' })
  @Prop({ 
    required: false, 
    type: Date
  })
  processedAt?: Date;

  @ApiProperty({ description: 'Additional metadata' })
  @Prop({ 
    required: false, 
    type: Object
  })
  metadata?: Record<string, any>;

  @ApiProperty({ description: 'Created at timestamp' })
  @Prop({
    type: Date,
    default: Date.now,
    index: true,
  })
  createdAt: Date;

  @ApiProperty({ description: 'Updated at timestamp' })
  @Prop({
    type: Date,
    default: Date.now,
  })
  updatedAt: Date;
}

export const CommissionSchema = SchemaFactory.createForClass(Commission);

// Indexes for better query performance
CommissionSchema.index({ userId: 1, status: 1 });
CommissionSchema.index({ userId: 1, type: 1 });
CommissionSchema.index({ userId: 1, city: 1 });
CommissionSchema.index({ userId: 1, earnedAt: -1 });
CommissionSchema.index({ orderId: 1 }, { sparse: true });
CommissionSchema.index({ referredUserId: 1 }, { sparse: true });
CommissionSchema.index({ city: 1, earnedAt: -1 });
CommissionSchema.index({ status: 1, earnedAt: -1 });
