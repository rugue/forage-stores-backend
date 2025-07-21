import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { 
  IsString, 
  IsNotEmpty, 
  IsOptional, 
  IsEnum,
  IsMongoId,
  IsNumber,
  Min,
  Max,
  IsBoolean,
  IsDate,
  IsArray,
  ValidateNested,
  MinLength,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AuctionStatus } from '../interfaces/auction.interface';
import { AUCTION_VALIDATION } from '../constants/auction.constants';

/**
 * Create auction DTO
 */
export class CreateAuctionDto {
  @ApiProperty({
    description: 'Product ID being auctioned',
    example: '507f1f77bcf86cd799439011'
  })
  @IsMongoId()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({
    description: 'Auction title',
    example: 'Flash Sale: Premium Pizza',
    minLength: AUCTION_VALIDATION.TITLE_MIN_LENGTH,
    maxLength: AUCTION_VALIDATION.TITLE_MAX_LENGTH
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(AUCTION_VALIDATION.TITLE_MIN_LENGTH)
  @MaxLength(AUCTION_VALIDATION.TITLE_MAX_LENGTH)
  title: string;

  @ApiPropertyOptional({
    description: 'Auction description',
    example: 'Limited time auction for premium pizza with special toppings',
    maxLength: AUCTION_VALIDATION.DESCRIPTION_MAX_LENGTH
  })
  @IsString()
  @IsOptional()
  @MaxLength(AUCTION_VALIDATION.DESCRIPTION_MAX_LENGTH)
  description?: string;

  @ApiProperty({
    description: 'Starting price in food points',
    required: true,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  startPrice: number;

  @ApiProperty({
    description: 'Reserve price in food points (minimum acceptable winning bid)',
    required: false,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  reservePrice?: number;

  @ApiProperty({
    description: 'Minimum bid increment',
    required: false,
    default: 100,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  @IsOptional()
  bidIncrement?: number;

  @ApiProperty({
    description: 'Start time of the auction',
    required: true,
  })
  @IsDate()
  @Type(() => Date)
  startTime: Date;

  @ApiProperty({
    description: 'End time of the auction',
    required: true,
  })
  @IsDate()
  @Type(() => Date)
  endTime: Date;

  @ApiProperty({
    description: 'Fee percentage charged on bids (non-refundable)',
    required: false,
    default: 5,
    minimum: 0,
    maximum: 100,
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  feePercentage?: number;

  @ApiProperty({
    description: 'Whether auto-extension is enabled',
    required: false,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  autoExtend?: boolean;

  @ApiProperty({
    description: 'Extension time in minutes if bid placed near end time',
    required: false,
    default: 5,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  @IsOptional()
  extensionMinutes?: number;
}

export class PlaceBidDto {
  @ApiProperty({
    description: 'Bid amount in food points',
    required: true,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  amount: number;
}

export class UpdateAuctionDto {
  @ApiProperty({
    description: 'Auction title',
    required: false,
  })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({
    description: 'Auction description',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Reserve price in food points',
    required: false,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  reservePrice?: number;

  @ApiProperty({
    description: 'Minimum bid increment',
    required: false,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  @IsOptional()
  bidIncrement?: number;

  @ApiProperty({
    description: 'Start time of the auction',
    required: false,
  })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  startTime?: Date;

  @ApiProperty({
    description: 'End time of the auction',
    required: false,
  })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  endTime?: Date;

  @ApiProperty({
    description: 'Auction status',
    required: false,
    enum: AuctionStatus,
  })
  @IsEnum(AuctionStatus)
  @IsOptional()
  status?: AuctionStatus;

  @ApiProperty({
    description: 'Fee percentage charged on bids',
    required: false,
    minimum: 0,
    maximum: 100,
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  feePercentage?: number;

  @ApiProperty({
    description: 'Whether auto-extension is enabled',
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  autoExtend?: boolean;

  @ApiProperty({
    description: 'Extension time in minutes',
    required: false,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  @IsOptional()
  extensionMinutes?: number;
}

export class AuctionFilterDto {
  @ApiProperty({
    description: 'Product ID',
    required: false,
  })
  @IsMongoId()
  @IsOptional()
  productId?: string;

  @ApiProperty({
    description: 'Auction status',
    required: false,
    enum: AuctionStatus,
  })
  @IsEnum(AuctionStatus)
  @IsOptional()
  status?: AuctionStatus;

  @ApiProperty({
    description: 'User ID who has placed bids in the auction',
    required: false,
  })
  @IsMongoId()
  @IsOptional()
  bidderId?: string;

  @ApiProperty({
    description: 'User ID who is currently winning the auction',
    required: false,
  })
  @IsMongoId()
  @IsOptional()
  currentTopBidder?: string;

  @ApiProperty({
    description: 'User ID who won the auction',
    required: false,
  })
  @IsMongoId()
  @IsOptional()
  winnerId?: string;

  @ApiProperty({
    description: 'Minimum current top bid',
    required: false,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  minTopBid?: number;

  @ApiProperty({
    description: 'Maximum current top bid',
    required: false,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  maxTopBid?: number;

  @ApiProperty({
    description: 'Include only active and upcoming auctions',
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  activeOnly?: boolean;

  @ApiProperty({
    description: 'Include only unprocessed ended auctions',
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  unprocessedOnly?: boolean;
}

export class BidResponseDto {
  @ApiProperty({ description: 'User ID who placed the bid' })
  userId: string;

  @ApiProperty({ description: 'Bid amount in food points' })
  amount: number;

  @ApiProperty({ description: 'Timestamp when the bid was placed' })
  timestamp: Date;

  @ApiProperty({ description: 'Status of the bid (active, winning, refunded)' })
  status: string;

  @ApiProperty({ description: 'Reference ID for the refund', required: false })
  refundRef?: string;

  @ApiProperty({ description: 'Timestamp when the bid was refunded', required: false })
  refundTimestamp?: Date;
}

export class AuctionResponseDto {
  @ApiProperty({ description: 'Auction ID' })
  _id: string;

  @ApiProperty({ description: 'Product ID being auctioned' })
  productId: string;

  @ApiProperty({ description: 'Auction title' })
  title: string;

  @ApiProperty({ description: 'Auction description', required: false })
  description?: string;

  @ApiProperty({ description: 'Starting price in food points' })
  startPrice: number;

  @ApiProperty({ description: 'Reserve price in food points (minimum acceptable winning bid)', required: false })
  reservePrice?: number;

  @ApiProperty({ description: 'Minimum bid increment' })
  bidIncrement: number;

  @ApiProperty({ description: 'Start time of the auction' })
  startTime: Date;

  @ApiProperty({ description: 'End time of the auction' })
  endTime: Date;

  @ApiProperty({ description: 'Current top bid amount' })
  currentTopBid: number;

  @ApiProperty({ description: 'User ID of the current top bidder', required: false })
  currentTopBidder?: string;

  @ApiProperty({ description: 'User ID of the auction winner', required: false })
  winnerId?: string;

  @ApiProperty({ description: 'Winning bid amount', required: false })
  winningBid?: number;

  @ApiProperty({ description: 'Total number of bids placed' })
  bidCount: number;

  @ApiProperty({ description: 'List of bids placed', type: [BidResponseDto] })
  bids: BidResponseDto[];

  @ApiProperty({ description: 'Auction status', enum: AuctionStatus })
  status: AuctionStatus;

  @ApiProperty({ description: 'Whether the auction has been processed' })
  isProcessed: boolean;

  @ApiProperty({ description: 'Fee percentage charged on bids' })
  feePercentage: number;

  @ApiProperty({ description: 'Whether auto-extension is enabled' })
  autoExtend: boolean;

  @ApiProperty({ description: 'Extension time in minutes if bid placed near end time', required: false })
  extensionMinutes?: number;

  @ApiProperty({ description: 'Last time the auction was extended', required: false })
  lastExtensionTime?: Date;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;
}
