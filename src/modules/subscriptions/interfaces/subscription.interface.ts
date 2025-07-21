import { Document, Types } from 'mongoose';

/**
 * Subscription status enumeration
 */
export enum SubscriptionStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  SUSPENDED = 'suspended',
  EXPIRED = 'expired',
}

/**
 * Payment plan enumeration
 */
export enum PaymentPlan {
  PAY_SMALL_SMALL = 'pay_small_small',
  PRICE_LOCK = 'price_lock',
  FLEXIBLE = 'flexible',
  FIXED = 'fixed',
}

/**
 * Payment frequency enumeration
 */
export enum PaymentFrequency {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  BIWEEKLY = 'biweekly',
  QUARTERLY = 'quarterly',
}

/**
 * Drop schedule item interface
 */
export interface IDropScheduleItem {
  scheduledDate: Date;
  amount: number;
  isPaid: boolean;
  paidDate?: Date;
  transactionRef?: string;
  paymentMethod?: string;
  failureReason?: string;
  retryCount: number;
}

/**
 * Drop schedule item document interface extending Mongoose Document
 */
export interface IDropScheduleItemDocument extends IDropScheduleItem, Document {}

/**
 * Subscription interface
 */
export interface ISubscription {
  userId: Types.ObjectId;
  orderId: Types.ObjectId;
  paymentPlan: PaymentPlan;
  totalAmount: number;
  dropAmount: number;
  frequency: PaymentFrequency;
  totalDrops: number;
  dropsPaid: number;
  amountPaid: number;
  dropSchedule: IDropScheduleItem[];
  nextDropDate?: Date;
  status: SubscriptionStatus;
  isCompleted: boolean;
  startDate: Date;
  endDate?: Date;
  pauseDate?: Date;
  resumeDate?: Date;
  cancellationReason?: string;
  cancellationDate?: Date;
  gracePeriodEnd?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Subscription document interface extending Mongoose Document
 */
export interface ISubscriptionDocument extends ISubscription, Document {
  readonly remainingAmount: number;
  readonly completionPercentage: number;
  readonly isPastDue: boolean;
  readonly daysUntilNextDrop: number;
  readonly canPause: boolean;
  readonly canCancel: boolean;
}

/**
 * Create subscription payload interface
 */
export interface ICreateSubscriptionPayload {
  userId: string;
  orderId: string;
  paymentPlan: PaymentPlan;
  totalAmount: number;
  frequency: PaymentFrequency;
  totalDrops: number;
  startDate?: Date;
}

/**
 * Update subscription payload interface
 */
export interface IUpdateSubscriptionPayload {
  frequency?: PaymentFrequency;
  dropAmount?: number;
  totalDrops?: number;
  status?: SubscriptionStatus;
  notes?: string;
}

/**
 * Process payment payload interface
 */
export interface IProcessPaymentPayload {
  subscriptionId: string;
  amount: number;
  transactionRef: string;
  paymentMethod: string;
}

/**
 * Pause subscription payload interface
 */
export interface IPauseSubscriptionPayload {
  subscriptionId: string;
  reason?: string;
  pauseDuration?: number; // days
}

/**
 * Cancel subscription payload interface
 */
export interface ICancelSubscriptionPayload {
  subscriptionId: string;
  reason: string;
  refundAmount?: number;
}

/**
 * Subscription query filters interface
 */
export interface ISubscriptionQueryFilters {
  userId?: string;
  orderId?: string;
  status?: SubscriptionStatus;
  paymentPlan?: PaymentPlan;
  frequency?: PaymentFrequency;
  isCompleted?: boolean;
  isPastDue?: boolean;
  startDate?: Date;
  endDate?: Date;
  minAmount?: number;
  maxAmount?: number;
}

/**
 * Subscription statistics interface
 */
export interface ISubscriptionStats {
  totalSubscriptions: number;
  activeSubscriptions: number;
  completedSubscriptions: number;
  cancelledSubscriptions: number;
  totalRevenue: number;
  averageSubscriptionValue: number;
  completionRate: number;
  byStatus: Record<SubscriptionStatus, number>;
  byPaymentPlan: Record<PaymentPlan, number>;
  byFrequency: Record<PaymentFrequency, number>;
}

/**
 * Payment schedule options interface
 */
export interface IPaymentScheduleOptions {
  totalAmount: number;
  frequency: PaymentFrequency;
  totalDrops: number;
  startDate: Date;
  skipWeekends?: boolean;
  skipHolidays?: boolean;
}

/**
 * Subscription notification data interface
 */
export interface ISubscriptionNotificationData {
  subscriptionId: string;
  userId: string;
  type: 'payment_due' | 'payment_failed' | 'payment_success' | 'subscription_completed' | 'subscription_cancelled';
  amount?: number;
  dueDate?: Date;
  retryCount?: number;
}

/**
 * Subscription analytics interface
 */
export interface ISubscriptionAnalytics {
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  data: Array<{
    date: Date;
    newSubscriptions: number;
    completedSubscriptions: number;
    cancelledSubscriptions: number;
    revenue: number;
    churnRate: number;
  }>;
}

/**
 * Payment retry configuration interface
 */
export interface IPaymentRetryConfig {
  maxRetries: number;
  retryIntervals: number[]; // in hours
  gracePeriod: number; // in days
  escalationSteps: string[];
}
