import { Controller, Get, Query, Res, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Response } from 'express';
import { AuthService } from '../auth/auth.service';
import { Public } from '../auth/decorators';

@ApiTags('web')
@Controller('web')
export class WebController {
  constructor(private readonly authService: AuthService) {}

  @Get('verify-email')
  @Public()
  @ApiOperation({ summary: 'Web-based email verification' })
  @ApiResponse({ status: 200, description: 'Email verified successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  async verifyEmailWeb(
    @Query('token') token: string,
    @Res() res: Response,
  ) {
    try {
      if (!token) {
        return res.status(HttpStatus.BAD_REQUEST).send(`
          <html>
            <head><title>Forage Stores - Email Verification</title></head>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px;">
              <div style="text-align: center; color: #f44336;">
                <h2>❌ Verification Failed</h2>
                <p>Invalid verification link. Please check your email for the correct link.</p>
              </div>
            </body>
          </html>
        `);
      }

      await this.authService.verifyEmail({ token });

      return res.status(HttpStatus.OK).send(`
        <html>
          <head><title>Forage Stores - Email Verified</title></head>
          <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px;">
            <div style="text-align: center; color: #4CAF50;">
              <h2>✅ Email Verified Successfully!</h2>
              <p>Your Forage Stores account has been activated.</p>
              <p>You can now log in to your account and start shopping!</p>
              <div style="margin: 30px 0;">
                <a href="https://forage-stores-backend.onrender.com/api" 
                   style="background-color: #4CAF50; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                  View API Documentation
                </a>
              </div>
              <p style="font-size: 14px; color: #666;">
                If you're using the mobile app, you can now return to the app and log in.
              </p>
            </div>
          </body>
        </html>
      `);
    } catch (error) {
      return res.status(HttpStatus.BAD_REQUEST).send(`
        <html>
          <head><title>Forage Stores - Email Verification</title></head>
          <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px;">
            <div style="text-align: center; color: #f44336;">
              <h2>❌ Verification Failed</h2>
              <p>${error.message || 'Invalid or expired verification token.'}</p>
              <p>Please try registering again or contact support.</p>
            </div>
          </body>
        </html>
      `);
    }
  }

  @Get('reset-password')
  @Public()
  @ApiOperation({ summary: 'Web-based password reset' })
  async resetPasswordWeb(
    @Query('token') token: string,
    @Res() res: Response,
  ) {
    if (!token) {
      return res.status(HttpStatus.BAD_REQUEST).send(`
        <html>
          <head><title>Forage Stores - Password Reset</title></head>
          <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px;">
            <div style="text-align: center; color: #f44336;">
              <h2>❌ Invalid Reset Link</h2>
              <p>This password reset link is invalid. Please request a new one.</p>
            </div>
          </body>
        </html>
      `);
    }

    return res.status(HttpStatus.OK).send(`
      <html>
        <head><title>Forage Stores - Reset Password</title></head>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px;">
          <div style="text-align: center;">
            <h2>🔒 Reset Your Password</h2>
            <form action="/api/auth/reset-password" method="POST" style="margin: 30px 0;">
              <input type="hidden" name="token" value="${token}" />
              <div style="margin: 20px 0;">
                <label style="display: block; margin-bottom: 5px;">New Password:</label>
                <input type="password" name="password" required 
                       style="width: 300px; padding: 10px; border: 1px solid #ddd; border-radius: 5px;" />
              </div>
              <div style="margin: 20px 0;">
                <label style="display: block; margin-bottom: 5px;">Confirm Password:</label>
                <input type="password" name="confirmPassword" required 
                       style="width: 300px; padding: 10px; border: 1px solid #ddd; border-radius: 5px;" />
              </div>
              <button type="submit" 
                      style="background-color: #4CAF50; color: white; padding: 15px 30px; border: none; border-radius: 5px; cursor: pointer;">
                Reset Password
              </button>
            </form>
          </div>
        </body>
      </html>
    `);
  }
}
