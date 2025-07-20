import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product, ProductDocument } from '../../entities/product.entity';
import { PriceLock, PriceLockDocument, PriceLockStatus } from '../../entities/price-lock.entity';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(PriceLock.name) private priceLockModel: Model<PriceLockDocument>,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Expire price lock offers that have passed their expiration date
   * @returns Number of price locks expired
   */
  async expirePriceLocks(): Promise<number> {
    const now = new Date();
    
    // Find active price locks that have expired
    const priceLocks = await this.priceLockModel.find({
      expiryDate: { $lte: now },
      status: PriceLockStatus.ACTIVE
    }).populate('userId').populate('productId').exec();
    
    if (priceLocks.length === 0) {
      return 0;
    }
    
    let expiredCount = 0;
    
    for (const priceLock of priceLocks) {
      try {
        // Update status to expired
        priceLock.status = PriceLockStatus.EXPIRED;
        await priceLock.save();
        
        // Notify user
        await this.notificationsService.sendPriceLockExpiryNotification(
          priceLock.userId.email,
          {
            priceLockId: priceLock._id.toString(),
            productName: priceLock.productId.name,
            lockedPrice: priceLock.price,
            currentPrice: priceLock.productId.price,
            expiredAt: priceLock.expiryDate.toISOString()
          }
        );
        
        expiredCount++;
      } catch (error) {
        this.logger.error(`Failed to expire price lock ${priceLock._id}:`, error);
      }
    }
    
    return expiredCount;
  }
}
