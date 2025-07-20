import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { 
  Subscription, 
  SubscriptionDocument, 
  SubscriptionStatus,
  DropScheduleItem
} from '../../entities/subscription.entity';
import { 
  Order, 
  OrderDocument, 
  PaymentPlan, 
  PaymentFrequency,
  PaymentMethod, 
  PaymentStatus, 
  OrderStatus,
  PaymentHistory
} from '../../entities/order.entity';
import { Wallet, WalletDocument } from '../../entities/wallet.entity';
import { 
  CreateSubscriptionDto, 
  UpdateSubscriptionDto, 
  ProcessDropDto,
  SubscriptionFilterDto 
} from './dto';
import { UserRole } from '../../entities/user.entity';

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);

  constructor(
    @InjectModel(Subscription.name) private subscriptionModel: Model<SubscriptionDocument>,
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(Wallet.name) private walletModel: Model<WalletDocument>,
  ) {}

  async create(userId: string, createSubscriptionDto: CreateSubscriptionDto): Promise<Subscription> {
    const { orderId, frequency, notes } = createSubscriptionDto;
    
    // Check if order exists and belongs to user
    const order = await this.orderModel.findOne({ 
      _id: orderId, 
      userId: new Types.ObjectId(userId) 
    });
    
    if (!order) {
      throw new NotFoundException('Order not found or does not belong to user');
    }

    // Verify order has an appropriate payment plan for subscription
    if (![PaymentPlan.PAY_SMALL_SMALL, PaymentPlan.PRICE_LOCK].includes(order.paymentPlan)) {
      throw new BadRequestException(
        'Subscriptions can only be created for Pay Small Small or Price Lock payment plans'
      );
    }

    // Check if subscription already exists for this order
    const existingSubscription = await this.subscriptionModel.findOne({ orderId });
    if (existingSubscription) {
      throw new BadRequestException('A subscription already exists for this order');
    }

    // Calculate drops based on payment plan and frequency
    const { dropAmount, totalDrops, dropSchedule } = this.calculateDropSchedule(
      order.finalTotal,
      order.paymentPlan,
      frequency,
      order.paymentHistory?.length ? order.amountPaid : 0
    );

    // Create the subscription
    const subscription = new this.subscriptionModel({
      userId: new Types.ObjectId(userId),
      orderId: new Types.ObjectId(orderId),
      paymentPlan: order.paymentPlan,
      totalAmount: order.finalTotal,
      dropAmount,
      frequency,
      totalDrops,
      dropsPaid: order.paymentHistory?.length || 0,
      amountPaid: order.amountPaid || 0,
      dropSchedule,
      startDate: new Date(),
      notes,
      status: SubscriptionStatus.ACTIVE,
      isCompleted: false,
    });
    
    // Find and set the next drop date
    const nextUnpaidDrop = dropSchedule.find(drop => !drop.isPaid);
    if (nextUnpaidDrop) {
      subscription.nextDropDate = nextUnpaidDrop.scheduledDate;
    }
    
    await subscription.save();
    return subscription;
  }

  async findAll(filterDto: SubscriptionFilterDto) {
    const { userId, orderId, status, paymentPlan, isCompleted } = filterDto;
    const filter: any = {};
    
    if (userId) filter.userId = new Types.ObjectId(userId);
    if (orderId) filter.orderId = new Types.ObjectId(orderId);
    if (status) filter.status = status;
    if (paymentPlan) filter.paymentPlan = paymentPlan;
    if (isCompleted !== undefined) filter.isCompleted = isCompleted;
    
    return this.subscriptionModel.find(filter).sort({ createdAt: -1 }).exec();
  }

  async findAllByUser(userId: string) {
    return this.subscriptionModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOne(id: string) {
    const subscription = await this.subscriptionModel.findById(id);
    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }
    return subscription;
  }

  async update(id: string, userId: string, userRole: UserRole, updateDto: UpdateSubscriptionDto) {
    const subscription = await this.subscriptionModel.findById(id);
    
    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }
    
    // Only the subscription owner or admin can update
    if (subscription.userId.toString() !== userId && userRole !== UserRole.ADMIN) {
      throw new BadRequestException('You do not have permission to update this subscription');
    }
    
    // Handle status change
    if (updateDto.status) {
      // Can't change back to active if completed
      if (subscription.isCompleted && updateDto.status === SubscriptionStatus.ACTIVE) {
        throw new BadRequestException('Cannot reactivate a completed subscription');
      }
      
      // If cancelling, mark end date
      if (updateDto.status === SubscriptionStatus.CANCELLED && 
          subscription.status !== SubscriptionStatus.CANCELLED) {
        subscription.endDate = new Date();
      }
    }
    
    Object.assign(subscription, updateDto);
    await subscription.save();
    
    return subscription;
  }

  async processNextDrop(subscriptionId: string, userId: string, userRole: UserRole, processDto: ProcessDropDto = {}) {
    const subscription = await this.subscriptionModel.findById(subscriptionId);
    
    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }
    
    // Only the subscription owner or admin can process drops
    if (subscription.userId.toString() !== userId && userRole !== UserRole.ADMIN) {
      throw new BadRequestException('You do not have permission to process drops for this subscription');
    }
    
    // Check if subscription is active
    if (subscription.status !== SubscriptionStatus.ACTIVE) {
      throw new BadRequestException(`Cannot process drop for ${subscription.status} subscription`);
    }
    
    // Check if subscription is already completed
    if (subscription.isCompleted) {
      throw new BadRequestException('Subscription is already completed');
    }
    
    // Find the next unpaid drop
    const nextDropIndex = subscription.dropSchedule.findIndex(drop => !drop.isPaid);
    if (nextDropIndex === -1) {
      throw new BadRequestException('No pending drops found');
    }
    
    const dropToProcess = subscription.dropSchedule[nextDropIndex];
    const dropAmount = processDto.amount || dropToProcess.amount;
    
    // Get order and wallet
    const order = await this.orderModel.findById(subscription.orderId);
    if (!order) {
      throw new NotFoundException('Associated order not found');
    }
    
    const wallet = await this.walletModel.findOne({ userId: subscription.userId });
    if (!wallet) {
      throw new NotFoundException('User wallet not found');
    }
    
    // Check if user has enough balance (unless admin is manually marking as paid)
    if (!processDto.markAsPaid && wallet.foodMoney < dropAmount) {
      throw new BadRequestException(`Insufficient wallet balance. Required: ${dropAmount}, Available: ${wallet.foodMoney}`);
    }
    
    // Process the payment
    if (!processDto.markAsPaid) {
      // Deduct from wallet
      wallet.foodMoney -= dropAmount;
      await wallet.save();
    }
    
    // Update drop as paid
    subscription.dropSchedule[nextDropIndex].isPaid = true;
    subscription.dropSchedule[nextDropIndex].paidDate = new Date();
    subscription.dropSchedule[nextDropIndex].transactionRef = processDto.transactionRef || `drop_${Date.now()}`;
    
    // Update subscription statistics
    subscription.dropsPaid += 1;
    subscription.amountPaid += dropAmount;
    
    // Check if this was the last drop
    const isLastDrop = subscription.dropsPaid >= subscription.totalDrops;
    
    // If last drop, mark subscription completed
    if (isLastDrop) {
      subscription.isCompleted = true;
      subscription.status = SubscriptionStatus.COMPLETED;
      subscription.endDate = new Date();
    } else {
      // Find next drop date
      const nextUnpaidDropIndex = subscription.dropSchedule.findIndex(drop => !drop.isPaid);
      if (nextUnpaidDropIndex !== -1) {
        subscription.nextDropDate = subscription.dropSchedule[nextUnpaidDropIndex].scheduledDate;
      }
    }
    
    await subscription.save();
    
    // Update the order with the payment
    const payment: PaymentHistory = {
      amount: dropAmount,
      paymentMethod: PaymentMethod.FOOD_MONEY, // Assuming wallet is used
      status: PaymentStatus.COMPLETED,
      paymentDate: new Date(),
      transactionRef: subscription.dropSchedule[nextDropIndex].transactionRef,
      notes: `Subscription drop ${subscription.dropsPaid}/${subscription.totalDrops}`,
    };
    
    order.paymentHistory.push(payment);
    order.amountPaid += dropAmount;
    order.remainingAmount = Math.max(0, order.finalTotal - order.amountPaid);
    
    // If order is fully paid, update status
    if (order.remainingAmount === 0 && order.status === OrderStatus.PENDING) {
      order.status = OrderStatus.PAID;
    }
    
    await order.save();
    
    return {
      success: true,
      message: isLastDrop 
        ? 'Final drop processed successfully. Subscription completed.' 
        : 'Drop processed successfully',
      subscription,
      processedDrop: subscription.dropSchedule[nextDropIndex],
      nextDropDate: subscription.nextDropDate,
      remainingDrops: subscription.totalDrops - subscription.dropsPaid,
    };
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, {
    name: 'process-automatic-drops'
  })
  async processAutomaticDrops() {
    this.logger.log('Running automatic drops processing');
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Find all active subscriptions with next drop date today
    const dueSubscriptions = await this.subscriptionModel.find({
      status: SubscriptionStatus.ACTIVE,
      isCompleted: false,
      nextDropDate: {
        $gte: today,
        $lt: tomorrow,
      }
    });
    
    this.logger.log(`Found ${dueSubscriptions.length} subscriptions with drops due today`);
    
    // Process each subscription
    for (const subscription of dueSubscriptions) {
      try {
        // Find the user's wallet
        const wallet = await this.walletModel.findOne({ userId: subscription.userId });
        
        if (!wallet) {
          this.logger.error(`Wallet not found for user ${subscription.userId}`);
          continue;
        }
        
        // Find the next unpaid drop
        const nextDropIndex = subscription.dropSchedule.findIndex(drop => !drop.isPaid);
        if (nextDropIndex === -1) {
          this.logger.warn(`No pending drops found for subscription ${subscription._id}`);
          continue;
        }
        
        const dropToProcess = subscription.dropSchedule[nextDropIndex];
        
        // Check if user has enough balance
        if (wallet.foodMoney < dropToProcess.amount) {
          this.logger.warn(`Insufficient balance for subscription ${subscription._id}. Required: ${dropToProcess.amount}, Available: ${wallet.foodMoney}`);
          // Could send notification to user here
          continue;
        }
        
        // Process the drop automatically
        await this.processNextDrop(
          subscription._id.toString(),
          subscription.userId.toString(),
          UserRole.SYSTEM, // System role for automatic processing
          { transactionRef: `auto_drop_${Date.now()}` }
        );
        
        this.logger.log(`Successfully processed automatic drop for subscription ${subscription._id}`);
      } catch (error) {
        this.logger.error(`Error processing drop for subscription ${subscription._id}:`, error.message);
      }
    }
    
    this.logger.log('Completed automatic drops processing');
  }

  private calculateDropSchedule(
    totalAmount: number,
    paymentPlan: PaymentPlan,
    frequency: PaymentFrequency,
    amountAlreadyPaid: number = 0
  ): { dropAmount: number; totalDrops: number; dropSchedule: DropScheduleItem[] } {
    let totalDrops: number;
    let dropAmount: number;
    let intervalDays: number;
    
    // Calculate drops based on payment plan
    if (paymentPlan === PaymentPlan.PAY_SMALL_SMALL) {
      // For Pay Small Small, split into equal payments based on frequency
      switch (frequency) {
        case PaymentFrequency.WEEKLY:
          totalDrops = 8; // 8 weeks = ~2 months
          intervalDays = 7;
          break;
        case PaymentFrequency.BIWEEKLY:
          totalDrops = 4; // 4 biweekly payments = ~2 months
          intervalDays = 14;
          break;
        case PaymentFrequency.MONTHLY:
          totalDrops = 2; // 2 months
          intervalDays = 30;
          break;
        default:
          totalDrops = 4;
          intervalDays = 14;
      }
    } else if (paymentPlan === PaymentPlan.PRICE_LOCK) {
      // For Price Lock, typically 50% upfront, 50% at delivery
      totalDrops = 2;
      intervalDays = 30; // Typically delivered after 30-45 days
    } else {
      throw new BadRequestException('Unsupported payment plan for subscription');
    }
    
    // Calculate drop amount (divide remaining amount by remaining drops)
    const remainingAmount = totalAmount - amountAlreadyPaid;
    const remainingDrops = amountAlreadyPaid > 0 ? totalDrops - 1 : totalDrops;
    dropAmount = Math.ceil(remainingAmount / remainingDrops);
    
    // Create drop schedule
    const dropSchedule: DropScheduleItem[] = [];
    const startDate = new Date();
    let currentDate = new Date(startDate);
    
    // If first payment already made, mark it as paid
    if (amountAlreadyPaid > 0) {
      dropSchedule.push({
        scheduledDate: new Date(currentDate),
        amount: amountAlreadyPaid,
        isPaid: true,
        paidDate: new Date(),
        transactionRef: 'initial_payment',
      });
    }
    
    // Create schedule for remaining drops
    for (let i = amountAlreadyPaid > 0 ? 1 : 0; i < totalDrops; i++) {
      // For remaining drops, increment the date
      if (i > 0 || amountAlreadyPaid > 0) {
        currentDate = new Date(currentDate);
        currentDate.setDate(currentDate.getDate() + intervalDays);
      }
      
      // For the last payment, adjust amount to match total exactly
      const isLastDrop = i === totalDrops - 1;
      const dropAmountForThisDrop = isLastDrop 
        ? remainingAmount - (dropAmount * (remainingDrops - 1))
        : dropAmount;
      
      dropSchedule.push({
        scheduledDate: new Date(currentDate),
        amount: dropAmountForThisDrop,
        isPaid: false,
      });
    }
    
    return { dropAmount, totalDrops, dropSchedule };
  }
}
