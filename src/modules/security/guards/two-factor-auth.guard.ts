import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TwoFactorAuth, TwoFactorAuthDocument } from '../entities/two-factor-auth.entity';
import { SecurityAuditService } from '../services/security-audit.service';
import { SecurityEventType, SecurityEventSeverity } from '../entities/security-audit-log.entity';
import { SECURITY_CONSTANTS, ADMIN_ACTIONS_REQUIRING_2FA } from '../constants';

@Injectable()
export class TwoFactorAuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @InjectModel(TwoFactorAuth.name) private readonly twoFactorAuthModel: Model<TwoFactorAuthDocument>,
    private readonly securityAuditService: SecurityAuditService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const require2FAMetadata = this.reflector.get('require2FA', context.getHandler());
    
    // If the method is not decorated with @Require2FA, allow access
    if (!require2FAMetadata) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('User not authenticated');
    }

    // Check if the action requires 2FA
    const actionName = require2FAMetadata.action;
    const requires2FA = this.actionRequires2FA(actionName, user);

    if (!requires2FA) {
      return true;
    }

    // Get user's 2FA configuration
    const userTwoFA = await this.twoFactorAuthModel.findOne({ userId: user.id }).exec();

    if (!userTwoFA || !userTwoFA.isEnabled) {
      await this.securityAuditService.createAuditLog({
        eventType: SecurityEventType.FAILED_PERMISSION_ACCESS,
        severity: SecurityEventSeverity.HIGH,
        description: `Access denied: 2FA required but not enabled for ${actionName}`,
        userId: user.id,
        ipAddress: this.getClientIp(request),
        userAgent: request.headers['user-agent'],
        metadata: {
          endpoint: request.url,
          method: request.method,
          action: actionName,
          reason: '2FA_NOT_ENABLED'
        }
      });

      throw new UnauthorizedException(SECURITY_CONSTANTS.ERRORS.TWO_FA_NOT_ENABLED);
    }

    // Check if account is locked due to failed 2FA attempts
    if (userTwoFA.lockedUntil && new Date() < userTwoFA.lockedUntil) {
      await this.securityAuditService.createAuditLog({
        eventType: SecurityEventType.FAILED_PERMISSION_ACCESS,
        severity: SecurityEventSeverity.HIGH,
        description: `Access denied: Account locked due to failed 2FA attempts`,
        userId: user.id,
        ipAddress: this.getClientIp(request),
        userAgent: request.headers['user-agent'],
        metadata: {
          endpoint: request.url,
          method: request.method,
          action: actionName,
          reason: 'ACCOUNT_LOCKED',
          lockedUntil: userTwoFA.lockedUntil
        }
      });

      throw new UnauthorizedException(SECURITY_CONSTANTS.ERRORS.TWO_FA_ACCOUNT_LOCKED);
    }

    // Check if 2FA token is provided in the request
    const twoFAToken = request.headers['x-2fa-token'] || request.body?.twoFAToken;
    
    if (!twoFAToken) {
      await this.securityAuditService.createAuditLog({
        eventType: SecurityEventType.FAILED_PERMISSION_ACCESS,
        severity: SecurityEventSeverity.MEDIUM,
        description: `Access denied: 2FA token required for ${actionName}`,
        userId: user.id,
        ipAddress: this.getClientIp(request),
        userAgent: request.headers['user-agent'],
        metadata: {
          endpoint: request.url,
          method: request.method,
          action: actionName,
          reason: 'MISSING_2FA_TOKEN'
        }
      });

      throw new BadRequestException('2FA token required in X-2FA-Token header or request body');
    }

    // Verify the 2FA token (this would be implemented in the TwoFactorAuthService)
    const isValidToken = await this.verify2FAToken(user.id, twoFAToken);

    if (!isValidToken) {
      // Increment failed attempts
      await this.handleFailedAttempt(userTwoFA);

      await this.securityAuditService.createAuditLog({
        eventType: SecurityEventType.TWO_FA_FAILED,
        severity: SecurityEventSeverity.HIGH,
        description: `Invalid 2FA token provided for ${actionName}`,
        userId: user.id,
        ipAddress: this.getClientIp(request),
        userAgent: request.headers['user-agent'],
        metadata: {
          endpoint: request.url,
          method: request.method,
          action: actionName,
          failedAttempts: userTwoFA.failedAttempts + 1
        }
      });

      throw new UnauthorizedException(SECURITY_CONSTANTS.ERRORS.TWO_FA_INVALID_TOKEN);
    }

    // Reset failed attempts on successful verification
    if (userTwoFA.failedAttempts > 0) {
      await this.twoFactorAuthModel.updateOne(
        { userId: user.id },
        {
          $set: { failedAttempts: 0 },
          $unset: { lockedUntil: 1 }
        }
      );
    }

    // Update last verified timestamp
    await this.twoFactorAuthModel.updateOne(
      { userId: user.id },
      { $set: { lastVerified: new Date() } }
    );

    // Log successful 2FA verification
    await this.securityAuditService.createAuditLog({
      eventType: SecurityEventType.TWO_FA_SUCCESS,
      severity: SecurityEventSeverity.LOW,
      description: `2FA verification successful for ${actionName}`,
      userId: user.id,
      ipAddress: this.getClientIp(request),
      userAgent: request.headers['user-agent'],
      metadata: {
        endpoint: request.url,
        method: request.method,
        action: actionName
      }
    });

    return true;
  }

  private actionRequires2FA(actionName: string, user: any): boolean {
    // Always require 2FA for admin users on sensitive actions
    if (user.role === 'admin' || user.role === 'super_admin') {
      return ADMIN_ACTIONS_REQUIRING_2FA.includes(actionName.toUpperCase());
    }

    // For regular users, specific actions might require 2FA (e.g., large wallet operations)
    const userActions2FA = [
      'LARGE_WALLET_TRANSFER',
      'ACCOUNT_DELETION',
      'SENSITIVE_DATA_EXPORT'
    ];

    return userActions2FA.includes(actionName.toUpperCase());
  }

  private async verify2FAToken(userId: string, token: string): Promise<boolean> {
    // This is a placeholder - would integrate with actual TOTP library
    // Implementation would verify against the user's secret
    // For now, we'll implement a basic check
    
    const userTwoFA = await this.twoFactorAuthModel.findOne({ userId }).exec();
    if (!userTwoFA || !userTwoFA.secret) {
      return false;
    }

    // Here you would use a library like 'otplib' to verify the TOTP token
    // Example: otplib.authenticator.verify({ token, secret: userTwoFA.secret })
    
    // For backup codes, check against hashed backup codes
    if (token.length === 8) { // Backup code length
      // Check if it's a valid backup code
      return this.verifyBackupCode(userId, token);
    }

    // For TOTP tokens (6 digits)
    if (token.length === 6 && /^\d{6}$/.test(token)) {
      // This is a simplified verification - use proper TOTP library in production
      return true; // Placeholder
    }

    return false;
  }

  private async verifyBackupCode(userId: string, code: string): Promise<boolean> {
    // This would hash the provided code and check against stored hashed backup codes
    // Remove the used backup code from the array
    // Return true if code was valid and unused, false otherwise
    
    // Placeholder implementation
    return false;
  }

  private async handleFailedAttempt(userTwoFA: TwoFactorAuthDocument): Promise<void> {
    const failedAttempts = (userTwoFA.failedAttempts || 0) + 1;
    
    const updateData: any = {
      failedAttempts
    };

    // Lock account if max failed attempts reached
    if (failedAttempts >= SECURITY_CONSTANTS.TWO_FA.MAX_FAILED_ATTEMPTS) {
      updateData.lockedUntil = new Date(Date.now() + SECURITY_CONSTANTS.TWO_FA.LOCKOUT_DURATION);
    }

    await this.twoFactorAuthModel.updateOne(
      { userId: userTwoFA.userId },
      { $set: updateData }
    );
  }

  private getClientIp(request: any): string {
    return request.ip || 
           request.connection.remoteAddress || 
           request.socket.remoteAddress ||
           (request.connection.socket ? request.connection.socket.remoteAddress : null) ||
           '0.0.0.0';
  }
}
