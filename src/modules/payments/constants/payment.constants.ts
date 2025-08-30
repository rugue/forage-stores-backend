export enum PaymentType {
  PAY_NOW = 'PAY_NOW',
  PRICE_LOCK = 'PRICE_LOCK',
  PAY_SMALL_SMALL = 'PAY_SMALL_SMALL',
  PAY_LATER = 'PAY_LATER',
  EXCLUSIVE_YEAR_PAYMENT = 'EXCLUSIVE_YEAR_PAYMENT', // Christmas bundles
}

export enum PaymentMethod {
  FOOD_MONEY = 'FOOD_MONEY',
  FOOD_POINTS = 'FOOD_POINTS',
  DEBIT_CARD = 'DEBIT_CARD',
  CREDIT_CARD = 'CREDIT_CARD',
  BANK_TRANSFER = 'BANK_TRANSFER',
  CASH_ON_DELIVERY = 'CASH_ON_DELIVERY',
  WALLET_TRANSFER = 'WALLET_TRANSFER',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
  PARTIALLY_REFUNDED = 'PARTIALLY_REFUNDED',
  DISPUTED = 'DISPUTED',
  EXPIRED = 'EXPIRED',
}

export enum PaymentGateway {
  PAYSTACK = 'PAYSTACK',
  FLUTTERWAVE = 'FLUTTERWAVE',
  INTERNAL_WALLET = 'INTERNAL_WALLET',
  MANUAL = 'MANUAL',
}

export enum TransactionType {
  PAYMENT = 'PAYMENT',
  REFUND = 'REFUND',
  REVERSAL = 'REVERSAL',
  FEE = 'FEE',
  CHARGEBACK = 'CHARGEBACK',
}

export enum RefundStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export enum PaymentFrequency {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  BIWEEKLY = 'BIWEEKLY',
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
}

export const PAYMENT_CONSTANTS = {
  // Payment Processing
  DEFAULT_CURRENCY: 'NGN',
  MIN_PAYMENT_AMOUNT: 100, // 1 Naira
  MAX_PAYMENT_AMOUNT: 10000000, // 100,000 Naira
  PAYMENT_TIMEOUT: 300000, // 5 minutes
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 5000, // 5 seconds

  // Transaction Fees
  PAYSTACK_FEE_PERCENTAGE: 1.5,
  PAYSTACK_FEE_CAP: 2000, // 20 Naira
  FLUTTERWAVE_FEE_PERCENTAGE: 1.4,
  FLUTTERWAVE_FEE_CAP: 2000,
  INTERNAL_TRANSFER_FEE: 0,
  CASH_HANDLING_FEE: 100, // 1 Naira

  // Price Lock Settings
  PRICE_LOCK_DURATION_DAYS: 30,
  PRICE_LOCK_DOWN_PAYMENT_PERCENTAGE: 20, // 20%
  PRICE_LOCK_EXTENDED_DURATION_DAYS: 45,

  // Pay Small Small Settings
  MIN_INSTALLMENT_AMOUNT: 500, // 5 Naira
  MAX_INSTALLMENTS: 16, // 16 weeks
  MIN_INSTALLMENTS: 2,
  DEFAULT_DOWN_PAYMENT_PERCENTAGE: 25, // 25%

  // Pay Later Settings
  CREDIT_CHECK_TIMEOUT: 24, // 24 hours
  MIN_CREDIT_SCORE: 650,
  MAX_CREDIT_LIMIT: 50000, // 500 Naira
  CREDIT_UTILIZATION_LIMIT: 80, // 80%

  // Exclusive Year Payment (Christmas)
  CHRISTMAS_BUNDLE_EARLY_BIRD_DISCOUNT: 15, // 15%
  CHRISTMAS_BUNDLE_PAYMENT_DEADLINE: 'December 20',
  YEAR_PAYMENT_ADVANCE_MONTHS: 3, // Pay 3 months in advance

  // Webhook Settings
  WEBHOOK_TIMEOUT: 30000, // 30 seconds
  WEBHOOK_RETRY_ATTEMPTS: 5,
  WEBHOOK_SIGNATURE_TOLERANCE: 300, // 5 minutes

  // Reconciliation
  RECONCILIATION_BATCH_SIZE: 100,
  RECONCILIATION_SCHEDULE: '0 2 * * *', // Daily at 2 AM
  RECONCILIATION_RETRY_DAYS: 7,

  // Caching
  PAYMENT_CACHE_TTL: 300, // 5 minutes
  TRANSACTION_CACHE_TTL: 3600, // 1 hour
  GATEWAY_STATUS_CACHE_TTL: 60, // 1 minute
};

export const PAYMENT_GATEWAY_CONFIGS = {
  PAYSTACK: {
    baseUrl: 'https://api.paystack.co',
    publicKey: process.env.PAYSTACK_PUBLIC_KEY,
    secretKey: process.env.PAYSTACK_SECRET_KEY,
    webhookSecret: process.env.PAYSTACK_WEBHOOK_SECRET,
    supportedMethods: ['card', 'bank', 'ussd', 'qr', 'mobile_money'],
    feeCalculation: (amount: number) => Math.min(amount * 0.015, 2000),
  },
  FLUTTERWAVE: {
    baseUrl: 'https://api.flutterwave.com/v3',
    publicKey: process.env.FLUTTERWAVE_PUBLIC_KEY,
    secretKey: process.env.FLUTTERWAVE_SECRET_KEY,
    webhookSecret: process.env.FLUTTERWAVE_WEBHOOK_SECRET,
    supportedMethods: ['card', 'account', 'ussd', 'qr', 'mobile_money'],
    feeCalculation: (amount: number) => Math.min(amount * 0.014, 2000),
  },
};

export const PAYMENT_ERROR_MESSAGES = {
  INVALID_AMOUNT: 'Invalid payment amount',
  INSUFFICIENT_FUNDS: 'Insufficient funds',
  PAYMENT_FAILED: 'Payment processing failed',
  GATEWAY_ERROR: 'Payment gateway error',
  INVALID_PAYMENT_METHOD: 'Invalid payment method',
  TRANSACTION_NOT_FOUND: 'Transaction not found',
  REFUND_NOT_ALLOWED: 'Refund not allowed for this transaction',
  WEBHOOK_VERIFICATION_FAILED: 'Webhook signature verification failed',
  PAYMENT_EXPIRED: 'Payment session has expired',
  DUPLICATE_TRANSACTION: 'Duplicate transaction detected',
  RECONCILIATION_FAILED: 'Payment reconciliation failed',
};

export const PAYMENT_SUCCESS_MESSAGES = {
  PAYMENT_INITIATED: 'Payment initiated successfully',
  PAYMENT_COMPLETED: 'Payment completed successfully',
  REFUND_INITIATED: 'Refund initiated successfully',
  REFUND_COMPLETED: 'Refund completed successfully',
  WEBHOOK_PROCESSED: 'Webhook processed successfully',
  RECONCILIATION_COMPLETED: 'Payment reconciliation completed',
};
