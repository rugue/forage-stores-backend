// Product business constants
export const PRODUCT_CONSTANTS = {
  // Pricing limits
  MIN_PRICE: 1, // minimum price in NGN
  MAX_PRICE: 1000000, // maximum price in NGN
  NIBIA_CONVERSION_RATE: 100, // 1 NGN = 100 Nibia points
  
  // Product specifications
  MIN_WEIGHT: 1, // minimum weight in grams
  MAX_WEIGHT: 50000, // maximum weight in grams (50kg)
  MAX_NAME_LENGTH: 255,
  MAX_DESCRIPTION_LENGTH: 2000,
  MAX_TAGS_COUNT: 20,
  MAX_IMAGES_COUNT: 10,
  
  // Stock management
  DEFAULT_STOCK: 0,
  LOW_STOCK_THRESHOLD: 10,
  OUT_OF_STOCK_THRESHOLD: 0,
  MAX_STOCK_QUANTITY: 10000,
  
  // Search and pagination
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  SEARCH_MIN_LENGTH: 2,
  
  // File uploads
  MAX_IMAGE_SIZE: 5242880, // 5MB in bytes
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  IMAGE_QUALITY: 80,
  
  // Analytics
  TOP_PRODUCTS_LIMIT: 10,
  POPULAR_PRODUCT_MIN_SALES: 5,
  TRENDING_DAYS_THRESHOLD: 7,
} as const;

// Product categories mapping
export const PRODUCT_CATEGORIES = {
  FRUITS: 'fruits',
  VEGETABLES: 'vegetables',
  GRAINS: 'grains',
  DAIRY: 'dairy',
  MEAT: 'meat',
  BEVERAGES: 'beverages',
  SNACKS: 'snacks',
  SPICES: 'spices',
  SEAFOOD: 'seafood',
  OTHERS: 'others',
} as const;

// Delivery type mapping
export const DELIVERY_TYPES = {
  FREE: 'free',
  PAID: 'paid',
} as const;

// Search and filter fields
export const PRODUCT_SEARCH_FIELDS = [
  'name',
  'description',
  'tags',
  'category',
] as const;

export const PRODUCT_SORT_FIELDS = [
  'name',
  'price',
  'priceInNibia',
  'weight',
  'stock',
  'category',
  'city',
  'createdAt',
  'updatedAt',
] as const;

// Price range configurations
export const PRICE_RANGES = [
  { min: 0, max: 500, label: 'Under ₦500' },
  { min: 500, max: 1000, label: '₦500 - ₦1,000' },
  { min: 1000, max: 2500, label: '₦1,000 - ₦2,500' },
  { min: 2500, max: 5000, label: '₦2,500 - ₦5,000' },
  { min: 5000, max: 10000, label: '₦5,000 - ₦10,000' },
  { min: 10000, max: Infinity, label: 'Above ₦10,000' },
] as const;

// Product validation rules
export const PRODUCT_VALIDATION = {
  NAME_PATTERN: /^[a-zA-Z0-9\s\-&'().,]+$/,
  TAG_PATTERN: /^[a-zA-Z0-9\-_]+$/,
  CITY_PATTERN: /^[a-zA-Z\s\-']+$/,
  IMAGE_URL_PATTERN: /^https?:\/\/.+\.(jpg|jpeg|png|webp)$/i,
} as const;

// Error messages
export const PRODUCT_ERROR_MESSAGES = {
  PRODUCT_NOT_FOUND: 'Product not found',
  INVALID_PRICE: 'Invalid product price',
  INVALID_WEIGHT: 'Invalid product weight',
  INVALID_STOCK: 'Invalid stock quantity',
  DUPLICATE_PRODUCT: 'Product with this name already exists in this city',
  OUT_OF_STOCK: 'Product is currently out of stock',
  INSUFFICIENT_STOCK: 'Insufficient stock available',
  INVALID_CATEGORY: 'Invalid product category',
  INVALID_DELIVERY_TYPE: 'Invalid delivery type',
  NAME_TOO_LONG: `Product name cannot exceed ${PRODUCT_CONSTANTS.MAX_NAME_LENGTH} characters`,
  DESCRIPTION_TOO_LONG: `Product description cannot exceed ${PRODUCT_CONSTANTS.MAX_DESCRIPTION_LENGTH} characters`,
  TOO_MANY_TAGS: `Maximum ${PRODUCT_CONSTANTS.MAX_TAGS_COUNT} tags allowed`,
  TOO_MANY_IMAGES: `Maximum ${PRODUCT_CONSTANTS.MAX_IMAGES_COUNT} images allowed`,
  INVALID_TAG_FORMAT: 'Tags can only contain letters, numbers, hyphens, and underscores',
  PRICE_OUT_OF_RANGE: `Price must be between ₦${PRODUCT_CONSTANTS.MIN_PRICE} and ₦${PRODUCT_CONSTANTS.MAX_PRICE}`,
  WEIGHT_OUT_OF_RANGE: `Weight must be between ${PRODUCT_CONSTANTS.MIN_WEIGHT}g and ${PRODUCT_CONSTANTS.MAX_WEIGHT}g`,
  UNAUTHORIZED_SELLER: 'You are not authorized to manage this product',
  PRODUCT_INACTIVE: 'This product is currently inactive',
} as const;

// Success messages
export const PRODUCT_SUCCESS_MESSAGES = {
  PRODUCT_CREATED: 'Product created successfully',
  PRODUCT_UPDATED: 'Product updated successfully',
  PRODUCT_DELETED: 'Product deleted successfully',
  PRODUCT_ACTIVATED: 'Product activated successfully',
  PRODUCT_DEACTIVATED: 'Product deactivated successfully',
  STOCK_UPDATED: 'Stock updated successfully',
  PRICE_UPDATED: 'Price updated successfully',
  IMAGES_UPLOADED: 'Images uploaded successfully',
} as const;

// Default values
export const PRODUCT_DEFAULTS = {
  DELIVERY_TYPE: DELIVERY_TYPES.PAID,
  IS_ACTIVE: true,
  STOCK: PRODUCT_CONSTANTS.DEFAULT_STOCK,
  TAGS: [],
  IMAGES: [],
  SORT_BY: 'createdAt',
  SORT_ORDER: 'desc',
  PAGE: 1,
  LIMIT: PRODUCT_CONSTANTS.DEFAULT_PAGE_SIZE,
} as const;
