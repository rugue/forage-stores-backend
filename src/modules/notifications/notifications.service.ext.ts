import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

interface PaymentReminderData {
  orderId: string;
  dueDate: string;
  amount: number;
  orderNumber: string;
}

interface DropReminderData {
  subscriptionId: string;
  dropDate: string;
  products: string;
  subscriptionName: string;
}

interface AuctionWinData {
  auctionId: string;
  productName: string;
  bidAmount: number;
  winTime: string;
}

interface AuctionRefundData {
  auctionId: string;
  productName: string;
  refundAmount: number;
  originalBid: number;
  fee: number;
}

interface PriceLockExpiryData {
  priceLockId: string;
  productName: string;
  lockedPrice: number;
  currentPrice: number;
  expiredAt: string;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private transporter: any;

  constructor(private configService: ConfigService) {
    // Initialize nodemailer transporter
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('EMAIL_HOST'),
      port: this.configService.get('EMAIL_PORT'),
      secure: this.configService.get('EMAIL_SECURE') === 'true',
      auth: {
        user: this.configService.get('EMAIL_USER'),
        pass: this.configService.get('EMAIL_PASSWORD'),
      },
    });
  }

  /**
   * Send a payment reminder for Pay Later orders
   */
  async sendPaymentReminder(email: string, data: PaymentReminderData): Promise<void> {
    const subject = `Payment Reminder for Order #${data.orderNumber}`;
    const text = `
      Hello,
      
      This is a friendly reminder that your payment of $${data.amount.toFixed(2)} for order #${data.orderNumber} is due on ${data.dueDate}.
      
      Please log in to your account to make the payment.
      
      Thank you,
      Forage Stores Team
    `;
    
    await this.sendEmail(email, subject, text);
    this.logger.log(`Sent payment reminder to ${email} for order ${data.orderId}`);
  }

  /**
   * Send a reminder for an upcoming subscription drop
   */
  async sendDropReminder(email: string, data: DropReminderData): Promise<void> {
    const subject = `Your ${data.subscriptionName} Drop is Coming Soon!`;
    const text = `
      Hello,
      
      Great news! Your upcoming subscription drop for ${data.subscriptionName} is scheduled for ${data.dropDate}.
      
      Products in this drop:
      ${data.products}
      
      We'll notify you when your items are ready for delivery.
      
      Thank you,
      Forage Stores Team
    `;
    
    await this.sendEmail(email, subject, text);
    this.logger.log(`Sent drop reminder to ${email} for subscription ${data.subscriptionId}`);
  }

  /**
   * Notify a user they've won an auction
   */
  async sendAuctionWinNotification(email: string, data: AuctionWinData): Promise<void> {
    const subject = `Congratulations! You've Won the Auction for ${data.productName}`;
    const text = `
      Hello,
      
      Congratulations! Your bid of $${data.bidAmount.toFixed(2)} for ${data.productName} was the winning bid.
      
      We'll be in touch shortly with details on how to complete your purchase.
      
      Thank you,
      Forage Stores Team
    `;
    
    await this.sendEmail(email, subject, text);
    this.logger.log(`Sent auction win notification to ${email} for auction ${data.auctionId}`);
  }

  /**
   * Notify a user of their auction bid refund
   */
  async sendAuctionRefundNotification(email: string, data: AuctionRefundData): Promise<void> {
    const subject = `Auction Refund for ${data.productName}`;
    const text = `
      Hello,
      
      We're sorry to inform you that your bid of $${data.originalBid.toFixed(2)} for ${data.productName} was not the winning bid.
      
      A refund of $${data.refundAmount.toFixed(2)} has been credited to your FoodPoints wallet.
      (A processing fee of $${data.fee.toFixed(2)} was applied)
      
      Thank you for participating!
      Forage Stores Team
    `;
    
    await this.sendEmail(email, subject, text);
    this.logger.log(`Sent auction refund notification to ${email} for auction ${data.auctionId}`);
  }

  /**
   * Notify a user that their price lock has expired
   */
  async sendPriceLockExpiryNotification(email: string, data: PriceLockExpiryData): Promise<void> {
    const subject = `Your Price Lock for ${data.productName} Has Expired`;
    const text = `
      Hello,
      
      Your price lock for ${data.productName} at $${data.lockedPrice.toFixed(2)} has expired.
      
      The current price is now $${data.currentPrice.toFixed(2)}.
      
      Thank you,
      Forage Stores Team
    `;
    
    await this.sendEmail(email, subject, text);
    this.logger.log(`Sent price lock expiry notification to ${email} for price lock ${data.priceLockId}`);
  }

  /**
   * Generic method to send emails
   */
  private async sendEmail(to: string, subject: string, text: string): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: this.configService.get('EMAIL_FROM'),
        to,
        subject,
        text,
      });
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}: ${error.message}`, error.stack);
      throw error;
    }
  }
}
