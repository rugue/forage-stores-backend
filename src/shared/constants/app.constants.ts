export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 100;
export const MIN_PASSWORD_LENGTH = 8;
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const JWT_EXPIRATION = '1d';
export const REFRESH_TOKEN_EXPIRATION = '7d';

// Rate limiting
export const THROTTLE_TTL = 60; // 1 minute
export const THROTTLE_LIMIT = 100; // 100 requests per minute

// Cache TTL values (in seconds)
export const CACHE_TTL = {
  PRODUCTS: 300, // 5 minutes
  CATEGORIES: 3600, // 1 hour
  USER_PROFILE: 60, // 1 minute
};

// Message templates
export const MESSAGE_TEMPLATES = {
  WELCOME: 'Welcome to Forage Stores, {{name}}!',
  ORDER_CONFIRMATION: 'Your order #{{orderId}} has been confirmed.',
  PAYMENT_RECEIVED: 'Payment received for order #{{orderId}}.',
};

// Error messages
export const ERROR_MESSAGES = {
  UNAUTHORIZED: 'Unauthorized access',
  FORBIDDEN: 'Access forbidden',
  NOT_FOUND: 'Resource not found',
  VALIDATION_ERROR: 'Validation error occurred',
  INTERNAL_SERVER_ERROR: 'Internal server error occurred',
};
