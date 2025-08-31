import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentPlan, PaymentFrequency } from '../../orders/entities/order.entity';
import { SubscriptionStatus } from '../entities/subscription.entity';

export interface ConvenienceFeeConfig {
  basePercentage: number;
  flatFee: number;
  maxFee: number;
  minFee: number;
  paymentPlanMultipliers: Record<PaymentPlan, number>;
  frequencyMultipliers: Record<PaymentFrequency, number>;
  earlyPaymentDiscount: number;
  loyaltyDiscount: number;
}

export interface FeeCalculationContext {
  amount: number;
  paymentPlan: PaymentPlan;
  frequency?: PaymentFrequency;
  isEarlyPayment?: boolean;
  isLoyalCustomer?: boolean;
  subscriptionCount?: number;
  userId: string;
}

export interface FeeCalculationResult {
  convenienceFee: number;
  convenienceFeePercentage: number;
  totalAmount: number;
  breakdown: {
    baseAmount: number;
    baseFee: number;
    paymentPlanAdjustment: number;
    frequencyAdjustment: number;
    discounts: number;
    finalFee: number;
  };
  appliedDiscounts: string[];
  feeReason: string;
}

@Injectable()
export class ConvenienceFeeProvider {
  private readonly logger = new Logger(ConvenienceFeeProvider.name);
  private readonly config: ConvenienceFeeConfig;

  constructor(private readonly configService: ConfigService) {
    this.config = {
      basePercentage: this.configService.get<number>('CONVENIENCE_FEE_BASE_PERCENTAGE', 2.5), // 2.5%
      flatFee: this.configService.get<number>('CONVENIENCE_FEE_FLAT', 50), // 50 NGN
      maxFee: this.configService.get<number>('CONVENIENCE_FEE_MAX', 5000), // 5000 NGN
      minFee: this.configService.get<number>('CONVENIENCE_FEE_MIN', 25), // 25 NGN
      
      paymentPlanMultipliers: {
        [PaymentPlan.PAY_NOW]: 0.5, // Lower fee for immediate payment
        [PaymentPlan.PRICE_LOCK]: 1.0, // Standard fee
        [PaymentPlan.PAY_SMALL_SMALL]: 1.2, // Higher fee for installments
        [PaymentPlan.PAY_LATER]: 1.5, // Highest fee for credit
      },
      
      frequencyMultipliers: {
        [PaymentFrequency.WEEKLY]: 1.3, // Higher fee for more frequent payments
        [PaymentFrequency.BIWEEKLY]: 1.1, // Moderate increase
        [PaymentFrequency.MONTHLY]: 1.0, // Standard rate
      },
      
      earlyPaymentDiscount: this.configService.get<number>('EARLY_PAYMENT_DISCOUNT', 0.1), // 10% discount
      loyaltyDiscount: this.configService.get<number>('LOYALTY_DISCOUNT', 0.15), // 15% discount for loyal customers
    };
  }

  /**
   * Calculate convenience fee for a subscription
   */
  calculateConvenienceFee(context: FeeCalculationContext): FeeCalculationResult {
    const { amount, paymentPlan, frequency, isEarlyPayment, isLoyalCustomer, subscriptionCount } = context;
    
    // Start with base fee calculation
    let baseFee = Math.max(
      amount * (this.config.basePercentage / 100), // Percentage-based fee
      this.config.flatFee // Minimum flat fee
    );
    
    // Apply payment plan multiplier
    const paymentPlanMultiplier = this.config.paymentPlanMultipliers[paymentPlan] || 1.0;
    let adjustedFee = baseFee * paymentPlanMultiplier;
    
    // Apply frequency multiplier (if applicable)
    let frequencyAdjustment = 0;
    if (frequency && paymentPlan === PaymentPlan.PAY_SMALL_SMALL) {
      const frequencyMultiplier = this.config.frequencyMultipliers[frequency] || 1.0;
      frequencyAdjustment = adjustedFee * (frequencyMultiplier - 1);
      adjustedFee *= frequencyMultiplier;
    }
    
    // Apply discounts
    const appliedDiscounts: string[] = [];
    let totalDiscount = 0;
    
    // Early payment discount
    if (isEarlyPayment) {
      const earlyDiscount = adjustedFee * this.config.earlyPaymentDiscount;
      totalDiscount += earlyDiscount;
      appliedDiscounts.push(`Early Payment Discount (${this.config.earlyPaymentDiscount * 100}%)`);
    }
    
    // Loyalty discount for customers with multiple subscriptions
    if (isLoyalCustomer || (subscriptionCount && subscriptionCount >= 3)) {
      const loyaltyDiscount = adjustedFee * this.config.loyaltyDiscount;
      totalDiscount += loyaltyDiscount;
      appliedDiscounts.push(`Loyalty Discount (${this.config.loyaltyDiscount * 100}%)`);
    }
    
    // Calculate final fee
    let finalFee = adjustedFee - totalDiscount;
    
    // Apply min/max constraints
    finalFee = Math.max(this.config.minFee, Math.min(this.config.maxFee, finalFee));
    
    // Round to 2 decimal places
    finalFee = Math.round(finalFee * 100) / 100;
    
    const convenienceFeePercentage = (finalFee / amount) * 100;
    const totalAmount = amount + finalFee;
    
    return {
      convenienceFee: finalFee,
      convenienceFeePercentage: Math.round(convenienceFeePercentage * 100) / 100,
      totalAmount: Math.round(totalAmount * 100) / 100,
      breakdown: {
        baseAmount: amount,
        baseFee: Math.round(baseFee * 100) / 100,
        paymentPlanAdjustment: Math.round((adjustedFee - baseFee - frequencyAdjustment) * 100) / 100,
        frequencyAdjustment: Math.round(frequencyAdjustment * 100) / 100,
        discounts: Math.round(totalDiscount * 100) / 100,
        finalFee,
      },
      appliedDiscounts,
      feeReason: this.generateFeeReason(paymentPlan, frequency, appliedDiscounts),
    };
  }

  /**
   * Calculate convenience fee for subscription drops
   */
  calculateDropConvenienceFee(
    dropAmount: number,
    paymentPlan: PaymentPlan,
    frequency?: PaymentFrequency,
    dropNumber: number = 1,
    totalDrops: number = 1
  ): FeeCalculationResult {
    
    // For drops, use a simplified fee structure
    const isFirstDrop = dropNumber === 1;
    const isLastDrop = dropNumber === totalDrops;
    
    return this.calculateConvenienceFee({
      amount: dropAmount,
      paymentPlan,
      frequency,
      isEarlyPayment: isFirstDrop, // First drop might qualify for early payment
      isLoyalCustomer: false, // Individual drop doesn't get loyalty discount
      userId: '', // Not needed for drop calculation
    });
  }

  /**
   * Get convenience fee estimate without processing
   */
  estimateConvenienceFee(
    amount: number,
    paymentPlan: PaymentPlan,
    frequency?: PaymentFrequency
  ): { minFee: number; maxFee: number; estimatedFee: number } {
    
    const context: FeeCalculationContext = {
      amount,
      paymentPlan,
      frequency,
      userId: '',
    };
    
    // Calculate base scenario
    const baseResult = this.calculateConvenienceFee(context);
    
    // Calculate with all discounts
    const discountedResult = this.calculateConvenienceFee({
      ...context,
      isEarlyPayment: true,
      isLoyalCustomer: true,
    });
    
    return {
      minFee: discountedResult.convenienceFee,
      maxFee: baseResult.convenienceFee,
      estimatedFee: baseResult.convenienceFee,
    };
  }

  /**
   * Check if convenience fee applies to a payment plan
   */
  doesPaymentPlanHaveConvenienceFee(paymentPlan: PaymentPlan): boolean {
    return paymentPlan !== PaymentPlan.PAY_NOW; // PAY_NOW has reduced fee
  }

  /**
   * Get current convenience fee configuration
   */
  getConfiguration(): ConvenienceFeeConfig {
    return { ...this.config };
  }

  /**
   * Update convenience fee configuration (admin only)
   */
  updateConfiguration(newConfig: Partial<ConvenienceFeeConfig>): ConvenienceFeeConfig {
    Object.assign(this.config, newConfig);
    this.logger.log('Convenience fee configuration updated');
    return this.getConfiguration();
  }

  private generateFeeReason(
    paymentPlan: PaymentPlan,
    frequency?: PaymentFrequency,
    appliedDiscounts: string[] = []
  ): string {
    let reason = `Convenience fee for ${paymentPlan} payment plan`;
    
    if (frequency && paymentPlan === PaymentPlan.PAY_SMALL_SMALL) {
      reason += ` with ${frequency} frequency`;
    }
    
    if (appliedDiscounts.length > 0) {
      reason += `. Applied discounts: ${appliedDiscounts.join(', ')}`;
    }
    
    return reason;
  }
}
