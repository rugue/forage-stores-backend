/**
 * Credit Scoring Constants
 * Centralized configuration values for the credit scoring system
 */

// Score ranges and thresholds
export const CREDIT_SCORE_RANGES = {
  EXCELLENT: { min: 800, max: 850, label: 'Excellent' },
  VERY_GOOD: { min: 740, max: 799, label: 'Very Good' },
  GOOD: { min: 670, max: 739, label: 'Good' },
  FAIR: { min: 580, max: 669, label: 'Fair' },
  POOR: { min: 300, max: 579, label: 'Poor' },
} as const;

// Risk levels
export const RISK_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
} as const;

// Credit scoring weights
export const SCORING_WEIGHTS = {
  PAYMENT_HISTORY: 0.35,
  CREDIT_UTILIZATION: 0.30,
  TRANSACTION_FREQUENCY: 0.15,
  ACCOUNT_AGE: 0.10,
  CREDIT_DIVERSITY: 0.05,
  RECENT_INQUIRIES: 0.05,
} as const;

// Payment behavior thresholds
export const PAYMENT_THRESHOLDS = {
  EXCELLENT_ON_TIME_RATE: 95,
  GOOD_ON_TIME_RATE: 90,
  FAIR_ON_TIME_RATE: 80,
  POOR_ON_TIME_RATE: 70,
  
  MAX_LATE_DAYS: 30,
  CRITICAL_LATE_DAYS: 90,
  
  MIN_PAYMENTS_FOR_ASSESSMENT: 3,
} as const;

// Credit utilization thresholds
export const UTILIZATION_THRESHOLDS = {
  LOW: 30,
  MODERATE: 50,
  HIGH: 80,
  MAXIMUM: 95,
} as const;

// Default credit limits based on score ranges
export const DEFAULT_CREDIT_LIMITS = {
  EXCELLENT: 50000,
  VERY_GOOD: 25000,
  GOOD: 15000,
  FAIR: 7500,
  POOR: 2500,
} as const;

// Assessment frequencies
export const ASSESSMENT_FREQUENCIES = {
  QUARTERLY_MONTHS: 3,
  MONTHLY_RECALC_DAY: 1,
  WEEKLY_ANALYTICS_DAY: 0, // Sunday
  CLEANUP_DAY: 15,
  LIMIT_CHECK_DAY: 1, // Monday
  RECOMMENDATIONS_DAY: 20,
} as const;

// Risk factor weights
export const RISK_FACTOR_WEIGHTS = {
  PAYMENT_HISTORY_RISK: 0.40,
  FINANCIAL_STABILITY_RISK: 0.25,
  CREDIT_BEHAVIOR_RISK: 0.20,
  EXTERNAL_FACTORS_RISK: 0.15,
} as const;

// Time periods for analysis
export const TIME_PERIODS = {
  RECENT_MONTHS: 3,
  ANALYSIS_MONTHS: 6,
  HISTORY_MONTHS: 12,
  MAX_HISTORY_MONTHS: 24,
} as const;

// Score change thresholds
export const SCORE_CHANGE_THRESHOLDS = {
  SIGNIFICANT_INCREASE: 25,
  MODERATE_INCREASE: 15,
  MINOR_INCREASE: 5,
  MINOR_DECREASE: -5,
  MODERATE_DECREASE: -15,
  SIGNIFICANT_DECREASE: -25,
} as const;

// Credit decision types
export const CREDIT_DECISIONS = {
  APPROVED: 'approved',
  REJECTED: 'rejected',
  MANUAL_REVIEW: 'manual_review',
  CONDITIONAL_APPROVAL: 'conditional_approval',
} as const;

// Default risk factors for new users
export const DEFAULT_RISK_FACTORS = {
  paymentHistoryRisk: 50, // Medium risk for new users
  financialStabilityRisk: 60,
  creditBehaviorRisk: 50,
  externalFactorsRisk: 40,
  overallRiskScore: 50,
  riskLevel: RISK_LEVELS.MEDIUM,
};

// Default credit limits for new users by category
export const NEW_USER_CREDIT_LIMITS = {
  STUDENT: 1000,
  PROFESSIONAL: 2500,
  BUSINESS: 5000,
  PREMIUM: 10000,
} as const;

// Improvement recommendation types
export const IMPROVEMENT_TYPES = {
  PAYMENT_HISTORY: 'payment_history',
  CREDIT_UTILIZATION: 'credit_utilization',
  ACCOUNT_DIVERSITY: 'account_diversity',
  INQUIRY_FREQUENCY: 'inquiry_frequency',
  ACCOUNT_AGE: 'account_age',
} as const;

// Notification triggers
export const NOTIFICATION_TRIGGERS = {
  SCORE_INCREASE: 15,
  SCORE_DECREASE: 10,
  LIMIT_INCREASE: 1000,
  LIMIT_DECREASE: 500,
  RISK_LEVEL_CHANGE: true,
} as const;

// API response codes
export const CREDIT_RESPONSE_CODES = {
  SUCCESS: 'CS_SUCCESS',
  INSUFFICIENT_DATA: 'CS_INSUFFICIENT_DATA',
  USER_NOT_FOUND: 'CS_USER_NOT_FOUND',
  ASSESSMENT_PENDING: 'CS_ASSESSMENT_PENDING',
  EXTERNAL_DATA_ERROR: 'CS_EXTERNAL_ERROR',
  CALCULATION_ERROR: 'CS_CALCULATION_ERROR',
} as const;

// Data retention policies
export const DATA_RETENTION = {
  SCORE_HISTORY_MONTHS: 24,
  ASSESSMENT_HISTORY_MONTHS: 36,
  PAYMENT_HISTORY_MONTHS: 60,
  INQUIRY_HISTORY_MONTHS: 24,
} as const;

// External credit bureau configurations
export const EXTERNAL_BUREAUS = {
  EXPERIAN: 'experian',
  EQUIFAX: 'equifax',
  TRANSUNION: 'transunion',
  LOCAL_BUREAU: 'local_bureau',
} as const;

// Credit product types
export const CREDIT_PRODUCTS = {
  PURCHASE_FINANCING: 'purchase_financing',
  WORKING_CAPITAL: 'working_capital',
  TRADE_CREDIT: 'trade_credit',
  REVOLVING_CREDIT: 'revolving_credit',
} as const;

// Validation rules
export const VALIDATION_RULES = {
  MIN_SCORE: 300,
  MAX_SCORE: 850,
  MIN_CREDIT_LIMIT: 100,
  MAX_CREDIT_LIMIT: 100000,
  MIN_AGE_MONTHS: 1,
  MAX_AGE_MONTHS: 600,
} as const;

// Error messages
export const ERROR_MESSAGES = {
  INVALID_USER_ID: 'Invalid user ID provided',
  INSUFFICIENT_PAYMENT_HISTORY: 'Insufficient payment history for assessment',
  CALCULATION_FAILED: 'Credit score calculation failed',
  EXTERNAL_SERVICE_UNAVAILABLE: 'External credit service unavailable',
  INVALID_SCORE_RANGE: 'Score must be between 300 and 850',
  INVALID_CREDIT_LIMIT: 'Credit limit must be positive and reasonable',
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  ASSESSMENT_COMPLETED: 'Credit assessment completed successfully',
  SCORE_UPDATED: 'Credit score updated successfully',
  LIMIT_UPDATED: 'Credit limit updated successfully',
  OVERRIDE_APPLIED: 'Credit override applied successfully',
} as const;
