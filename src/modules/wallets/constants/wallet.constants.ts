// Wallet business constants
export const WALLET_CONSTANTS = {
  // Balance limits
  MIN_BALANCE: 0,
  MAX_BALANCE: 10000000, // 10 million NGN
  MAX_FOOD_POINTS: 5000000, // 5 million points
  
  // Transaction limits
  MIN_TRANSACTION_AMOUNT: 1, // 1 NGN minimum
  MAX_TRANSACTION_AMOUNT: 500000, // 500k NGN per transaction
  DAILY_TRANSACTION_LIMIT: 1000000, // 1M NGN per day
  MONTHLY_TRANSACTION_LIMIT: 10000000, // 10M NGN per month
  
  // Conversion rates
  NIBIA_TO_NGN_RATE: 1.0, // 1 Nibia = 1 NGN (updated for GA/GE withdrawal)
  NGN_TO_NIBIA_RATE: 1.0, // 1 NGN = 1 Nibia (updated for GA/GE withdrawal)
  
  // Withdrawal limits for GA/GE users
  MIN_WITHDRAWAL_AMOUNT: 1, // 1 Nibia minimum
  MAX_WITHDRAWAL_AMOUNT: 100000, // 100k Nibia per request
  DAILY_WITHDRAWAL_LIMIT: 500000, // 500k Nibia per day
  MONTHLY_WITHDRAWAL_LIMIT: 2000000, // 2M Nibia per month
  
  // Withdrawal processing
  WITHDRAWAL_PROCESSING_FEE: 0, // No fee for GA/GE withdrawals
  AUTO_APPROVE_LIMIT: 10000, // Auto-approve withdrawals under 10k Nibia for GE
  PRIORITY_PROCESSING_HOURS: 24, // GE requests processed within 24 hours
  
  // Fees and charges
  TRANSFER_FEE_PERCENTAGE: 0.005, // 0.5% transfer fee
  MIN_TRANSFER_FEE: 5, // Minimum 5 NGN
  MAX_TRANSFER_FEE: 500, // Maximum 500 NGN
  
  // System limits
  WALLET_INACTIVITY_DAYS: 365, // 1 year
  TRANSACTION_HISTORY_DAYS: 730, // 2 years
  AUTO_FREEZE_SUSPICIOUS_AMOUNT: 100000, // 100k NGN
  
  // Pagination
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  
  // Retry and timeout
  TRANSACTION_TIMEOUT_SECONDS: 30,
  MAX_RETRY_ATTEMPTS: 3,
  RETRY_DELAY_SECONDS: 5,
} as const;

// Wallet status configurations
export const WALLET_STATUS_CONFIG = {
  ACTIVE: {
    description: 'Wallet is active and can perform all operations',
    canTransact: true,
    canReceive: true,
    canWithdraw: true,
  },
  SUSPENDED: {
    description: 'Wallet is temporarily suspended',
    canTransact: false,
    canReceive: true,
    canWithdraw: false,
  },
  FROZEN: {
    description: 'Wallet is frozen due to security concerns',
    canTransact: false,
    canReceive: false,
    canWithdraw: false,
  },
} as const;

// Transaction type configurations
export const TRANSACTION_TYPES = {
  CREDIT: {
    description: 'Money added to wallet',
    affectsBalance: 'increase',
    requiresApproval: false,
  },
  DEBIT: {
    description: 'Money deducted from wallet',
    affectsBalance: 'decrease',
    requiresApproval: true,
  },
  TRANSFER: {
    description: 'Money transferred between wallets',
    affectsBalance: 'both',
    requiresApproval: true,
  },
  REFUND: {
    description: 'Money refunded to wallet',
    affectsBalance: 'increase',
    requiresApproval: false,
  },
  CASHBACK: {
    description: 'Cashback reward',
    affectsBalance: 'increase',
    requiresApproval: false,
  },
  BONUS: {
    description: 'Bonus reward',
    affectsBalance: 'increase',
    requiresApproval: false,
  },
  PENALTY: {
    description: 'Penalty charge',
    affectsBalance: 'decrease',
    requiresApproval: true,
  },
} as const;

// Currency configurations
export const CURRENCY_CONFIG = {
  FOOD_MONEY: {
    symbol: '₦',
    name: 'Food Money',
    decimalPlaces: 2,
    isMainCurrency: true,
  },
  FOOD_POINTS: {
    symbol: 'FP',
    name: 'Food Points',
    decimalPlaces: 2,
    isMainCurrency: false,
  },
  FOOD_SAFE: {
    symbol: '₦',
    name: 'Food Safe',
    decimalPlaces: 2,
    isMainCurrency: false,
  },
} as const;

// Error messages
export const WALLET_ERROR_MESSAGES = {
  WALLET_NOT_FOUND: 'Wallet not found',
  INSUFFICIENT_BALANCE: 'Insufficient wallet balance',
  WALLET_SUSPENDED: 'Wallet is suspended',
  WALLET_FROZEN: 'Wallet is frozen',
  INVALID_AMOUNT: 'Invalid transaction amount',
  AMOUNT_TOO_LOW: `Minimum transaction amount is ₦${WALLET_CONSTANTS.MIN_TRANSACTION_AMOUNT}`,
  AMOUNT_TOO_HIGH: `Maximum transaction amount is ₦${WALLET_CONSTANTS.MAX_TRANSACTION_AMOUNT}`,
  DAILY_LIMIT_EXCEEDED: 'Daily transaction limit exceeded',
  MONTHLY_LIMIT_EXCEEDED: 'Monthly transaction limit exceeded',
  SELF_TRANSFER: 'Cannot transfer to the same wallet',
  INVALID_CURRENCY: 'Invalid currency type',
  TRANSACTION_FAILED: 'Transaction failed to process',
  DUPLICATE_TRANSACTION: 'Duplicate transaction detected',
  WALLET_ALREADY_EXISTS: 'Wallet already exists for this user',
  UNAUTHORIZED_ACCESS: 'Unauthorized wallet access',
  NEGATIVE_BALANCE: 'Transaction would result in negative balance',
  CONVERSION_FAILED: 'Currency conversion failed',
} as const;

// Success messages
export const WALLET_SUCCESS_MESSAGES = {
  WALLET_CREATED: 'Wallet created successfully',
  BALANCE_UPDATED: 'Wallet balance updated successfully',
  TRANSFER_COMPLETED: 'Transfer completed successfully',
  WALLET_STATUS_UPDATED: 'Wallet status updated successfully',
  TRANSACTION_PROCESSED: 'Transaction processed successfully',
  FUNDS_ADDED: 'Funds added to wallet successfully',
  FUNDS_WITHDRAWN: 'Funds withdrawn successfully',
  WALLET_ACTIVATED: 'Wallet activated successfully',
  WALLET_SUSPENDED: 'Wallet suspended successfully',
  WALLET_FROZEN: 'Wallet frozen successfully',
} as const;

// Validation rules
export const WALLET_VALIDATION = {
  AMOUNT_PATTERN: /^\d+(\.\d{1,2})?$/,
  REFERENCE_PATTERN: /^[A-Za-z0-9\-_]{6,50}$/,
  DESCRIPTION_MAX_LENGTH: 255,
  METADATA_MAX_SIZE: 1000, // bytes
} as const;

// Default values
export const WALLET_DEFAULTS = {
  INITIAL_FOOD_MONEY: 0,
  INITIAL_FOOD_POINTS: 0,
  INITIAL_FOOD_SAFE: 0,
  STATUS: 'active',
  PAGE_SIZE: WALLET_CONSTANTS.DEFAULT_PAGE_SIZE,
  SORT_BY: 'createdAt',
  SORT_ORDER: 'desc',
} as const;
