import { Types } from 'mongoose';
import {
  OrderStatus,
  PaymentPlan,
  DeliveryMethod,
  PaymentFrequency,
  CreditStatus,
  PaymentStatus,
  PaymentMethod,
  CartItem,
  PaymentSchedule,
  CreditCheck,
  PaymentHistory,
  DeliveryAddress,
} from '../entities/order.entity';

export interface IOrder {
  _id?: Types.ObjectId;
  orderNumber: string;
  userId: Types.ObjectId;
  items: CartItem[];
  totalAmount: number;
  totalAmountInNibia: number;
  deliveryFee: number;
  finalTotal: number;
  status: OrderStatus;
  paymentPlan: PaymentPlan;
  deliveryMethod: DeliveryMethod;
  deliveryAddress?: DeliveryAddress;
  paymentSchedule?: PaymentSchedule;
  creditCheck?: CreditCheck;
  scheduledDeliveryDate?: Date;
  paymentHistory: PaymentHistory[];
  amountPaid: number;
  remainingAmount: number;
  expectedDeliveryDate?: Date;
  actualDeliveryDate?: Date;
  notes?: string;
  cancellationReason?: string;
  trackingNumber?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ICartItem {
  productId: Types.ObjectId;
  quantity: number;
  unitPrice: number;
  unitPriceInNibia: number;
  totalPrice: number;
  totalPriceInNibia: number;
}

export interface IPaymentSchedule {
  frequency: PaymentFrequency;
  installmentAmount: number;
  totalInstallments: number;
  installmentsPaid: number;
  startDate: Date;
  nextPaymentDate: Date;
  finalPaymentDate: Date;
}

export interface ICreditCheck {
  status: CreditStatus;
  score?: number;
  checkDate?: Date;
  notes?: string;
  approvedLimit?: number;
}

export interface IPaymentHistory {
  amount: number;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  paymentDate: Date;
  transactionRef?: string;
  notes?: string;
}

export interface IDeliveryAddress {
  street: string;
  city: string;
  state: string;
  postalCode?: string;
  country: string;
  instructions?: string;
}

export interface OrderSearchParams {
  userId?: Types.ObjectId;
  status?: OrderStatus;
  paymentPlan?: PaymentPlan;
  deliveryMethod?: DeliveryMethod;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface OrderSummary {
  totalOrders: number;
  totalAmount: number;
  totalAmountInNibia: number;
  ordersByStatus: Record<OrderStatus, number>;
  ordersByPaymentPlan: Record<PaymentPlan, number>;
}

export interface PaymentSummary {
  totalAmountPaid: number;
  totalRemainingAmount: number;
  paymentsByStatus: Record<PaymentStatus, number>;
  paymentsByMethod: Record<PaymentMethod, number>;
}

export interface OrderAnalytics {
  dailyOrders: Array<{
    date: string;
    count: number;
    totalAmount: number;
  }>;
  topProducts: Array<{
    productId: Types.ObjectId;
    totalQuantity: number;
    totalRevenue: number;
  }>;
  customerInsights: Array<{
    userId: Types.ObjectId;
    totalOrders: number;
    totalSpent: number;
    averageOrderValue: number;
  }>;
}

export interface OrderExport {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  status: OrderStatus;
  totalAmount: number;
  paymentPlan: PaymentPlan;
  deliveryMethod: DeliveryMethod;
  createdAt: Date;
  expectedDeliveryDate?: Date;
}
