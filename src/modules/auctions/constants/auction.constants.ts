import { AuctionStatus } from '../interfaces/auction.interface';

/**
 * Auction-related constants and configurations
 */
export const AUCTION_CONSTANTS = {
  // Collection name
  COLLECTION_NAME: 'auctions',
  
  // Content limits
  TITLE_MAX_LENGTH: 255,
  DESCRIPTION_MAX_LENGTH: 1000,
  
  // Timing
  MIN_AUCTION_DURATION: 30 * 60 * 1000, // 30 minutes in milliseconds
  MAX_AUCTION_DURATION: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
  EXTENSION_TRIGGER_TIME: 5 * 60 * 1000, // 5 minutes in milliseconds
  
  // Bidding
  MIN_BID_INCREMENT: 1,
  MAX_BID_INCREMENT: 10000,
  MIN_START_PRICE: 1,
  MIN_FEE_PERCENTAGE: 0,
  MAX_FEE_PERCENTAGE: 20,
  
  // Processing
  AUTO_PROCESS_DELAY: 2 * 60 * 1000, // 2 minutes delay after auction ends
  REFUND_BATCH_SIZE: 50,
  
  // Pagination
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const;

/**
 * Default auction configuration
 */
export const AUCTION_DEFAULTS = {
  status: AuctionStatus.UPCOMING,
  bidIncrement: 100,
  feePercentage: 5,
  autoExtend: true,
  extensionMinutes: 5,
  bidCount: 0,
  currentTopBid: 0,
  isProcessed: false,
} as const;

/**
 * Auction validation rules
 */
export const AUCTION_VALIDATION = {
  TITLE_MIN_LENGTH: 3,
  TITLE_MAX_LENGTH: AUCTION_CONSTANTS.TITLE_MAX_LENGTH,
  DESCRIPTION_MAX_LENGTH: AUCTION_CONSTANTS.DESCRIPTION_MAX_LENGTH,
  MIN_START_PRICE: AUCTION_CONSTANTS.MIN_START_PRICE,
  MIN_BID_INCREMENT: AUCTION_CONSTANTS.MIN_BID_INCREMENT,
  MAX_BID_INCREMENT: AUCTION_CONSTANTS.MAX_BID_INCREMENT,
  MIN_FEE_PERCENTAGE: AUCTION_CONSTANTS.MIN_FEE_PERCENTAGE,
  MAX_FEE_PERCENTAGE: AUCTION_CONSTANTS.MAX_FEE_PERCENTAGE,
  MIN_EXTENSION_MINUTES: 1,
  MAX_EXTENSION_MINUTES: 60,
} as const;

/**
 * Auction error messages
 */
export const AUCTION_ERROR_MESSAGES = {
  NOT_FOUND: 'Auction not found',
  ALREADY_EXISTS: 'An auction for this product already exists',
  INVALID_STATUS: 'Invalid auction status',
  AUCTION_NOT_ACTIVE: 'Auction is not currently active',
  AUCTION_ENDED: 'Auction has already ended',
  AUCTION_NOT_STARTED: 'Auction has not started yet',
  INSUFFICIENT_BID: 'Bid amount is too low',
  INVALID_BID_INCREMENT: 'Bid increment must be positive',
  SELF_BIDDING: 'Cannot bid on your own auction',
  INSUFFICIENT_FUNDS: 'Insufficient funds to place bid',
  DUPLICATE_BID: 'Cannot place identical bid amount',
  RESERVE_NOT_MET: 'Reserve price has not been met',
  ALREADY_HIGHEST_BIDDER: 'You are already the highest bidder',
  AUCTION_CANCELLED: 'Auction has been cancelled',
  CANNOT_EDIT_ACTIVE: 'Cannot edit active auction',
  CANNOT_CANCEL_WITH_BIDS: 'Cannot cancel auction with existing bids',
  INVALID_TIME_RANGE: 'Invalid start/end time range',
  PAST_START_TIME: 'Start time cannot be in the past',
  DURATION_TOO_SHORT: 'Auction duration is too short',
  DURATION_TOO_LONG: 'Auction duration is too long',
} as const;

/**
 * Auction success messages
 */
export const AUCTION_SUCCESS_MESSAGES = {
  CREATED: 'Auction created successfully',
  UPDATED: 'Auction updated successfully',
  CANCELLED: 'Auction cancelled successfully',
  BID_PLACED: 'Bid placed successfully',
  BID_REFUNDED: 'Bid refunded successfully',
  AUCTION_COMPLETED: 'Auction completed successfully',
  WINNER_NOTIFIED: 'Winner has been notified',
  REFUNDS_PROCESSED: 'All refunds have been processed',
} as const;

/**
 * Auction notification types
 */
export const AUCTION_NOTIFICATION_TYPES = {
  BID_PLACED: 'bid_placed',
  OUTBID: 'outbid',
  AUCTION_WON: 'auction_won',
  AUCTION_ENDED: 'auction_ended',
  REFUND_PROCESSED: 'refund_processed',
  AUCTION_STARTING: 'auction_starting',
  AUCTION_EXTENDED: 'auction_extended',
} as const;

/**
 * Auction activity log types
 */
export const AUCTION_ACTIVITY_TYPES = {
  CREATED: 'auction_created',
  UPDATED: 'auction_updated',
  CANCELLED: 'auction_cancelled',
  BID_PLACED: 'bid_placed',
  BID_REFUNDED: 'bid_refunded',
  EXTENDED: 'auction_extended',
  COMPLETED: 'auction_completed',
  WINNER_DECLARED: 'winner_declared',
} as const;

/**
 * Auction status transitions
 */
export const AUCTION_STATUS_TRANSITIONS: Record<AuctionStatus, AuctionStatus[]> = {
  [AuctionStatus.UPCOMING]: [AuctionStatus.ACTIVE, AuctionStatus.CANCELLED],
  [AuctionStatus.ACTIVE]: [AuctionStatus.ENDED, AuctionStatus.CANCELLED],
  [AuctionStatus.ENDED]: [AuctionStatus.COMPLETED, AuctionStatus.EXPIRED],
  [AuctionStatus.CANCELLED]: [], // Terminal state
  [AuctionStatus.COMPLETED]: [], // Terminal state
  [AuctionStatus.EXPIRED]: [], // Terminal state
};

/**
 * Fee calculation helpers
 */
export const FEE_CALCULATOR = {
  calculateBidFee: (bidAmount: number, feePercentage: number): number => {
    return Math.round((bidAmount * feePercentage) / 100);
  },
  
  calculateNetBidAmount: (bidAmount: number, feePercentage: number): number => {
    const fee = FEE_CALCULATOR.calculateBidFee(bidAmount, feePercentage);
    return bidAmount - fee;
  },
  
  calculateMinimumBid: (currentTopBid: number, bidIncrement: number): number => {
    return currentTopBid + bidIncrement;
  },
} as const;
