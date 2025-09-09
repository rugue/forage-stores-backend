import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { User } from '../../users/entities/user.entity';

@Injectable()
export class AuthEmailService {
  private readonly logger = new Logger(AuthEmailService.name);
  private readonly transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('SMTP_HOST', 'smtp.gmail.com'),
      port: this.configService.get('SMTP_PORT', 587),
      secure: false, // true for 465, false for other ports
      auth: {
        user: this.configService.get('SMTP_USER'),
        pass: this.configService.get('SMTP_PASS'),
      },
    });
  }

  async sendEmailVerification(user: User, token: string): Promise<void> {
    const frontendUrl = this.configService.get('FRONTEND_URL', 'http://localhost:3000');
    const verificationUrl = `${frontendUrl}/verify-email?token=${token}`;

    const mailOptions = {
      from: this.configService.get('SMTP_FROM') || this.configService.get('MAIL_FROM') || 'noreply@forage.com',
      to: user.email,
      subject: 'Verify Your Email - Forage Stores',
      html: `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
          <h2 style="color: #2c5aa0;">Welcome to Forage Stores!</h2>
          <p>Hi ${user.name},</p>
          <p>Thank you for registering with Forage Stores. Please verify your email address to activate your account.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" 
               style="background-color: #4CAF50; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Verify Email Address
            </a>
          </div>
          <p>If the button doesn't work, you can also click on this link:</p>
          <p><a href="${verificationUrl}">${verificationUrl}</a></p>
          <p>This verification link will expire in 24 hours.</p>
          <hr style="margin: 30px 0;">
          <p style="font-size: 12px; color: #666;">
            If you didn't create an account with Forage Stores, please ignore this email.
          </p>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Email verification sent to ${user.email}`);
    } catch (error) {
      this.logger.error(`Failed to send email verification to ${user.email}`, error);
      throw new Error('Failed to send verification email');
    }
  }

  async sendPasswordReset(user: User, token: string): Promise<void> {
    const frontendUrl = this.configService.get('FRONTEND_URL', 'http://localhost:3000');
    const resetUrl = `${frontendUrl}/reset-password?token=${token}`;

    const mailOptions = {
      from: this.configService.get('SMTP_FROM', 'noreply@forage.com'),
      to: user.email,
      subject: 'Reset Your Password - Forage Stores',
      html: `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
          <h2 style="color: #2c5aa0;">Password Reset Request</h2>
          <p>Hi ${user.name},</p>
          <p>We received a request to reset your password for your Forage Stores account.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #f44336; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p>If the button doesn't work, you can also click on this link:</p>
          <p><a href="${resetUrl}">${resetUrl}</a></p>
          <p>This reset link will expire in 1 hour for security reasons.</p>
          <hr style="margin: 30px 0;">
          <p style="font-size: 12px; color: #666;">
            If you didn't request a password reset, please ignore this email. Your password will remain unchanged.
          </p>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Password reset email sent to ${user.email}`);
    } catch (error) {
      this.logger.error(`Failed to send password reset email to ${user.email}`, error);
      throw new Error('Failed to send password reset email');
    }
  }

  async sendAccountActivated(user: User): Promise<void> {
    const mailOptions = {
      from: this.configService.get('SMTP_FROM', 'noreply@forage.com'),
      to: user.email,
      subject: 'Account Activated - Welcome to Forage Stores!',
      html: `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
          <h2 style="color: #4CAF50;">Account Activated Successfully!</h2>
          <p>Hi ${user.name},</p>
          <p>Congratulations! Your Forage Stores account has been successfully activated.</p>
          <p>You can now:</p>
          <ul>
            <li>Browse and purchase products</li>
            <li>Use flexible payment options</li>
            <li>Participate in auctions</li>
            <li>Refer friends and earn rewards</li>
          </ul>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${this.configService.get('FRONTEND_URL', 'http://localhost:3000')}" 
               style="background-color: #4CAF50; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Start Shopping
            </a>
          </div>
          <p>Welcome to the Forage family!</p>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Account activation email sent to ${user.email}`);
    } catch (error) {
      this.logger.error(`Failed to send account activation email to ${user.email}`, error);
    }
  }
}
