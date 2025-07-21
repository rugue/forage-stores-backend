// Notification business constants
export const NOTIFICATION_CONSTANTS = {
  // Message limits
  MAX_TITLE_LENGTH: 255,
  MAX_MESSAGE_LENGTH: 1000,
  MAX_METADATA_SIZE: 5000, // bytes
  
  // Retry configuration
  MAX_RETRY_ATTEMPTS: 3,
  RETRY_DELAY_MINUTES: [5, 15, 60], // Progressive delay
  RETRY_BACKOFF_MULTIPLIER: 2,
  
  // Rate limiting
  EMAIL_RATE_LIMIT_PER_MINUTE: 100,
  PUSH_RATE_LIMIT_PER_MINUTE: 500,
  SMS_RATE_LIMIT_PER_MINUTE: 50,
  WHATSAPP_RATE_LIMIT_PER_MINUTE: 100,
  
  // Expiry and scheduling
  DEFAULT_EXPIRY_HOURS: 72, // 3 days
  MAX_SCHEDULE_DAYS_AHEAD: 30,
  CLEANUP_EXPIRED_DAYS: 90,
  
  // Pagination
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  
  // Bulk operations
  MAX_BULK_RECIPIENTS: 1000,
  BULK_BATCH_SIZE: 50,
  
  // Performance
  QUEUE_PROCESSING_INTERVAL_SECONDS: 30,
  DELIVERY_TIMEOUT_SECONDS: 30,
  READ_TIMEOUT_MINUTES: 60,
  
  // Templates
  MAX_TEMPLATE_VARIABLES: 20,
  TEMPLATE_CACHE_TTL_MINUTES: 60,
} as const;

// Notification priority configurations
export const PRIORITY_CONFIG = {
  LOW: {
    description: 'Non-urgent notifications',
    deliveryDelay: 0,
    retryCount: 1,
    expiryHours: 72,
  },
  MEDIUM: {
    description: 'Standard notifications',
    deliveryDelay: 0,
    retryCount: 2,
    expiryHours: 48,
  },
  HIGH: {
    description: 'Important notifications',
    deliveryDelay: 0,
    retryCount: 3,
    expiryHours: 24,
  },
  URGENT: {
    description: 'Critical notifications requiring immediate attention',
    deliveryDelay: 0,
    retryCount: 5,
    expiryHours: 12,
  },
} as const;

// Channel configurations
export const CHANNEL_CONFIG = {
  EMAIL: {
    description: 'Email notifications',
    isRealTime: false,
    supportsBulk: true,
    supportsScheduling: true,
    maxMessageLength: 10000,
    supportedContentTypes: ['text', 'html'],
  },
  PUSH: {
    description: 'Push notifications',
    isRealTime: true,
    supportsBulk: true,
    supportsScheduling: true,
    maxMessageLength: 256,
    supportedContentTypes: ['text'],
  },
  SMS: {
    description: 'SMS notifications',
    isRealTime: true,
    supportsBulk: true,
    supportsScheduling: true,
    maxMessageLength: 160,
    supportedContentTypes: ['text'],
  },
  WHATSAPP: {
    description: 'WhatsApp notifications',
    isRealTime: true,
    supportsBulk: false,
    supportsScheduling: false,
    maxMessageLength: 4096,
    supportedContentTypes: ['text', 'media'],
  },
  IN_APP: {
    description: 'In-app notifications',
    isRealTime: true,
    supportsBulk: true,
    supportsScheduling: true,
    maxMessageLength: 500,
    supportedContentTypes: ['text', 'rich'],
  },
} as const;

// Notification type configurations
export const TYPE_CONFIG = {
  ORDER_UPDATE: {
    description: 'Order status updates',
    defaultChannel: 'PUSH',
    priority: 'MEDIUM',
    userControllable: true,
  },
  PAYMENT_REMINDER: {
    description: 'Payment due reminders',
    defaultChannel: 'EMAIL',
    priority: 'HIGH',
    userControllable: true,
  },
  AUCTION_EVENT: {
    description: 'Auction-related events',
    defaultChannel: 'PUSH',
    priority: 'HIGH',
    userControllable: true,
  },
  RIDER_ASSIGNMENT: {
    description: 'Delivery rider assignments',
    defaultChannel: 'PUSH',
    priority: 'HIGH',
    userControllable: false,
  },
  GENERAL: {
    description: 'General announcements',
    defaultChannel: 'IN_APP',
    priority: 'LOW',
    userControllable: true,
  },
  DROP_REMINDER: {
    description: 'Product drop reminders',
    defaultChannel: 'PUSH',
    priority: 'MEDIUM',
    userControllable: true,
  },
  PRICE_LOCK_EXPIRED: {
    description: 'Price lock expiration notices',
    defaultChannel: 'EMAIL',
    priority: 'HIGH',
    userControllable: false,
  },
  WALLET_TRANSACTION: {
    description: 'Wallet transaction alerts',
    defaultChannel: 'PUSH',
    priority: 'MEDIUM',
    userControllable: true,
  },
  SECURITY_ALERT: {
    description: 'Security-related alerts',
    defaultChannel: 'EMAIL',
    priority: 'URGENT',
    userControllable: false,
  },
  PROMOTION: {
    description: 'Promotional offers',
    defaultChannel: 'PUSH',
    priority: 'LOW',
    userControllable: true,
  },
} as const;

// Default user preferences
export const DEFAULT_PREFERENCES = {
  emailEnabled: true,
  pushEnabled: true,
  whatsappEnabled: false,
  smsEnabled: false,
  inAppEnabled: true,
  categories: {
    orderUpdates: true,
    paymentReminders: true,
    promotions: false,
    securityAlerts: true,
    auctionEvents: true,
    generalNews: false,
  },
  quietHours: {
    enabled: false,
    startTime: '22:00',
    endTime: '08:00',
    timezone: 'Africa/Lagos',
  },
} as const;

// Error messages
export const NOTIFICATION_ERROR_MESSAGES = {
  NOTIFICATION_NOT_FOUND: 'Notification not found',
  RECIPIENT_NOT_FOUND: 'Recipient not found',
  INVALID_CHANNEL: 'Invalid notification channel',
  INVALID_TYPE: 'Invalid notification type',
  INVALID_PRIORITY: 'Invalid notification priority',
  MESSAGE_TOO_LONG: `Message exceeds maximum length of ${NOTIFICATION_CONSTANTS.MAX_MESSAGE_LENGTH} characters`,
  TITLE_TOO_LONG: `Title exceeds maximum length of ${NOTIFICATION_CONSTANTS.MAX_TITLE_LENGTH} characters`,
  EXPIRED_NOTIFICATION: 'Notification has expired',
  ALREADY_SENT: 'Notification has already been sent',
  DELIVERY_FAILED: 'Failed to deliver notification',
  RATE_LIMIT_EXCEEDED: 'Rate limit exceeded for this channel',
  INVALID_TEMPLATE: 'Invalid notification template',
  MISSING_VARIABLES: 'Required template variables are missing',
  BULK_LIMIT_EXCEEDED: `Bulk operation exceeds maximum limit of ${NOTIFICATION_CONSTANTS.MAX_BULK_RECIPIENTS} recipients`,
  SCHEDULING_TOO_FAR: `Cannot schedule notifications more than ${NOTIFICATION_CONSTANTS.MAX_SCHEDULE_DAYS_AHEAD} days ahead`,
  PREFERENCES_NOT_FOUND: 'User notification preferences not found',
  CHANNEL_DISABLED: 'Notification channel is disabled for this user',
  QUIET_HOURS_ACTIVE: 'User has quiet hours enabled',
  PROVIDER_UNAVAILABLE: 'Notification provider is currently unavailable',
} as const;

// Success messages
export const NOTIFICATION_SUCCESS_MESSAGES = {
  NOTIFICATION_SENT: 'Notification sent successfully',
  NOTIFICATION_SCHEDULED: 'Notification scheduled successfully',
  NOTIFICATION_UPDATED: 'Notification updated successfully',
  NOTIFICATION_DELETED: 'Notification deleted successfully',
  BULK_NOTIFICATIONS_QUEUED: 'Bulk notifications queued for processing',
  PREFERENCES_UPDATED: 'Notification preferences updated successfully',
  TEMPLATE_CREATED: 'Notification template created successfully',
  TEMPLATE_UPDATED: 'Notification template updated successfully',
  PROVIDER_CONFIGURED: 'Notification provider configured successfully',
  NOTIFICATION_READ: 'Notification marked as read',
  NOTIFICATIONS_MARKED_READ: 'All notifications marked as read',
} as const;

// Queue configurations
export const QUEUE_CONFIG = {
  LOW_PRIORITY: {
    name: 'low-priority-notifications',
    concurrency: 5,
    processingDelay: 1000, // 1 second
  },
  MEDIUM_PRIORITY: {
    name: 'medium-priority-notifications',
    concurrency: 10,
    processingDelay: 500, // 0.5 seconds
  },
  HIGH_PRIORITY: {
    name: 'high-priority-notifications',
    concurrency: 20,
    processingDelay: 100, // 0.1 seconds
  },
  URGENT_PRIORITY: {
    name: 'urgent-notifications',
    concurrency: 50,
    processingDelay: 0, // Immediate
  },
} as const;

// Default values
export const NOTIFICATION_DEFAULTS = {
  PRIORITY: 'MEDIUM',
  STATUS: 'PENDING',
  READ: false,
  SUCCESS: true,
  RETRY_COUNT: 0,
  PAGE_SIZE: NOTIFICATION_CONSTANTS.DEFAULT_PAGE_SIZE,
  SORT_BY: 'createdAt',
  SORT_ORDER: 'desc',
  EXPIRY_HOURS: NOTIFICATION_CONSTANTS.DEFAULT_EXPIRY_HOURS,
} as const;
