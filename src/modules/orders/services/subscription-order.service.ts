import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Order, OrderDocument, OrderStatus, PaymentPlan, DeliveryMethod, PaymentFrequency } from '../../orders/entities/order.entity';
import { User, UserDocument } from '../../users/entities/user.entity';
import { Product, ProductDocument } from '../../products/entities/product.entity';
import { OrdersService } from '../../orders/orders.service';
import { CartService } from '../../orders/cart.service';

export enum SubscriptionStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
}

export enum SubscriptionFrequency {
  WEEKLY = 'weekly',
  BIWEEKLY = 'biweekly', 
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
}

export interface SubscriptionPlan {
  _id?: string;
  userId: Types.ObjectId;
  name: string;
  description?: string;
  frequency: SubscriptionFrequency;
  status: SubscriptionStatus;
  startDate: Date;
  nextOrderDate: Date;
  endDate?: Date;
  items: Array<{
    productId: Types.ObjectId;
    quantity: number;
    customInstructions?: string;
  }>;
  deliveryAddress: {
    street: string;
    city: string;
    state: string;
    postalCode?: string;
    country: string;
    latitude?: number;
    longitude?: number;
    instructions?: string;
  };
  paymentPlan: PaymentPlan;
  autoPayment: boolean;
  totalOrders: number;
  successfulOrders: number;
  failedOrders: number;
  lastOrderDate?: Date;
  lastOrderId?: Types.ObjectId;
  pausedUntil?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface SubscriptionOrder {
  subscriptionId: Types.ObjectId;
  subscriptionPlan: SubscriptionPlan;
  orderId: Types.ObjectId;
  orderDate: Date;
  status: 'scheduled' | 'processed' | 'failed' | 'cancelled';
  failureReason?: string;
  retryCount: number;
  nextRetry?: Date;
}

export interface CreateSubscriptionDto {
  name: string;
  description?: string;
  frequency: SubscriptionFrequency;
  startDate: Date;
  endDate?: Date;
  items: Array<{
    productId: string;
    quantity: number;
    customInstructions?: string;
  }>;
  deliveryAddress: {
    street: string;
    city: string;
    state: string;
    postalCode?: string;
    country: string;
    latitude?: number;
    longitude?: number;
    instructions?: string;
  };
  paymentPlan: PaymentPlan;
  autoPayment: boolean;
}

@Injectable()
export class SubscriptionOrderService {
  private readonly logger = new Logger(SubscriptionOrderService.name);

  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    private ordersService: OrdersService,
    private cartService: CartService,
  ) {}

  /**
   * Create a new subscription plan
   */
  async createSubscription(userId: string, subscriptionDto: CreateSubscriptionDto): Promise<SubscriptionPlan> {
    try {
      // Validate products exist and are available
      for (const item of subscriptionDto.items) {
        const product = await this.productModel.findById(item.productId);
        if (!product) {
          throw new BadRequestException(`Product ${item.productId} not found`);
        }
        if (product.stock < item.quantity) {
          throw new BadRequestException(`Insufficient stock for product ${product.name}`);
        }
      }

      // Calculate next order date based on frequency
      const nextOrderDate = this.calculateNextOrderDate(subscriptionDto.startDate, subscriptionDto.frequency);

      const subscription: SubscriptionPlan = {
        userId: new Types.ObjectId(userId),
        name: subscriptionDto.name,
        description: subscriptionDto.description,
        frequency: subscriptionDto.frequency,
        status: SubscriptionStatus.ACTIVE,
        startDate: subscriptionDto.startDate,
        nextOrderDate,
        endDate: subscriptionDto.endDate,
        items: subscriptionDto.items.map(item => ({
          productId: new Types.ObjectId(item.productId),
          quantity: item.quantity,
          customInstructions: item.customInstructions,
        })),
        deliveryAddress: subscriptionDto.deliveryAddress,
        paymentPlan: subscriptionDto.paymentPlan,
        autoPayment: subscriptionDto.autoPayment,
        totalOrders: 0,
        successfulOrders: 0,
        failedOrders: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // For now, store in a simple collection-like structure
      // In production, you'd want a dedicated subscriptions collection
      const result = await this.createSubscriptionDocument(subscription);
      
      this.logger.log(`Created subscription ${result._id} for user ${userId}`);
      return result;
    } catch (error) {
      this.logger.error(`Error creating subscription: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Process subscription orders (called by cron job)
   */
  @Cron(CronExpression.EVERY_HOUR)
  async processScheduledSubscriptions(): Promise<void> {
    this.logger.log('Processing scheduled subscription orders...');

    try {
      const dueSubscriptions = await this.getDueSubscriptions();
      
      for (const subscription of dueSubscriptions) {
        await this.processSubscriptionOrder(subscription);
      }

      this.logger.log(`Processed ${dueSubscriptions.length} subscription orders`);
    } catch (error) {
      this.logger.error(`Error processing scheduled subscriptions: ${error.message}`, error.stack);
    }
  }

  /**
   * Process a single subscription order
   */
  async processSubscriptionOrder(subscription: SubscriptionPlan): Promise<SubscriptionOrder> {
    try {
      this.logger.log(`Processing subscription order for subscription ${subscription._id}`);

      // Check if subscription is still active
      if (subscription.status !== SubscriptionStatus.ACTIVE) {
        return {
          subscriptionId: new Types.ObjectId(subscription._id),
          subscriptionPlan: subscription,
          orderId: new Types.ObjectId(),
          orderDate: new Date(),
          status: 'cancelled',
          failureReason: 'Subscription is not active',
          retryCount: 0,
        };
      }

      // Check if subscription has expired
      if (subscription.endDate && new Date() > subscription.endDate) {
        await this.updateSubscriptionStatus(subscription._id!, SubscriptionStatus.EXPIRED);
        return {
          subscriptionId: new Types.ObjectId(subscription._id),
          subscriptionPlan: subscription,
          orderId: new Types.ObjectId(),
          orderDate: new Date(),
          status: 'cancelled',
          failureReason: 'Subscription has expired',
          retryCount: 0,
        };
      }

      // Validate product availability
      for (const item of subscription.items) {
        const product = await this.productModel.findById(item.productId);
        if (!product || product.stock < item.quantity) {
          // Handle out of stock scenario
          await this.handleOutOfStock(subscription, item.productId.toString());
          return {
            subscriptionId: new Types.ObjectId(subscription._id),
            subscriptionPlan: subscription,
            orderId: new Types.ObjectId(),
            orderDate: new Date(),
            status: 'failed',
            failureReason: `Product ${item.productId} is out of stock`,
            retryCount: 0,
            nextRetry: new Date(Date.now() + 24 * 60 * 60 * 1000), // Retry in 24 hours
          };
        }
      }

      // Create order from subscription
      const order = await this.createOrderFromSubscription(subscription);
      
      // Update subscription tracking
      await this.updateSubscriptionAfterOrder(subscription._id!, order._id.toString(), true);

      return {
        subscriptionId: new Types.ObjectId(subscription._id),
        subscriptionPlan: subscription,
        orderId: new Types.ObjectId(order._id.toString()),
        orderDate: new Date(),
        status: 'processed',
        retryCount: 0,
      };

    } catch (error) {
      this.logger.error(`Error processing subscription order: ${error.message}`, error.stack);
      
      // Update subscription tracking for failed order
      await this.updateSubscriptionAfterOrder(subscription._id!, null, false);

      return {
        subscriptionId: new Types.ObjectId(subscription._id),
        subscriptionPlan: subscription,
        orderId: new Types.ObjectId(),
        orderDate: new Date(),
        status: 'failed',
        failureReason: error.message,
        retryCount: 0,
        nextRetry: new Date(Date.now() + 4 * 60 * 60 * 1000), // Retry in 4 hours
      };
    }
  }

  /**
   * Create an order from a subscription plan
   */
  private async createOrderFromSubscription(subscription: SubscriptionPlan): Promise<OrderDocument> {
    // Clear and populate cart with subscription items
    await this.cartService.clearCart(subscription.userId.toString());
    
    for (const item of subscription.items) {
      await this.cartService.addToCart(
        subscription.userId.toString(), 
        item.productId.toString(), 
        item.quantity
      );
    }

    // Create checkout DTO with proper payment plan structure
    const checkoutDto = {
      paymentPlan: {
        type: subscription.paymentPlan,
        // Add required plan details based on type
        payNowDetails: subscription.paymentPlan === PaymentPlan.PAY_NOW ? {} : undefined,
        priceLockDetails: subscription.paymentPlan === PaymentPlan.PRICE_LOCK ? {
          preferredDeliveryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
        } : undefined,
        paySmallSmallDetails: subscription.paymentPlan === PaymentPlan.PAY_SMALL_SMALL ? {
          frequency: PaymentFrequency.MONTHLY,
          totalInstallments: 4,
        } : undefined,
        payLaterDetails: subscription.paymentPlan === PaymentPlan.PAY_LATER ? {
          monthlyIncome: 100000, // Default subscription income requirement
          employmentStatus: 'Subscription Customer',
          bvn: '00000000000', // Placeholder BVN for subscription orders
          loanDuration: 30,
        } : undefined,
      },
      deliveryMethod: DeliveryMethod.HOME_DELIVERY,
      deliveryAddress: subscription.deliveryAddress,
      notes: `Subscription order from plan: ${subscription.name}`,
    };

    // Process checkout
    const order = await this.ordersService.checkout(subscription.userId.toString(), checkoutDto);
    
    if (!order) {
      throw new Error('Checkout failed: No order returned');
    }

    // Add subscription reference to order
    await this.orderModel.updateOne(
      { _id: order._id },
      { 
        $set: { 
          subscriptionId: subscription._id,
          isSubscriptionOrder: true,
        }
      }
    );

    return order;
  }

  /**
   * Get subscriptions due for processing
   */
  private async getDueSubscriptions(): Promise<SubscriptionPlan[]> {
    // This is a simplified implementation
    // In production, you'd query a dedicated subscriptions collection
    const now = new Date();
    
    // For demo purposes, return a mock subscription that's due
    // You would implement proper database querying here
    return [];
  }

  /**
   * Calculate next order date based on frequency
   */
  private calculateNextOrderDate(currentDate: Date, frequency: SubscriptionFrequency): Date {
    const nextDate = new Date(currentDate);
    
    switch (frequency) {
      case SubscriptionFrequency.WEEKLY:
        nextDate.setDate(nextDate.getDate() + 7);
        break;
      case SubscriptionFrequency.BIWEEKLY:
        nextDate.setDate(nextDate.getDate() + 14);
        break;
      case SubscriptionFrequency.MONTHLY:
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
      case SubscriptionFrequency.QUARTERLY:
        nextDate.setMonth(nextDate.getMonth() + 3);
        break;
    }
    
    return nextDate;
  }

  /**
   * Handle out of stock scenario for subscription items
   */
  private async handleOutOfStock(subscription: SubscriptionPlan, productId: string): Promise<void> {
    // Options:
    // 1. Pause subscription until product is back in stock
    // 2. Remove item from subscription
    // 3. Substitute with alternative product
    // 4. Notify user and let them decide

    this.logger.warn(`Product ${productId} out of stock for subscription ${subscription._id}`);
    
    // For now, we'll pause the subscription
    await this.pauseSubscription(subscription._id!, 'Product out of stock', 7); // Pause for 7 days
  }

  /**
   * Pause a subscription
   */
  async pauseSubscription(subscriptionId: string, reason: string, daysToResume: number = 7): Promise<void> {
    const resumeDate = new Date();
    resumeDate.setDate(resumeDate.getDate() + daysToResume);

    // Update subscription status
    await this.updateSubscriptionDocument(subscriptionId, {
      status: SubscriptionStatus.PAUSED,
      pausedUntil: resumeDate,
      updatedAt: new Date(),
    });

    this.logger.log(`Subscription ${subscriptionId} paused until ${resumeDate.toISOString()}: ${reason}`);
  }

  /**
   * Resume a paused subscription
   */
  async resumeSubscription(subscriptionId: string): Promise<void> {
    const subscription = await this.getSubscriptionById(subscriptionId);
    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    const nextOrderDate = this.calculateNextOrderDate(new Date(), subscription.frequency);

    await this.updateSubscriptionDocument(subscriptionId, {
      status: SubscriptionStatus.ACTIVE,
      nextOrderDate,
      pausedUntil: undefined,
      updatedAt: new Date(),
    });

    this.logger.log(`Subscription ${subscriptionId} resumed`);
  }

  /**
   * Cancel a subscription
   */
  async cancelSubscription(subscriptionId: string, userId: string, reason?: string): Promise<void> {
    const subscription = await this.getSubscriptionById(subscriptionId);
    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    if (subscription.userId.toString() !== userId) {
      throw new BadRequestException('Unauthorized to cancel this subscription');
    }

    await this.updateSubscriptionDocument(subscriptionId, {
      status: SubscriptionStatus.CANCELLED,
      updatedAt: new Date(),
    });

    this.logger.log(`Subscription ${subscriptionId} cancelled by user ${userId}: ${reason || 'No reason provided'}`);
  }

  /**
   * Get user's subscriptions
   */
  async getUserSubscriptions(userId: string, status?: SubscriptionStatus): Promise<SubscriptionPlan[]> {
    // In production, query the subscriptions collection
    // For now, return mock data
    return [];
  }

  /**
   * Get subscription by ID
   */
  async getSubscriptionById(subscriptionId: string): Promise<SubscriptionPlan | null> {
    // In production, query the subscriptions collection
    // For now, return null as placeholder
    return null;
  }

  /**
   * Update subscription status
   */
  private async updateSubscriptionStatus(subscriptionId: string, status: SubscriptionStatus): Promise<void> {
    await this.updateSubscriptionDocument(subscriptionId, {
      status,
      updatedAt: new Date(),
    });
  }

  /**
   * Update subscription after order processing
   */
  private async updateSubscriptionAfterOrder(
    subscriptionId: string, 
    orderId: string | null, 
    success: boolean
  ): Promise<void> {
    const subscription = await this.getSubscriptionById(subscriptionId);
    if (!subscription) return;

    const nextOrderDate = this.calculateNextOrderDate(new Date(), subscription.frequency);

    const updateData: Partial<SubscriptionPlan> = {
      totalOrders: subscription.totalOrders + 1,
      lastOrderDate: new Date(),
      nextOrderDate,
      updatedAt: new Date(),
    };

    if (success && orderId) {
      updateData.successfulOrders = subscription.successfulOrders + 1;
      updateData.lastOrderId = new Types.ObjectId(orderId);
    } else {
      updateData.failedOrders = subscription.failedOrders + 1;
    }

    await this.updateSubscriptionDocument(subscriptionId, updateData);
  }

  /**
   * Create subscription document (placeholder for actual database operations)
   */
  private async createSubscriptionDocument(subscription: SubscriptionPlan): Promise<SubscriptionPlan> {
    // In production, this would create a document in a subscriptions collection
    // For now, we'll simulate by returning the subscription with an ID
    return {
      ...subscription,
      _id: new Types.ObjectId().toString(),
    };
  }

  /**
   * Update subscription document (placeholder for actual database operations)
   */
  private async updateSubscriptionDocument(
    subscriptionId: string, 
    updateData: Partial<SubscriptionPlan>
  ): Promise<void> {
    // In production, this would update the document in the subscriptions collection
    this.logger.log(`Updating subscription ${subscriptionId} with data:`, updateData);
  }

  /**
   * Get subscription analytics
   */
  async getSubscriptionAnalytics(timeframe: 'day' | 'week' | 'month' = 'month') {
    // Mock analytics data
    return {
      totalSubscriptions: 0,
      activeSubscriptions: 0,
      pausedSubscriptions: 0,
      cancelledSubscriptions: 0,
      totalSubscriptionRevenue: 0,
      averageOrderValue: 0,
      subscriptionRetentionRate: 0,
      mostPopularFrequency: SubscriptionFrequency.MONTHLY,
      orderSuccessRate: 0,
    };
  }
}
