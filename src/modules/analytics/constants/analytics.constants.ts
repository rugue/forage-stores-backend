/**
 * Analytics Module Constants
 */

export const ANALYTICS_CONSTANTS = {
  // Default chart colors
  CHART_COLORS: [
    '#FF6384', // Red
    '#36A2EB', // Blue  
    '#FFCE56', // Yellow
    '#4BC0C0', // Teal
    '#9966FF', // Purple
    '#FF9F40', // Orange
    '#FF6384', // Pink
    '#C9CBCF', // Grey
    '#4BC0C0', // Light Blue
    '#FF6384'  // Light Red
  ],

  // Chart configuration defaults
  CHART_CONFIG: {
    PIE_CHART: {
      showLegend: true,
      showLabels: true,
      minPercentageToShow: 2 // Don't show slices smaller than 2%
    },
    BAR_CHART: {
      showGrid: true,
      showLegend: false,
      barWidth: 0.8
    },
    LINE_CHART: {
      showGrid: true,
      showPoints: true,
      smoothCurve: true
    },
    HISTOGRAM: {
      binCount: 10,
      showGrid: true
    }
  },

  // Date ranges
  DATE_RANGES: {
    LAST_30_DAYS: 30,
    LAST_90_DAYS: 90,
    LAST_6_MONTHS: 180,
    LAST_YEAR: 365
  },

  // Spending limits and ranges
  SPENDING_RANGES: {
    LOW: { min: 0, max: 5000 },
    MEDIUM: { min: 5000, max: 20000 },
    HIGH: { min: 20000, max: 50000 },
    PREMIUM: { min: 50000, max: Number.MAX_SAFE_INTEGER }
  },

  // Analytics periods
  PERIODS: {
    DAILY: 'daily',
    WEEKLY: 'weekly', 
    MONTHLY: 'monthly',
    YEARLY: 'yearly'
  },

  // Cache settings
  CACHE: {
    DASHBOARD_TTL: 300, // 5 minutes
    ANALYTICS_TTL: 600, // 10 minutes
    REPORTS_TTL: 1800   // 30 minutes
  },

  // Pagination
  PAGINATION: {
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
    DEFAULT_PAGE: 1
  },

  // Chart limits
  CHART_LIMITS: {
    MAX_PIE_SLICES: 10,
    MAX_BAR_ITEMS: 50,
    MAX_LINE_POINTS: 365
  },

  // Report formats
  REPORT_FORMATS: {
    JSON: 'json',
    CSV: 'csv',
    PDF: 'pdf'
  },

  // Insight thresholds
  INSIGHTS: {
    HIGH_SPENDING_THRESHOLD: 0.2, // 20% increase considered high
    LOW_SPENDING_THRESHOLD: -0.1, // 10% decrease considered low
    FREQUENT_ORDERING_THRESHOLD: 10, // 10+ orders per month
    CATEGORY_DOMINANCE_THRESHOLD: 0.5 // 50% of spending in one category
  },

  // Error messages
  ERRORS: {
    INSUFFICIENT_DATA: 'Insufficient data for analysis',
    INVALID_DATE_RANGE: 'Invalid date range provided',
    NO_ORDERS_FOUND: 'No orders found for the specified criteria',
    CHART_GENERATION_FAILED: 'Failed to generate chart data',
    REPORT_GENERATION_FAILED: 'Failed to generate report'
  },

  // Success messages
  MESSAGES: {
    DASHBOARD_GENERATED: 'Expense tracking dashboard generated successfully',
    CHART_GENERATED: 'Chart data generated successfully',
    REPORT_GENERATED: 'Spending report generated successfully',
    ANALYTICS_COMPUTED: 'Analytics computed successfully'
  }
};

export const PAYMENT_METHOD_LABELS = {
  'food_money': 'Food Money',
  'food_points': 'Food Points', 
  'cash': 'Cash',
  'card': 'Card Payment',
  'bank_transfer': 'Bank Transfer'
};

export const ORDER_STATUS_LABELS = {
  'pending': 'Pending',
  'paid': 'Paid',
  'shipped': 'Shipped',
  'delivered': 'Delivered',
  'cancelled': 'Cancelled'
};

export const PAYMENT_PLAN_LABELS = {
  'pay_now': 'Pay Now',
  'price_lock': 'Price Lock',
  'pay_small_small': 'Pay Small Small',
  'pay_later': 'Pay Later'
};
