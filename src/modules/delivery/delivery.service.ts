import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Delivery, DeliveryDocument, DeliveryStatus, PaymentStatus } from '../../entities/delivery.entity';
import { Order, OrderDocument, OrderStatus } from '../../entities/order.entity';
import { Rider, RiderDocument, RiderStatus } from '../../entities/rider.entity';
import { User, UserDocument, UserRole } from '../../entities/user.entity';
import { Wallet, WalletDocument } from '../../entities/wallet.entity';
import { RidersService } from './riders.service';
import {
  CreateDeliveryDto,
  AssignRiderDto,
  RiderResponseDto,
  UpdateDeliveryStatusDto,
  ReleasePaymentDto,
  RateDeliveryDto,
  DeliveryFilterDto,
} from './dto';

@Injectable()
export class DeliveryService {
  private readonly logger = new Logger(DeliveryService.name);

  constructor(
    @InjectModel(Delivery.name) private deliveryModel: Model<DeliveryDocument>,
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(Rider.name) private riderModel: Model<RiderDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Wallet.name) private walletModel: Model<WalletDocument>,
    private ridersService: RidersService,
  ) {}

  async create(createDeliveryDto: CreateDeliveryDto): Promise<Delivery> {
    const { orderId, customerId } = createDeliveryDto;

    // Check if order exists
    const order = await this.orderModel.findById(orderId);
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Check if delivery already exists for this order
    const existingDelivery = await this.deliveryModel.findOne({ orderId: new Types.ObjectId(orderId) });
    if (existingDelivery) {
      throw new BadRequestException('Delivery already exists for this order');
    }

    // Check if customer exists
    const customer = await this.userModel.findById(customerId);
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    // Create delivery
    const delivery = new this.deliveryModel({
      ...createDeliveryDto,
      orderId: new Types.ObjectId(orderId),
      customerId: new Types.ObjectId(customerId),
      status: DeliveryStatus.PENDING_ASSIGNMENT,
      paymentStatus: PaymentStatus.PENDING,
      statusHistory: [
        {
          status: DeliveryStatus.PENDING_ASSIGNMENT,
          timestamp: new Date(),
          notes: 'Delivery created',
        },
      ],
      timeLogs: {},
      seenByRider: false,
    });

    return delivery.save();
  }

  async findAll(filterDto: DeliveryFilterDto = {}): Promise<Delivery[]> {
    const {
      status,
      riderId,
      customerId,
      orderId,
      city,
      paymentStatus,
      unassignedOnly,
      pendingAcceptanceOnly,
      pendingPaymentOnly,
    } = filterDto;

    const filter: any = {};

    if (status) {
      filter.status = status;
    }

    if (riderId) {
      filter.riderId = new Types.ObjectId(riderId);
    }

    if (customerId) {
      filter.customerId = new Types.ObjectId(customerId);
    }

    if (orderId) {
      filter.orderId = new Types.ObjectId(orderId);
    }

    if (city) {
      filter['deliveryLocation.city'] = city;
    }

    if (paymentStatus) {
      filter.paymentStatus = paymentStatus;
    }

    if (unassignedOnly) {
      filter.status = DeliveryStatus.PENDING_ASSIGNMENT;
    }

    if (pendingAcceptanceOnly) {
      filter.status = DeliveryStatus.PENDING_ACCEPTANCE;
    }

    if (pendingPaymentOnly) {
      filter.status = DeliveryStatus.COMPLETED;
      filter.paymentStatus = PaymentStatus.PENDING;
    }

    return this.deliveryModel.find(filter).sort({ createdAt: -1 }).exec();
  }

  async findOne(id: string): Promise<Delivery> {
    const delivery = await this.deliveryModel.findById(id);
    if (!delivery) {
      throw new NotFoundException('Delivery not found');
    }
    return delivery;
  }

  async findByOrderId(orderId: string): Promise<Delivery> {
    const delivery = await this.deliveryModel.findOne({ orderId: new Types.ObjectId(orderId) });
    if (!delivery) {
      throw new NotFoundException('Delivery not found for this order');
    }
    return delivery;
  }

  async assignRider(id: string, assignRiderDto: AssignRiderDto): Promise<Delivery> {
    const { riderId } = assignRiderDto;
    
    // Check if delivery exists
    const delivery = await this.deliveryModel.findById(id);
    if (!delivery) {
      throw new NotFoundException('Delivery not found');
    }

    // Check if delivery is in the right state
    if (delivery.status !== DeliveryStatus.PENDING_ASSIGNMENT) {
      throw new BadRequestException(`Cannot assign rider to delivery in ${delivery.status} status`);
    }

    // Check if rider exists
    const rider = await this.riderModel.findById(riderId);
    if (!rider) {
      throw new NotFoundException('Rider not found');
    }

    // Check if rider is active
    if (rider.status !== RiderStatus.ACTIVE) {
      throw new BadRequestException(`Rider is not active (current status: ${rider.status})`);
    }

    // Check if rider is available
    if (rider.isOnDelivery) {
      throw new BadRequestException('Rider is already on a delivery');
    }

    // Check rider's security deposit (>= N70,000)
    if (rider.securityDeposit < 70000) {
      throw new BadRequestException(
        `Rider's security deposit (₦${rider.securityDeposit}) is below the required ₦70,000`
      );
    }

    // Assign rider to delivery
    delivery.riderId = new Types.ObjectId(riderId);
    delivery.status = DeliveryStatus.PENDING_ACCEPTANCE;
    
    // Set expiry time for rider acceptance (3 minutes from now)
    const now = new Date();
    const expiryTime = new Date(now);
    expiryTime.setMinutes(expiryTime.getMinutes() + 3);
    delivery.acceptanceExpiryTime = expiryTime;

    // Add to status history
    delivery.statusHistory.push({
      status: DeliveryStatus.PENDING_ACCEPTANCE,
      timestamp: now,
      notes: `Assigned to rider ${riderId}`,
    });

    // Mark rider as assigned to delivery
    await this.ridersService.setDeliveryStatus(riderId, true);

    // Save and return delivery
    return delivery.save();
  }

  async respondToAssignment(
    id: string, 
    riderId: string, 
    response: RiderResponseDto
  ): Promise<Delivery> {
    // Check if delivery exists
    const delivery = await this.deliveryModel.findById(id);
    if (!delivery) {
      throw new NotFoundException('Delivery not found');
    }

    // Check if delivery is assigned to this rider
    if (!delivery.riderId || delivery.riderId.toString() !== riderId) {
      throw new ForbiddenException('This delivery is not assigned to you');
    }

    // Check if delivery is in the right state
    if (delivery.status !== DeliveryStatus.PENDING_ACCEPTANCE) {
      throw new BadRequestException(`Cannot respond to delivery in ${delivery.status} status`);
    }

    // Check if response is within the 3-minute window
    const now = new Date();
    if (delivery.acceptanceExpiryTime && now > delivery.acceptanceExpiryTime) {
      // Update delivery status to EXPIRED
      delivery.status = DeliveryStatus.EXPIRED;
      delivery.statusHistory.push({
        status: DeliveryStatus.EXPIRED,
        timestamp: now,
        notes: 'Acceptance window expired',
      });

      // Mark rider as available again
      await this.ridersService.setDeliveryStatus(riderId, false);

      await delivery.save();
      throw new BadRequestException('Acceptance window has expired');
    }

    // Mark as seen by rider
    delivery.seenByRider = true;

    // Process response
    if (response.accept) {
      // Rider accepted the delivery
      delivery.status = DeliveryStatus.ACCEPTED;
      delivery.statusHistory.push({
        status: DeliveryStatus.ACCEPTED,
        timestamp: now,
        notes: 'Rider accepted the delivery',
      });

      // Update rider stats (still on delivery)
      await this.ridersService.setDeliveryStatus(riderId, true);
    } else {
      // Rider declined the delivery
      delivery.status = DeliveryStatus.DECLINED;
      delivery.statusHistory.push({
        status: DeliveryStatus.DECLINED,
        timestamp: now,
        notes: `Rider declined: ${response.reason || 'No reason provided'}`,
      });

      // Update rider stats
      await this.ridersService.updateStats(riderId, { rejectedDelivery: true });
      await this.ridersService.setDeliveryStatus(riderId, false);
    }

    // Save and return delivery
    return delivery.save();
  }

  async updateStatus(
    id: string,
    updateStatusDto: UpdateDeliveryStatusDto,
    userId: string,
    userRole: UserRole,
  ): Promise<Delivery> {
    const { status, notes } = updateStatusDto;
    
    // Check if delivery exists
    const delivery = await this.deliveryModel.findById(id);
    if (!delivery) {
      throw new NotFoundException('Delivery not found');
    }

    // Check permissions based on the requested status change
    this.validateStatusChangePermission(delivery, status, userId, userRole);

    // Special handling for COMPLETED status (customer confirmation)
    if (status === DeliveryStatus.COMPLETED) {
      if (delivery.status !== DeliveryStatus.DELIVERED) {
        throw new BadRequestException('Delivery must be in DELIVERED status to be confirmed as COMPLETED');
      }
    }

    // Update delivery status
    delivery.status = status;
    
    // Add to status history
    delivery.statusHistory.push({
      status,
      timestamp: new Date(),
      notes: notes || `Status updated to ${status}`,
      updatedBy: new Types.ObjectId(userId),
    });

    // Special handling for different statuses
    if (status === DeliveryStatus.PICKED_UP || status === DeliveryStatus.IN_TRANSIT) {
      // Update order status to SHIPPED when rider picks up
      await this.orderModel.findByIdAndUpdate(
        delivery.orderId,
        { status: OrderStatus.SHIPPED }
      );
    } 
    else if (status === DeliveryStatus.DELIVERED) {
      // Calculate delivery time in minutes
      if (delivery.timeLogs.pickedUpAt) {
        const deliveryTimeMinutes = 
          (new Date().getTime() - delivery.timeLogs.pickedUpAt.getTime()) / (1000 * 60);
        
        // Update rider stats
        if (delivery.riderId) {
          await this.ridersService.updateStats(
            delivery.riderId.toString(), 
            { deliveryTime: deliveryTimeMinutes }
          );
        }
      }
    }
    else if (status === DeliveryStatus.COMPLETED) {
      // When customer confirms delivery, update order status
      await this.orderModel.findByIdAndUpdate(
        delivery.orderId,
        { status: OrderStatus.DELIVERED }
      );
      
      // Update rider stats for completed delivery
      if (delivery.riderId) {
        await this.ridersService.updateStats(
          delivery.riderId.toString(), 
          { completedDelivery: true }
        );
      }
    }
    else if (status === DeliveryStatus.CANCELLED) {
      // Update rider stats for cancelled delivery
      if (delivery.riderId) {
        await this.ridersService.updateStats(
          delivery.riderId.toString(), 
          { cancelledDelivery: true }
        );
        
        // Mark rider as available again
        await this.ridersService.setDeliveryStatus(delivery.riderId.toString(), false);
      }
    }

    // Save and return delivery
    return delivery.save();
  }

  async releasePayment(
    id: string,
    releasePaymentDto: ReleasePaymentDto,
    userRole: UserRole,
  ): Promise<Delivery> {
    // Only admins can release payments
    if (userRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can release payments to riders');
    }
    
    // Check if delivery exists
    const delivery = await this.deliveryModel.findById(id);
    if (!delivery) {
      throw new NotFoundException('Delivery not found');
    }

    // Check if delivery is completed
    if (delivery.status !== DeliveryStatus.COMPLETED) {
      throw new BadRequestException('Payment can only be released for completed deliveries');
    }

    // Check if payment is still pending
    if (delivery.paymentStatus !== PaymentStatus.PENDING) {
      throw new BadRequestException(`Payment is already ${delivery.paymentStatus}`);
    }

    // Check if rider exists
    if (!delivery.riderId) {
      throw new BadRequestException('No rider assigned to this delivery');
    }

    // Release payment to rider's wallet
    const rider = await this.riderModel.findById(delivery.riderId);
    if (!rider) {
      throw new NotFoundException('Rider not found');
    }

    // Get rider's wallet
    const wallet = await this.walletModel.findOne({ userId: rider.userId });
    if (!wallet) {
      throw new NotFoundException('Wallet not found for rider');
    }

    // Update wallet balance
    wallet.foodMoney += delivery.riderPayment;
    await wallet.save();

    // Update delivery payment status
    delivery.paymentStatus = PaymentStatus.RELEASED;
    delivery.paymentRef = releasePaymentDto.paymentRef || `payment_${Date.now()}`;
    
    // Add to status history
    delivery.statusHistory.push({
      status: delivery.status,
      timestamp: new Date(),
      notes: releasePaymentDto.notes || `Payment of ₦${delivery.riderPayment} released to rider`,
    });

    // Update rider stats with earnings
    await this.ridersService.updateStats(
      delivery.riderId.toString(),
      { earnings: delivery.riderPayment }
    );

    // Save and return delivery
    return delivery.save();
  }

  async rateDelivery(
    id: string,
    rateDeliveryDto: RateDeliveryDto,
    userId: string,
  ): Promise<Delivery> {
    const { rating, feedback } = rateDeliveryDto;
    
    // Check if delivery exists
    const delivery = await this.deliveryModel.findById(id);
    if (!delivery) {
      throw new NotFoundException('Delivery not found');
    }

    // Check if user is the customer for this delivery
    if (delivery.customerId.toString() !== userId) {
      throw new ForbiddenException('Only the customer can rate this delivery');
    }

    // Check if delivery is completed
    if (delivery.status !== DeliveryStatus.COMPLETED && delivery.status !== DeliveryStatus.DELIVERED) {
      throw new BadRequestException('Only completed or delivered deliveries can be rated');
    }

    // Update delivery with rating
    delivery.rating = rating;
    delivery.feedback = feedback;

    // Update rider stats with rating
    if (delivery.riderId) {
      await this.ridersService.updateStats(
        delivery.riderId.toString(),
        { rating }
      );
    }

    // Save and return delivery
    return delivery.save();
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async checkExpiredAssignments() {
    this.logger.log('Checking for expired delivery assignments...');
    
    const now = new Date();
    
    // Find all deliveries in PENDING_ACCEPTANCE state with expired acceptance window
    const expiredDeliveries = await this.deliveryModel.find({
      status: DeliveryStatus.PENDING_ACCEPTANCE,
      acceptanceExpiryTime: { $lt: now },
    });
    
    this.logger.log(`Found ${expiredDeliveries.length} expired delivery assignments`);
    
    // Process each expired delivery
    for (const delivery of expiredDeliveries) {
      try {
        // Update delivery status to EXPIRED
        delivery.status = DeliveryStatus.EXPIRED;
        delivery.statusHistory.push({
          status: DeliveryStatus.EXPIRED,
          timestamp: now,
          notes: 'Acceptance window expired automatically',
        });
        
        // Make rider available again
        if (delivery.riderId) {
          await this.ridersService.setDeliveryStatus(delivery.riderId.toString(), false);
        }
        
        await delivery.save();
        this.logger.log(`Marked delivery ${delivery._id} as EXPIRED`);
      } catch (error) {
        this.logger.error(`Error processing expired delivery ${delivery._id}: ${error.message}`);
      }
    }
  }

  private validateStatusChangePermission(
    delivery: DeliveryDocument,
    newStatus: DeliveryStatus,
    userId: string,
    userRole: UserRole,
  ) {
    // Admins can make any status change
    if (userRole === UserRole.ADMIN) {
      return true;
    }

    // Riders can only update to specific statuses
    if (userRole === UserRole.RIDER) {
      // Check if this is the assigned rider
      if (!delivery.riderId || delivery.riderId.toString() !== userId) {
        throw new ForbiddenException('You are not assigned to this delivery');
      }

      // Allowed status transitions for riders
      const allowedStatusesForRider = [
        DeliveryStatus.PICKED_UP,
        DeliveryStatus.IN_TRANSIT,
        DeliveryStatus.DELIVERED,
      ];

      if (!allowedStatusesForRider.includes(newStatus)) {
        throw new ForbiddenException(`Riders cannot set delivery status to ${newStatus}`);
      }

      return true;
    }

    // Customers can only confirm completion
    if (delivery.customerId.toString() === userId) {
      if (newStatus !== DeliveryStatus.COMPLETED) {
        throw new ForbiddenException('Customers can only confirm delivery completion');
      }
      return true;
    }

    // If we get here, the user doesn't have permission
    throw new ForbiddenException('You do not have permission to update this delivery status');
  }
}
