import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  Min,
  IsOptional,
  IsDate,
  IsEnum,
  IsBoolean,
  IsArray,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export type AuctionDocument = Auction & Document;

export enum AuctionStatus {
  UPCOMING = 'upcoming',
  ACTIVE = 'active',
  ENDED = 'ended',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
  EXPIRED = 'expired',
}

@Schema({ timestamps: true, _id: false })
export class Bid {
  @ApiProperty({ description: 'User ID who placed the bid' })
  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  userId: Types.ObjectId;

  @ApiProperty({ description: 'Bid amount in food points' })
  @Prop({ required: true, type: Number, min: 0 })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({ description: 'Time the bid was placed' })
  @Prop({ required: true, type: Date, default: Date.now })
  @IsDate()
  timestamp: Date;

  @ApiProperty({ description: 'Bid status (active, refunded, winning)' })
  @Prop({ required: true, type: String, enum: ['active', 'refunded', 'winning'] })
  @IsString()
  status: string;

  @ApiProperty({ description: 'Refund transaction reference' })
  @Prop({ required: false, type: String })
  @IsOptional()
  @IsString()
  refundRef?: string;

  @ApiProperty({ description: 'Refund timestamp' })
  @Prop({ required: false, type: Date })
  @IsOptional()
  @IsDate()
  refundTimestamp?: Date;
}

@Schema({ timestamps: true })
export class Auction {
  @ApiProperty({ description: 'Product ID being auctioned' })
  @Prop({ required: true, type: Types.ObjectId, ref: 'Product' })
  @IsString()
  @IsNotEmpty()
  productId: Types.ObjectId;

  @ApiProperty({ description: 'Auction title' })
  @Prop({ required: true, type: String, maxlength: 255 })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'Auction description' })
  @Prop({ required: false, type: String, maxlength: 1000 })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Starting price in food points' })
  @Prop({ required: true, type: Number, min: 0 })
  @IsNumber()
  @Min(0)
  startPrice: number;

  @ApiProperty({ description: 'Reserve price in food points (minimum acceptable winning bid)' })
  @Prop({ required: false, type: Number, min: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  reservePrice?: number;

  @ApiProperty({ description: 'Current top bid amount' })
  @Prop({ required: true, type: Number, default: 0, min: 0 })
  @IsNumber()
  @Min(0)
  currentTopBid: number;

  @ApiProperty({ description: 'User ID with the current top bid' })
  @Prop({ required: false, type: Types.ObjectId, ref: 'User' })
  @IsOptional()
  @IsString()
  currentTopBidder?: Types.ObjectId;

  @ApiProperty({ description: 'Minimum bid increment' })
  @Prop({ required: true, type: Number, min: 1, default: 100 })
  @IsNumber()
  @Min(1)
  bidIncrement: number;

  @ApiProperty({ description: 'Start time of the auction' })
  @Prop({ required: true, type: Date })
  @IsDate()
  startTime: Date;

  @ApiProperty({ description: 'End time of the auction' })
  @Prop({ required: true, type: Date })
  @IsDate()
  endTime: Date;

  @ApiProperty({ description: 'Auction status', enum: AuctionStatus })
  @Prop({ required: true, enum: Object.values(AuctionStatus), default: AuctionStatus.UPCOMING })
  @IsEnum(AuctionStatus)
  status: AuctionStatus;

  @ApiProperty({ description: 'All bids placed in the auction', type: [Bid] })
  @Prop({ required: true, type: [Object], default: [] })
  @IsArray()
  bids: Bid[];

  @ApiProperty({ description: 'Total number of bids placed' })
  @Prop({ required: true, type: Number, default: 0 })
  @IsNumber()
  @Min(0)
  bidCount: number;

  @ApiProperty({ description: 'Fee percentage charged on bids (non-refundable)' })
  @Prop({ required: true, type: Number, min: 0, max: 100, default: 5 })
  @IsNumber()
  @Min(0)
  feePercentage: number;

  @ApiProperty({ description: 'Whether auto-extension is enabled' })
  @Prop({ required: true, type: Boolean, default: true })
  @IsBoolean()
  autoExtend: boolean;

  @ApiProperty({ description: 'Extension time in minutes if bid placed near end time' })
  @Prop({ required: true, type: Number, min: 1, default: 5 })
  @IsNumber()
  @Min(1)
  extensionMinutes: number;

  @ApiProperty({ description: 'Last extension time' })
  @Prop({ required: false, type: Date })
  @IsOptional()
  @IsDate()
  lastExtensionTime?: Date;

  @ApiProperty({ description: 'Winner user ID' })
  @Prop({ required: false, type: Types.ObjectId, ref: 'User' })
  @IsOptional()
  @IsString()
  winnerId?: Types.ObjectId;

  @ApiProperty({ description: 'Winning bid amount' })
  @Prop({ required: false, type: Number })
  @IsOptional()
  @IsNumber()
  winningBid?: number;

  @ApiProperty({ description: 'Completion status for refunds and winner marking' })
  @Prop({ required: true, type: Boolean, default: false })
  @IsBoolean()
  isProcessed: boolean;
}

export const BidSchema = SchemaFactory.createForClass(Bid);
export const AuctionSchema = SchemaFactory.createForClass(Auction);

// Pre-save middleware
AuctionSchema.pre('save', function (next) {
  // Update auction status based on time
  const now = new Date();
  
  if (this.status !== AuctionStatus.CANCELLED) {
    if (now < this.startTime) {
      this.status = AuctionStatus.UPCOMING;
    } else if (now >= this.startTime && now < this.endTime) {
      this.status = AuctionStatus.ACTIVE;
    } else if (now >= this.endTime) {
      this.status = AuctionStatus.ENDED;
    }
  }

  next();
});

// Add indexes for better query performance
AuctionSchema.index({ productId: 1 });
AuctionSchema.index({ status: 1 });
AuctionSchema.index({ startTime: 1 });
AuctionSchema.index({ endTime: 1 });
AuctionSchema.index({ 'bids.userId': 1 });
AuctionSchema.index({ currentTopBidder: 1 });
AuctionSchema.index({ winnerId: 1 });
