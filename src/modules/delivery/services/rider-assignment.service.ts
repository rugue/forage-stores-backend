import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Order, OrderDocument, OrderStatus } from '../../orders/entities/order.entity';
import { Rider, RiderDocument, RiderStatus, VehicleType } from '../entities/rider.entity';
import { User, UserDocument } from '../../users/entities/user.entity';

export interface RiderAssignmentCriteria {
  orderId: string;
  deliveryAddress: {
    latitude: number;
    longitude: number;
    city: string;
    state: string;
  };
  orderValue: number;
  deliveryFee: number;
  urgency: 'low' | 'medium' | 'high';
  vehicleRequirement?: VehicleType;
}

export interface RiderScore {
  riderId: string;
  rider: RiderDocument;
  score: number;
  distance: number;
  availability: boolean;
  factors: {
    distanceScore: number;
    ratingScore: number;
    experienceScore: number;
    availabilityScore: number;
    vehicleScore: number;
  };
}

export interface AssignmentResult {
  success: boolean;
  assignedRider?: RiderDocument;
  reason?: string;
  alternativeRiders?: RiderScore[];
  estimatedDeliveryTime?: number;
}

@Injectable()
export class RiderAssignmentService {
  private readonly logger = new Logger(RiderAssignmentService.name);
  
  // Assignment configuration
  private readonly MAX_SEARCH_RADIUS_KM = 15; // 15km search radius
  private readonly MIN_RIDER_RATING = 3.0;
  private readonly MAX_ACTIVE_DELIVERIES = 3;
  private readonly PRIORITY_RADIUS_KM = 5; // Priority for riders within 5km

  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(Rider.name) private riderModel: Model<RiderDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  /**
   * Assign the best available rider to an order
   */
  async assignRider(criteria: RiderAssignmentCriteria): Promise<AssignmentResult> {
    try {
      this.logger.log(`Starting rider assignment for order ${criteria.orderId}`);

      // Get available riders in the area
      const availableRiders = await this.getAvailableRiders(criteria);
      
      if (availableRiders.length === 0) {
        return {
          success: false,
          reason: 'No available riders found in the delivery area',
        };
      }

      // Score and rank riders
      const rankedRiders = await this.scoreAndRankRiders(availableRiders, criteria);
      
      if (rankedRiders.length === 0) {
        return {
          success: false,
          reason: 'No riders meet the minimum requirements for this delivery',
        };
      }

      // Assign the best rider
      const bestRider = rankedRiders[0];
      const assignmentSuccess = await this.performAssignment(
        criteria.orderId,
        bestRider.rider._id.toString()
      );

      if (assignmentSuccess) {
        const estimatedTime = this.calculateEstimatedDeliveryTime(
          bestRider.distance,
          bestRider.rider.vehicle?.type || VehicleType.MOTORCYCLE
        );

        this.logger.log(
          `Successfully assigned rider ${bestRider.rider._id} to order ${criteria.orderId}`
        );

        return {
          success: true,
          assignedRider: bestRider.rider,
          alternativeRiders: rankedRiders.slice(1, 4), // Top 3 alternatives
          estimatedDeliveryTime: estimatedTime,
        };
      } else {
        return {
          success: false,
          reason: 'Failed to complete rider assignment',
          alternativeRiders: rankedRiders,
        };
      }
    } catch (error) {
      this.logger.error(`Error in rider assignment: ${error.message}`, error.stack);
      return {
        success: false,
        reason: `Assignment failed: ${error.message}`,
      };
    }
  }

  /**
   * Get available riders in the delivery area
   */
  private async getAvailableRiders(criteria: RiderAssignmentCriteria): Promise<RiderDocument[]> {
    const { deliveryAddress } = criteria;

    // Find riders within search radius
    const riders = await this.riderModel.aggregate([
      {
        $match: {
          status: RiderStatus.ACTIVE,
          isAvailable: true,
          isOnDelivery: false,
          'currentLocation.latitude': { $exists: true },
          'currentLocation.longitude': { $exists: true },
          serviceAreas: deliveryAddress.city,
        },
      },
      {
        $addFields: {
          distance: {
            $multiply: [
              6371, // Earth's radius in km
              {
                $acos: {
                  $add: [
                    {
                      $multiply: [
                        { $sin: { $degreesToRadians: '$currentLocation.latitude' } },
                        { $sin: { $degreesToRadians: deliveryAddress.latitude } }
                      ]
                    },
                    {
                      $multiply: [
                        { $cos: { $degreesToRadians: '$currentLocation.latitude' } },
                        { $cos: { $degreesToRadians: deliveryAddress.latitude } },
                        { $cos: { $degreesToRadians: { $subtract: [deliveryAddress.longitude, '$currentLocation.longitude'] } } }
                      ]
                    }
                  ]
                }
              }
            ]
          }
        }
      },
      {
        $match: {
          distance: { $lte: this.MAX_SEARCH_RADIUS_KM }
        }
      },
      {
        $lookup: {
          from: 'orders',
          localField: '_id',
          foreignField: 'assignedRider',
          as: 'activeDeliveries'
        }
      },
      {
        $addFields: {
          activeDeliveryCount: {
            $size: {
              $filter: {
                input: '$activeDeliveries',
                cond: { $in: ['$$this.status', [OrderStatus.PAID, OrderStatus.SHIPPED]] }
              }
            }
          }
        }
      },
      {
        $match: {
          activeDeliveryCount: { $lt: this.MAX_ACTIVE_DELIVERIES }
        }
      },
      {
        $sort: { distance: 1 }
      }
    ]);

    return riders;
  }

  /**
   * Score and rank riders based on multiple factors
   */
  private async scoreAndRankRiders(
    riders: any[],
    criteria: RiderAssignmentCriteria
  ): Promise<RiderScore[]> {
    const scoredRiders: RiderScore[] = [];

    for (const rider of riders) {
      const score = this.calculateRiderScore(rider, criteria);
      
      if (score.score >= 60) { // Minimum score threshold
        scoredRiders.push(score);
      }
    }

    // Sort by score (highest first)
    return scoredRiders.sort((a, b) => b.score - a.score);
  }

  /**
   * Calculate rider score based on multiple factors
   */
  private calculateRiderScore(rider: any, criteria: RiderAssignmentCriteria): RiderScore {
    const factors = {
      distanceScore: this.calculateDistanceScore(rider.distance),
      ratingScore: this.calculateRatingScore(rider.deliveryStats?.averageRating || 0),
      experienceScore: this.calculateExperienceScore(rider.deliveryStats?.completedDeliveries || 0),
      availabilityScore: this.calculateAvailabilityScore(rider),
      vehicleScore: this.calculateVehicleScore(rider.vehicle?.type, criteria),
    };

    // Weighted average calculation
    const weights = {
      distance: 0.35,    // 35% - proximity is most important
      rating: 0.25,      // 25% - customer satisfaction
      experience: 0.20,  // 20% - delivery experience
      availability: 0.15, // 15% - current availability
      vehicle: 0.05,     // 5% - vehicle suitability
    };

    const totalScore = 
      factors.distanceScore * weights.distance +
      factors.ratingScore * weights.rating +
      factors.experienceScore * weights.experience +
      factors.availabilityScore * weights.availability +
      factors.vehicleScore * weights.vehicle;

    return {
      riderId: rider._id.toString(),
      rider: rider,
      score: Math.round(totalScore),
      distance: rider.distance,
      availability: rider.isAvailable && !rider.isOnDelivery,
      factors,
    };
  }

  /**
   * Calculate distance-based score (closer = higher score)
   */
  private calculateDistanceScore(distance: number): number {
    if (distance <= this.PRIORITY_RADIUS_KM) {
      return 100; // Perfect score for nearby riders
    }
    
    // Linear decay from 100 to 0 over MAX_SEARCH_RADIUS_KM
    return Math.max(0, 100 - ((distance - this.PRIORITY_RADIUS_KM) / 
      (this.MAX_SEARCH_RADIUS_KM - this.PRIORITY_RADIUS_KM)) * 100);
  }

  /**
   * Calculate rating-based score
   */
  private calculateRatingScore(rating: number): number {
    if (rating < this.MIN_RIDER_RATING) {
      return 0; // Below minimum rating
    }
    
    // Scale from min rating to 5 stars
    return ((rating - this.MIN_RIDER_RATING) / (5 - this.MIN_RIDER_RATING)) * 100;
  }

  /**
   * Calculate experience-based score
   */
  private calculateExperienceScore(completedDeliveries: number): number {
    if (completedDeliveries === 0) {
      return 20; // New riders get some chance
    }
    
    // Logarithmic scale for experience
    return Math.min(100, 20 + (Math.log10(completedDeliveries + 1) * 35));
  }

  /**
   * Calculate availability-based score
   */
  private calculateAvailabilityScore(rider: any): number {
    if (!rider.isAvailable || rider.isOnDelivery) {
      return 0;
    }
    
    // Consider current workload
    const activeDeliveries = rider.activeDeliveryCount || 0;
    return Math.max(0, 100 - (activeDeliveries * 33)); // Reduce score by 33% per active delivery
  }

  /**
   * Calculate vehicle suitability score
   */
  private calculateVehicleScore(vehicleType: VehicleType, criteria: RiderAssignmentCriteria): number {
    if (criteria.vehicleRequirement && vehicleType !== criteria.vehicleRequirement) {
      return 0; // Doesn't match requirement
    }
    
    // Score based on order value and vehicle type suitability
    const vehicleScores = {
      [VehicleType.FOOT]: criteria.orderValue <= 5000 ? 80 : 20,
      [VehicleType.BICYCLE]: criteria.orderValue <= 15000 ? 90 : 40,
      [VehicleType.MOTORCYCLE]: criteria.orderValue <= 50000 ? 100 : 80,
      [VehicleType.CAR]: criteria.orderValue <= 100000 ? 95 : 100,
      [VehicleType.VAN]: criteria.orderValue > 50000 ? 100 : 60,
    };
    
    return vehicleScores[vehicleType] || 50;
  }

  /**
   * Perform the actual assignment
   */
  private async performAssignment(orderId: string, riderId: string): Promise<boolean> {
    try {
      // Update order with assigned rider
      const orderUpdate = await this.orderModel.updateOne(
        { _id: new Types.ObjectId(orderId) },
        {
          $set: {
            assignedRider: new Types.ObjectId(riderId),
            riderAssignedAt: new Date(),
          }
        }
      );

      // Update rider availability
      const riderUpdate = await this.riderModel.updateOne(
        { _id: new Types.ObjectId(riderId) },
        {
          $set: {
            isOnDelivery: true,
            lastAssignmentAt: new Date(),
          },
          $inc: {
            'deliveryStats.assignedDeliveries': 1,
          }
        }
      );

      return orderUpdate.modifiedCount > 0 && riderUpdate.modifiedCount > 0;
    } catch (error) {
      this.logger.error(`Failed to perform assignment: ${error.message}`);
      return false;
    }
  }

  /**
   * Calculate estimated delivery time based on distance and vehicle
   */
  private calculateEstimatedDeliveryTime(distance: number, vehicleType: VehicleType): number {
    // Average speeds in km/h
    const vehicleSpeeds = {
      [VehicleType.FOOT]: 5,
      [VehicleType.BICYCLE]: 15,
      [VehicleType.MOTORCYCLE]: 30,
      [VehicleType.CAR]: 25,
      [VehicleType.VAN]: 20,
    };

    const speed = vehicleSpeeds[vehicleType] || 25;
    const travelTimeMinutes = (distance / speed) * 60;
    
    // Add preparation and handover time
    const preparationTime = 15; // 15 minutes
    const handoverTime = 5; // 5 minutes
    
    return Math.ceil(travelTimeMinutes + preparationTime + handoverTime);
  }

  /**
   * Get rider assignment analytics
   */
  async getAssignmentAnalytics(timeframe: 'day' | 'week' | 'month' = 'day') {
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

    const analytics = await this.orderModel.aggregate([
      {
        $match: {
          riderAssignedAt: { $gte: startDate },
          assignedRider: { $exists: true }
        }
      },
      {
        $group: {
          _id: null,
          totalAssignments: { $sum: 1 },
          averageAssignmentTime: { $avg: { $subtract: ['$riderAssignedAt', '$createdAt'] } },
          successfulDeliveries: {
            $sum: { $cond: [{ $eq: ['$status', OrderStatus.DELIVERED] }, 1, 0] }
          }
        }
      }
    ]);

    return analytics[0] || {
      totalAssignments: 0,
      averageAssignmentTime: 0,
      successfulDeliveries: 0
    };
  }

  /**
   * Reassign order if current rider becomes unavailable
   */
  async reassignOrder(orderId: string, reason: string): Promise<AssignmentResult> {
    const order = await this.orderModel.findById(orderId);
    if (!order) {
      return {
        success: false,
        reason: 'Order not found'
      };
    }

    // Release current rider
    if (order.assignedRider) {
      await this.riderModel.updateOne(
        { _id: order.assignedRider },
        {
          $set: { isOnDelivery: false },
          $inc: { 'deliveryStats.reassignedDeliveries': 1 }
        }
      );
    }

    // Clear assignment
    await this.orderModel.updateOne(
      { _id: orderId },
      {
        $unset: { assignedRider: 1, riderAssignedAt: 1 },
        $push: {
          statusHistory: {
            status: order.status,
            timestamp: new Date(),
            reason: `Reassignment: ${reason}`,
            updatedBy: 'system'
          }
        }
      }
    );

    // Try to assign new rider
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
      urgency: 'high', // Reassignments are high priority
    };

    return this.assignRider(criteria);
  }
}
