/**
 * Profit Pool Module Constants
 */

export const PROFIT_POOL_CONSTANTS = {
  // Revenue sharing
  POOL_PERCENTAGE: 0.01, // 1% of revenue
  
  // Cron schedule
  MONTHLY_CALCULATION_CRON: '0 2 1 * *', // 1st day of month at 2 AM
  DISTRIBUTION_CRON: '0 3 1 * *', // 1st day of month at 3 AM
  
  // Collection names
  COLLECTION_NAME: 'profitpools',
  
  // Status values
  STATUS: {
    CALCULATED: 'calculated',
    DISTRIBUTED: 'distributed',
    FAILED: 'failed',
  } as const,
  
  // Distribution limits
  MAX_RETRIES: 3,
  RETRY_DELAY: 30000, // 30 seconds
  
  // Transaction references
  TRANSACTION_PREFIX: 'POOL',
  
  // Default values
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  
  // Revenue calculation
  REVENUE_SOURCES: {
    ORDER_COMPLETED: 'order_completed',
    SUBSCRIPTION_PAYMENT: 'subscription_payment',
    DELIVERY_FEE: 'delivery_fee',
  } as const,
  
  // Cities supported
  SUPPORTED_CITIES: [
    'Lagos',
    'Abuja',
    'Port Harcourt',
    'Kano',
    'Ibadan',
    'Benin City',
    'Enugu',
    'Kaduna',
    'Jos',
    'Ilorin',
  ] as const,
  
  // Cache keys
  CACHE_KEYS: {
    MONTHLY_REVENUE: 'profit_pool:revenue',
    CITY_GES: 'profit_pool:ges',
    STATS: 'profit_pool:stats',
  } as const,
  
  // Cache TTL (in seconds)
  CACHE_TTL: {
    REVENUE: 3600, // 1 hour
    GES: 1800, // 30 minutes
    STATS: 7200, // 2 hours
  } as const,
  
  // Validation
  MONTH_FORMAT: /^\d{4}-\d{2}$/,
  MIN_POOL_AMOUNT: 100, // Minimum 100 Nibia to distribute
  
  // Logging
  LOG_CONTEXT: 'ProfitPoolModule',
  
  // Error messages
  ERRORS: {
    INVALID_MONTH: 'Invalid month format. Use YYYY-MM',
    POOL_EXISTS: 'Profit pool already exists for this city and month',
    POOL_NOT_FOUND: 'Profit pool not found',
    NO_GES_FOUND: 'No Growth Elites found in this city',
    INSUFFICIENT_REVENUE: 'Insufficient revenue to create profit pool',
    DISTRIBUTION_FAILED: 'Failed to distribute profits',
    ALREADY_DISTRIBUTED: 'Profit pool already distributed',
    CALCULATION_IN_PROGRESS: 'Calculation already in progress',
    INVALID_STATUS: 'Invalid profit pool status',
  } as const,
  
  // Success messages
  SUCCESS: {
    POOL_CREATED: 'Profit pool created successfully',
    POOL_DISTRIBUTED: 'Profits distributed successfully',
    STATS_RETRIEVED: 'Statistics retrieved successfully',
    POOLS_RETRIEVED: 'Profit pools retrieved successfully',
  } as const,
};

export type SupportedCity = typeof PROFIT_POOL_CONSTANTS.SUPPORTED_CITIES[number];
export type RevenueSource = typeof PROFIT_POOL_CONSTANTS.REVENUE_SOURCES[keyof typeof PROFIT_POOL_CONSTANTS.REVENUE_SOURCES];
export type ProfitPoolError = typeof PROFIT_POOL_CONSTANTS.ERRORS[keyof typeof PROFIT_POOL_CONSTANTS.ERRORS];
export type ProfitPoolSuccess = typeof PROFIT_POOL_CONSTANTS.SUCCESS[keyof typeof PROFIT_POOL_CONSTANTS.SUCCESS];
