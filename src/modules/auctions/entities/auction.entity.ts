import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import {
  AuctionStatus,
  BidStatus,
  PaymentStatus,
  PaymentMethod,
} from '../../../shared/enums';

// Export the enums for external use
export { AuctionStatus, BidStatus, PaymentStatus, PaymentMethod };

// Constants
export const AUCTION_CONSTANTS = {
  COLLECTION_NAME: 'auctions',
  TITLE_MAX_LENGTH: 200,
  DESCRIPTION_MAX_LENGTH: 1000,
};

export const AUCTION_DEFAULTS = {
  bidIncrement: 10,
  status: AuctionStatus.UPCOMING,
  feePercentage: 5,
  autoExtend: true,
  extensionMinutes: 5,
};

// Type definitions
export type AuctionDocument = Auction & Document;
export type BidDocument = Bid & Document;

@Schema({ 
  timestamps: true, 
  _id: false,
  toJSON: {
    transform: (doc, ret) => {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
})
export class Bid extends Document {
  @Prop({ 
    required: true, 
    type: Types.ObjectId, 
    ref: 'User',

  })
  userId: Types.ObjectId;

  @Prop({ 
    required: true, 
    type: Number, 
    min: 0 
  })
  amount: number;

  @Prop({ 
    required: true, 
    type: Date, 
    default: Date.now,

  })
  timestamp: Date;

  @Prop({ 
    required: true, 
    type: String, 
    enum: Object.values(BidStatus),
    default: BidStatus.ACTIVE
  })
  status: BidStatus;

  @Prop({ 
    required: false, 
    type: String 
  })
  refundRef?: string;

  @Prop({ 
    required: false, 
    type: Date 
  })
  refundTimestamp?: Date;

  @Prop({
    type: Date,
    default: Date.now,

  })
  createdAt: Date;

  @Prop({
    type: Date,
    default: Date.now,
  })
  updatedAt: Date;
}

@Schema({ 
  collection: AUCTION_CONSTANTS.COLLECTION_NAME,
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
export class Auction extends Document {
  @Prop({ 
    required: true, 
    type: Types.ObjectId, 
    ref: 'Product',

  })
  productId: Types.ObjectId;

  @Prop({ 
    required: true, 
    type: String, 
    maxlength: AUCTION_CONSTANTS.TITLE_MAX_LENGTH,
    trim: true
  })
  title: string;

  @Prop({ 
    required: false, 
    type: String, 
    maxlength: AUCTION_CONSTANTS.DESCRIPTION_MAX_LENGTH,
    trim: true
  })
  description?: string;

  @Prop({ 
    required: true, 
    type: Number, 
    min: 0 
  })
  startPrice: number;

  @Prop({ 
    required: false, 
    type: Number, 
    min: 0 
  })
  reservePrice?: number;

  @Prop({ 
    required: true, 
    type: Number, 
    default: 0, 
    min: 0 
  })
  currentTopBid: number;

  @Prop({ 
    required: false, 
    type: Types.ObjectId, 
    ref: 'User',

  })
  currentTopBidder?: Types.ObjectId;

  @Prop({ 
    required: true, 
    type: Number, 
    min: 1, 
    default: AUCTION_DEFAULTS.bidIncrement
  })
  bidIncrement: number;

  @Prop({ 
    required: true, 
    type: Date,

  })
  startTime: Date;

  @Prop({ 
    required: true, 
    type: Date,

  })
  endTime: Date;

  @Prop({ 
    required: true, 
    enum: Object.values(AuctionStatus), 
    default: AUCTION_DEFAULTS.status,

  })
  status: AuctionStatus;

  @Prop({ 
    required: true, 
    type: [Object], 
    default: [] 
  })
  bids: Bid[];

  @Prop({ 
    required: true, 
    type: Number, 
    default: 0 
  })
  bidCount: number;

  @Prop({ 
    required: true, 
    type: Number, 
    min: 0, 
    max: 100, 
    default: AUCTION_DEFAULTS.feePercentage
  })
  feePercentage: number;

  @Prop({ 
    required: true, 
    type: Boolean, 
    default: AUCTION_DEFAULTS.autoExtend
  })
  autoExtend: boolean;

  @Prop({ 
    required: true, 
    type: Number, 
    min: 1, 
    default: AUCTION_DEFAULTS.extensionMinutes
  })
  extensionMinutes: number;

  @Prop({ 
    required: false, 
    type: Date 
  })
  lastExtensionTime?: Date;

  @Prop({ 
    required: false, 
    type: Types.ObjectId, 
    ref: 'User',

  })
  winnerId?: Types.ObjectId;

  @Prop({ 
    required: false, 
    type: Number 
  })
  winningBid?: number;

  @Prop({ 
    required: true, 
    type: Boolean, 
    default: false 
  })
  isProcessed: boolean;

  @Prop({
    type: Date,
    default: Date.now,

  })
  createdAt: Date;

  @Prop({
    type: Date,
    default: Date.now,
  })
  updatedAt: Date;

  // Virtual properties
  get isActive(): boolean {
    const now = new Date();
    return this.status === AuctionStatus.ACTIVE && 
           now >= this.startTime && 
           now < this.endTime;
  }

  get hasEnded(): boolean {
    const now = new Date();
    return now >= this.endTime || 
           this.status === AuctionStatus.ENDED ||
           this.status === AuctionStatus.COMPLETED ||
           this.status === AuctionStatus.CANCELLED;
  }

  get timeRemaining(): number {
    if (this.hasEnded) return 0;
    const now = new Date();
    return Math.max(0, this.endTime.getTime() - now.getTime());
  }

  get hasReserveBeenMet(): boolean {
    if (!this.reservePrice) return true;
    return this.currentTopBid >= this.reservePrice;
  }
}

export const BidSchema = SchemaFactory.createForClass(Bid);
export const AuctionSchema = SchemaFactory.createForClass(Auction);

// Pre-save middleware to update auction status
AuctionSchema.pre('save', function (next) {
  const now = new Date();
  
  // Only update status if auction is not cancelled
  if (this.status !== AuctionStatus.CANCELLED) {
    if (now < this.startTime) {
      this.status = AuctionStatus.UPCOMING;
    } else if (now >= this.startTime && now < this.endTime) {
      this.status = AuctionStatus.ACTIVE;
    } else if (now >= this.endTime && this.status !== AuctionStatus.COMPLETED) {
      this.status = AuctionStatus.ENDED;
    }
  }

  next();
});

// Indexes for better query performance
AuctionSchema.index({ productId: 1 });
AuctionSchema.index({ status: 1 });
AuctionSchema.index({ startTime: 1 });
AuctionSchema.index({ endTime: 1 });
AuctionSchema.index({ currentTopBidder: 1 });
AuctionSchema.index({ winnerId: 1 });
AuctionSchema.index({ 'bids.userId': 1 });
AuctionSchema.index({ createdAt: -1 });
AuctionSchema.index({ status: 1, startTime: 1 });
AuctionSchema.index({ status: 1, endTime: 1 });
