import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order, OrderDocument, OrderStatus, DeliveryMethod } from '../../orders/entities/order.entity';
import { RiderAssignmentService, RiderAssignmentCriteria } from './rider-assignment.service';
import { OrdersService } from '../../orders/orders.service';

@Injectable()
export class DeliveryOrchestrationService {
  private readonly logger = new Logger(DeliveryOrchestrationService.name);

  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    private riderAssignmentService: RiderAssignmentService,
    private ordersService: OrdersService,
  ) {}

  /**
   * Process order for delivery assignment when status changes to PAID
   */
  async processOrderForDelivery(orderId: string): Promise<void> {
    try {
      const order = await this.orderModel.findById(orderId);
      if (!order) {
        this.logger.error(`Order ${orderId} not found`);
        return;
      }

      // Only process home delivery orders
      if (order.deliveryMethod !== DeliveryMethod.HOME_DELIVERY) {
        this.logger.log(`Order ${orderId} is pickup, skipping rider assignment`);
        return;
      }

      // Check if rider is already assigned
      if (order.assignedRider) {
        this.logger.log(`Order ${orderId} already has assigned rider`);
        return;
      }

      // Validate delivery address has coordinates
      if (!order.deliveryAddress?.latitude || !order.deliveryAddress?.longitude) {
        this.logger.warn(`Order ${orderId} missing delivery coordinates, cannot assign rider`);
        await this.ordersService.addStatusHistory(orderId, {
          status: order.status,
          reason: 'Missing delivery coordinates for rider assignment',
          updatedBy: 'system',
        });
        return;
      }

      // Prepare assignment criteria
      const criteria: RiderAssignmentCriteria = {
        orderId,
        deliveryAddress: {
          latitude: order.deliveryAddress.latitude,
          longitude: order.deliveryAddress.longitude,
          city: order.deliveryAddress.city,
          state: order.deliveryAddress.state,
        },
        orderValue: order.finalTotal,
        deliveryFee: order.deliveryFee || 0,
        urgency: this.determineOrderUrgency(order),
      };

      // Attempt rider assignment
      const assignmentResult = await this.riderAssignmentService.assignRider(criteria);

      if (assignmentResult.success && assignmentResult.assignedRider) {
        // Update order status to SHIPPED
        await this.ordersService.updateOrderStatus(orderId, OrderStatus.SHIPPED, {
          reason: `Assigned to rider ${assignmentResult.assignedRider.firstName} ${assignmentResult.assignedRider.lastName}`,
          updatedBy: 'system',
        });

        // Set estimated delivery date
        if (assignmentResult.estimatedDeliveryTime) {
          const estimatedDeliveryDate = new Date();
          estimatedDeliveryDate.setMinutes(
            estimatedDeliveryDate.getMinutes() + assignmentResult.estimatedDeliveryTime
          );

          await this.orderModel.updateOne(
            { _id: orderId },
            { $set: { expectedDeliveryDate: estimatedDeliveryDate } }
          );
        }

        this.logger.log(
          `Successfully assigned rider ${assignmentResult.assignedRider._id} to order ${orderId}`
        );
      } else {
        // Assignment failed, add to manual assignment queue
        await this.addToManualAssignmentQueue(orderId, assignmentResult.reason || 'Unknown error');
        
        this.logger.warn(
          `Failed to auto-assign rider to order ${orderId}: ${assignmentResult.reason}`
        );
      }
    } catch (error) {
      this.logger.error(`Error processing order ${orderId} for delivery: ${error.message}`, error.stack);
      
      // Add error to order history
      await this.ordersService.addStatusHistory(orderId, {
        status: OrderStatus.PAID,
        reason: `Delivery processing error: ${error.message}`,
        updatedBy: 'system',
      });
    }
  }

  /**
   * Handle rider availability changes (rider goes offline, etc.)
   */
  async handleRiderUnavailable(riderId: string, reason: string): Promise<void> {
    try {
      // Find orders assigned to this rider that are not yet delivered
      const affectedOrders = await this.orderModel.find({
        assignedRider: riderId,
        status: { $in: [OrderStatus.PAID, OrderStatus.SHIPPED] }
      });

      for (const order of affectedOrders) {
        this.logger.log(`Reassigning order ${order._id} due to rider unavailability`);
        
        const reassignmentResult = await this.riderAssignmentService.reassignOrder(
          order._id.toString(),
          reason
        );

        if (reassignmentResult.success) {
          await this.ordersService.addStatusHistory(order._id.toString(), {
            status: order.status,
            reason: `Reassigned due to rider unavailability: ${reason}`,
            updatedBy: 'system',
          });
        } else {
          // Add to manual assignment queue
          await this.addToManualAssignmentQueue(
            order._id.toString(),
            `Automatic reassignment failed: ${reassignmentResult.reason}`
          );
        }
      }
    } catch (error) {
      this.logger.error(`Error handling rider ${riderId} unavailability: ${error.message}`, error.stack);
    }
  }

  /**
   * Get orders pending rider assignment
   */
  async getPendingAssignments(): Promise<OrderDocument[]> {
    return this.orderModel.find({
      status: OrderStatus.PAID,
      deliveryMethod: DeliveryMethod.HOME_DELIVERY,
      assignedRider: { $exists: false },
      'deliveryAddress.latitude': { $exists: true },
      'deliveryAddress.longitude': { $exists: true },
    }).sort({ createdAt: 1 });
  }

  /**
   * Manually assign rider to order
   */
  async manuallyAssignRider(orderId: string, riderId: string, assignedBy: string): Promise<boolean> {
    try {
      const order = await this.orderModel.findById(orderId);
      if (!order) {
        throw new Error('Order not found');
      }

      // Update order with assigned rider
      await this.orderModel.updateOne(
        { _id: orderId },
        {
          $set: {
            assignedRider: riderId,
            riderAssignedAt: new Date(),
          }
        }
      );

      // Update order status if needed
      if (order.status === OrderStatus.PAID) {
        await this.ordersService.updateOrderStatus(orderId, OrderStatus.SHIPPED, {
          reason: `Manually assigned to rider`,
          updatedBy: assignedBy,
        });
      }

      this.logger.log(`Manually assigned rider ${riderId} to order ${orderId} by ${assignedBy}`);
      return true;
    } catch (error) {
      this.logger.error(`Error in manual assignment: ${error.message}`, error.stack);
      return false;
    }
  }

  /**
   * Determine order urgency based on various factors
   */
  private determineOrderUrgency(order: OrderDocument): 'low' | 'medium' | 'high' {
    const now = new Date();
    const orderAge = now.getTime() - order.createdAt.getTime();
    const ageInHours = orderAge / (1000 * 60 * 60);

    // High urgency criteria
    if (ageInHours > 2) return 'high'; // Order older than 2 hours
    if (order.finalTotal > 100000) return 'high'; // High value orders (>100k NGN)
    if (order.deliveryFee > 5000) return 'high'; // Premium delivery

    // Medium urgency criteria
    if (ageInHours > 1) return 'medium'; // Order older than 1 hour
    if (order.finalTotal > 50000) return 'medium'; // Medium value orders

    return 'low';
  }

  /**
   * Add order to manual assignment queue
   */
  private async addToManualAssignmentQueue(orderId: string, reason: string): Promise<void> {
    // For now, just add to order history
    // In the future, this could create a task in a job queue or notification system
    await this.ordersService.addStatusHistory(orderId, {
      status: OrderStatus.PAID,
      reason: `Added to manual assignment queue: ${reason}`,
      updatedBy: 'system',
    });

    // TODO: Implement notification to delivery managers
    this.logger.warn(`Order ${orderId} added to manual assignment queue: ${reason}`);
  }

  /**
   * Get delivery performance metrics
   */
  async getDeliveryMetrics(timeframe: 'day' | 'week' | 'month' = 'day') {
    const now = new Date();
    const startDate = new Date();

    switch (timeframe) {
      case 'day':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
    }

    const metrics = await this.orderModel.aggregate([
      {
        $match: {
          deliveryMethod: DeliveryMethod.HOME_DELIVERY,
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          assignedOrders: {
            $sum: { $cond: [{ $exists: ['$assignedRider', true] }, 1, 0] }
          },
          deliveredOrders: {
            $sum: { $cond: [{ $eq: ['$status', OrderStatus.DELIVERED] }, 1, 0] }
          },
          averageAssignmentTime: {
            $avg: {
              $cond: [
                { $exists: ['$riderAssignedAt', true] },
                { $subtract: ['$riderAssignedAt', '$createdAt'] },
                null
              ]
            }
          },
          averageDeliveryTime: {
            $avg: {
              $cond: [
                { $exists: ['$actualDeliveryDate', true] },
                { $subtract: ['$actualDeliveryDate', '$riderAssignedAt'] },
                null
              ]
            }
          }
        }
      }
    ]);

    const result = metrics[0] || {
      totalOrders: 0,
      assignedOrders: 0,
      deliveredOrders: 0,
      averageAssignmentTime: 0,
      averageDeliveryTime: 0
    };

    return {
      ...result,
      assignmentRate: result.totalOrders > 0 ? (result.assignedOrders / result.totalOrders) * 100 : 0,
      deliveryRate: result.assignedOrders > 0 ? (result.deliveredOrders / result.assignedOrders) * 100 : 0,
      averageAssignmentTimeMinutes: result.averageAssignmentTime ? result.averageAssignmentTime / (1000 * 60) : 0,
      averageDeliveryTimeMinutes: result.averageDeliveryTime ? result.averageDeliveryTime / (1000 * 60) : 0
    };
  }
}
