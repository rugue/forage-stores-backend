import { BundleType, SeasonalType } from '../entities/bundle.entity';

/**
 * Bundle-related constants and configurations
 */
export const BUNDLE_CONSTANTS = {
  // Collection names
  BUNDLE_COLLECTION: 'bundles',
  BUNDLE_ORDER_COLLECTION: 'bundle_orders',
  
  // Bundle limits
  MIN_PRODUCTS_PER_BUNDLE: 2,
  MAX_PRODUCTS_PER_BUNDLE: 20,
  MIN_BUNDLE_PRICE: 1000, // NGN
  MAX_BUNDLE_PRICE: 100000, // NGN
  
  // Gift settings
  MAX_GIFT_MESSAGE_LENGTH: 500,
  GIFT_WRAPPING_BASE_FEE: 200, // NGN
  
  // Order limits
  MAX_BUNDLE_QUANTITY_PER_ORDER: 10,
  DEFAULT_BUNDLE_ORDER_EXPIRY_HOURS: 48,
  
  // Pagination
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  
  // Cache settings
  BUNDLE_CACHE_TTL: 300, // 5 minutes
  SEASONAL_BUNDLE_CACHE_TTL: 60, // 1 minute for seasonal bundles
  
  // File upload
  MAX_BUNDLE_IMAGES: 10,
  ALLOWED_IMAGE_TYPES: ['jpg', 'jpeg', 'png', 'webp'],
  MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB
} as const;

/**
 * Predefined bundle templates
 */
export const BUNDLE_TEMPLATES = {
  [BundleType.FAMILY_RESTOCK]: {
    name: 'Family Restock Bundle',
    description: 'Complete weekly groceries for a family of 4-6 people',
    defaultProducts: [
      { category: 'grains', minQuantity: 2 },
      { category: 'vegetables', minQuantity: 3 },
      { category: 'fruits', minQuantity: 2 },
      { category: 'meat', minQuantity: 1 },
      { category: 'dairy', minQuantity: 1 },
    ],
    basePrice: 15000,
    discountPercentage: 10,
    tags: ['family', 'weekly', 'complete', 'groceries'],
    canBeGifted: true,
    giftMessageTemplate: 'Hope this helps stock your family kitchen with fresh, quality groceries!',
  },
  
  [BundleType.CHRISTMAS_BUNDLE]: {
    name: 'Christmas Special Bundle',
    description: 'Festive holiday bundle with premium items for Christmas celebration',
    defaultProducts: [
      { category: 'meat', minQuantity: 2 }, // Turkey, chicken
      { category: 'beverages', minQuantity: 3 }, // Wines, juices
      { category: 'snacks', minQuantity: 4 }, // Holiday treats
      { category: 'fruits', minQuantity: 2 }, // Festive fruits
      { category: 'spices', minQuantity: 1 }, // Cooking spices
    ],
    basePrice: 25000,
    discountPercentage: 15,
    tags: ['christmas', 'festive', 'holiday', 'premium', 'celebration'],
    canBeGifted: true,
    giftMessageTemplate: 'Wishing you a Merry Christmas filled with joy, love, and delicious food!',
    seasonalType: SeasonalType.CHRISTMAS,
  },
  
  [BundleType.LOVE_BOX]: {
    name: 'Love Box Bundle',
    description: 'Romantic bundle perfect for special occasions and date nights',
    defaultProducts: [
      { category: 'beverages', minQuantity: 1 }, // Wine or romantic drinks
      { category: 'snacks', minQuantity: 3 }, // Chocolates, treats
      { category: 'fruits', minQuantity: 2 }, // Strawberries, romantic fruits
      { category: 'dairy', minQuantity: 1 }, // Cheese, cream
    ],
    basePrice: 8000,
    discountPercentage: 12,
    tags: ['romantic', 'date', 'love', 'special', 'couple'],
    canBeGifted: true,
    giftMessageTemplate: 'A special box filled with love and delicious treats just for you!',
    seasonalType: SeasonalType.VALENTINE,
  },
  
  [BundleType.STAFF_GIFT_BOX]: {
    name: 'Staff Appreciation Gift Box',
    description: 'Premium gift box for employee appreciation and corporate gifting',
    defaultProducts: [
      { category: 'beverages', minQuantity: 2 }, // Premium drinks
      { category: 'snacks', minQuantity: 4 }, // Quality snacks
      { category: 'fruits', minQuantity: 2 }, // Fresh fruits
      { category: 'grains', minQuantity: 1 }, // Premium grains
    ],
    basePrice: 12000,
    discountPercentage: 8,
    tags: ['staff', 'corporate', 'appreciation', 'premium', 'gift'],
    canBeGifted: true,
    giftMessageTemplate: 'Thank you for your hard work and dedication. This gift is a small token of our appreciation!',
    requiresAdminApproval: true,
  },
  
  [BundleType.SEND_FOOD]: {
    name: 'Send Food Bundle',
    description: 'Customizable food bundle to send to family and friends',
    defaultProducts: [
      { category: 'grains', minQuantity: 1 },
      { category: 'vegetables', minQuantity: 2 },
      { category: 'meat', minQuantity: 1 },
      { category: 'fruits', minQuantity: 1 },
    ],
    basePrice: 10000,
    discountPercentage: 5,
    tags: ['send', 'family', 'friends', 'care', 'support'],
    canBeGifted: true,
    giftMessageTemplate: 'Sending you some love through this care package. Hope it brings comfort and nourishment!',
  },
} as const;

/**
 * Seasonal bundle configurations
 */
export const SEASONAL_CONFIGS = {
  [SeasonalType.CHRISTMAS]: {
    startMonth: 11, // November
    startDay: 15,
    endMonth: 12, // December
    endDay: 31,
    name: 'Christmas Season',
    description: 'Holiday season bundles and special offers',
  },
  
  [SeasonalType.VALENTINE]: {
    startMonth: 1, // January
    startDay: 20,
    endMonth: 2, // February
    endDay: 20,
    name: 'Valentine Season',
    description: 'Romantic bundles for Valentine\'s Day',
  },
  
  [SeasonalType.EASTER]: {
    startMonth: 3, // March
    startDay: 15,
    endMonth: 4, // April
    endDay: 15,
    name: 'Easter Season',
    description: 'Easter celebration bundles',
  },
  
  [SeasonalType.RAMADAN]: {
    startMonth: 3, // Varies by year, approximate
    startDay: 1,
    endMonth: 4,
    endDay: 30,
    name: 'Ramadan Season',
    description: 'Iftar and Suhoor bundles for Ramadan',
  },
  
  [SeasonalType.NEW_YEAR]: {
    startMonth: 12, // December
    startDay: 20,
    endMonth: 1, // January
    endDay: 15,
    name: 'New Year Season',
    description: 'New Year celebration bundles',
  },
  
  [SeasonalType.MOTHERS_DAY]: {
    startMonth: 5, // May
    startDay: 1,
    endMonth: 5,
    endDay: 15,
    name: 'Mother\'s Day Season',
    description: 'Special bundles for Mother\'s Day',
  },
  
  [SeasonalType.FATHERS_DAY]: {
    startMonth: 6, // June
    startDay: 1,
    endMonth: 6,
    endDay: 20,
    name: 'Father\'s Day Season',
    description: 'Special bundles for Father\'s Day',
  },
} as const;

/**
 * Bundle validation rules
 */
export const BUNDLE_VALIDATION = {
  REQUIRED_FIELDS: ['name', 'description', 'type', 'products', 'pricing'],
  MIN_DISCOUNT_PERCENTAGE: 0,
  MAX_DISCOUNT_PERCENTAGE: 50,
  MIN_PRODUCT_QUANTITY: 1,
  MAX_PRODUCT_QUANTITY: 100,
} as const;

/**
 * Bundle pricing calculators
 */
export const BUNDLE_CALCULATOR = {
  calculateBasePrice: (products: { price: number; quantity: number }[]): number => {
    return products.reduce((total, product) => total + (product.price * product.quantity), 0);
  },
  
  calculateDiscountedPrice: (basePrice: number, discountPercentage: number): number => {
    return Math.round(basePrice * (1 - discountPercentage / 100) * 100) / 100;
  },
  
  calculateSavings: (basePrice: number, discountedPrice: number): number => {
    return Math.round((basePrice - discountedPrice) * 100) / 100;
  },
  
  calculateNibiaPrice: (ngnPrice: number, conversionRate: number = 100): number => {
    return Math.round(ngnPrice * conversionRate * 100) / 100;
  },
} as const;

/**
 * Bundle order status flow
 */
export const BUNDLE_ORDER_STATUS_FLOW = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
} as const;

/**
 * Gift delivery flow
 */
export const GIFT_DELIVERY_FLOW = {
  PENDING: ['GIFT_MESSAGE_SENT', 'FAILED'],
  GIFT_MESSAGE_SENT: ['RECIPIENT_NOTIFIED', 'FAILED'],
  RECIPIENT_NOTIFIED: ['DELIVERED', 'FAILED'],
  DELIVERED: [],
  FAILED: ['PENDING'], // Can retry
} as const;

/**
 * Bundle notification messages
 */
export const BUNDLE_MESSAGES = {
  BUNDLE_CREATED: 'Bundle created successfully',
  BUNDLE_UPDATED: 'Bundle updated successfully',
  BUNDLE_DELETED: 'Bundle deleted successfully',
  BUNDLE_ORDER_PLACED: 'Bundle order placed successfully',
  BUNDLE_ORDER_CONFIRMED: 'Bundle order confirmed',
  BUNDLE_SHIPPED: 'Bundle order shipped',
  BUNDLE_DELIVERED: 'Bundle order delivered',
  GIFT_SENT: 'Gift bundle sent successfully',
  GIFT_DELIVERED: 'Gift bundle delivered to recipient',
  SEASONAL_BUNDLE_ACTIVATED: 'Seasonal bundle activated',
  SEASONAL_BUNDLE_DEACTIVATED: 'Seasonal bundle deactivated',
} as const;
