import { Types } from 'mongoose';
import { BundleType, SeasonalType, BundleStatus } from '../entities/bundle.entity';
import { BundleOrderStatus, GiftDeliveryStatus } from '../entities/bundle-order.entity';

export interface IBundleProduct {
  productId: Types.ObjectId;
  quantity: number;
  isRequired: boolean;
  alternatives?: Types.ObjectId[];
}

export interface IBundlePricing {
  basePrice: number;
  priceInNibia: number;
  discountPercentage?: number;
  discountedPrice?: number;
  savingsAmount?: number;
}

export interface ISeasonalAvailability {
  seasonalType: SeasonalType;
  startDate: Date;
  endDate: Date;
  year: number;
  isCurrentlyActive: boolean;
}

export interface IGiftSettings {
  canBeGifted: boolean;
  giftMessageTemplate?: string;
  giftWrappingAvailable: boolean;
  giftWrappingFee?: number;
}

export interface IBundle {
  _id?: Types.ObjectId;
  name: string;
  description: string;
  type: BundleType;
  status: BundleStatus;
  products: IBundleProduct[];
  pricing: IBundlePricing;
  seasonalAvailability?: ISeasonalAvailability;
  giftSettings: IGiftSettings;
  availableCities: string[];
  images?: string[];
  tags: string[];
  maxOrderQuantity?: number;
  minOrderHistory?: number;
  requiresAdminApproval: boolean;
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  availableFrom?: Date;
  availableUntil?: Date;
  purchaseCount: number;
  totalRevenue: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IRecipientInfo {
  fullName: string;
  phoneNumber: string;
  email?: string;
  deliveryAddress: string;
  city: string;
  state?: string;
}

export interface IGiftMessage {
  message?: string;
  senderName: string;
  includeSenderContact: boolean;
  occasion?: string;
}

export interface IBundleOrder {
  _id?: Types.ObjectId;
  orderNumber: string;
  bundleId: Types.ObjectId;
  userId: Types.ObjectId;
  quantity: number;
  totalAmount: number;
  totalAmountInNibia: number;
  status: BundleOrderStatus;
  isGift: boolean;
  recipientInfo?: IRecipientInfo;
  giftMessage?: IGiftMessage;
  giftDeliveryStatus?: GiftDeliveryStatus;
  expectedDeliveryDate?: Date;
  deliveredAt?: Date;
  paymentMethod?: string;
  transactionRef?: string;
  specialInstructions?: string;
  approvedBy?: Types.ObjectId;
  approvedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IBundleTemplate {
  name: string;
  description: string;
  defaultProducts: {
    category: string;
    minQuantity: number;
  }[];
  basePrice: number;
  discountPercentage: number;
  tags: string[];
  canBeGifted: boolean;
  giftMessageTemplate: string;
  seasonalType?: SeasonalType;
  requiresAdminApproval?: boolean;
}

export interface TopBundleData {
  id: string;
  name: string;
  purchaseCount: number;
  revenue: number;
}

export interface SeasonalPerformance {
  seasonalType: string;
  year: number;
  totalRevenue: number;
  totalOrders: number;
  avgOrderValue: number;
}

export interface MonthlyTrend {
  month: number;
  year: number;
  totalOrders: number;
  totalRevenue: number;
  avgOrderValue: number;
}

export interface BundleAnalytics {
  totalBundles: number;
  totalRevenue: number;
  totalPurchases: number;
  avgBundlePrice: number;
  topBundles: TopBundleData[];
  revenueByType: Record<string, number>;
  purchasesByType: Record<string, number>;
  seasonalPerformance: SeasonalPerformance[];
  monthlyTrends: MonthlyTrend[];
}

export interface SeasonalAnalytics {
  seasonalType: string;
  year: number;
  totalBundles: number;
  activeBundles: number;
  totalOrders: number;
  totalRevenue: number;
  topBundles: TopBundleData[];
  dateRange: {
    start: Date;
    end: Date;
  };
}

export interface IBundleValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface IBundleAvailability {
  isAvailable: boolean;
  reason?: string;
  availableFrom?: Date;
  availableUntil?: Date;
  seasonalInfo?: {
    seasonalType: SeasonalType;
    isActive: boolean;
    startDate: Date;
    endDate: Date;
  };
}

export interface IBundleStockValidation {
  isValid: boolean;
  insufficientProducts: {
    productId: string;
    productName: string;
    required: number;
    available: number;
  }[];
}

export interface IBundleOrderSummary {
  bundleOrderId: string;
  bundleName: string;
  bundleType: BundleType;
  quantity: number;
  totalAmount: number;
  status: BundleOrderStatus;
  isGift: boolean;
  recipientName?: string;
  expectedDelivery?: Date;
  canCancel: boolean;
  canModify: boolean;
}
