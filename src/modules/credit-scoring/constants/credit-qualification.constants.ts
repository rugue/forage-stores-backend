/**
 * Credit Qualification Constants
 * Contains all hard-coded criteria and thresholds for credit qualification
 */

export const CREDIT_QUALIFICATION_CONSTANTS = {
  // FoodSafe Balance Requirements
  FOODSAFE_MINIMUM_PERCENTAGE: 0.10, // 10% of total wallet balance
  MINIMUM_FOODSAFE_BALANCE: 5000, // Minimum ₦5,000 in FoodSafe regardless of percentage

  // Purchase History Thresholds
  RECENT_PURCHASE_THRESHOLD: 250000, // ₦250,000 in last 4 months
  YEARLY_PURCHASE_THRESHOLD: 800000, // ₦800,000 yearly for 2 consecutive years

  // Credit Score Requirements
  MINIMUM_CREDIT_SCORE: 650, // Minimum credit score for qualification

  // Account Requirements
  MINIMUM_ACCOUNT_AGE_DAYS: 90, // 3 months minimum account age
  MINIMUM_COMPLETED_ORDERS: 5, // Minimum successful orders

  // Credit Limit Calculation
  SPENDING_MULTIPLIER: 2.0, // Credit limit = 2x monthly average spending
  MINIMUM_CREDIT_LIMIT: 10000, // ₦10,000 minimum credit limit
  MAXIMUM_CREDIT_LIMIT: 500000, // ₦500,000 maximum credit limit

  // Default Recovery
  FOODSAFE_RECOVERY_PERCENTAGE: 1.0, // 100% recovery from FoodSafe for defaults
  MAXIMUM_FOODSAFE_DEDUCTION: 100000, // Maximum ₦100,000 deduction per default
  DEFAULT_GRACE_PERIOD_DAYS: 7, // 7 days before automatic FoodSafe deduction

  // Review Frequencies
  QUARTERLY_REVIEW_MONTHS: 3,
  MONTHLY_MONITORING_DAY: 1,
  WEEKLY_ANALYTICS_DAY: 0, // Sunday

  // Qualification Scoring Weights
  QUALIFICATION_WEIGHTS: {
    FOODSAFE_BALANCE: 0.20, // 20%
    RECENT_PURCHASES: 0.25, // 25%
    YEARLY_PURCHASES: 0.25, // 25%
    CREDIT_SCORE: 0.15, // 15%
    NO_DEFAULTS: 0.10, // 10%
    ACCOUNT_AGE: 0.05, // 5%
  },

  // Progressive Credit Limits
  PROGRESSIVE_LIMITS: {
    TIER_1: { minScore: 650, maxLimit: 50000 }, // ₦50K for fair credit
    TIER_2: { minScore: 700, maxLimit: 150000 }, // ₦150K for good credit
    TIER_3: { minScore: 750, maxLimit: 300000 }, // ₦300K for very good credit
    TIER_4: { minScore: 800, maxLimit: 500000 }, // ₦500K for excellent credit
  },

  // Risk Mitigation
  UTILIZATION_LIMITS: {
    LOW_RISK: 0.30, // 30% utilization for low risk users
    MEDIUM_RISK: 0.20, // 20% utilization for medium risk users
    HIGH_RISK: 0.10, // 10% utilization for high risk users
  },

  // Default Recovery Escalation
  RECOVERY_ESCALATION: {
    LEVEL_1_DAYS: 7, // First notice after 7 days
    LEVEL_2_DAYS: 14, // Second notice after 14 days
    LEVEL_3_DAYS: 21, // Final notice after 21 days
    AUTOMATIC_DEDUCTION_DAYS: 30, // Automatic FoodSafe deduction after 30 days
  },
} as const;

// Qualification failure reason types
export type QualificationFailureReason = 
  | 'INSUFFICIENT_FOODSAFE_BALANCE'
  | 'INSUFFICIENT_RECENT_PURCHASES'
  | 'INSUFFICIENT_YEARLY_PURCHASES'
  | 'POOR_CREDIT_SCORE'
  | 'ACTIVE_DEFAULTS_FOUND'
  | 'ACCOUNT_TOO_NEW'
  | 'INSUFFICIENT_PAYMENT_HISTORY'
  | 'USER_NOT_FOUND'
  | 'WALLET_NOT_FOUND'
  | 'ASSESSMENT_ERROR';

// Credit qualification error messages
export const QUALIFICATION_ERROR_MESSAGES = {
  INSUFFICIENT_FOODSAFE_BALANCE: 'FoodSafe balance must be at least 10% of total wallet balance',
  INSUFFICIENT_RECENT_PURCHASES: 'Must have ₦250,000 in purchases within the last 4 months',
  INSUFFICIENT_YEARLY_PURCHASES: 'Must maintain ₦800,000 yearly spending for 2 consecutive years',
  POOR_CREDIT_SCORE: 'Credit score must be at least 650 for qualification',
  ACTIVE_DEFAULTS_FOUND: 'Cannot qualify with active payment defaults',
  ACCOUNT_TOO_NEW: 'Account must be at least 3 months old',
  INSUFFICIENT_PAYMENT_HISTORY: 'Must have at least 5 completed successful orders',
  USER_NOT_FOUND: 'User account not found',
  WALLET_NOT_FOUND: 'User wallet not found',
  ASSESSMENT_ERROR: 'Error occurred during qualification assessment',
} as const;
