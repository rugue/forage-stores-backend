import { Document, Types } from 'mongoose';

/**
 * Delivery status enumeration
 */
export enum DeliveryStatus {
  PENDING_ASSIGNMENT = 'pending_assignment',  // Waiting for admin to assign rider
  PENDING_ACCEPTANCE = 'pending_acceptance',  // Waiting for rider to accept
  ACCEPTED = 'accepted',                     // Rider accepted, waiting for pickup
  PICKED_UP = 'picked_up',                   // Rider has picked up the order
  IN_TRANSIT = 'in_transit',                 // Rider is delivering the order
  DELIVERED = 'delivered',                   // Order has been delivered
  COMPLETED = 'completed',                   // Delivery confirmed by customer
  CANCELLED = 'cancelled',                   // Delivery was cancelled
  DECLINED = 'declined',                     // Rider declined the delivery
  EXPIRED = 'expired',                       // Rider didn't respond in time
}

/**
 * Payment status enumeration
 */
export enum PaymentStatus {
  PENDING = 'pending',
  RELEASED = 'released',
  CANCELLED = 'cancelled',
}

/**
 * Rider status enumeration
 */
export enum RiderStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING_VERIFICATION = 'pending_verification',
}

/**
 * Vehicle type enumeration
 */
export enum VehicleType {
  MOTORCYCLE = 'motorcycle',
  BICYCLE = 'bicycle',
  CAR = 'car',
  VAN = 'van',
  FOOT = 'foot',
}

/**
 * Delivery location interface
 */
export interface IDeliveryLocation {
  address: string;
  city: string;
  state: string;
  coordinates?: number[];
  instructions?: string;
}

/**
 * Time log interface
 */
export interface ITimeLog {
  assignedAt?: Date;
  respondedAt?: Date;
  pickedUpAt?: Date;
  deliveredAt?: Date;
  confirmedAt?: Date;
  paymentReleasedAt?: Date;
}

/**
 * Status history interface
 */
export interface IStatusHistory {
  status: DeliveryStatus;
  timestamp: Date;
  notes?: string;
  updatedBy?: Types.ObjectId;
}

/**
 * Vehicle interface
 */
export interface IVehicle {
  type: VehicleType;
  model?: string;
  licensePlate?: string;
  year?: number;
  color?: string;
}

/**
 * Verification document interface
 */
export interface IVerificationDocument {
  documentType: string;
  documentNumber: string;
  issueDate?: Date;
  expiryDate?: Date;
  status: string;
  documentUrl?: string;
}

/**
 * Delivery stats interface
 */
export interface IDeliveryStats {
  completedDeliveries: number;
  cancelledDeliveries: number;
  rejectedDeliveries: number;
  averageDeliveryTime: number;
  averageRating: number;
  totalRatings: number;
  totalEarnings: number;
}

/**
 * Delivery interface
 */
export interface IDelivery {
  orderId: Types.ObjectId;
  riderId?: Types.ObjectId;
  customerId: Types.ObjectId;
  status: DeliveryStatus;
  pickupLocation: IDeliveryLocation;
  deliveryLocation: IDeliveryLocation;
  distance: number;
  deliveryFee: number;
  riderPayment: number;
  paymentStatus: PaymentStatus;
  paymentRef?: string;
  timeLogs: ITimeLog;
  statusHistory: IStatusHistory[];
  rating?: number;
  feedback?: string;
  acceptanceExpiryTime?: Date;
  seenByRider: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Delivery document interface extending Mongoose Document
 */
export interface IDeliveryDocument extends IDelivery, Document {}

/**
 * Rider interface
 */
export interface IRider {
  userId: Types.ObjectId;
  status: RiderStatus;
  vehicle: IVehicle;
  currentLocation?: number[];
  serviceAreas: string[];
  maxDeliveryDistance: number;
  isAvailable: boolean;
  isOnDelivery: boolean;
  verificationDocuments: IVerificationDocument[];
  deliveryStats: IDeliveryStats;
  securityDeposit: number;
  accountNumber?: string;
  bankName?: string;
  accountName?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Rider document interface extending Mongoose Document
 */
export interface IRiderDocument extends IRider, Document {}

/**
 * Create delivery payload interface
 */
export interface ICreateDeliveryPayload {
  orderId: string;
  customerId: string;
  pickupLocation: IDeliveryLocation;
  deliveryLocation: IDeliveryLocation;
  distance: number;
  deliveryFee: number;
  riderPayment: number;
}

/**
 * Assign rider payload interface
 */
export interface IAssignRiderPayload {
  deliveryId: string;
  riderId: string;
}

/**
 * Update delivery status payload interface
 */
export interface IUpdateDeliveryStatusPayload {
  deliveryId: string;
  status: DeliveryStatus;
  notes?: string;
  updatedBy?: string;
}

/**
 * Delivery query filters interface
 */
export interface IDeliveryQueryFilters {
  status?: DeliveryStatus;
  riderId?: string;
  customerId?: string;
  paymentStatus?: PaymentStatus;
  city?: string;
  startDate?: Date;
  endDate?: Date;
}

/**
 * Rider query filters interface
 */
export interface IRiderQueryFilters {
  status?: RiderStatus;
  isAvailable?: boolean;
  isOnDelivery?: boolean;
  city?: string;
  vehicleType?: VehicleType;
  minRating?: number;
}

/**
 * Delivery tracking info interface
 */
export interface IDeliveryTrackingInfo {
  delivery: IDelivery;
  rider?: IRider;
  estimatedArrival?: Date;
  currentLocation?: number[];
}

/**
 * Delivery metrics interface
 */
export interface IDeliveryMetrics {
  totalDeliveries: number;
  completedDeliveries: number;
  pendingDeliveries: number;
  cancelledDeliveries: number;
  averageDeliveryTime: number;
  totalRevenue: number;
  byStatus: Record<DeliveryStatus, number>;
}
