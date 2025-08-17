import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order, OrderDocument } from '../../orders/entities/order.entity';
import { Subscription, SubscriptionDocument } from '../../subscriptions/entities/subscription.entity';
import { Delivery, DeliveryDocument } from '../../delivery/entities/delivery.entity';
import { PROFIT_POOL_CONSTANTS } from '../constants/profit-pool.constants';
import * as moment from 'moment';

export interface RevenueCalculationResult {
  totalRevenue: number;
  orderRevenue: number;
  subscriptionRevenue: number;
  deliveryRevenue: number;
  orderCount: number;
  averageOrderValue: number;
  calculationTime: number;
}

@Injectable()
export class RevenueCalculationService {
  private readonly logger = new Logger(RevenueCalculationService.name);

  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(Subscription.name) private subscriptionModel: Model<SubscriptionDocument>,
    @InjectModel(Delivery.name) private deliveryModel: Model<DeliveryDocument>,
  ) {}

  /**
   * Calculate total revenue for a city in a specific month
   */
  async calculateCityRevenue(
    city: string,
    month: string,
  ): Promise<RevenueCalculationResult> {
    const startTime = Date.now();
    this.logger.log(`Calculating revenue for ${city} in ${month}`);

    try {
      // Parse month to get date range
      const startDate = moment(month, 'YYYY-MM').startOf('month').toDate();
      const endDate = moment(month, 'YYYY-MM').endOf('month').toDate();

      // Calculate revenues in parallel
      const [orderRevenue, subscriptionRevenue, deliveryRevenue] = await Promise.all([
        this.calculateOrderRevenue(city, startDate, endDate),
        this.calculateSubscriptionRevenue(city, startDate, endDate),
        this.calculateDeliveryRevenue(city, startDate, endDate),
      ]);

      const totalRevenue = orderRevenue.total + subscriptionRevenue + deliveryRevenue;
      const calculationTime = Date.now() - startTime;

      this.logger.log(
        `Revenue calculated for ${city} in ${month}: ₦${totalRevenue.toLocaleString()}`,
      );

      return {
        totalRevenue,
        orderRevenue: orderRevenue.total,
        subscriptionRevenue,
        deliveryRevenue,
        orderCount: orderRevenue.count,
        averageOrderValue: orderRevenue.count > 0 ? orderRevenue.total / orderRevenue.count : 0,
        calculationTime,
      };
    } catch (error) {
      this.logger.error(`Failed to calculate revenue for ${city} in ${month}:`, error);
      throw error;
    }
  }

  /**
   * Calculate order revenue for a city in date range
   */
  private async calculateOrderRevenue(
    city: string,
    startDate: Date,
    endDate: Date,
  ): Promise<{ total: number; count: number }> {
    try {
      // Use aggregation pipeline for better performance
      const result = await this.orderModel.aggregate([
        {
          $match: {
            city: new RegExp(city, 'i'), // Case-insensitive city match
            status: 'completed',
            createdAt: { $gte: startDate, $lte: endDate },
          },
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$totalAmount' },
            orderCount: { $sum: 1 },
          },
        },
      ]);

      if (result.length === 0) {
        return { total: 0, count: 0 };
      }

      return {
        total: result[0].totalRevenue || 0,
        count: result[0].orderCount || 0,
      };
    } catch (error) {
      this.logger.error(`Failed to calculate order revenue for ${city}:`, error);
      return { total: 0, count: 0 };
    }
  }

  /**
   * Calculate subscription revenue for a city in date range
   */
  private async calculateSubscriptionRevenue(
    city: string,
    startDate: Date,
    endDate: Date,
  ): Promise<number> {
    try {
      // Find users in the city who made subscription payments
      const result = await this.subscriptionModel.aggregate([
        {
          $lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: '_id',
            as: 'user',
          },
        },
        {
          $unwind: '$user',
        },
        {
          $match: {
            'user.city': new RegExp(city, 'i'),
            status: 'active',
            createdAt: { $gte: startDate, $lte: endDate },
          },
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$amount' },
          },
        },
      ]);

      return result.length > 0 ? result[0].totalRevenue || 0 : 0;
    } catch (error) {
      this.logger.error(`Failed to calculate subscription revenue for ${city}:`, error);
      return 0;
    }
  }

  /**
   * Calculate delivery revenue for a city in date range
   */
  private async calculateDeliveryRevenue(
    city: string,
    startDate: Date,
    endDate: Date,
  ): Promise<number> {
    try {
      const result = await this.deliveryModel.aggregate([
        {
          $match: {
            city: new RegExp(city, 'i'),
            status: 'completed',
            createdAt: { $gte: startDate, $lte: endDate },
          },
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$deliveryFee' },
          },
        },
      ]);

      return result.length > 0 ? result[0].totalRevenue || 0 : 0;
    } catch (error) {
      this.logger.error(`Failed to calculate delivery revenue for ${city}:`, error);
      return 0;
    }
  }

  /**
   * Get revenue breakdown for all cities in a month
   */
  async getAllCitiesRevenue(month: string): Promise<Record<string, RevenueCalculationResult>> {
    const results: Record<string, RevenueCalculationResult> = {};

    // Calculate revenue for all supported cities in parallel
    const promises = PROFIT_POOL_CONSTANTS.SUPPORTED_CITIES.map(async (city) => {
      try {
        const revenue = await this.calculateCityRevenue(city, month);
        results[city] = revenue;
      } catch (error) {
        this.logger.error(`Failed to calculate revenue for ${city}:`, error);
        results[city] = {
          totalRevenue: 0,
          orderRevenue: 0,
          subscriptionRevenue: 0,
          deliveryRevenue: 0,
          orderCount: 0,
          averageOrderValue: 0,
          calculationTime: 0,
        };
      }
    });

    await Promise.all(promises);
    return results;
  }

  /**
   * Validate month format
   */
  validateMonth(month: string): boolean {
    return PROFIT_POOL_CONSTANTS.MONTH_FORMAT.test(month);
  }

  /**
   * Get previous month in YYYY-MM format
   */
  getPreviousMonth(): string {
    return moment().subtract(1, 'month').format('YYYY-MM');
  }

  /**
   * Get current month in YYYY-MM format
   */
  getCurrentMonth(): string {
    return moment().format('YYYY-MM');
  }
}
