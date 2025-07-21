import { DeliveryStatus, PaymentStatus, RiderStatus, VehicleType } from '../interfaces/delivery.interface';

/**
 * Delivery-related constants and configurations
 */
export const DELIVERY_CONSTANTS = {
  // Collection names
  DELIVERY_COLLECTION: 'deliveries',
  RIDER_COLLECTION: 'riders',
  
  // Time settings
  ACCEPTANCE_TIMEOUT: 3 * 60 * 1000, // 3 minutes in milliseconds
  DELIVERY_TIMEOUT: 60 * 60 * 1000, // 1 hour in milliseconds
  AUTO_ASSIGN_DELAY: 5 * 60 * 1000, // 5 minutes delay before auto-assignment
  
  // Distance and location
  MAX_DELIVERY_DISTANCE: 50, // Maximum delivery distance in km
  LOCATION_UPDATE_INTERVAL: 30 * 1000, // 30 seconds
  GEOFENCE_RADIUS: 100, // meters
  
  // Payment
  MIN_RIDER_PAYMENT: 500, // Minimum payment in NGN
  BASE_DELIVERY_FEE: 300, // Base delivery fee in NGN
  PER_KM_RATE: 50, // Rate per kilometer in NGN
  
  // Rating
  MIN_RATING: 1,
  MAX_RATING: 5,
  
  // Verification
  REQUIRED_DOCUMENTS: ['id_card', 'drivers_license', 'vehicle_documents'],
  
  // Pagination
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const;

/**
 * Default delivery configuration
 */
export const DELIVERY_DEFAULTS = {
  status: DeliveryStatus.PENDING_ASSIGNMENT,
  paymentStatus: PaymentStatus.PENDING,
  seenByRider: false,
  timeLogs: {},
  statusHistory: [],
} as const;

/**
 * Default rider configuration
 */
export const RIDER_DEFAULTS = {
  status: RiderStatus.PENDING_VERIFICATION,
  maxDeliveryDistance: 10,
  isAvailable: false,
  isOnDelivery: false,
  serviceAreas: [],
  verificationDocuments: [],
  deliveryStats: {
    completedDeliveries: 0,
    cancelledDeliveries: 0,
    rejectedDeliveries: 0,
    averageDeliveryTime: 0,
    averageRating: 0,
    totalRatings: 0,
    totalEarnings: 0,
  },
  securityDeposit: 0,
} as const;

/**
 * Delivery validation rules
 */
export const DELIVERY_VALIDATION = {
  MIN_DISTANCE: 0.1, // Minimum delivery distance in km
  MAX_DISTANCE: DELIVERY_CONSTANTS.MAX_DELIVERY_DISTANCE,
  MIN_DELIVERY_FEE: 100,
  MAX_DELIVERY_FEE: 10000,
  MIN_RIDER_PAYMENT: DELIVERY_CONSTANTS.MIN_RIDER_PAYMENT,
  ADDRESS_MIN_LENGTH: 10,
  ADDRESS_MAX_LENGTH: 255,
  NOTES_MAX_LENGTH: 500,
} as const;

/**
 * Rider validation rules
 */
export const RIDER_VALIDATION = {
  MIN_SERVICE_AREAS: 1,
  MAX_SERVICE_AREAS: 10,
  MIN_DELIVERY_DISTANCE: 1,
  MAX_DELIVERY_DISTANCE: DELIVERY_CONSTANTS.MAX_DELIVERY_DISTANCE,
  ACCOUNT_NUMBER_LENGTH: [10, 11], // Nigerian bank account numbers
  MIN_SECURITY_DEPOSIT: 5000,
  MAX_SECURITY_DEPOSIT: 50000,
} as const;

/**
 * Delivery error messages
 */
export const DELIVERY_ERROR_MESSAGES = {
  NOT_FOUND: 'Delivery not found',
  RIDER_NOT_FOUND: 'Rider not found',
  INVALID_STATUS: 'Invalid delivery status',
  INVALID_STATUS_TRANSITION: 'Invalid status transition',
  RIDER_UNAVAILABLE: 'Rider is not available',
  RIDER_ON_DELIVERY: 'Rider is already on a delivery',
  ACCEPTANCE_EXPIRED: 'Delivery acceptance time has expired',
  ALREADY_ASSIGNED: 'Delivery is already assigned to a rider',
  CANNOT_CANCEL: 'Cannot cancel delivery at this stage',
  INSUFFICIENT_PAYMENT: 'Insufficient payment for delivery',
  INVALID_RATING: 'Rating must be between 1 and 5',
  LOCATION_REQUIRED: 'Pickup and delivery locations are required',
  INVALID_DISTANCE: 'Invalid delivery distance',
  RIDER_NOT_VERIFIED: 'Rider is not verified',
  RIDER_SUSPENDED: 'Rider account is suspended',
  DUPLICATE_DELIVERY: 'Delivery already exists for this order',
  OUTSIDE_SERVICE_AREA: 'Delivery location is outside rider service area',
} as const;

/**
 * Delivery success messages
 */
export const DELIVERY_SUCCESS_MESSAGES = {
  CREATED: 'Delivery created successfully',
  ASSIGNED: 'Rider assigned to delivery successfully',
  STATUS_UPDATED: 'Delivery status updated successfully',
  COMPLETED: 'Delivery completed successfully',
  CANCELLED: 'Delivery cancelled successfully',
  RIDER_REGISTERED: 'Rider registered successfully',
  RIDER_VERIFIED: 'Rider verified successfully',
  PAYMENT_RELEASED: 'Payment released to rider successfully',
  RATING_SUBMITTED: 'Rating submitted successfully',
  LOCATION_UPDATED: 'Location updated successfully',
} as const;

/**
 * Delivery notification types
 */
export const DELIVERY_NOTIFICATION_TYPES = {
  DELIVERY_ASSIGNED: 'delivery_assigned',
  DELIVERY_ACCEPTED: 'delivery_accepted',
  DELIVERY_DECLINED: 'delivery_declined',
  DELIVERY_PICKED_UP: 'delivery_picked_up',
  DELIVERY_IN_TRANSIT: 'delivery_in_transit',
  DELIVERY_COMPLETED: 'delivery_completed',
  PAYMENT_RELEASED: 'payment_released',
  RATING_RECEIVED: 'rating_received',
} as const;

/**
 * Status transition rules
 */
export const DELIVERY_STATUS_TRANSITIONS: Record<DeliveryStatus, DeliveryStatus[]> = {
  [DeliveryStatus.PENDING_ASSIGNMENT]: [
    DeliveryStatus.PENDING_ACCEPTANCE,
    DeliveryStatus.CANCELLED
  ],
  [DeliveryStatus.PENDING_ACCEPTANCE]: [
    DeliveryStatus.ACCEPTED,
    DeliveryStatus.DECLINED,
    DeliveryStatus.EXPIRED,
    DeliveryStatus.CANCELLED
  ],
  [DeliveryStatus.ACCEPTED]: [
    DeliveryStatus.PICKED_UP,
    DeliveryStatus.CANCELLED
  ],
  [DeliveryStatus.PICKED_UP]: [
    DeliveryStatus.IN_TRANSIT,
    DeliveryStatus.CANCELLED
  ],
  [DeliveryStatus.IN_TRANSIT]: [
    DeliveryStatus.DELIVERED,
    DeliveryStatus.CANCELLED
  ],
  [DeliveryStatus.DELIVERED]: [
    DeliveryStatus.COMPLETED
  ],
  [DeliveryStatus.COMPLETED]: [], // Terminal state
  [DeliveryStatus.CANCELLED]: [], // Terminal state
  [DeliveryStatus.DECLINED]: [], // Terminal state
  [DeliveryStatus.EXPIRED]: [], // Terminal state
};

/**
 * Fee calculation helpers
 */
export const FEE_CALCULATOR = {
  calculateDeliveryFee: (distance: number): number => {
    return DELIVERY_CONSTANTS.BASE_DELIVERY_FEE + (distance * DELIVERY_CONSTANTS.PER_KM_RATE);
  },
  
  calculateRiderPayment: (deliveryFee: number, platformFeePercentage: number = 20): number => {
    const platformFee = (deliveryFee * platformFeePercentage) / 100;
    return Math.max(deliveryFee - platformFee, DELIVERY_CONSTANTS.MIN_RIDER_PAYMENT);
  },
  
  calculateDistance: (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  },
} as const;

/**
 * Vehicle type configurations
 */
export const VEHICLE_TYPE_CONFIG: Record<VehicleType, {
  maxDistance: number;
  baseRate: number;
  capacity: string;
}> = {
  [VehicleType.FOOT]: {
    maxDistance: 2,
    baseRate: 200,
    capacity: 'Small items only'
  },
  [VehicleType.BICYCLE]: {
    maxDistance: 5,
    baseRate: 250,
    capacity: 'Up to 10kg'
  },
  [VehicleType.MOTORCYCLE]: {
    maxDistance: 20,
    baseRate: 300,
    capacity: 'Up to 20kg'
  },
  [VehicleType.CAR]: {
    maxDistance: 50,
    baseRate: 500,
    capacity: 'Up to 100kg'
  },
  [VehicleType.VAN]: {
    maxDistance: 50,
    baseRate: 800,
    capacity: 'Up to 500kg'
  },
};
