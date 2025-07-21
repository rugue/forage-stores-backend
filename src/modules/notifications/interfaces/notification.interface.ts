import { Types } from 'mongoose';
import {
  NotificationChannel,
  NotificationType,
  NotificationPriority,
  NotificationStatus,
} from '../entities/notification.entity';

export interface INotification {
  _id?: Types.ObjectId;
  recipientId: Types.ObjectId;
  title: string;
  message: string;
  type: NotificationType;
  channel: NotificationChannel;
  priority: NotificationPriority;
  status: NotificationStatus;
  read: boolean;
  readAt?: Date;
  sentAt?: Date;
  deliveredAt?: Date;
  metadata?: Record<string, any>;
  success: boolean;
  errorMessage?: string;
  retryCount?: number;
  scheduledAt?: Date;
  expiresAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface NotificationTemplate {
  type: NotificationType;
  channel: NotificationChannel;
  title: string;
  message: string;
  priority: NotificationPriority;
  variables?: string[];
}

export interface NotificationPreferences {
  userId: Types.ObjectId;
  emailEnabled: boolean;
  pushEnabled: boolean;
  whatsappEnabled: boolean;
  smsEnabled: boolean;
  inAppEnabled: boolean;
  categories: {
    orderUpdates: boolean;
    paymentReminders: boolean;
    promotions: boolean;
    securityAlerts: boolean;
    auctionEvents: boolean;
    generalNews: boolean;
  };
  quietHours: {
    enabled: boolean;
    startTime: string; // HH:mm format
    endTime: string; // HH:mm format
    timezone: string;
  };
}

export interface NotificationSearchParams {
  recipientId?: Types.ObjectId;
  type?: NotificationType;
  channel?: NotificationChannel;
  status?: NotificationStatus;
  priority?: NotificationPriority;
  read?: boolean;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface NotificationSummary {
  totalNotifications: number;
  unreadCount: number;
  notificationsByType: Record<NotificationType, number>;
  notificationsByChannel: Record<NotificationChannel, number>;
  notificationsByStatus: Record<NotificationStatus, number>;
  deliveryRate: number;
  readRate: number;
}

export interface NotificationAnalytics {
  dailyStats: Array<{
    date: string;
    sent: number;
    delivered: number;
    read: number;
    failed: number;
  }>;
  channelPerformance: Array<{
    channel: NotificationChannel;
    totalSent: number;
    deliveryRate: number;
    readRate: number;
    averageDeliveryTime: number;
  }>;
  typeEngagement: Array<{
    type: NotificationType;
    totalSent: number;
    readRate: number;
    averageTimeToRead: number;
  }>;
  userEngagement: Array<{
    userId: Types.ObjectId;
    totalReceived: number;
    readCount: number;
    readRate: number;
    preferredChannel: NotificationChannel;
  }>;
}

export interface BulkNotificationRequest {
  recipientIds: Types.ObjectId[];
  title: string;
  message: string;
  type: NotificationType;
  channel: NotificationChannel;
  priority?: NotificationPriority;
  scheduledAt?: Date;
  expiresAt?: Date;
  metadata?: Record<string, any>;
}

export interface NotificationQueue {
  notifications: INotification[];
  priority: NotificationPriority;
  processingOrder: 'fifo' | 'priority' | 'scheduled';
  retryPolicy: {
    maxRetries: number;
    backoffMultiplier: number;
    initialDelay: number;
  };
}

export interface NotificationDeliveryResult {
  notificationId: Types.ObjectId;
  success: boolean;
  deliveredAt?: Date;
  errorMessage?: string;
  providerResponse?: any;
  retryAttempt: number;
}

export interface NotificationProvider {
  name: string;
  channel: NotificationChannel;
  isEnabled: boolean;
  configuration: Record<string, any>;
  rateLimit: {
    requestsPerMinute: number;
    requestsPerHour: number;
    requestsPerDay: number;
  };
}

export interface NotificationExport {
  recipientId: string;
  recipientName: string;
  recipientEmail: string;
  title: string;
  message: string;
  type: NotificationType;
  channel: NotificationChannel;
  status: NotificationStatus;
  read: boolean;
  sentAt?: Date;
  readAt?: Date;
  createdAt: Date;
}
