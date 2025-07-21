// Order business constants
export const ORDER_CONSTANTS = {
  // Order number generation
  ORDER_NUMBER_PREFIX: 'FRG',
  ORDER_NUMBER_LENGTH: 8,
  
  // Payment and pricing
  DEFAULT_DELIVERY_FEE: 500, // in NGN
  FREE_DELIVERY_THRESHOLD: 10000, // orders above this amount get free delivery
  NIBIA_CONVERSION_RATE: 100, // 1 NGN = 100 Nibia points
  
  // Payment plans
  PRICE_LOCK_DELIVERY_DAYS: 35, // 30-45 days for price lock orders
  PAY_SMALL_SMALL_MIN_AMOUNT: 5000, // minimum amount for installment plans
  PAY_LATER_CREDIT_LIMIT: 50000, // maximum credit limit for pay later
  
  // Credit scoring
  CREDIT_SCORE_THRESHOLD: 650, // minimum score for pay later approval
  CREDIT_CHECK_EXPIRY_DAYS: 30, // credit check validity period
  
  // Payment frequencies
  WEEKLY_PAYMENT_DAYS: 7,
  BIWEEKLY_PAYMENT_DAYS: 14,
  MONTHLY_PAYMENT_DAYS: 30,
  
  // Delivery
  STANDARD_DELIVERY_DAYS: 3,
  EXPRESS_DELIVERY_DAYS: 1,
  PICKUP_READY_HOURS: 24,
  
  // Order limits
  MAX_ITEMS_PER_ORDER: 50,
  MIN_ORDER_AMOUNT: 500, // minimum order value
  MAX_ORDER_AMOUNT: 500000, // maximum order value
  
  // Status transitions
  ORDER_CANCELLATION_DEADLINE_HOURS: 24, // can cancel within 24 hours
  PAYMENT_RETRY_ATTEMPTS: 3,
  PAYMENT_RETRY_DELAY_HOURS: 24,
  
  // Pagination
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  
  // Analytics
  POPULAR_PRODUCT_MIN_ORDERS: 10,
  TOP_CUSTOMER_MIN_ORDERS: 5,
  
  // File exports
  EXPORT_BATCH_SIZE: 1000,
  EXPORT_DATE_FORMAT: 'YYYY-MM-DD',
  
  // Order notifications
  DELIVERY_REMINDER_DAYS: 1,
  PAYMENT_REMINDER_DAYS: 3,
  OVERDUE_PAYMENT_DAYS: 7,
} as const;

// Order status progression mapping
export const ORDER_STATUS_FLOW = {
  [ORDER_CONSTANTS.ORDER_NUMBER_PREFIX]: ['PENDING'],
  PENDING: ['PAID', 'CANCELLED'],
  PAID: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
} as const;

// Payment plan configurations
export const PAYMENT_PLAN_CONFIG = {
  PAY_NOW: {
    description: 'Full payment with instant delivery',
    deliveryDays: ORDER_CONSTANTS.STANDARD_DELIVERY_DAYS,
    requiresCreditCheck: false,
    allowsInstallments: false,
  },
  PRICE_LOCK: {
    description: 'Lock price, deliver after 30-45 days',
    deliveryDays: ORDER_CONSTANTS.PRICE_LOCK_DELIVERY_DAYS,
    requiresCreditCheck: false,
    allowsInstallments: false,
  },
  PAY_SMALL_SMALL: {
    description: 'Split into weekly/monthly payments',
    deliveryDays: ORDER_CONSTANTS.STANDARD_DELIVERY_DAYS,
    requiresCreditCheck: true,
    allowsInstallments: true,
    minAmount: ORDER_CONSTANTS.PAY_SMALL_SMALL_MIN_AMOUNT,
  },
  PAY_LATER: {
    description: 'Credit check before approving',
    deliveryDays: ORDER_CONSTANTS.STANDARD_DELIVERY_DAYS,
    requiresCreditCheck: true,
    allowsInstallments: false,
    maxCreditLimit: ORDER_CONSTANTS.PAY_LATER_CREDIT_LIMIT,
  },
} as const;

// Delivery method configurations
export const DELIVERY_METHOD_CONFIG = {
  PICKUP: {
    description: 'Pickup from store',
    fee: 0,
    readyHours: ORDER_CONSTANTS.PICKUP_READY_HOURS,
    requiresAddress: false,
  },
  HOME_DELIVERY: {
    description: 'Delivery to home address',
    fee: ORDER_CONSTANTS.DEFAULT_DELIVERY_FEE,
    deliveryDays: ORDER_CONSTANTS.STANDARD_DELIVERY_DAYS,
    requiresAddress: true,
  },
} as const;

// Payment method configurations
export const PAYMENT_METHOD_CONFIG = {
  FOOD_MONEY: {
    description: 'Forage wallet balance',
    processingFee: 0,
    instantProcessing: true,
  },
  FOOD_POINTS: {
    description: 'Nibia loyalty points',
    processingFee: 0,
    instantProcessing: true,
  },
  CASH: {
    description: 'Cash payment on delivery',
    processingFee: 0,
    instantProcessing: false,
  },
  CARD: {
    description: 'Credit/Debit card',
    processingFee: 0.015, // 1.5% processing fee
    instantProcessing: true,
  },
  BANK_TRANSFER: {
    description: 'Bank transfer',
    processingFee: 0,
    instantProcessing: false,
  },
} as const;

// Error messages
export const ORDER_ERROR_MESSAGES = {
  ORDER_NOT_FOUND: 'Order not found',
  INVALID_ORDER_STATUS: 'Invalid order status transition',
  PAYMENT_REQUIRED: 'Payment is required to proceed',
  CREDIT_CHECK_FAILED: 'Credit check failed. Please choose a different payment plan',
  INSUFFICIENT_CREDIT_LIMIT: 'Order amount exceeds approved credit limit',
  ORDER_ALREADY_PAID: 'Order has already been paid',
  ORDER_CANCELLED: 'Order has been cancelled',
  DELIVERY_ADDRESS_REQUIRED: 'Delivery address is required for home delivery',
  INVALID_PAYMENT_AMOUNT: 'Payment amount is invalid',
  ORDER_AMOUNT_TOO_LOW: `Minimum order amount is ${ORDER_CONSTANTS.MIN_ORDER_AMOUNT} NGN`,
  ORDER_AMOUNT_TOO_HIGH: `Maximum order amount is ${ORDER_CONSTANTS.MAX_ORDER_AMOUNT} NGN`,
  TOO_MANY_ITEMS: `Maximum ${ORDER_CONSTANTS.MAX_ITEMS_PER_ORDER} items allowed per order`,
  CANCELLATION_DEADLINE_PASSED: 'Order cannot be cancelled after 24 hours',
  INVALID_INSTALLMENT_PLAN: 'Invalid installment plan configuration',
  PAYMENT_SCHEDULE_CONFLICT: 'Payment schedule conflicts with existing payments',
} as const;

// Success messages
export const ORDER_SUCCESS_MESSAGES = {
  ORDER_CREATED: 'Order created successfully',
  ORDER_UPDATED: 'Order updated successfully',
  ORDER_CANCELLED: 'Order cancelled successfully',
  PAYMENT_PROCESSED: 'Payment processed successfully',
  ORDER_SHIPPED: 'Order has been shipped',
  ORDER_DELIVERED: 'Order has been delivered',
  CREDIT_CHECK_APPROVED: 'Credit check approved',
  INSTALLMENT_PLAN_CREATED: 'Installment plan created successfully',
} as const;
