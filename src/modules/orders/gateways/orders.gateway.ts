import { Injectable, Logger } from '@nestjs/common';
import { OrderStatus, PaymentStatus } from '../entities/order.entity';
import { UserRole } from '../../users/entities/user.entity';

interface OrderUpdatePayload {
  orderId: string;
  status: OrderStatus;
  paymentStatus?: PaymentStatus;
  deliveryUpdate?: any;
  timestamp: Date;
  userId?: string;
}

interface DeliveryTrackingPayload {
  orderId: string;
  riderId?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  estimatedArrival?: Date;
  status: string;
  userId?: string;
}

interface RealTimeSubscription {
  userId: string;
  userRole: UserRole;
  orderId?: string;
  subscriptionType: 'order_updates' | 'delivery_tracking' | 'payment_reminders';
  createdAt: Date;
}

@Injectable()
export class OrderRealTimeService {
  private readonly logger = new Logger(OrderRealTimeService.name);
  private subscriptions = new Map<string, RealTimeSubscription[]>();
  private eventBuffer = new Map<string, any[]>();

  /**
   * Subscribe user to real-time order updates
   */
  subscribeToOrderUpdates(userId: string, userRole: UserRole, orderId?: string): string {
    const subscriptionId = `${userId}_${Date.now()}`;
    
    const subscription: RealTimeSubscription = {
      userId,
      userRole,
      orderId,
      subscriptionType: 'order_updates',
      createdAt: new Date(),
    };

    if (!this.subscriptions.has(userId)) {
      this.subscriptions.set(userId, []);
    }
    
    this.subscriptions.get(userId)!.push(subscription);
    
    this.logger.log(`User ${userId} subscribed to order updates (ID: ${subscriptionId})`);
    
    return subscriptionId;
  }

  /**
   * Unsubscribe user from real-time updates
   */
  unsubscribe(userId: string, subscriptionId?: string): boolean {
    const userSubscriptions = this.subscriptions.get(userId);
    
    if (!userSubscriptions) {
      return false;
    }

    if (subscriptionId) {
      // Remove specific subscription
      const index = userSubscriptions.findIndex(sub => 
        `${sub.userId}_${sub.createdAt.getTime()}` === subscriptionId
      );
      if (index > -1) {
        userSubscriptions.splice(index, 1);
        this.logger.log(`Removed subscription ${subscriptionId} for user ${userId}`);
        return true;
      }
    } else {
      // Remove all subscriptions for user
      this.subscriptions.delete(userId);
      this.logger.log(`Removed all subscriptions for user ${userId}`);
      return true;
    }

    return false;
  }

  /**
   * Broadcast order status update
   */
  broadcastOrderUpdate(payload: OrderUpdatePayload) {
    // Find subscribed users for this order
    const subscribedUsers: string[] = [];
    
    this.subscriptions.forEach((subs, userId) => {
      const hasOrderSub = subs.some(sub => 
        sub.subscriptionType === 'order_updates' && 
        (!sub.orderId || sub.orderId === payload.orderId)
      );
      
      if (hasOrderSub) {
        subscribedUsers.push(userId);
      }
    });

    // Add to event buffer for each subscribed user
    subscribedUsers.forEach(userId => {
      this.addToEventBuffer(userId, {
        type: 'order_update',
        ...payload,
      });
    });

    // Also add to admin buffer
    this.addToEventBuffer('admin', {
      type: 'admin_order_update',
      ...payload,
    });

    this.logger.log(`Order update queued for ${subscribedUsers.length} subscribers: ${payload.orderId}`);
  }

  /**
   * Broadcast delivery tracking update
   */
  broadcastDeliveryUpdate(payload: DeliveryTrackingPayload) {
    // Find subscribed users for delivery tracking
    const subscribedUsers: string[] = [];
    
    this.subscriptions.forEach((subs, userId) => {
      const hasDeliverySub = subs.some(sub => 
        sub.subscriptionType === 'delivery_tracking' && 
        (!sub.orderId || sub.orderId === payload.orderId)
      );
      
      if (hasDeliverySub) {
        subscribedUsers.push(userId);
      }
    });

    // Add to event buffer
    subscribedUsers.forEach(userId => {
      this.addToEventBuffer(userId, {
        type: 'delivery_update',
        ...payload,
        timestamp: new Date(),
      });
    });

    this.logger.log(`Delivery update queued for ${subscribedUsers.length} subscribers: ${payload.orderId}`);
  }

  /**
   * Send payment reminder
   */
  sendPaymentReminder(userId: string, orderData: any) {
    this.addToEventBuffer(userId, {
      type: 'payment_reminder',
      ...orderData,
      timestamp: new Date(),
    });

    this.logger.log(`Payment reminder queued for user ${userId}`);
  }

  /**
   * Get real-time events for a user (Server-Sent Events endpoint)
   */
  getEventsForUser(userId: string): any[] {
    const events = this.eventBuffer.get(userId) || [];
    
    // Clear buffer after sending
    this.eventBuffer.delete(userId);
    
    return events;
  }

  /**
   * Get admin events
   */
  getAdminEvents(): any[] {
    const events = this.eventBuffer.get('admin') || [];
    
    // Clear admin buffer after sending
    this.eventBuffer.delete('admin');
    
    return events;
  }

  /**
   * Add event to user's buffer
   */
  private addToEventBuffer(userId: string, event: any) {
    if (!this.eventBuffer.has(userId)) {
      this.eventBuffer.set(userId, []);
    }
    
    const userEvents = this.eventBuffer.get(userId)!;
    userEvents.push(event);
    
    // Keep only last 50 events per user
    if (userEvents.length > 50) {
      userEvents.splice(0, userEvents.length - 50);
    }
  }

  /**
   * Get connection statistics
   */
  getConnectionStats() {
    const totalSubscriptions = Array.from(this.subscriptions.values())
      .reduce((total, subs) => total + subs.length, 0);
    
    const userCount = this.subscriptions.size;
    const bufferedEvents = Array.from(this.eventBuffer.values())
      .reduce((total, events) => total + events.length, 0);

    return {
      totalSubscriptions,
      userCount,
      bufferedEvents,
      subscriptionTypes: {
        order_updates: this.getSubscriptionCountByType('order_updates'),
        delivery_tracking: this.getSubscriptionCountByType('delivery_tracking'),
        payment_reminders: this.getSubscriptionCountByType('payment_reminders'),
      },
    };
  }

  private getSubscriptionCountByType(type: RealTimeSubscription['subscriptionType']): number {
    return Array.from(this.subscriptions.values())
      .flat()
      .filter(sub => sub.subscriptionType === type)
      .length;
  }
}
