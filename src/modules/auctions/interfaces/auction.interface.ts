import { Document, Types } from 'mongoose';

/**
 * Auction status enumeration
 */
export enum AuctionStatus {
  UPCOMING = 'upcoming',
  ACTIVE = 'active',
  ENDED = 'ended',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
  EXPIRED = 'expired',
}

/**
 * Bid status enumeration
 */
export enum BidStatus {
  ACTIVE = 'active',
  REFUNDED = 'refunded',
  WINNING = 'winning',
}

/**
 * Bid interface
 */
export interface IBid {
  userId: Types.ObjectId;
  amount: number;
  timestamp: Date;
  status: BidStatus;
  refundRef?: string;
  refundTimestamp?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Bid document interface extending Mongoose Document
 */
export interface IBidDocument extends IBid, Document {}

/**
 * Auction interface
 */
export interface IAuction {
  productId: Types.ObjectId;
  title: string;
  description?: string;
  startPrice: number;
  reservePrice?: number;
  currentTopBid: number;
  currentTopBidder?: Types.ObjectId;
  bidIncrement: number;
  startTime: Date;
  endTime: Date;
  status: AuctionStatus;
  bids: IBid[];
  bidCount: number;
  feePercentage: number;
  autoExtend: boolean;
  extensionMinutes: number;
  lastExtensionTime?: Date;
  winnerId?: Types.ObjectId;
  winningBid?: number;
  isProcessed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Auction document interface extending Mongoose Document
 */
export interface IAuctionDocument extends IAuction, Document {
  readonly isActive: boolean;
  readonly hasEnded: boolean;
  readonly timeRemaining: number;
  readonly hasReserveBeenMet: boolean;
}

/**
 * Create auction payload interface
 */
export interface ICreateAuctionPayload {
  productId: string;
  title: string;
  description?: string;
  startPrice: number;
  reservePrice?: number;
  bidIncrement?: number;
  startTime: Date;
  endTime: Date;
  feePercentage?: number;
  autoExtend?: boolean;
  extensionMinutes?: number;
}

/**
 * Update auction payload interface
 */
export interface IUpdateAuctionPayload {
  title?: string;
  description?: string;
  startPrice?: number;
  reservePrice?: number;
  bidIncrement?: number;
  startTime?: Date;
  endTime?: Date;
  feePercentage?: number;
  autoExtend?: boolean;
  extensionMinutes?: number;
}

/**
 * Place bid payload interface
 */
export interface IPlaceBidPayload {
  auctionId: string;
  userId: string;
  amount: number;
}

/**
 * Auction query filters interface
 */
export interface IAuctionQueryFilters {
  status?: AuctionStatus;
  productId?: string;
  userId?: string;
  startDate?: Date;
  endDate?: Date;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
}

/**
 * Auction statistics interface
 */
export interface IAuctionStats {
  totalAuctions: number;
  activeAuctions: number;
  completedAuctions: number;
  totalBids: number;
  totalRevenue: number;
  averageBidsPerAuction: number;
  byStatus: Record<AuctionStatus, number>;
}

/**
 * Bid validation result interface
 */
export interface IBidValidationResult {
  isValid: boolean;
  minimumBid: number;
  errors: string[];
}

/**
 * Auction completion result interface
 */
export interface IAuctionCompletionResult {
  auction: IAuction;
  winner?: {
    userId: Types.ObjectId;
    winningBid: number;
  };
  refundedBids: IBid[];
  totalRefundAmount: number;
}

/**
 * Auction notification data interface
 */
export interface IAuctionNotificationData {
  auctionId: string;
  title: string;
  userId?: string;
  amount?: number;
  type: 'bid_placed' | 'outbid' | 'auction_won' | 'auction_ended' | 'refund_processed';
}
