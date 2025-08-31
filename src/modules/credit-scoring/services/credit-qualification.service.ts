import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from '../../users/entities/user.entity';
import { Wallet, WalletDocument } from '../../wallets/entities/wallet.entity';
import { Order, OrderDocument } from '../../orders/entities/order.entity';
import { CreditCheck, CreditCheckDocument } from '../entities/credit-check.entity';
import { 
  CreditQualificationResult, 
  QualificationCriteria,
  QualificationFailureReason 
} from '../interfaces/credit-qualification.interface';
import { CREDIT_QUALIFICATION_CONSTANTS } from '../constants/credit-qualification.constants';

@Injectable()
export class CreditQualificationService {
  private readonly logger = new Logger(CreditQualificationService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Wallet.name) private walletModel: Model<WalletDocument>,
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(CreditCheck.name) private creditCheckModel: Model<CreditCheckDocument>,
  ) {}

  /**
   * Centralized Credit Qualification Engine
   * Checks all explicit criteria for pay-later eligibility
   */
  async assessCreditQualification(userId: string): Promise<CreditQualificationResult> {
    try {
      this.logger.log(`Starting credit qualification assessment for user: ${userId}`);

      const user = await this.userModel.findById(userId);
      if (!user) {
        return this.createFailureResult('USER_NOT_FOUND', 'User not found');
      }

      const wallet = await this.walletModel.findOne({ userId: new Types.ObjectId(userId) });
      if (!wallet) {
        return this.createFailureResult('WALLET_NOT_FOUND', 'User wallet not found');
      }

      // Get user's order history
      const orders = await this.orderModel.find({ 
        userId: new Types.ObjectId(userId),
        status: { $in: ['completed', 'delivered'] }
      }).sort({ createdAt: -1 }).exec();

      // Get existing credit check
      const creditCheck = await this.creditCheckModel.findOne({ 
        userId: new Types.ObjectId(userId),
        isActive: true 
      });

      // Run all qualification checks
      const criteria: QualificationCriteria = {
        hasSufficientFoodSafeBalance: await this.checkFoodSafeBalance(wallet),
        meetsRecentPurchaseThreshold: await this.checkRecentPurchases(orders),
        meetsYearlyPurchaseThreshold: await this.checkYearlyPurchases(orders),
        hasGoodCreditScore: this.checkCreditScore(creditCheck),
        hasNoActiveDefaults: await this.checkActiveDefaults(userId),
        accountAgeRequirement: await this.checkAccountAge(user),
        hasPositivePaymentHistory: await this.checkPaymentHistory(orders),
      };

      // Determine overall qualification
      const isQualified = this.evaluateOverallQualification(criteria);
      const failureReasons = this.getFailureReasons(criteria);

      // Calculate recommended credit limit
      const recommendedCreditLimit = this.calculateCreditLimit(criteria, orders, creditCheck);

      return {
        isQualified,
        criteria,
        failureReasons,
        recommendedCreditLimit,
        assessmentDate: new Date(),
        nextReviewDate: this.calculateNextReviewDate(),
      };

    } catch (error) {
      this.logger.error(`Error in credit qualification assessment: ${error.message}`, error.stack);
      return this.createFailureResult('ASSESSMENT_ERROR', error.message);
    }
  }

  /**
   * Check FoodSafe Balance Requirement (10% minimum of total wallet)
   */
  private checkFoodSafeBalance(wallet: WalletDocument): boolean {
    const totalWalletBalance = wallet.foodMoney + wallet.foodSafe + wallet.foodPoints;
    const requiredFoodSafeAmount = totalWalletBalance * CREDIT_QUALIFICATION_CONSTANTS.FOODSAFE_MINIMUM_PERCENTAGE;
    
    this.logger.debug(`FoodSafe Balance Check: ${wallet.foodSafe} >= ${requiredFoodSafeAmount} (${CREDIT_QUALIFICATION_CONSTANTS.FOODSAFE_MINIMUM_PERCENTAGE * 100}% of ${totalWalletBalance})`);
    
    return wallet.foodSafe >= requiredFoodSafeAmount && wallet.foodSafe >= CREDIT_QUALIFICATION_CONSTANTS.MINIMUM_FOODSAFE_BALANCE;
  }

  /**
   * Check Recent Purchase Threshold (₦250,000 in last 4 months)
   */
  private async checkRecentPurchases(orders: OrderDocument[]): Promise<boolean> {
    // Ensure orders is an array
    const ordersArray = Array.isArray(orders) ? orders : [];
    
    const fourMonthsAgo = new Date();
    fourMonthsAgo.setMonth(fourMonthsAgo.getMonth() - 4);

    const recentOrders = ordersArray.filter(order => 
      (order as any).createdAt >= fourMonthsAgo &&
      order.status === 'delivered' &&
      order.paymentHistory.some(payment => payment.status === 'completed')
    );

    const recentSpending = recentOrders.reduce((total, order) => total + (order.finalTotal || order.totalAmount), 0);
    const meetsThreshold = recentSpending >= CREDIT_QUALIFICATION_CONSTANTS.RECENT_PURCHASE_THRESHOLD;
    
    this.logger.debug(`Recent Purchase Check: ₦${recentSpending} >= ₦${CREDIT_QUALIFICATION_CONSTANTS.RECENT_PURCHASE_THRESHOLD}. Meets requirement: ${meetsThreshold}`);
    
    return meetsThreshold;
  }

  /**
   * Check Yearly Purchase Threshold (₦800,000 yearly for 2 years)
   */
  private async checkYearlyPurchases(orders: OrderDocument[]): Promise<boolean> {
    // Ensure orders is an array
    const ordersArray = Array.isArray(orders) ? orders : [];
    
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

    const relevantOrders = ordersArray.filter(order => 
      (order as any).createdAt >= twoYearsAgo &&
      order.status === 'delivered' &&
      order.paymentHistory.some(payment => payment.status === 'completed')
    );

    // Group by year
    const spendingByYear: Record<number, number> = {};
    relevantOrders.forEach(order => {
      const year = (order as any).createdAt.getFullYear();
      spendingByYear[year] = (spendingByYear[year] || 0) + (order.finalTotal || order.totalAmount);
    });

    // Check for consecutive years meeting threshold
    const currentYear = new Date().getFullYear();
    const years = [currentYear - 1, currentYear - 2]; // Check last 2 years
    
    const meetsThreshold = years.every(year => 
      (spendingByYear[year] || 0) >= CREDIT_QUALIFICATION_CONSTANTS.YEARLY_PURCHASE_THRESHOLD
    );

    this.logger.debug(`Yearly Purchase Check: Years ${years.join(', ')} spending: ${years.map(y => `₦${spendingByYear[y] || 0}`).join(', ')}. Meets threshold: ${meetsThreshold}`);
    
    return meetsThreshold;
  }

  /**
   * Check Credit Score Requirement
   */
  private checkCreditScore(creditCheck: CreditCheckDocument | null): boolean {
    if (!creditCheck) {
      this.logger.debug('Credit Score Check: No credit history found, defaulting to false');
      return false;
    }

    const meetsRequirement = creditCheck.currentScore >= CREDIT_QUALIFICATION_CONSTANTS.MINIMUM_CREDIT_SCORE;
    this.logger.debug(`Credit Score Check: ${creditCheck.currentScore} >= ${CREDIT_QUALIFICATION_CONSTANTS.MINIMUM_CREDIT_SCORE}. Meets requirement: ${meetsRequirement}`);
    
    return meetsRequirement;
  }

  /**
   * Check for Active Defaults
   */
  private async checkActiveDefaults(userId: string): Promise<boolean> {
    // Check for any orders with payment failures or defaults
    const defaultedOrders = await this.orderModel.find({
      userId: new Types.ObjectId(userId),
      paymentPlan: 'pay_later',
      status: { $in: ['payment_failed', 'defaulted'] },
    }).exec();

    const hasNoDefaults = defaultedOrders.length === 0;
    this.logger.debug(`Active Defaults Check: Found ${defaultedOrders.length} defaulted orders. No defaults: ${hasNoDefaults}`);
    
    return hasNoDefaults;
  }

  /**
   * Check Account Age Requirement
   */
  private checkAccountAge(user: UserDocument): boolean {
    const accountAgeInDays = (new Date().getTime() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24);
    const meetsRequirement = accountAgeInDays >= CREDIT_QUALIFICATION_CONSTANTS.MINIMUM_ACCOUNT_AGE_DAYS;
    
    this.logger.debug(`Account Age Check: ${Math.floor(accountAgeInDays)} days >= ${CREDIT_QUALIFICATION_CONSTANTS.MINIMUM_ACCOUNT_AGE_DAYS} days. Meets requirement: ${meetsRequirement}`);
    
    return meetsRequirement;
  }

  /**
   * Check Payment History
   */
  private async checkPaymentHistory(orders: OrderDocument[]): Promise<boolean> {
    const paidOrders = orders.filter(order => 
      ['delivered'].includes(order.status) && 
      order.paymentHistory.some(payment => payment.status === 'completed')
    );

    const hasMinimumOrders = paidOrders.length >= CREDIT_QUALIFICATION_CONSTANTS.MINIMUM_COMPLETED_ORDERS;
    this.logger.debug(`Payment History Check: ${paidOrders.length} completed orders >= ${CREDIT_QUALIFICATION_CONSTANTS.MINIMUM_COMPLETED_ORDERS}. Meets requirement: ${hasMinimumOrders}`);
    
    return hasMinimumOrders;
  }

  /**
   * Evaluate Overall Qualification
   */
  private evaluateOverallQualification(criteria: QualificationCriteria): boolean {
    // All criteria must be met for qualification
    return Object.values(criteria).every(criterion => criterion === true);
  }

  /**
   * Get Failure Reasons
   */
  private getFailureReasons(criteria: QualificationCriteria): QualificationFailureReason[] {
    const failures: QualificationFailureReason[] = [];

    if (!criteria.hasSufficientFoodSafeBalance) {
      failures.push('INSUFFICIENT_FOODSAFE_BALANCE');
    }
    if (!criteria.meetsRecentPurchaseThreshold) {
      failures.push('INSUFFICIENT_RECENT_PURCHASES');
    }
    if (!criteria.meetsYearlyPurchaseThreshold) {
      failures.push('INSUFFICIENT_YEARLY_PURCHASES');
    }
    if (!criteria.hasGoodCreditScore) {
      failures.push('POOR_CREDIT_SCORE');
    }
    if (!criteria.hasNoActiveDefaults) {
      failures.push('ACTIVE_DEFAULTS_FOUND');
    }
    if (!criteria.accountAgeRequirement) {
      failures.push('ACCOUNT_TOO_NEW');
    }
    if (!criteria.hasPositivePaymentHistory) {
      failures.push('INSUFFICIENT_PAYMENT_HISTORY');
    }

    return failures;
  }

  /**
   * Calculate Credit Limit Based on Qualification
   */
  private calculateCreditLimit(
    criteria: QualificationCriteria, 
    orders: OrderDocument[], 
    creditCheck: CreditCheckDocument | null
  ): number {
    if (!this.evaluateOverallQualification(criteria)) {
      return 0; // No credit if not qualified
    }

    // Base credit limit calculation
    const recentSpending = this.calculateRecentSpending(orders);
    const creditScore = creditCheck?.currentScore || 600;
    
    // Calculate limit based on spending patterns and credit score
    let baseLimit = Math.min(
      recentSpending * CREDIT_QUALIFICATION_CONSTANTS.SPENDING_MULTIPLIER,
      CREDIT_QUALIFICATION_CONSTANTS.MAXIMUM_CREDIT_LIMIT
    );

    // Adjust based on credit score
    if (creditScore >= 750) {
      baseLimit *= 1.5; // 50% increase for excellent credit
    } else if (creditScore >= 700) {
      baseLimit *= 1.25; // 25% increase for good credit
    } else if (creditScore >= 650) {
      baseLimit *= 1.0; // Standard limit
    } else {
      baseLimit *= 0.75; // 25% reduction for fair credit
    }

    // Ensure minimum and maximum limits
    return Math.max(
      CREDIT_QUALIFICATION_CONSTANTS.MINIMUM_CREDIT_LIMIT,
      Math.min(baseLimit, CREDIT_QUALIFICATION_CONSTANTS.MAXIMUM_CREDIT_LIMIT)
    );
  }

  /**
   * Calculate Recent Spending (last 6 months average)
   */
  private calculateRecentSpending(orders: OrderDocument[]): number {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const recentOrders = orders.filter(order => 
      (order as any).createdAt >= sixMonthsAgo && 
      ['completed', 'delivered'].includes(order.status)
    );

    const totalSpent = recentOrders.reduce((sum, order) => sum + order.totalAmount, 0);
    return totalSpent / 6; // Monthly average
  }

  /**
   * Calculate Next Review Date
   */
  private calculateNextReviewDate(): Date {
    const nextReview = new Date();
    nextReview.setMonth(nextReview.getMonth() + 3); // Quarterly review
    return nextReview;
  }

  /**
   * Create Failure Result
   */
  private createFailureResult(reason: QualificationFailureReason, message: string): CreditQualificationResult {
    return {
      isQualified: false,
      criteria: {
        hasSufficientFoodSafeBalance: false,
        meetsRecentPurchaseThreshold: false,
        meetsYearlyPurchaseThreshold: false,
        hasGoodCreditScore: false,
        hasNoActiveDefaults: false,
        accountAgeRequirement: false,
        hasPositivePaymentHistory: false,
      },
      failureReasons: [reason],
      recommendedCreditLimit: 0,
      assessmentDate: new Date(),
      nextReviewDate: this.calculateNextReviewDate(),
    };
  }

  /**
   * Get Detailed Qualification Report
   */
  async getQualificationReport(userId: string): Promise<{
    qualification: CreditQualificationResult;
    recommendations: string[];
    timeToQualification: string | null;
  }> {
    const qualification = await this.assessCreditQualification(userId);
    const recommendations = this.generateRecommendations(qualification.criteria);
    const timeToQualification = this.estimateTimeToQualification(qualification.criteria);

    return {
      qualification,
      recommendations,
      timeToQualification,
    };
  }

  /**
   * Generate Improvement Recommendations
   */
  private generateRecommendations(criteria: QualificationCriteria): string[] {
    const recommendations: string[] = [];

    if (!criteria.hasSufficientFoodSafeBalance) {
      recommendations.push('Increase your FoodSafe balance to at least 10% of your total wallet balance');
    }
    if (!criteria.meetsRecentPurchaseThreshold) {
      recommendations.push('Make more purchases to reach ₦250,000 in recent 4-month spending');
    }
    if (!criteria.meetsYearlyPurchaseThreshold) {
      recommendations.push('Maintain consistent yearly spending of ₦800,000 for qualification');
    }
    if (!criteria.hasGoodCreditScore) {
      recommendations.push('Improve your credit score by making timely payments and maintaining low credit utilization');
    }
    if (!criteria.hasNoActiveDefaults) {
      recommendations.push('Clear all outstanding payment defaults to qualify for credit');
    }
    if (!criteria.accountAgeRequirement) {
      recommendations.push('Continue using your account to meet the minimum account age requirement');
    }
    if (!criteria.hasPositivePaymentHistory) {
      recommendations.push('Complete more successful orders to build a positive payment history');
    }

    return recommendations;
  }

  /**
   * Estimate Time to Qualification
   */
  private estimateTimeToQualification(criteria: QualificationCriteria): string | null {
    const failedCriteria = Object.entries(criteria).filter(([_, value]) => !value);
    
    if (failedCriteria.length === 0) {
      return null; // Already qualified
    }

    // Estimate based on most time-consuming criteria
    const timeEstimates = failedCriteria.map(([key]) => {
      switch (key) {
        case 'accountAgeRequirement':
          return '3-6 months';
        case 'meetsYearlyPurchaseThreshold':
          return '6-12 months';
        case 'meetsRecentPurchaseThreshold':
          return '2-4 months';
        case 'hasGoodCreditScore':
          return '3-6 months';
        case 'hasSufficientFoodSafeBalance':
          return 'Immediate (save more to FoodSafe)';
        case 'hasPositivePaymentHistory':
          return '1-3 months';
        case 'hasNoActiveDefaults':
          return 'Immediate (clear outstanding debts)';
        default:
          return '1-3 months';
      }
    });

    // Return the longest estimated time
    if (timeEstimates.includes('6-12 months')) return '6-12 months';
    if (timeEstimates.includes('3-6 months')) return '3-6 months';
    if (timeEstimates.includes('2-4 months')) return '2-4 months';
    if (timeEstimates.includes('1-3 months')) return '1-3 months';
    return 'Immediate action required';
  }
}
