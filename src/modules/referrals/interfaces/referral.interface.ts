import { Document, Types } from 'mongoose';

/**
 * Commission type enumeration
 */
export enum CommissionType {
  FOOD_MONEY = 'food_money',
  FOOD_POINTS = 'food_points',
}

/**
 * Referral status enumeration
 */
export enum ReferralStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
}

/**
 * Referral tier enumeration
 */
export enum ReferralTier {
  BRONZE = 'bronze',
  SILVER = 'silver',
  GOLD = 'gold',
  PLATINUM = 'platinum',
}

/**
 * Commission history interface
 */
export interface ICommissionHistory {
  orderId: Types.ObjectId;
  amount: number;
  type: CommissionType;
  date: Date;
  orderAmount: number;
  commissionPercentage: number;
  isProcessed: boolean;
}

/**
 * Commission history document interface extending Mongoose Document
 */
export interface ICommissionHistoryDocument extends ICommissionHistory, Document {}

/**
 * Referral interface
 */
export interface IReferral {
  referrerId: Types.ObjectId;
  referredUserId: Types.ObjectId;
  referralDate: Date;
  signUpDate?: Date;
  status: ReferralStatus;
  referralCode?: string;
  totalCommissionsEarned: number;
  purchaseCount: number;
  isCommissionCompleted: boolean;
  commissionHistory: ICommissionHistory[];
  tier: ReferralTier;
  expiryDate?: Date;
  lastPurchaseDate?: Date;
  bonusMultiplier: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Referral document interface extending Mongoose Document
 */
export interface IReferralDocument extends IReferral, Document {
  readonly isActive: boolean;
  readonly isExpired: boolean;
  readonly canEarnCommission: boolean;
}

/**
 * Create referral payload interface
 */
export interface ICreateReferralPayload {
  referrerId: string;
  referredUserId: string;
  referralCode?: string;
}

/**
 * Process commission payload interface
 */
export interface IProcessCommissionPayload {
  referralId: string;
  orderId: string;
  orderAmount: number;
  commissionType: CommissionType;
}

/**
 * Referral query filters interface
 */
export interface IReferralQueryFilters {
  referrerId?: string;
  referredUserId?: string;
  status?: ReferralStatus;
  tier?: ReferralTier;
  isCommissionCompleted?: boolean;
  startDate?: Date;
  endDate?: Date;
  minCommissions?: number;
  maxCommissions?: number;
}

/**
 * Referral statistics interface
 */
export interface IReferralStats {
  totalReferrals: number;
  activeReferrals: number;
  completedReferrals: number;
  totalCommissionsPaid: number;
  averageCommissionPerReferral: number;
  byStatus: Record<ReferralStatus, number>;
  byTier: Record<ReferralTier, number>;
  topReferrers: Array<{
    userId: Types.ObjectId;
    referralCount: number;
    totalCommissions: number;
  }>;
}

/**
 * Referral code generation options interface
 */
export interface IReferralCodeOptions {
  userId: string;
  length?: number;
  prefix?: string;
  includeNumbers?: boolean;
  includeLetters?: boolean;
}

/**
 * Commission calculation result interface
 */
export interface ICommissionCalculationResult {
  amount: number;
  type: CommissionType;
  percentage: number;
  tier: ReferralTier;
  bonusMultiplier: number;
  baseAmount: number;
  bonusAmount: number;
}

/**
 * Referral tier benefits interface
 */
export interface IReferralTierBenefits {
  tier: ReferralTier;
  commissionPercentage: number;
  bonusMultiplier: number;
  maxReferrals: number;
  expiryDays: number;
  perks: string[];
}

/**
 * Referral validation result interface
 */
export interface IReferralValidationResult {
  isValid: boolean;
  canRefer: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Referral analytics interface
 */
export interface IReferralAnalytics {
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  data: Array<{
    date: Date;
    newReferrals: number;
    completedReferrals: number;
    commissionsEarned: number;
    conversionRate: number;
  }>;
}
