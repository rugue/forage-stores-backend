import { Injectable } from '@nestjs/common';
import { UserRole } from '../../users/entities/user.entity';
import { CommissionType } from '../entities/commission.entity';
import { REFERRAL_CONSTANTS } from '../constants/referral.constants';

export interface CommissionCalculationResult {
  shouldEarnCommission: boolean;
  commissionType?: CommissionType;
  commissionRate?: number;
  maxPurchases?: number;
}

export interface CommissionStrategy {
  calculateCommission(
    referrerRole: UserRole,
    orderAmount: number,
    previousCommissions: number,
    referredUserId: string,
  ): Promise<CommissionCalculationResult>;
}

@Injectable()
export class RegularUserCommissionStrategy implements CommissionStrategy {
  async calculateCommission(
    referrerRole: UserRole,
    orderAmount: number,
    previousCommissions: number,
    referredUserId: string,
  ): Promise<CommissionCalculationResult> {
    // Regular users: 0.5%-2.5% on first 3 purchases only
    if (previousCommissions >= REFERRAL_CONSTANTS.NORMAL_USER.MAX_QUALIFYING_PURCHASES) {
      return { shouldEarnCommission: false };
    }

    const commissionRate = this.calculateDynamicRate(orderAmount);
    
    return {
      shouldEarnCommission: true,
      commissionType: CommissionType.NORMAL_REFERRAL,
      commissionRate,
      maxPurchases: REFERRAL_CONSTANTS.NORMAL_USER.MAX_QUALIFYING_PURCHASES,
    };
  }

  private calculateDynamicRate(orderAmount: number): number {
    const minRate = REFERRAL_CONSTANTS.NORMAL_USER.COMMISSION_RATE_MIN;
    const maxRate = REFERRAL_CONSTANTS.NORMAL_USER.COMMISSION_RATE_MAX;
    
    // Scale rate based on order amount
    const baseAmount = 50000; // ₦50k base amount
    const scaleFactor = Math.min(orderAmount / baseAmount, 5);
    
    const rate = minRate + ((maxRate - minRate) * (scaleFactor - 1) / 4);
    return Math.min(Math.max(rate, minRate), maxRate);
  }
}

@Injectable()
export class GrowthAssociateCommissionStrategy implements CommissionStrategy {
  async calculateCommission(
    referrerRole: UserRole,
    orderAmount: number,
    previousCommissions: number,
    referredUserId: string,
  ): Promise<CommissionCalculationResult> {
    // Growth Associates: 0.5%-2.5% on ALL purchases in perpetuity
    const commissionRate = this.calculateDynamicRate(orderAmount);
    
    return {
      shouldEarnCommission: true,
      commissionType: CommissionType.GA_REFERRAL,
      commissionRate,
      maxPurchases: -1, // Unlimited
    };
  }

  private calculateDynamicRate(orderAmount: number): number {
    const minRate = REFERRAL_CONSTANTS.GA_QUALIFICATION.COMMISSION_RATE_MIN;
    const maxRate = REFERRAL_CONSTANTS.GA_QUALIFICATION.COMMISSION_RATE_MAX;
    
    // Enhanced rate calculation for GA
    const baseAmount = 100000; // ₦100k base amount for GA
    const scaleFactor = Math.min(orderAmount / baseAmount, 3);
    
    const rate = minRate + ((maxRate - minRate) * (scaleFactor - 1) / 2);
    return Math.min(Math.max(rate, minRate), maxRate);
  }
}

@Injectable()
export class GrowthEliteCommissionStrategy implements CommissionStrategy {
  async calculateCommission(
    referrerRole: UserRole,
    orderAmount: number,
    previousCommissions: number,
    referredUserId: string,
  ): Promise<CommissionCalculationResult> {
    // Growth Elites: Same as GA plus profit pool sharing
    const commissionRate = this.calculateDynamicRate(orderAmount);
    
    return {
      shouldEarnCommission: true,
      commissionType: CommissionType.GE_REFERRAL,
      commissionRate,
      maxPurchases: -1, // Unlimited
    };
  }

  private calculateDynamicRate(orderAmount: number): number {
    const minRate = REFERRAL_CONSTANTS.GE_QUALIFICATION.COMMISSION_RATE_MIN;
    const maxRate = REFERRAL_CONSTANTS.GE_QUALIFICATION.COMMISSION_RATE_MAX;
    
    // Premium rate calculation for GE
    const baseAmount = 150000; // ₦150k base amount for GE
    const scaleFactor = Math.min(orderAmount / baseAmount, 2.5);
    
    const rate = minRate + ((maxRate - minRate) * scaleFactor / 2.5);
    return Math.min(Math.max(rate, minRate), maxRate);
  }
}

@Injectable()
export class CommissionStrategyFactory {
  constructor(
    private regularUserStrategy: RegularUserCommissionStrategy,
    private growthAssociateStrategy: GrowthAssociateCommissionStrategy,
    private growthEliteStrategy: GrowthEliteCommissionStrategy,
  ) {}

  getStrategy(userRole: UserRole): CommissionStrategy {
    switch (userRole) {
      case UserRole.GROWTH_ELITE:
        return this.growthEliteStrategy;
      case UserRole.GROWTH_ASSOCIATE:
        return this.growthAssociateStrategy;
      case UserRole.USER:
      case UserRole.PRO_AFFILIATE:
      default:
        return this.regularUserStrategy;
    }
  }
}
