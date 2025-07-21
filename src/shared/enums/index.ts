export enum AccountType {
  FAMILY = 'family',
  BUSINESS = 'business',
}

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  RIDER = 'rider',
  PRO_AFFILIATE = 'pro-affiliate',
  SYSTEM = 'system',
}

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  PARTIAL = 'partial',
}

export enum PaymentMethod {
  FOOD_MONEY = 'food_money',
  CREDIT = 'credit',
  CASH_ON_DELIVERY = 'cash_on_delivery',
  BANK_TRANSFER = 'bank_transfer',
}

export enum NotificationType {
  ORDER_UPDATE = 'order_update',
  PAYMENT_REMINDER = 'payment_reminder',
  AUCTION_EVENT = 'auction_event',
  RIDER_ASSIGNMENT = 'rider_assignment',
  GENERAL = 'general',
}

export enum NotificationChannel {
  EMAIL = 'email',
  PUSH = 'push',
  WHATSAPP = 'whatsapp',
  SMS = 'sms',
}

export enum AuctionStatus {
  ACTIVE = 'active',
  ENDED = 'ended',
  CANCELLED = 'cancelled',
}

export enum DeliveryStatus {
  PENDING = 'pending',
  ASSIGNED = 'assigned',
  PICKED_UP = 'picked_up',
  IN_TRANSIT = 'in_transit',
  DELIVERED = 'delivered',
  FAILED = 'failed',
}

export enum ProductStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  OUT_OF_STOCK = 'out_of_stock',
  DISCONTINUED = 'discontinued',
}
