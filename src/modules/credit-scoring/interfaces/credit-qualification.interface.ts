import { QualificationFailureReason } from '../constants/credit-qualification.constants';

// Re-export for convenience
export { QualificationFailureReason } from '../constants/credit-qualification.constants';

/**
 * Credit Qualification Criteria Interface
 */
export interface QualificationCriteria {
  /** FoodSafe balance is at least 10% of total wallet balance */
  hasSufficientFoodSafeBalance: boolean;
  
  /** Has ₦250,000 in purchases within last 4 months */
  meetsRecentPurchaseThreshold: boolean;
  
  /** Has ₦800,000 yearly spending for 2 consecutive years */
  meetsYearlyPurchaseThreshold: boolean;
  
  /** Credit score is at least 650 */
  hasGoodCreditScore: boolean;
  
  /** No active payment defaults */
  hasNoActiveDefaults: boolean;
  
  /** Account is at least 3 months old */
  accountAgeRequirement: boolean;
  
  /** Has at least 5 completed successful orders */
  hasPositivePaymentHistory: boolean;
}

/**
 * Credit Qualification Result Interface
 */
export interface CreditQualificationResult {
  /** Whether the user qualifies for pay-later credit */
  isQualified: boolean;
  
  /** Detailed breakdown of qualification criteria */
  criteria: QualificationCriteria;
  
  /** List of reasons for failure (if not qualified) */
  failureReasons: QualificationFailureReason[];
  
  /** Recommended credit limit based on qualification */
  recommendedCreditLimit: number;
  
  /** Date of this assessment */
  assessmentDate: Date;
  
  /** Date for next qualification review */
  nextReviewDate: Date;
}

/**
 * Credit Qualification Report Interface
 */
export interface CreditQualificationReport extends CreditQualificationResult {
  /** Personalized recommendations for improvement */
  recommendations: string[];
  
  /** Estimated time to qualification (if not qualified) */
  timeToQualification: string | null;
  
  /** Detailed spending analysis */
  spendingAnalysis: {
    recentSpending: number;
    yearlySpending: number[];
    averageMonthlySpending: number;
    spendingTrend: 'increasing' | 'decreasing' | 'stable';
  };
  
  /** FoodSafe analysis */
  foodSafeAnalysis: {
    currentBalance: number;
    requiredBalance: number;
    percentageOfWallet: number;
    shortfall: number;
  };
}

/**
 * Default Recovery Request Interface
 */
export interface DefaultRecoveryRequest {
  /** User ID with payment default */
  userId: string;
  
  /** Order ID that defaulted */
  orderId: string;
  
  /** Amount in default */
  defaultAmount: number;
  
  /** Date payment was due */
  dueDate: Date;
  
  /** Days overdue */
  daysOverdue: number;
  
  /** Recovery method to use */
  recoveryMethod: 'foodsafe_deduction' | 'payment_plan' | 'manual_collection';
  
  /** Maximum amount to recover from FoodSafe */
  maxFoodSafeDeduction?: number;
}

/**
 * Default Recovery Result Interface
 */
export interface DefaultRecoveryResult {
  /** Whether recovery was successful */
  success: boolean;
  
  /** Amount recovered */
  recoveredAmount: number;
  
  /** Recovery method used */
  recoveryMethod: string;
  
  /** Remaining balance after recovery */
  remainingDefault: number;
  
  /** User's updated FoodSafe balance */
  updatedFoodSafeBalance: number;
  
  /** Recovery transaction ID */
  recoveryTransactionId: string;
  
  /** Any errors or warnings */
  message?: string;
}

/**
 * Progressive Credit Limit Interface
 */
export interface ProgressiveCreditLimit {
  /** Current tier level */
  currentTier: number;
  
  /** Current credit limit */
  currentLimit: number;
  
  /** Next tier limit */
  nextTierLimit: number;
  
  /** Requirements to reach next tier */
  nextTierRequirements: {
    creditScoreNeeded: number;
    spendingTargetNeeded: number;
    timeToEligibility: string;
  };
  
  /** Credit utilization recommendation */
  recommendedUtilization: {
    maxUtilization: number;
    currentUtilization: number;
    utilizationPercentage: number;
  };
}
