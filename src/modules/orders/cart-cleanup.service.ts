import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CartService } from './cart.service';

@Injectable()
export class CartCleanupService {
  private readonly logger = new Logger(CartCleanupService.name);

  constructor(private readonly cartService: CartService) {}

  /**
   * Clean up expired carts every day at 2 AM
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async handleCartCleanup() {
    this.logger.log('Starting scheduled cart cleanup...');
    
    try {
      const deletedCount = await this.cartService.cleanupExpiredCarts();
      this.logger.log(`Cart cleanup completed. Removed ${deletedCount} expired carts.`);
    } catch (error) {
      this.logger.error('Error during cart cleanup:', error);
    }
  }

  /**
   * Clean up expired carts every hour (for more aggressive cleanup)
   * Uncomment if you want more frequent cleanup
   */
  // @Cron(CronExpression.EVERY_HOUR)
  // async handleHourlyCartCleanup() {
  //   this.logger.log('Starting hourly cart cleanup...');
    
  //   try {
  //     const deletedCount = await this.cartService.cleanupExpiredCarts();
  //     if (deletedCount > 0) {
  //       this.logger.log(`Hourly cleanup completed. Removed ${deletedCount} expired carts.`);
  //     }
  //   } catch (error) {
  //     this.logger.error('Error during hourly cart cleanup:', error);
  //   }
  // }
}
