import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { ReferralsService } from '../referrals/referrals.service';
import { CommissionType } from '../referrals/entities/referral.entity';

@Injectable()
export class OrdersReferralHookService {
  constructor(
    @Inject(forwardRef(() => ReferralsService))
    private readonly referralsService: ReferralsService,
  ) {}

  /**
   * Process referral commission for a completed order
   * @param userId User who made the purchase
   * @param orderId Order ID
   * @param orderAmount Total amount of the order
   */
  async processReferralCommission(userId: string, orderId: string, orderAmount: number): Promise<void> {
    try {
      // Default to food money commission type
      const commissionType = CommissionType.FOOD_MONEY;
      
      // Process commission for the user's referrer
      await this.referralsService.processCommission(
        userId,
        {
          orderId,
          orderAmount,
          commissionType,
        }
      );
    } catch (error) {
      // Log the error but don't fail the order process
      console.error(`Error processing referral commission: ${error.message}`);
    }
  }
}
