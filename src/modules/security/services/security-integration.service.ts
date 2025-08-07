import { Injectable, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { TwoFactorAuthService } from './two-factor-auth.service';
import { SecurityAuditService } from './security-audit.service';
import { SecurityEventType } from '../entities/security-audit-log.entity';

@Injectable()
export class SecurityIntegrationService {
  constructor(
    private readonly twoFactorService: TwoFactorAuthService,
    private readonly auditService: SecurityAuditService,
  ) {}

  /**
   * Verify 2FA is required and valid for admin actions
   */
  async verifyAdminAction(
    userId: string,
    action: string,
    resource?: string,
    ipAddress?: string,
    userAgent?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    // Check if user has 2FA enabled
    const twoFactorStatus = await this.twoFactorService.getTwoFactorStatus(userId);
    
    if (!twoFactorStatus.isEnabled) {
      throw new ForbiddenException('Two-factor authentication must be enabled for admin actions');
    }

    // Check if current session is 2FA authenticated
    const isAuthenticated = await this.twoFactorService.isSessionTwoFactorAuthenticated(userId);
    
    if (!isAuthenticated) {
      throw new UnauthorizedException('Two-factor authentication required for this action');
    }

    // Log the admin action
    await this.auditService.createAuditLog({
      eventType: SecurityEventType.ADMIN_ACTION,
      userId,
      action,
      resource,
      ipAddress,
      userAgent,
      metadata: {
        ...metadata,
        twoFactorVerified: true,
        timestamp: new Date().toISOString(),
      }
    });
  }

  /**
   * Verify 2FA for critical system operations
   */
  async verifyCriticalOperation(
    userId: string,
    operation: string,
    ipAddress?: string,
    userAgent?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    // Always require 2FA for critical operations
    const twoFactorStatus = await this.twoFactorService.getTwoFactorStatus(userId);
    
    if (!twoFactorStatus.isEnabled) {
      await this.auditService.createAuditLog({
        eventType: SecurityEventType.SECURITY_VIOLATION,
        userId,
        action: `Attempted critical operation without 2FA: ${operation}`,
        ipAddress,
        userAgent,
        metadata: { ...metadata, severity: 'HIGH' }
      });
      
      throw new ForbiddenException('Two-factor authentication must be enabled for critical operations');
    }

    const isAuthenticated = await this.twoFactorService.isSessionTwoFactorAuthenticated(userId);
    
    if (!isAuthenticated) {
      await this.auditService.createAuditLog({
        eventType: SecurityEventType.SECURITY_VIOLATION,
        userId,
        action: `Attempted critical operation without 2FA session: ${operation}`,
        ipAddress,
        userAgent,
        metadata: { ...metadata, severity: 'HIGH' }
      });
      
      throw new UnauthorizedException('Two-factor authentication session required for critical operations');
    }

    // Log successful critical operation
    await this.auditService.createAuditLog({
      eventType: SecurityEventType.CRITICAL_OPERATION,
      userId,
      action: operation,
      ipAddress,
      userAgent,
      metadata: {
        ...metadata,
        twoFactorVerified: true,
        operationType: 'CRITICAL',
        timestamp: new Date().toISOString(),
      }
    });
  }

  /**
   * Log security events with automatic threat analysis
   */
  async logSecurityEvent(
    eventType: SecurityEventType,
    userId: string,
    action: string,
    ipAddress?: string,
    userAgent?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.auditService.createAuditLog({
      eventType,
      userId,
      action,
      ipAddress,
      userAgent,
      metadata
    });
  }

  /**
   * Check if an action requires enhanced security
   */
  isEnhancedSecurityRequired(action: string, resource?: string): boolean {
    const enhancedSecurityActions = [
      'DELETE_USER',
      'MODIFY_PERMISSIONS',
      'SYSTEM_CONFIG_CHANGE',
      'BULK_DELETE',
      'FINANCIAL_TRANSACTION',
      'EXPORT_DATA',
      'BACKUP_SYSTEM',
      'RESTORE_SYSTEM',
      'SECURITY_CONFIG_CHANGE'
    ];

    const enhancedSecurityResources = [
      'users',
      'admins', 
      'system',
      'config',
      'security',
      'payments',
      'wallet'
    ];

    return enhancedSecurityActions.some(secureAction => 
      action.toUpperCase().includes(secureAction)
    ) || (resource && enhancedSecurityResources.some(secureResource => 
      resource.toLowerCase().includes(secureResource)
    ));
  }

  /**
   * Get security context for current user
   */
  async getSecurityContext(userId: string): Promise<{
    hasTwoFactor: boolean;
    isAuthenticated: boolean;
    lastLoginTime?: Date;
    loginAttempts?: number;
    isLocked?: boolean;
  }> {
    const twoFactorStatus = await this.twoFactorService.getTwoFactorStatus(userId);
    const isAuthenticated = await this.twoFactorService.isSessionTwoFactorAuthenticated(userId);
    
    return {
      hasTwoFactor: twoFactorStatus.isEnabled,
      isAuthenticated,
      lastLoginTime: twoFactorStatus.lastUsed,
      loginAttempts: 0, // This would need to be tracked separately
      isLocked: false, // This would need to be tracked separately
    };
  }
}
