import { SubscriptionStatus, PaymentPlan, PaymentFrequency } from '../interfaces/subscription.interface';

/**
 * Subscription-related constants and configurations
 */
export const SUBSCRIPTION_CONSTANTS = {
  // Collection name
  COLLECTION_NAME: 'subscriptions',
  
  // Payment settings
  MIN_SUBSCRIPTION_AMOUNT: 1000, // Minimum subscription amount (NGN)
  MAX_SUBSCRIPTION_AMOUNT: 1000000, // Maximum subscription amount (NGN)
  MIN_PRICE_LOCK_AMOUNT: 5000, // Minimum amount for price lock (NGN)
  MIN_DROPS: 2, // Minimum number of drops
  MAX_DROPS: 365, // Maximum number of drops (1 year daily)
  
  // Retry settings
  MAX_PAYMENT_RETRIES: 3,
  RETRY_INTERVALS: [24, 48, 72], // Hours between retries
  GRACE_PERIOD_DAYS: 7, // Days before suspension
  
  // Time settings
  PAYMENT_DUE_HOURS: 2, // Hours before payment is due
  LATE_PAYMENT_GRACE_HOURS: 24, // Grace period for late payments
  AUTO_CANCEL_DAYS: 30, // Days of inactivity before auto-cancellation
  
  // Frequency settings
  FREQUENCY_MULTIPLIERS: {
    daily: 1,
    weekly: 7,
    biweekly: 14,
    monthly: 30,
    quarterly: 90,
  },
  
  // Business rules
  MIN_PAUSE_DURATION: 7, // Minimum pause duration in days
  MAX_PAUSE_DURATION: 90, // Maximum pause duration in days
  MAX_PAUSES_PER_SUBSCRIPTION: 3, // Maximum number of pauses allowed
  
  // Pagination
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const;

/**
 * Default subscription configuration
 */
export const SUBSCRIPTION_DEFAULTS = {
  status: SubscriptionStatus.ACTIVE,
  dropsPaid: 0,
  amountPaid: 0,
  isCompleted: false,
  dropSchedule: [],
  retryCount: 0,
} as const;

/**
 * Payment plan configurations
 */
export const PAYMENT_PLAN_CONFIG = {
  [PaymentPlan.PAY_SMALL_SMALL]: {
    name: 'Pay Small Small',
    description: 'Break down your payment into small, manageable chunks',
    minDrops: 2,
    maxDrops: 12,
    allowedFrequencies: [PaymentFrequency.DAILY, PaymentFrequency.WEEKLY],
    defaultFrequency: PaymentFrequency.WEEKLY,
    processingFee: 0.02, // 2%
    cancellationFee: 0.05, // 5%
  },
  [PaymentPlan.PRICE_LOCK]: {
    name: 'Price Lock',
    description: 'Lock in current prices for future deliveries',
    minDrops: 4,
    maxDrops: 52,
    allowedFrequencies: [PaymentFrequency.WEEKLY, PaymentFrequency.MONTHLY],
    defaultFrequency: PaymentFrequency.MONTHLY,
    processingFee: 0.015, // 1.5%
    cancellationFee: 0.03, // 3%
  },
  [PaymentPlan.FLEXIBLE]: {
    name: 'Flexible Plan',
    description: 'Customize your payment schedule',
    minDrops: 2,
    maxDrops: 24,
    allowedFrequencies: [
      PaymentFrequency.DAILY,
      PaymentFrequency.WEEKLY,
      PaymentFrequency.BIWEEKLY,
      PaymentFrequency.MONTHLY,
    ],
    defaultFrequency: PaymentFrequency.BIWEEKLY,
    processingFee: 0.025, // 2.5%
    cancellationFee: 0.1, // 10%
  },
  [PaymentPlan.FIXED]: {
    name: 'Fixed Plan',
    description: 'Fixed payment amounts and schedule',
    minDrops: 6,
    maxDrops: 12,
    allowedFrequencies: [PaymentFrequency.MONTHLY],
    defaultFrequency: PaymentFrequency.MONTHLY,
    processingFee: 0.01, // 1%
    cancellationFee: 0.02, // 2%
  },
} as const;

/**
 * Payment frequency configurations
 */
export const PAYMENT_FREQUENCY_CONFIG = {
  [PaymentFrequency.DAILY]: {
    name: 'Daily',
    description: 'Payment every day',
    intervalDays: 1,
    maxDrops: 90,
    minAmount: 100,
  },
  [PaymentFrequency.WEEKLY]: {
    name: 'Weekly',
    description: 'Payment every week',
    intervalDays: 7,
    maxDrops: 52,
    minAmount: 500,
  },
  [PaymentFrequency.BIWEEKLY]: {
    name: 'Bi-weekly',
    description: 'Payment every two weeks',
    intervalDays: 14,
    maxDrops: 26,
    minAmount: 1000,
  },
  [PaymentFrequency.MONTHLY]: {
    name: 'Monthly',
    description: 'Payment every month',
    intervalDays: 30,
    maxDrops: 12,
    minAmount: 2000,
  },
  [PaymentFrequency.QUARTERLY]: {
    name: 'Quarterly',
    description: 'Payment every three months',
    intervalDays: 90,
    maxDrops: 4,
    minAmount: 10000,
  },
} as const;

/**
 * Subscription validation rules
 */
export const SUBSCRIPTION_VALIDATION = {
  MIN_AMOUNT: SUBSCRIPTION_CONSTANTS.MIN_SUBSCRIPTION_AMOUNT,
  MAX_AMOUNT: SUBSCRIPTION_CONSTANTS.MAX_SUBSCRIPTION_AMOUNT,
  MIN_DROPS: SUBSCRIPTION_CONSTANTS.MIN_DROPS,
  MAX_DROPS: SUBSCRIPTION_CONSTANTS.MAX_DROPS,
  MIN_DROP_AMOUNT: 50,
  NOTES_MAX_LENGTH: 500,
} as const;

/**
 * Subscription error messages
 */
export const SUBSCRIPTION_ERROR_MESSAGES = {
  NOT_FOUND: 'Subscription not found',
  ALREADY_EXISTS: 'Subscription already exists for this order',
  INVALID_STATUS: 'Invalid subscription status',
  INVALID_PAYMENT_PLAN: 'Invalid payment plan',
  INVALID_FREQUENCY: 'Invalid payment frequency',
  INSUFFICIENT_AMOUNT: 'Subscription amount is too low',
  EXCESSIVE_AMOUNT: 'Subscription amount is too high',
  INVALID_DROPS: 'Invalid number of drops',
  FREQUENCY_NOT_ALLOWED: 'Payment frequency not allowed for this plan',
  ALREADY_COMPLETED: 'Subscription is already completed',
  ALREADY_CANCELLED: 'Subscription is already cancelled',
  CANNOT_PAUSE: 'Subscription cannot be paused in current status',
  CANNOT_RESUME: 'Subscription cannot be resumed',
  MAX_PAUSES_REACHED: 'Maximum number of pauses reached',
  PAYMENT_FAILED: 'Payment processing failed',
  INVALID_PAYMENT_AMOUNT: 'Invalid payment amount',
  PAYMENT_ALREADY_PROCESSED: 'Payment has already been processed',
  PAST_DUE: 'Subscription payment is past due',
  INSUFFICIENT_FUNDS: 'Insufficient funds for payment',
  SCHEDULE_CONFLICT: 'Payment schedule conflict detected',
} as const;

/**
 * Subscription success messages
 */
export const SUBSCRIPTION_SUCCESS_MESSAGES = {
  CREATED: 'Subscription created successfully',
  UPDATED: 'Subscription updated successfully',
  PAUSED: 'Subscription paused successfully',
  RESUMED: 'Subscription resumed successfully',
  CANCELLED: 'Subscription cancelled successfully',
  COMPLETED: 'Subscription completed successfully',
  PAYMENT_PROCESSED: 'Payment processed successfully',
  SCHEDULE_GENERATED: 'Payment schedule generated successfully',
  REMINDER_SENT: 'Payment reminder sent successfully',
} as const;

/**
 * Subscription notification types
 */
export const SUBSCRIPTION_NOTIFICATION_TYPES = {
  PAYMENT_DUE: 'payment_due',
  PAYMENT_FAILED: 'payment_failed',
  PAYMENT_SUCCESS: 'payment_success',
  PAYMENT_RETRY: 'payment_retry',
  SUBSCRIPTION_COMPLETED: 'subscription_completed',
  SUBSCRIPTION_CANCELLED: 'subscription_cancelled',
  SUBSCRIPTION_PAUSED: 'subscription_paused',
  SUBSCRIPTION_RESUMED: 'subscription_resumed',
  GRACE_PERIOD_WARNING: 'grace_period_warning',
  SUSPENSION_WARNING: 'suspension_warning',
} as const;

/**
 * Status transition rules
 */
export const SUBSCRIPTION_STATUS_TRANSITIONS: Record<SubscriptionStatus, SubscriptionStatus[]> = {
  [SubscriptionStatus.ACTIVE]: [
    SubscriptionStatus.PAUSED,
    SubscriptionStatus.COMPLETED,
    SubscriptionStatus.CANCELLED,
    SubscriptionStatus.SUSPENDED,
  ],
  [SubscriptionStatus.PAUSED]: [
    SubscriptionStatus.ACTIVE,
    SubscriptionStatus.CANCELLED,
    SubscriptionStatus.EXPIRED,
  ],
  [SubscriptionStatus.COMPLETED]: [], // Terminal state
  [SubscriptionStatus.CANCELLED]: [], // Terminal state
  [SubscriptionStatus.SUSPENDED]: [
    SubscriptionStatus.ACTIVE,
    SubscriptionStatus.CANCELLED,
    SubscriptionStatus.EXPIRED,
  ],
  [SubscriptionStatus.EXPIRED]: [], // Terminal state
};

/**
 * Payment retry configuration
 */
export const PAYMENT_RETRY_CONFIG = {
  maxRetries: SUBSCRIPTION_CONSTANTS.MAX_PAYMENT_RETRIES,
  retryIntervals: SUBSCRIPTION_CONSTANTS.RETRY_INTERVALS,
  gracePeriod: SUBSCRIPTION_CONSTANTS.GRACE_PERIOD_DAYS,
  escalationSteps: [
    'email_reminder',
    'sms_reminder',
    'phone_call',
    'suspension_warning',
    'account_suspension',
  ],
} as const;

/**
 * Subscription calculation helpers
 */
export const SUBSCRIPTION_CALCULATOR = {
  calculateDropAmount: (totalAmount: number, totalDrops: number): number => {
    return Math.round((totalAmount / totalDrops) * 100) / 100;
  },
  
  calculateProcessingFee: (amount: number, paymentPlan: PaymentPlan): number => {
    const feeRate = PAYMENT_PLAN_CONFIG[paymentPlan].processingFee;
    return Math.round(amount * feeRate * 100) / 100;
  },
  
  calculateCancellationFee: (remainingAmount: number, paymentPlan: PaymentPlan): number => {
    const feeRate = PAYMENT_PLAN_CONFIG[paymentPlan].cancellationFee;
    return Math.round(remainingAmount * feeRate * 100) / 100;
  },
  
  generatePaymentSchedule: (options: {
    totalAmount: number;
    frequency: PaymentFrequency;
    totalDrops: number;
    startDate: Date;
  }) => {
    const { totalAmount, frequency, totalDrops, startDate } = options;
    const dropAmount = SUBSCRIPTION_CALCULATOR.calculateDropAmount(totalAmount, totalDrops);
    const intervalDays = PAYMENT_FREQUENCY_CONFIG[frequency].intervalDays;
    
    const schedule = [];
    let currentDate = new Date(startDate);
    
    for (let i = 0; i < totalDrops; i++) {
      // Adjust amount for the last drop to account for rounding
      const amount = i === totalDrops - 1 
        ? totalAmount - (dropAmount * (totalDrops - 1))
        : dropAmount;
      
      schedule.push({
        scheduledDate: new Date(currentDate),
        amount,
        isPaid: false,
        retryCount: 0,
      });
      
      // Add interval days for next payment
      currentDate.setDate(currentDate.getDate() + intervalDays);
    }
    
    return schedule;
  },
} as const;

/**
 * Subscription activity log types
 */
export const SUBSCRIPTION_ACTIVITY_TYPES = {
  CREATED: 'subscription_created',
  UPDATED: 'subscription_updated',
  PAUSED: 'subscription_paused',
  RESUMED: 'subscription_resumed',
  CANCELLED: 'subscription_cancelled',
  COMPLETED: 'subscription_completed',
  PAYMENT_PROCESSED: 'payment_processed',
  PAYMENT_FAILED: 'payment_failed',
  PAYMENT_RETRIED: 'payment_retried',
  SCHEDULE_MODIFIED: 'schedule_modified',
  STATUS_CHANGED: 'status_changed',
} as const;
