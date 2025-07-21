import { ReferralStatus, ReferralTier, CommissionType } from '../interfaces/referral.interface';

/**
 * Referral-related constants and configurations
 */
export const REFERRAL_CONSTANTS = {
  // Collection name
  COLLECTION_NAME: 'referrals',
  
  // Commission settings
  DEFAULT_COMMISSION_PERCENTAGE: 5, // 5% commission
  MIN_ORDER_AMOUNT_FOR_COMMISSION: 1000, // Minimum order amount (NGN)
  PURCHASES_REQUIRED_FOR_COMPLETION: 3, // Number of purchases to complete referral
  
  // Referral code settings
  REFERRAL_CODE_LENGTH: 8,
  REFERRAL_CODE_PREFIX: 'REF',
  REFERRAL_CODE_EXPIRY_DAYS: 30,
  
  // Tier settings
  TIER_UPGRADE_THRESHOLDS: {
    SILVER: 5, // 5 successful referrals
    GOLD: 15, // 15 successful referrals
    PLATINUM: 50, // 50 successful referrals
  },
  
  // Time limits
  REFERRAL_EXPIRY_DAYS: 90, // Referral expires after 90 days
  COMMISSION_PROCESSING_DELAY: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
  
  // Limits
  MAX_REFERRALS_PER_USER: 100,
  MAX_COMMISSION_PER_ORDER: 1000, // Maximum commission per order (NGN)
  
  // Pagination
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const;

/**
 * Default referral configuration
 */
export const REFERRAL_DEFAULTS = {
  status: ReferralStatus.PENDING,
  tier: ReferralTier.BRONZE,
  totalCommissionsEarned: 0,
  purchaseCount: 0,
  isCommissionCompleted: false,
  commissionHistory: [],
  bonusMultiplier: 1,
} as const;

/**
 * Referral tier configurations
 */
export const REFERRAL_TIER_CONFIG = {
  [ReferralTier.BRONZE]: {
    commissionPercentage: 5,
    bonusMultiplier: 1,
    maxReferrals: 10,
    expiryDays: 90,
    perks: ['Basic commission rates', 'Standard support'],
  },
  [ReferralTier.SILVER]: {
    commissionPercentage: 7,
    bonusMultiplier: 1.2,
    maxReferrals: 25,
    expiryDays: 120,
    perks: ['Higher commission rates', 'Priority support', 'Monthly bonus'],
  },
  [ReferralTier.GOLD]: {
    commissionPercentage: 10,
    bonusMultiplier: 1.5,
    maxReferrals: 50,
    expiryDays: 180,
    perks: ['Premium commission rates', 'VIP support', 'Weekly bonuses', 'Special promotions'],
  },
  [ReferralTier.PLATINUM]: {
    commissionPercentage: 15,
    bonusMultiplier: 2,
    maxReferrals: 100,
    expiryDays: 365,
    perks: ['Maximum commission rates', 'Dedicated support', 'Daily bonuses', 'Exclusive access', 'Custom rewards'],
  },
} as const;

/**
 * Commission type configurations
 */
export const COMMISSION_TYPE_CONFIG = {
  [CommissionType.FOOD_MONEY]: {
    name: 'Food Money',
    description: 'Commission paid in food money (NGN)',
    icon: '💰',
    isDefault: true,
  },
  [CommissionType.FOOD_POINTS]: {
    name: 'Food Points',
    description: 'Commission paid in food points',
    icon: '⭐',
    isDefault: false,
  },
} as const;

/**
 * Referral validation rules
 */
export const REFERRAL_VALIDATION = {
  MIN_ORDER_AMOUNT: REFERRAL_CONSTANTS.MIN_ORDER_AMOUNT_FOR_COMMISSION,
  MAX_COMMISSION_AMOUNT: REFERRAL_CONSTANTS.MAX_COMMISSION_PER_ORDER,
  REFERRAL_CODE_MIN_LENGTH: 6,
  REFERRAL_CODE_MAX_LENGTH: 12,
  MIN_COMMISSION_PERCENTAGE: 1,
  MAX_COMMISSION_PERCENTAGE: 50,
} as const;

/**
 * Referral error messages
 */
export const REFERRAL_ERROR_MESSAGES = {
  NOT_FOUND: 'Referral not found',
  ALREADY_EXISTS: 'Referral already exists for this user',
  INVALID_REFERRER: 'Invalid referrer user',
  INVALID_REFERRED_USER: 'Invalid referred user',
  SELF_REFERRAL: 'Cannot refer yourself',
  REFERRAL_EXPIRED: 'Referral has expired',
  REFERRAL_COMPLETED: 'Referral is already completed',
  REFERRAL_CANCELLED: 'Referral has been cancelled',
  INVALID_REFERRAL_CODE: 'Invalid or expired referral code',
  CODE_ALREADY_USED: 'Referral code has already been used',
  MAX_REFERRALS_REACHED: 'Maximum number of referrals reached',
  INSUFFICIENT_ORDER_AMOUNT: 'Order amount is below minimum for commission',
  COMMISSION_ALREADY_PROCESSED: 'Commission for this order has already been processed',
  INVALID_COMMISSION_TYPE: 'Invalid commission type',
  REFERRAL_NOT_ACTIVE: 'Referral is not active',
  USER_ALREADY_REFERRED: 'User has already been referred by someone else',
  INVALID_TIER: 'Invalid referral tier',
} as const;

/**
 * Referral success messages
 */
export const REFERRAL_SUCCESS_MESSAGES = {
  CREATED: 'Referral created successfully',
  ACTIVATED: 'Referral activated successfully',
  COMPLETED: 'Referral completed successfully',
  COMMISSION_PROCESSED: 'Commission processed successfully',
  CODE_GENERATED: 'Referral code generated successfully',
  TIER_UPGRADED: 'Referral tier upgraded successfully',
  BONUS_APPLIED: 'Bonus applied successfully',
  CANCELLED: 'Referral cancelled successfully',
} as const;

/**
 * Referral notification types
 */
export const REFERRAL_NOTIFICATION_TYPES = {
  REFERRAL_SUCCESSFUL: 'referral_successful',
  COMMISSION_EARNED: 'commission_earned',
  TIER_UPGRADED: 'tier_upgraded',
  REFERRAL_COMPLETED: 'referral_completed',
  BONUS_EARNED: 'bonus_earned',
  REFERRAL_EXPIRED: 'referral_expired',
} as const;

/**
 * Referral status transitions
 */
export const REFERRAL_STATUS_TRANSITIONS: Record<ReferralStatus, ReferralStatus[]> = {
  [ReferralStatus.PENDING]: [ReferralStatus.ACTIVE, ReferralStatus.CANCELLED, ReferralStatus.EXPIRED],
  [ReferralStatus.ACTIVE]: [ReferralStatus.COMPLETED, ReferralStatus.CANCELLED, ReferralStatus.EXPIRED],
  [ReferralStatus.COMPLETED]: [], // Terminal state
  [ReferralStatus.EXPIRED]: [], // Terminal state
  [ReferralStatus.CANCELLED]: [], // Terminal state
};

/**
 * Commission calculation helpers
 */
export const COMMISSION_CALCULATOR = {
  calculateCommission: (orderAmount: number, tier: ReferralTier): number => {
    const config = REFERRAL_TIER_CONFIG[tier];
    const baseCommission = (orderAmount * config.commissionPercentage) / 100;
    const bonusAmount = baseCommission * (config.bonusMultiplier - 1);
    return Math.min(baseCommission + bonusAmount, REFERRAL_CONSTANTS.MAX_COMMISSION_PER_ORDER);
  },
  
  calculateTierFromReferralCount: (referralCount: number): ReferralTier => {
    if (referralCount >= REFERRAL_CONSTANTS.TIER_UPGRADE_THRESHOLDS.PLATINUM) {
      return ReferralTier.PLATINUM;
    } else if (referralCount >= REFERRAL_CONSTANTS.TIER_UPGRADE_THRESHOLDS.GOLD) {
      return ReferralTier.GOLD;
    } else if (referralCount >= REFERRAL_CONSTANTS.TIER_UPGRADE_THRESHOLDS.SILVER) {
      return ReferralTier.SILVER;
    }
    return ReferralTier.BRONZE;
  },
  
  generateReferralCode: (userId: string, options?: { length?: number; prefix?: string }): string => {
    const length = options?.length || REFERRAL_CONSTANTS.REFERRAL_CODE_LENGTH;
    const prefix = options?.prefix || REFERRAL_CONSTANTS.REFERRAL_CODE_PREFIX;
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const userHash = userId.slice(-3).toUpperCase();
    const randomPart = Array.from({ length: length - prefix.length - userHash.length }, () =>
      chars.charAt(Math.floor(Math.random() * chars.length))
    ).join('');
    return `${prefix}${userHash}${randomPart}`;
  },
} as const;

/**
 * Referral activity log types
 */
export const REFERRAL_ACTIVITY_TYPES = {
  REFERRAL_CREATED: 'referral_created',
  REFERRAL_ACTIVATED: 'referral_activated',
  COMMISSION_EARNED: 'commission_earned',
  TIER_UPGRADED: 'tier_upgraded',
  REFERRAL_COMPLETED: 'referral_completed',
  BONUS_APPLIED: 'bonus_applied',
  REFERRAL_EXPIRED: 'referral_expired',
  REFERRAL_CANCELLED: 'referral_cancelled',
} as const;
