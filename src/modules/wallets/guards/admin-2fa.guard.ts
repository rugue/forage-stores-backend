import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  BadRequestException,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument, UserRole } from '../../users/entities/user.entity';

export const ADMIN_2FA_KEY = 'admin2fa';

interface TwoFactorRequest {
  body: {
    adminPassword?: string;
    twoFactorCode?: string;
  };
  user: {
    id: string;
    role: UserRole;
  };
  url: string;
  method: string;
}

@Injectable()
export class AdminTwoFactorGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const require2FA = this.reflector.getAllAndOverride<boolean>(ADMIN_2FA_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!require2FA) {
      return true; // No 2FA required
    }

    const request = context.switchToHttp().getRequest<TwoFactorRequest>();
    
    // Check if user is admin
    if (!request.user || request.user.role !== UserRole.ADMIN) {
      throw new UnauthorizedException('Admin access required');
    }

    // Get admin user details
    const admin = await this.userModel.findById(request.user.id);
    if (!admin) {
      throw new UnauthorizedException('Admin user not found');
    }

    // Validate admin password
    const { adminPassword, twoFactorCode } = request.body;
    
    if (!adminPassword) {
      throw new BadRequestException('Admin password is required for this operation');
    }

    const isValidPassword = await bcrypt.compare(adminPassword, admin.password);
    if (!isValidPassword) {
      throw new UnauthorizedException('Invalid admin password');
    }

    // For now, we'll use admin password as 2FA
    // In production, you would implement proper 2FA with TOTP, SMS, or email codes
    if (this.isHighSecurityOperation(request)) {
      // Require additional verification for high-security operations
      if (!twoFactorCode) {
        throw new BadRequestException('Two-factor authentication code is required for this operation');
      }

      // Simulate 2FA code validation (in production, use proper 2FA library)
      if (!this.validateTwoFactorCode(twoFactorCode, admin)) {
        throw new UnauthorizedException('Invalid two-factor authentication code');
      }
    }

    return true;
  }

  private isHighSecurityOperation(request: TwoFactorRequest): boolean {
    const { url, method } = request;
    
    // Define high-security operations that require 2FA
    const highSecurityPatterns = [
      /\/admin\/wallets\/wipe/,
      /\/admin\/wallets\/.*\/status/,
      /\/admin\/withdrawals\/.*\/decision/,
      /\/admin\/users\/.*\/promote/,
      /\/admin\/users\/.*\/demote/,
    ];

    return highSecurityPatterns.some(pattern => pattern.test(url)) && method === 'POST';
  }

  private validateTwoFactorCode(code: string, admin: UserDocument): boolean {
    // In production, implement proper 2FA validation
    // This is a simplified version for demonstration
    
    // For demo purposes, accept codes that match a simple pattern
    // In production, use libraries like:
    // - speakeasy for TOTP
    // - SMS service for SMS codes
    // - Email service for email codes
    
    if (code.length !== 6 || !/^\d{6}$/.test(code)) {
      return false;
    }

    // Simple validation: accept codes based on current time (demo only)
    const currentMinute = new Date().getMinutes();
    const expectedCode = ((currentMinute + admin._id.toString().slice(-2).charCodeAt(0)) % 1000000)
      .toString()
      .padStart(6, '0');
    
    return code === expectedCode;
  }
}

// Custom decorator to mark endpoints that require 2FA
export const RequireAdminTwoFactor = () => SetMetadata(ADMIN_2FA_KEY, true);
