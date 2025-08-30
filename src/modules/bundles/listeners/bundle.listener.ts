import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Bundle, BundleDocument } from '../entities/bundle.entity';
import { BundleOrder, BundleOrderDocument } from '../entities/bundle-order.entity';
import { Notification, NotificationDocument, NotificationType } from '../../notifications/entities/notification.entity';
import { NotificationsService } from '../../notifications/notifications.service';

export interface BundleCreatedEvent {
  bundleId: string;
  bundleType: string;
  adminId: string;
}

export interface BundleOrderedEvent {
  bundleOrderId: string;
  bundleId: string;
  userId: string;
  quantity: number;
  totalAmount: number;
  isGift: boolean;
}

export interface BundleSeasonalControlledEvent {
  seasonalType: string;
  year: number;
  activate: boolean;
  bundleCount: number;
  adminId: string;
}

@Injectable()
export class BundleEventListener {
  private readonly logger = new Logger(BundleEventListener.name);

  constructor(
    @InjectModel(Bundle.name) private bundleModel: Model<BundleDocument>,
    @InjectModel(BundleOrder.name) private bundleOrderModel: Model<BundleOrderDocument>,
    @InjectModel(Notification.name) private notificationModel: Model<NotificationDocument>,
    private notificationsService: NotificationsService,
  ) {}

  @OnEvent('bundle.created')
  async handleBundleCreated(event: BundleCreatedEvent) {
    this.logger.log(`Bundle created: ${event.bundleId} of type ${event.bundleType} by admin ${event.adminId}`);

    try {
      await this.notificationModel.create({
        title: 'New Bundle Created',
        message: `A new ${event.bundleType} bundle has been created and is ready for review.`,
        type: NotificationType.GENERAL,
        recipientId: event.adminId,
        metadata: {
          bundleId: event.bundleId,
          bundleType: event.bundleType,
          action: 'bundle_created',
        },
      });
    } catch (error) {
      this.logger.error('Failed to send bundle creation notification:', error);
    }
  }

  @OnEvent('bundle.ordered')
  async handleBundleOrdered(event: BundleOrderedEvent) {
    this.logger.log(`Bundle ordered: ${event.bundleOrderId} by user ${event.userId}`);

    try {
      const [bundleOrder, bundle] = await Promise.all([
        this.bundleOrderModel.findById(event.bundleOrderId).populate('userId', 'name email'),
        this.bundleModel.findById(event.bundleId),
      ]);

      if (!bundleOrder || !bundle) {
        return;
      }

      const user = bundleOrder.userId as any;
      await this.notificationsService.sendEmail({
        type: NotificationType.ORDER_UPDATE,
        title: 'Bundle Order Confirmation',
        message: `Your ${bundle.name} bundle order has been confirmed. Order #${bundleOrder.orderNumber}`,
        recipientId: event.userId,
        recipientEmail: user.email,
        metadata: {
          bundleOrderId: event.bundleOrderId,
          bundleName: bundle.name,
          quantity: event.quantity,
          totalAmount: event.totalAmount,
          isGift: event.isGift,
        },
      });

      if (event.isGift && bundleOrder.recipientInfo?.email) {
        await this.notificationsService.sendEmail({
          type: NotificationType.GENERAL,
          title: 'Someone Sent You a Gift!',
          message: `You have a gift bundle "${bundle.name}" on the way!`,
          recipientEmail: bundleOrder.recipientInfo.email,
          metadata: {
            bundleName: bundle.name,
            isGiftNotification: true,
          },
        });
      }
    } catch (error) {
      this.logger.error('Failed to process bundle order event:', error);
    }
  }

  @OnEvent('bundle.seasonal.controlled')
  async handleSeasonalControlled(event: BundleSeasonalControlledEvent) {
    this.logger.log(
      `Seasonal bundles ${event.activate ? 'activated' : 'deactivated'}: ${event.seasonalType} for year ${event.year}`
    );

    try {
      await this.notificationModel.create({
        title: `Seasonal Bundles ${event.activate ? 'Activated' : 'Deactivated'}`,
        message: `${event.bundleCount} ${event.seasonalType} bundles have been ${event.activate ? 'activated' : 'deactivated'} for year ${event.year}.`,
        type: NotificationType.GENERAL,
        recipientId: event.adminId,
        metadata: {
          seasonalType: event.seasonalType,
          year: event.year,
          activate: event.activate,
          bundleCount: event.bundleCount,
          action: 'seasonal_control',
        },
      });
    } catch (error) {
      this.logger.error('Failed to send seasonal control notification:', error);
    }
  }
}