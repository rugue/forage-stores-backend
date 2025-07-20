import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { 
  Auction, 
  AuctionDocument, 
  AuctionStatus, 
  Bid
} from '../../entities/auction.entity';
import { Product, ProductDocument } from '../../entities/product.entity';
import { User, UserDocument, UserRole } from '../../entities/user.entity';
import { Wallet, WalletDocument } from '../../entities/wallet.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType, NotificationChannel } from '../../entities/notification.entity';
import { 
  CreateAuctionDto, 
  UpdateAuctionDto, 
  PlaceBidDto,
  AuctionFilterDto
} from './dto';

@Injectable()
export class AuctionsService {
  private readonly logger = new Logger(AuctionsService.name);
  // Define how close to end time (in minutes) a bid can trigger extension
  private readonly EXTENSION_THRESHOLD_MINUTES = 5;

  constructor(
    @InjectModel(Auction.name) private auctionModel: Model<AuctionDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Wallet.name) private walletModel: Model<WalletDocument>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(createAuctionDto: CreateAuctionDto): Promise<Auction> {
    const { productId, startTime, endTime } = createAuctionDto;
    
    // Validate product exists
    const product = await this.productModel.findById(productId);
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    
    // Validate times
    const now = new Date();
    if (new Date(startTime) < now) {
      throw new BadRequestException('Start time must be in the future');
    }
    
    if (new Date(endTime) <= new Date(startTime)) {
      throw new BadRequestException('End time must be after start time');
    }
    
    // Create the auction
    const auction = new this.auctionModel({
      ...createAuctionDto,
      productId: new Types.ObjectId(productId),
      currentTopBid: 0,
      bidCount: 0,
      bids: [],
      status: AuctionStatus.UPCOMING,
      isProcessed: false,
    });
    
    return auction.save();
  }

  async findAll(filterDto: AuctionFilterDto = {}): Promise<Auction[]> {
    const { 
      productId, 
      status, 
      bidderId, 
      currentTopBidder, 
      winnerId, 
      minTopBid, 
      maxTopBid,
      activeOnly,
      unprocessedOnly
    } = filterDto;
    
    const filter: any = {};
    
    if (productId) {
      filter.productId = new Types.ObjectId(productId);
    }
    
    if (status) {
      filter.status = status;
    }
    
    if (activeOnly) {
      filter.status = { $in: [AuctionStatus.ACTIVE, AuctionStatus.UPCOMING] };
    }
    
    if (bidderId) {
      filter['bids.userId'] = new Types.ObjectId(bidderId);
    }
    
    if (currentTopBidder) {
      filter.currentTopBidder = new Types.ObjectId(currentTopBidder);
    }
    
    if (winnerId) {
      filter.winnerId = new Types.ObjectId(winnerId);
    }
    
    if (minTopBid !== undefined) {
      filter.currentTopBid = filter.currentTopBid || {};
      filter.currentTopBid.$gte = minTopBid;
    }
    
    if (maxTopBid !== undefined) {
      filter.currentTopBid = filter.currentTopBid || {};
      filter.currentTopBid.$lte = maxTopBid;
    }
    
    if (unprocessedOnly) {
      filter.status = AuctionStatus.ENDED;
      filter.isProcessed = false;
    }
    
    return this.auctionModel.find(filter).sort({ endTime: 1 }).exec();
  }

  async findOne(id: string): Promise<Auction> {
    const auction = await this.auctionModel.findById(id);
    if (!auction) {
      throw new NotFoundException('Auction not found');
    }
    return auction;
  }
  
  async findUserBids(userId: string): Promise<Auction[]> {
    return this.auctionModel.find({
      'bids.userId': new Types.ObjectId(userId)
    }).sort({ endTime: -1 }).exec();
  }
  
  async findUserWonAuctions(userId: string): Promise<Auction[]> {
    return this.auctionModel.find({
      winnerId: new Types.ObjectId(userId)
    }).sort({ endTime: -1 }).exec();
  }

  async update(id: string, updateAuctionDto: UpdateAuctionDto, userRole: UserRole): Promise<Auction> {
    // Only admins can update auctions
    if (userRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can update auctions');
    }
    
    const auction = await this.auctionModel.findById(id);
    if (!auction) {
      throw new NotFoundException('Auction not found');
    }
    
    // Don't allow changes to auctions that have bids
    if (auction.bidCount > 0 && (
      updateAuctionDto.startTime !== undefined ||
      updateAuctionDto.endTime !== undefined
    )) {
      throw new BadRequestException('Cannot change core auction details after bids have been placed');
    }
    
    // Don't allow shortening auction end time if there are bids
    if (updateAuctionDto.endTime && auction.bidCount > 0) {
      if (new Date(updateAuctionDto.endTime) < auction.endTime) {
        throw new BadRequestException('Cannot shorten auction duration after bids have been placed');
      }
    }
    
    // Update the auction
    Object.assign(auction, updateAuctionDto);
    return auction.save();
  }

  async placeBid(auctionId: string, userId: string, bidDto: PlaceBidDto): Promise<Auction> {
    const auction = await this.auctionModel.findById(auctionId);
    if (!auction) {
      throw new NotFoundException('Auction not found');
    }
    
    // Check if auction is active
    if (auction.status !== AuctionStatus.ACTIVE) {
      throw new BadRequestException(`Cannot place bid on ${auction.status} auction`);
    }
    
    // Validate bid amount against current top bid + increment
    const minimumBid = auction.currentTopBid === 0 
      ? auction.startPrice 
      : auction.currentTopBid + auction.bidIncrement;
    
    if (bidDto.amount < minimumBid) {
      throw new BadRequestException(`Bid must be at least ${minimumBid} food points`);
    }
    
    // Check if user has enough food points
    const wallet = await this.walletModel.findOne({ userId: new Types.ObjectId(userId) });
    if (!wallet) {
      throw new NotFoundException('User wallet not found');
    }
    
    if (wallet.foodPoints < bidDto.amount) {
      throw new BadRequestException(`Insufficient food points. Required: ${bidDto.amount}, Available: ${wallet.foodPoints}`);
    }
    
    // Place the bid
    const bid: Bid = {
      userId: new Types.ObjectId(userId),
      amount: bidDto.amount,
      timestamp: new Date(),
      status: 'active',
    };
    
    // Lock the bid amount in user's wallet
    wallet.foodPoints -= bidDto.amount;
    await wallet.save();
    
    // Update auction with new bid
    auction.bids.push(bid);
    auction.bidCount += 1;
    auction.currentTopBid = bidDto.amount;
    auction.currentTopBidder = new Types.ObjectId(userId);
    
    // Check if auto-extension is needed
    if (auction.autoExtend) {
      const now = new Date();
      const minutesToEnd = (auction.endTime.getTime() - now.getTime()) / (1000 * 60);
      
      if (minutesToEnd <= auction.extensionMinutes) {
        // Extend the auction end time
        const newEndTime = new Date(auction.endTime);
        newEndTime.setMinutes(newEndTime.getMinutes() + auction.extensionMinutes);
        auction.endTime = newEndTime;
        auction.lastExtensionTime = now;
        
        this.logger.log(`Auction ${auctionId} extended by ${auction.extensionMinutes} minutes due to last-minute bid`);
      }
    }
    
    await auction.save();
    
    return auction;
  }
  
  async cancelAuction(id: string, userRole: UserRole): Promise<Auction> {
    // Only admins can cancel auctions
    if (userRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can cancel auctions');
    }
    
    const auction = await this.auctionModel.findById(id);
    if (!auction) {
      throw new NotFoundException('Auction not found');
    }
    
    // Cancel auction and refund all bids
    auction.status = AuctionStatus.CANCELLED;
    
    // Process refunds for all bids
    await this.refundAllBids(auction);
    
    auction.isProcessed = true;
    return auction.save();
  }
  
  async finalizeAuction(id: string): Promise<Auction> {
    const auction = await this.auctionModel.findById(id);
    if (!auction) {
      throw new NotFoundException('Auction not found');
    }
    
    if (auction.status !== AuctionStatus.ENDED) {
      throw new BadRequestException('Only ended auctions can be finalized');
    }
    
    if (auction.isProcessed) {
      throw new BadRequestException('Auction has already been processed');
    }
    
    // If there are no bids, just mark as processed
    if (auction.bidCount === 0) {
      auction.isProcessed = true;
      return auction.save();
    }
    
    // Determine the winner
    const hasWinner = auction.currentTopBid > 0 && 
      (auction.reservePrice === undefined || auction.currentTopBid >= auction.reservePrice);
    
    if (hasWinner) {
      // Mark the winning bid
      const winningBidIndex = auction.bids.findIndex(
        bid => bid.userId.toString() === auction.currentTopBidder.toString() && 
               bid.amount === auction.currentTopBid
      );
      
      if (winningBidIndex !== -1) {
        auction.bids[winningBidIndex].status = 'winning';
        auction.winnerId = auction.currentTopBidder;
        auction.winningBid = auction.currentTopBid;
      }
    }
    
    // Refund all non-winning bids
    await this.refundLosingBids(auction);
    
    auction.isProcessed = true;
    return auction.save();
  }
  
  private async refundLosingBids(auction: AuctionDocument): Promise<void> {
    // Process refunds for all non-winning bids with status 'active'
    for (const bid of auction.bids) {
      if (bid.status === 'active') {
        // If this is not the winning bid, refund it (minus fee)
        if (!(auction.winnerId && 
            bid.userId.toString() === auction.winnerId.toString() && 
            bid.amount === auction.winningBid)) {
          
          await this.refundBid(bid, auction.feePercentage);
        }
      }
    }
  }
  
  private async refundAllBids(auction: AuctionDocument): Promise<void> {
    // Process refunds for all bids with status 'active'
    for (const bid of auction.bids) {
      if (bid.status === 'active') {
        await this.refundBid(bid, auction.feePercentage);
      }
    }
  }
  
  private async refundBid(bid: Bid, feePercentage: number): Promise<void> {
    try {
      // Get user's wallet
      const wallet = await this.walletModel.findOne({ userId: bid.userId });
      if (!wallet) {
        this.logger.error(`Wallet not found for user ${bid.userId} during bid refund`);
        return;
      }
      
      // Calculate fee and refund amount
      const feeAmount = (bid.amount * feePercentage) / 100;
      const refundAmount = bid.amount - feeAmount;
      
      // Refund the bid amount minus fee
      wallet.foodPoints += refundAmount;
      await wallet.save();
      
      // Update bid status
      bid.status = 'refunded';
      bid.refundRef = `refund_${Date.now()}`;
      bid.refundTimestamp = new Date();
      
      this.logger.log(`Refunded ${refundAmount} food points to user ${bid.userId} (fee: ${feeAmount})`);
    } catch (error) {
      this.logger.error(`Error refunding bid for user ${bid.userId}: ${error.message}`);
    }
  }
  
  @Cron(CronExpression.EVERY_MINUTE, { name: 'processAuctionStates' })
  async processAuctionStates() {
    this.logger.log('Processing auction states...');
    
    const now = new Date();
    
    // Update statuses of auctions based on time
    await this.auctionModel.updateMany(
      { status: AuctionStatus.UPCOMING, startTime: { $lte: now } },
      { $set: { status: AuctionStatus.ACTIVE } }
    );
    
    await this.auctionModel.updateMany(
      { status: AuctionStatus.ACTIVE, endTime: { $lte: now } },
      { $set: { status: AuctionStatus.ENDED } }
    );
    
    // Find ended auctions that need processing
    const endedAuctions = await this.auctionModel.find({
      status: AuctionStatus.ENDED,
      isProcessed: false
    });
    
    this.logger.log(`Found ${endedAuctions.length} ended auctions to process`);
    
    // Process each auction
    for (const auction of endedAuctions) {
      try {
        await this.finalizeAuction(auction._id.toString());
        this.logger.log(`Successfully processed auction ${auction._id}`);
      } catch (error) {
        this.logger.error(`Error processing auction ${auction._id}: ${error.message}`);
      }
    }
  }


  // Added methods for scheduled tasks
  async processEndedAuctions(): Promise<number> {
    const now = new Date();
    
    // Find auctions that have ended but not yet processed
    const auctions = await this.auctionModel.find({
      endTime: { $lte: now },
      status: AuctionStatus.ACTIVE
    }).populate('bids.userId').exec();
    
    if (auctions.length === 0) {
      return 0;
    }
    
    let processedCount = 0;
    
    for (const auction of auctions) {
      try {
        // Sort bids by amount (highest first)
        const sortedBids = [...auction.bids].sort((a, b) => b.amount - a.amount);
        
        // Determine winner (highest bid)
        const winningBid = sortedBids.length > 0 ? sortedBids[0] : null;
        
        if (winningBid) {
          // Update auction status
          auction.status = AuctionStatus.COMPLETED;
          auction.winnerId = winningBid.userId;
          auction.winningBid = winningBid.amount;
          
          // Notify winner
          const winnerUser = winningBid.userId as any;
          await this.notificationsService.sendEmail({
            recipientEmail: winnerUser.email,
            type: NotificationType.AUCTION_WIN,
            title: `Congratulations! You've Won the Auction for ${auction.title}`,
            message: `
              Hello,
              
              Congratulations! Your bid of $${winningBid.amount.toFixed(2)} for ${auction.title} was the winning bid.
              
              We'll be in touch shortly with details on how to complete your purchase.
              
              Thank you,
              Forage Stores Team
            `,
            recipientId: winnerUser._id.toString(),
            metadata: {
              auctionId: auction._id.toString(),
              productName: auction.title,
              bidAmount: winningBid.amount,
              winTime: now.toISOString()
            }
          });
          
          // Refund losing bidders (minus fee)
          for (const bid of sortedBids.slice(1)) {
            const refundAmount = bid.amount * (1 - (auction.feePercentage / 100));
            const feeAmount = bid.amount - refundAmount;
            
            // Refund to wallet
            await this.walletModel.updateOne(
              { userId: bid.userId },
              { $inc: { foodPoints: refundAmount } }
            );
            
            // Update bid status
            bid.status = 'refunded';
            bid.refundRef = `refund_${Date.now()}`;
            bid.refundTimestamp = now;
            
            // Notify of refund
            const bidderUser = bid.userId as any;
            await this.notificationsService.sendEmail({
              recipientEmail: bidderUser.email,
              type: NotificationType.AUCTION_REFUND,
              title: `Auction Refund for ${auction.title}`,
              message: `
                Hello,
                
                We're sorry to inform you that your bid of $${bid.amount.toFixed(2)} for ${auction.title} was not the winning bid.
                
                A refund of $${refundAmount.toFixed(2)} has been credited to your FoodPoints wallet.
                (A processing fee of $${feeAmount.toFixed(2)} was applied)
                
                Thank you for participating!
                Forage Stores Team
              `,
              recipientId: bidderUser._id.toString(),
              metadata: {
                auctionId: auction._id.toString(),
                productName: auction.title,
                refundAmount: refundAmount,
                originalBid: bid.amount,
                fee: feeAmount
              }
            });
          }
        } else {
          // No bids, mark as expired
          auction.status = AuctionStatus.EXPIRED;
        }
        
        auction.isProcessed = true;
        await auction.save();
        processedCount++;
      } catch (error) {
        this.logger.error(`Failed to process ended auction ${auction._id}:`, error);
      }
    }
    
    return processedCount;
  }
}
