import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { 
  Auction, 
  AuctionDocument, 
  AuctionStatus 
} from '../auctions/entities/auction.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { WalletsService } from '../wallets/wallets.service';

@Injectable()
export class AuctionsService {
  private readonly logger = new Logger(AuctionsService.name);

  constructor(
    @InjectModel(Auction.name) private auctionModel: Model<AuctionDocument>,
    private readonly notificationsService: NotificationsService,
    private readonly walletsService: WalletsService,
  ) {}

  /**
   * Process auctions that have ended
   * @returns Number of auctions processed
   */
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
          await this.notificationsService.sendAuctionWinNotification(
            winningBid.userId.email,
            {
              auctionId: auction._id.toString(),
              productName: auction.productName,
              bidAmount: winningBid.amount,
              winTime: now.toISOString()
            }
          );
          
          // Refund losing bidders (minus fee)
          for (const bid of sortedBids.slice(1)) {
            const refundAmount = bid.amount * 0.95; // 5% fee
            await this.walletsService.addFoodPoints(bid.userId._id.toString(), refundAmount, {
              reason: 'Auction refund',
              reference: auction._id.toString()
            });
            
            // Notify of refund
            await this.notificationsService.sendAuctionRefundNotification(
              bid.userId.email,
              {
                auctionId: auction._id.toString(),
                productName: auction.productName,
                refundAmount: refundAmount,
                originalBid: bid.amount,
                fee: bid.amount - refundAmount
              }
            );
          }
        } else {
          // No bids, mark as expired
          auction.status = AuctionStatus.EXPIRED;
        }
        
        await auction.save();
        processedCount++;
      } catch (error) {
        this.logger.error(`Failed to process ended auction ${auction._id}:`, error);
      }
    }
    
    return processedCount;
  }
}
