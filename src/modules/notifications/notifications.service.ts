import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';
import { User, UserDocument } from '../users/entities/user.entity';
import { 
  Notification, 
  NotificationDocument, 
  NotificationType,
  NotificationChannel
} from '../notifications/entities/notification.entity';
import { NotificationDto } from './dto/notification.dto';
import { EmailNotificationDto } from './dto/email-notification.dto';
import { PushNotificationDto } from './dto/push-notification.dto';
import { WhatsAppNotificationDto } from './dto/whatsapp-notification.dto';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly emailTransporter: nodemailer.Transporter;
  private readonly firebaseAdmin: any; // Type will be added when firebase-admin is properly integrated
  private readonly whatsappClient: any; // Type will be added when WhatsApp client is properly integrated

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Notification.name) private notificationModel: Model<NotificationDocument>,
    private configService: ConfigService,
  ) {
    // Initialize email transporter
    this.emailTransporter = nodemailer.createTransport({
      host: this.configService.get<string>('EMAIL_HOST'),
      port: this.configService.get<number>('EMAIL_PORT'),
      secure: this.configService.get<boolean>('EMAIL_SECURE'),
      auth: {
        user: this.configService.get<string>('EMAIL_USER'),
        pass: this.configService.get<string>('EMAIL_PASSWORD'),
      },
    });

    // Initialize Firebase for push notifications (commented out until firebase-admin is installed)
    /*
    const firebaseAdmin = require('firebase-admin');
    const serviceAccount = require(this.configService.get<string>('FIREBASE_SERVICE_ACCOUNT_PATH'));
    
    this.firebaseAdmin = firebaseAdmin.initializeApp({
      credential: firebaseAdmin.credential.cert(serviceAccount),
    });
    */

    // Initialize WhatsApp client (commented out until proper WhatsApp client is installed)
    /*
    const twilio = require('twilio');
    this.whatsappClient = twilio(
      this.configService.get<string>('TWILIO_ACCOUNT_SID'),
      this.configService.get<string>('TWILIO_AUTH_TOKEN')
    );
    */
  }

  /**
   * Send email notification
   */
  async sendEmail(notification: EmailNotificationDto): Promise<boolean> {
    try {
      const mailOptions = {
        from: this.configService.get<string>('EMAIL_FROM'),
        to: notification.recipientEmail,
        cc: notification.cc,
        bcc: notification.bcc,
        subject: notification.title,
        text: notification.message,
        html: this.generateEmailHtml(notification),
        attachments: notification.attachments || [],
      };

      const info = await this.emailTransporter.sendMail(mailOptions);
      this.logger.log(`Email sent: ${info.messageId}`);
      
      // Save notification to database if needed
      await this.saveNotificationRecord(
        {
          type: notification.type,
          title: notification.title,
          message: notification.message,
          recipientId: notification.recipientId,
          metadata: {
            ...notification.metadata,
            emailId: info.messageId,
            recipientEmail: notification.recipientEmail,
          },
        },
        NotificationChannel.EMAIL,
        true
      );
      
      return true;
    } catch (error) {
      this.logger.error(`Failed to send email: ${error.message}`, error.stack);
      return false;
    }
  }

  /**
   * Send push notification
   */
  async sendPushNotification(notification: PushNotificationDto): Promise<boolean> {
    // Check if Firebase is initialized
    if (!this.firebaseAdmin) {
      this.logger.warn('Firebase admin is not initialized. Cannot send push notification.');
      return false;
    }

    try {
      const message = {
        token: notification.deviceToken,
        notification: {
          title: notification.title,
          body: notification.message,
          imageUrl: notification.image,
        },
        data: notification.data || {},
        android: notification.android || {},
        apns: notification.ios ? {
          payload: {
            aps: {
              badge: notification.ios.badge,
              sound: notification.ios.sound,
              'content-available': 1,
            },
          },
        } : undefined,
      };

      const response = await this.firebaseAdmin.messaging().send(message);
      this.logger.log(`Push notification sent: ${response}`);
      
      // Save notification to database if needed
      await this.saveNotificationRecord(
        {
          type: notification.type,
          title: notification.title,
          message: notification.message,
          recipientId: notification.recipientId,
          metadata: {
            ...notification.metadata,
            deviceToken: notification.deviceToken,
            firebaseResponse: response,
          },
        },
        NotificationChannel.PUSH,
        true
      );
      
      return true;
    } catch (error) {
      this.logger.error(`Failed to send push notification: ${error.message}`, error.stack);
      return false;
    }
  }

  /**
   * Send WhatsApp notification
   */
  async sendWhatsAppMessage(notification: WhatsAppNotificationDto): Promise<boolean> {
    // Check if WhatsApp client is initialized
    if (!this.whatsappClient) {
      this.logger.warn('WhatsApp client is not initialized. Cannot send WhatsApp message.');
      return false;
    }

    try {
      let messageContent = notification.message;
      
      // Use template if provided
      if (notification.templateName && notification.templateParams) {
        messageContent = this.applyWhatsAppTemplate(
          notification.templateName, 
          notification.templateParams
        );
      }
      
      const whatsappNumber = `whatsapp:${notification.phoneNumber}`;
      const fromNumber = `whatsapp:${this.configService.get<string>('WHATSAPP_FROM_NUMBER')}`;
      
      const messageOptions: any = {
        body: messageContent,
        from: fromNumber,
        to: whatsappNumber,
      };
      
      // Add media if provided
      if (notification.mediaUrl) {
        messageOptions.mediaUrl = [notification.mediaUrl];
      }
      
      const message = await this.whatsappClient.messages.create(messageOptions);
      this.logger.log(`WhatsApp message sent: ${message.sid}`);
      
      // Save notification to database if needed
      await this.saveNotificationRecord(
        {
          type: notification.type,
          title: notification.title,
          message: notification.message,
          recipientId: notification.recipientId,
          metadata: {
            ...notification.metadata,
            phoneNumber: notification.phoneNumber,
            whatsappMessageSid: message.sid,
          },
        },
        NotificationChannel.WHATSAPP,
        true
      );
      
      return true;
    } catch (error) {
      this.logger.error(`Failed to send WhatsApp message: ${error.message}`, error.stack);
      return false;
    }
  }

  /**
   * Trigger notifications for order updates
   */
  async notifyOrderUpdate(
    userId: string, 
    orderId: string, 
    status: string,
    additionalInfo?: Record<string, any>
  ): Promise<void> {
    try {
      const user = await this.userModel.findById(userId);
      if (!user) {
        this.logger.warn(`Cannot send order update notification: User ${userId} not found`);
        return;
      }

      const title = `Order Status Update`;
      const message = `Your order #${orderId} status has been updated to: ${status}`;
      
      // Send email notification
      if (user.email) {
        await this.sendEmail({
          type: NotificationType.ORDER_UPDATE,
          title,
          message,
          recipientEmail: user.email,
          recipientId: userId,
          metadata: {
            orderId,
            status,
            ...additionalInfo,
          },
        });
      }
      
      // Send push notification if device token is available
      if (user['deviceToken']) {
        await this.sendPushNotification({
          type: NotificationType.ORDER_UPDATE,
          title,
          message,
          deviceToken: user['deviceToken'],
          recipientId: userId,
          data: {
            orderId,
            status,
            type: 'ORDER_UPDATE',
            ...additionalInfo,
          },
        });
      }
      
      // Send WhatsApp notification if phone is available and feature is enabled
      if (user.phone && this.configService.get<boolean>('ENABLE_WHATSAPP_NOTIFICATIONS')) {
        await this.sendWhatsAppMessage({
          type: NotificationType.ORDER_UPDATE,
          title,
          message,
          phoneNumber: user.phone,
          recipientId: userId,
          templateName: 'order_update',
          templateParams: [orderId, status],
        });
      }
    } catch (error) {
      this.logger.error(`Failed to send order update notifications: ${error.message}`, error.stack);
    }
  }

  /**
   * Trigger notifications for late payments
   */
  async notifyLatePayment(
    userId: string, 
    subscriptionId: string, 
    daysLate: number,
    amountDue: number,
    currency: string = 'foodMoney'
  ): Promise<void> {
    try {
      const user = await this.userModel.findById(userId);
      if (!user) {
        this.logger.warn(`Cannot send late payment notification: User ${userId} not found`);
        return;
      }

      const title = `Payment Reminder`;
      const message = `Your payment for subscription #${subscriptionId} is ${daysLate} day(s) late. Amount due: ${amountDue} ${currency}`;
      
      // Send email notification
      if (user.email) {
        await this.sendEmail({
          type: NotificationType.PAYMENT_REMINDER,
          title,
          message,
          recipientEmail: user.email,
          recipientId: userId,
          metadata: {
            subscriptionId,
            daysLate,
            amountDue,
            currency,
          },
        });
      }
      
      // Send push notification
      if (user['deviceToken']) {
        await this.sendPushNotification({
          type: NotificationType.PAYMENT_REMINDER,
          title,
          message,
          deviceToken: user['deviceToken'],
          recipientId: userId,
          data: {
            subscriptionId,
            daysLate,
            amountDue,
            currency,
            type: 'PAYMENT_REMINDER',
          },
        });
      }
      
      // Send WhatsApp notification (higher priority for payment reminders)
      if (user.phone) {
        await this.sendWhatsAppMessage({
          type: NotificationType.PAYMENT_REMINDER,
          title,
          message,
          phoneNumber: user.phone,
          recipientId: userId,
          templateName: 'payment_reminder',
          templateParams: [subscriptionId, daysLate.toString(), amountDue.toString(), currency],
        });
      }
    } catch (error) {
      this.logger.error(`Failed to send late payment notifications: ${error.message}`, error.stack);
    }
  }

  /**
   * Trigger notifications for auction events
   */
  async notifyAuctionEvent(
    userId: string, 
    auctionId: string, 
    eventType: 'start' | 'bid' | 'outbid' | 'ending_soon' | 'won' | 'lost' | 'cancelled',
    additionalInfo?: Record<string, any>
  ): Promise<void> {
    try {
      const user = await this.userModel.findById(userId);
      if (!user) {
        this.logger.warn(`Cannot send auction event notification: User ${userId} not found`);
        return;
      }

      // Prepare notification content based on event type
      let title = 'Auction Update';
      let message = '';

      switch (eventType) {
        case 'start':
          title = 'New Auction Started';
          message = `A new auction #${auctionId} has started. Don't miss your chance to bid!`;
          break;
        case 'bid':
          title = 'Bid Placed Successfully';
          message = `Your bid on auction #${auctionId} has been placed successfully.`;
          break;
        case 'outbid':
          title = 'You\'ve Been Outbid';
          message = `Someone has placed a higher bid on auction #${auctionId}. Place a new bid to stay in the game!`;
          break;
        case 'ending_soon':
          title = 'Auction Ending Soon';
          message = `Auction #${auctionId} is ending soon. Last chance to place your bid!`;
          break;
        case 'won':
          title = 'Congratulations! You Won';
          message = `You've won the auction #${auctionId}. Check your account for details.`;
          break;
        case 'lost':
          title = 'Auction Ended';
          message = `The auction #${auctionId} has ended. Unfortunately, you didn't win this time. Your foodPoints have been refunded (minus fees).`;
          break;
        case 'cancelled':
          title = 'Auction Cancelled';
          message = `Auction #${auctionId} has been cancelled. Your foodPoints have been refunded.`;
          break;
      }
      
      // Send email notification
      if (user.email) {
        await this.sendEmail({
          type: NotificationType.AUCTION_EVENT,
          title,
          message,
          recipientEmail: user.email,
          recipientId: userId,
          metadata: {
            auctionId,
            eventType,
            ...additionalInfo,
          },
        });
      }
      
      // Send push notification (high priority for outbid and ending_soon)
      if (user['deviceToken']) {
        await this.sendPushNotification({
          type: NotificationType.AUCTION_EVENT,
          title,
          message,
          deviceToken: user['deviceToken'],
          recipientId: userId,
          data: {
            auctionId,
            eventType,
            type: 'AUCTION_EVENT',
            ...additionalInfo,
          },
          android: {
            priority: ['outbid', 'ending_soon', 'won'].includes(eventType) ? 'high' : 'normal',
          },
        });
      }
      
      // Send WhatsApp notification for critical events only
      if (user.phone && ['outbid', 'won', 'lost'].includes(eventType)) {
        await this.sendWhatsAppMessage({
          type: NotificationType.AUCTION_EVENT,
          title,
          message,
          phoneNumber: user.phone,
          recipientId: userId,
          templateName: `auction_${eventType}`,
          templateParams: [auctionId],
        });
      }
    } catch (error) {
      this.logger.error(`Failed to send auction event notifications: ${error.message}`, error.stack);
    }
  }

  /**
   * Trigger notifications for rider assignments
   */
  async notifyRiderAssignment(
    riderId: string,
    orderId: string,
    expiryTime: Date,
    deliveryDetails: Record<string, any>
  ): Promise<void> {
    try {
      const rider = await this.userModel.findById(riderId);
      if (!rider) {
        this.logger.warn(`Cannot send rider assignment notification: Rider ${riderId} not found`);
        return;
      }

      const expiryMinutes = Math.round((expiryTime.getTime() - new Date().getTime()) / 60000);
      
      const title = 'New Delivery Assignment';
      const message = `You have a new delivery assignment for order #${orderId}. Please accept or decline within ${expiryMinutes} minutes.`;
      
      // Send push notification (highest priority)
      if (rider['deviceToken']) {
        await this.sendPushNotification({
          type: NotificationType.RIDER_ASSIGNMENT,
          title,
          message,
          deviceToken: rider['deviceToken'],
          recipientId: riderId,
          data: {
            orderId,
            expiryTime: expiryTime.toISOString(),
            type: 'RIDER_ASSIGNMENT',
            ...deliveryDetails,
          },
          android: {
            priority: 'high',
          },
        });
      }
      
      // Send WhatsApp notification (important for immediate action)
      if (rider.phone) {
        await this.sendWhatsAppMessage({
          type: NotificationType.RIDER_ASSIGNMENT,
          title,
          message,
          phoneNumber: rider.phone,
          recipientId: riderId,
          templateName: 'rider_assignment',
          templateParams: [orderId, expiryMinutes.toString()],
        });
      }
      
      // Send email notification (lower priority for riders)
      if (rider.email) {
        await this.sendEmail({
          type: NotificationType.RIDER_ASSIGNMENT,
          title,
          message,
          recipientEmail: rider.email,
          recipientId: riderId,
          metadata: {
            orderId,
            expiryTime: expiryTime.toISOString(),
            ...deliveryDetails,
          },
        });
      }
    } catch (error) {
      this.logger.error(`Failed to send rider assignment notifications: ${error.message}`, error.stack);
    }
  }

  /**
   * Helper method to save notification record to database
   */
  private async saveNotificationRecord(
    notification: {
      type: NotificationType;
      title: string;
      message: string;
      recipientId?: string;
      metadata?: Record<string, any>;
    },
    channel: NotificationChannel,
    success: boolean = true,
    errorMessage?: string
  ): Promise<void> {
    try {
      if (!notification.recipientId) {
        this.logger.warn('Cannot save notification record: Missing recipientId');
        return;
      }

      const notificationRecord = new this.notificationModel({
        recipientId: new Types.ObjectId(notification.recipientId),
        title: notification.title,
        message: notification.message,
        type: notification.type,
        channel: channel,
        read: false,
        metadata: notification.metadata || {},
        success: success,
        errorMessage: errorMessage
      });

      await notificationRecord.save();
      this.logger.debug(`Notification saved: ${notificationRecord._id}`);
    } catch (error) {
      this.logger.error(`Failed to save notification record: ${error.message}`, error.stack);
    }
  }

  /**
   * Helper method to generate HTML email content
   */
  private generateEmailHtml(notification: EmailNotificationDto): string {
    // This method could be expanded to use templates, for now just a simple HTML structure
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          .container {
            font-family: Arial, sans-serif;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            border: 1px solid #eee;
            border-radius: 5px;
          }
          .header {
            background-color: #f8f9fa;
            padding: 10px;
            text-align: center;
            border-bottom: 1px solid #eee;
          }
          .footer {
            background-color: #f8f9fa;
            padding: 10px;
            text-align: center;
            font-size: 12px;
            color: #666;
            border-top: 1px solid #eee;
            margin-top: 20px;
          }
          .content {
            padding: 20px;
            line-height: 1.5;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>${notification.title}</h2>
          </div>
          <div class="content">
            ${notification.message}
          </div>
          <div class="footer">
            &copy; ${new Date().getFullYear()} Forage Stores. All rights reserved.
            <p>This is an automated message, please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Send price lock expiry notification
   */
  async sendPriceLockExpiryNotification(
    recipientEmail: string,
    recipientId: string,
    metadata: { productName: string; orderNumber: string; expiryDate: string }
  ): Promise<boolean> {
    return this.sendEmail({
      recipientEmail,
      type: NotificationType.ORDER_UPDATE,
      title: `Price Lock Expiring Soon - ${metadata.productName}`,
      message: `
        Hello,
        
        Your price lock for ${metadata.productName} (Order: ${metadata.orderNumber}) will expire on ${metadata.expiryDate}.
        
        Please complete your payment to secure your order at the locked price.
        
        Thank you,
        Forage Stores Team
      `,
      recipientId,
      metadata
    });
  }

  /**
   * Send payment reminder notification
   */
  async sendPaymentReminder(
    recipientEmail: string,
    recipientId: string,
    metadata: { subscriptionName: string; dueDate: string; amount: number }
  ): Promise<boolean> {
    return this.sendEmail({
      recipientEmail,
      type: NotificationType.PAYMENT_REMINDER,
      title: `Payment Reminder - ${metadata.subscriptionName}`,
      message: `
        Hello,
        
        This is a reminder that your payment for ${metadata.subscriptionName} is due on ${metadata.dueDate}.
        
        Amount due: ₦${metadata.amount.toFixed(2)}
        
        Please make your payment to avoid any service interruption.
        
        Thank you,
        Forage Stores Team
      `,
      recipientId,
      metadata
    });
  }

  /**
   * Send drop reminder notification
   */
  async sendDropReminder(
    recipientEmail: string,
    recipientId: string,
    metadata: { subscriptionName: string; dropDate: string; products: string }
  ): Promise<boolean> {
    return this.sendEmail({
      recipientEmail,
      type: NotificationType.DELIVERY_UPDATE,
      title: `Upcoming Delivery - ${metadata.subscriptionName}`,
      message: `
        Hello,
        
        Your scheduled delivery for ${metadata.subscriptionName} is coming up on ${metadata.dropDate}.
        
        Items to be delivered: ${metadata.products}
        
        Please ensure someone is available to receive the delivery.
        
        Thank you,
        Forage Stores Team
      `,
      recipientId,
      metadata
    });
  }
  
  /**
   * Helper method to apply WhatsApp template
   */
  private applyWhatsAppTemplate(templateName: string, params: string[]): string {
    // This is a placeholder for template processing
    // In a real implementation, you might load templates from a database or files
    const templates: Record<string, string> = {
      'order_update': 'Your order #{{0}} status has been updated to: {{1}}',
      'payment_reminder': 'PAYMENT REMINDER: Your payment for subscription #{{0}} is {{1}} day(s) late. Amount due: {{2}} {{3}}',
      'auction_outbid': 'Someone placed a higher bid on auction #{{0}}. Act now to stay in the game!',
      'auction_won': 'Congratulations! You\'ve won auction #{{0}}.',
      'auction_lost': 'Auction #{{0}} has ended. Your foodPoints have been refunded (minus fees).',
      'rider_assignment': 'NEW DELIVERY: You have a new delivery assignment for order #{{0}}. Please accept/decline within {{1}} minutes.',
    };
    
    let template = templates[templateName] || '{{message}}';
    
    // Replace placeholders with parameters
    params.forEach((param, index) => {
      template = template.replace(new RegExp(`\\{\\{${index}\\}\\}`, 'g'), param);
    });
    
    return template;
  }
}
