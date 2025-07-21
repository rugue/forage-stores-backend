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
import { WalletType, TransactionType } from '../wallets/dto/update-balance.dto';

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
    })
    .populate({
      path: 'bids.userId',
      select: 'email firstName lastName'
    })
    .populate({
      path: 'productId',
      select: 'name'
    })
    .exec();
    
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
          
          // Notify winner - use the extension service method
          await (this.notificationsService as any).sendAuctionWinNotification(
            (winningBid.userId as any).email,
            {
              auctionId: auction._id.toString(),
              productName: (auction.productId as any).name || auction.title,
              bidAmount: winningBid.amount,
              winTime: now.toISOString()
            }
          );
          
          // Refund losing bidders (minus fee)
          for (const bid of sortedBids.slice(1)) {
            const refundAmount = bid.amount * 0.95; // 5% fee
            
            // Use the correct wallet service method
            await this.walletsService.updateBalance(
              (bid.userId as any)._id.toString(),
              {
                amount: refundAmount,
                walletType: WalletType.FOOD_POINTS,
                transactionType: TransactionType.CREDIT,
                description: 'Auction refund',
                reference: auction._id.toString()
              }
            );
            
            // Notify of refund - use the extension service method
            await (this.notificationsService as any).sendAuctionRefundNotification(
              (bid.userId as any).email,
              {
                auctionId: auction._id.toString(),
                productName: (auction.productId as any).name || auction.title,
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
