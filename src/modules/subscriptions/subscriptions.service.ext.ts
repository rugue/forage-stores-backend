import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { 
  Subscription, 
  SubscriptionDocument, 
  SubscriptionStatus 
} from '../subscriptions/entities/subscription.entity';
import { Order, OrderDocument, PaymentPlan, PaymentStatus, OrderStatus } from '../orders/entities/order.entity';
import { User, UserDocument } from '../users/entities/user.entity';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);

  constructor(
    @InjectModel(Subscription.name) private subscriptionModel: Model<SubscriptionDocument>,
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Send reminders for pay later orders that are due soon
   * @returns Number of reminders sent
   */
  async sendPayLaterReminders(): Promise<number> {
    // Get orders with PAY_LATER plan where next payment is within 3 days
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    
    const today = new Date();
    
    const orders = await this.orderModel.find({
      paymentPlan: PaymentPlan.PAY_LATER,
      status: { $in: [OrderStatus.PENDING, OrderStatus.PAID] },
      'paymentSchedule.nextPaymentDate': {
        $gte: today,
        $lte: threeDaysFromNow
      }
    }).populate('userId').exec();

    let reminderCount = 0;
    
    for (const order of orders) {
      try {
        // Get remaining amount
        const paidAmount = order.paymentHistory.reduce(
          (sum, payment) => sum + payment.amount, 0
        );
        const remainingAmount = order.totalAmount - paidAmount;
        
        // Send notification
        await this.notificationsService.sendPaymentReminder(
          (order.userId as any).email,
          order.userId.toString(),
          {
            subscriptionName: `Order ${order._id}`,
            dueDate: order.paymentSchedule?.nextPaymentDate?.toDateString() || 'TBD',
            amount: remainingAmount,
          }
        );
        
        reminderCount++;
      } catch (error) {
        this.logger.error(`Failed to send pay later reminder for order ${order._id}:`, error);
      }
    }
    
    return reminderCount;
  }

  /**
   * Send reminders for upcoming subscription drops
   * @returns Number of reminders sent
   */
  async sendDropReminders(): Promise<number> {
    // Get active subscriptions with drops scheduled within the next 2 days
    const twoDaysFromNow = new Date();
    twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);
    
    const today = new Date();
    
    const subscriptions = await this.subscriptionModel.find({
      status: SubscriptionStatus.ACTIVE,
      'dropSchedule.nextDropDate': {
        $gte: today,
        $lte: twoDaysFromNow
      }
    }).populate('userId').exec();

    let reminderCount = 0;
    
    for (const subscription of subscriptions) {
      try {
        const nextDrop = subscription.dropSchedule.find(drop => 
          drop.nextDropDate >= today && drop.nextDropDate <= twoDaysFromNow
        );
        
        if (nextDrop) {
          // Send notification
          await this.notificationsService.sendDropReminder(
            (subscription.userId as any).email,
            subscription.userId.toString(),
            {
              subscriptionName: subscription.name || 'Your subscription',
              dropDate: nextDrop.nextDropDate?.toDateString() || 'TBD',
              products: nextDrop.products?.map(p => (p as any).name).join(', ') || 'Products',
            }
          );
          
          reminderCount++;
        }
      } catch (error) {
        this.logger.error(`Failed to send drop reminder for subscription ${subscription._id}:`, error);
      }
    }
    
    return reminderCount;
  }
}
