import { Injectable, Logger, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { TwoFactorAuth, TwoFactorAuthDocument } from '../entities/two-factor-auth.entity';
import { SecurityAuditService } from './security-audit.service';
import { SecurityEventType, SecurityEventSeverity } from '../entities/security-audit-log.entity';
import { SECURITY_CONSTANTS } from '../constants';
import { 
  TwoFactorSetupDto, 
  TwoFactorVerifyDto, 
  TwoFactorBackupCodesDto 
} from '../dto';
import * as crypto from 'crypto';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';

@Injectable()
export class TwoFactorAuthService {
  private readonly logger = new Logger(TwoFactorAuthService.name);

  constructor(
    @InjectModel(TwoFactorAuth.name) private readonly twoFactorModel: Model<TwoFactorAuthDocument>,
    private readonly securityAuditService: SecurityAuditService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Setup 2FA for a user
   */
  async setupTwoFactor(
    userId: string,
    setupDto: TwoFactorSetupDto,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{
    secret: string;
    qrCodeUrl: string;
    backupCodes: string[];
    manualEntryKey: string;
  }> {
    try {
      // Check if user already has 2FA setup
      const existing2FA = await this.twoFactorModel.findOne({ userId: new Types.ObjectId(userId) });
      if (existing2FA && existing2FA.isEnabled) {
        throw new BadRequestException(SECURITY_CONSTANTS.ERRORS.TWO_FA_ALREADY_ENABLED);
      }

      // Generate secret
      const secret = speakeasy.generateSecret({
        name: `Forage Stores (${setupDto.email})`,
        issuer: 'Forage Stores',
        length: 32
      });

      // Generate backup codes
      const backupCodes = this.generateBackupCodes();

      // Hash backup codes for storage
      const hashedBackupCodes = await Promise.all(
        backupCodes.map(code => this.hashBackupCode(code))
      );

      // Create or update 2FA record
      const twoFactorData = {
        userId: new Types.ObjectId(userId),
        secret: secret.base32,
        backupCodes: hashedBackupCodes,
        isEnabled: false, // Will be enabled after verification
        isVerified: false,
        method: setupDto.method,
        phoneNumber: setupDto.phoneNumber,
        email: setupDto.email,
        setupDate: new Date()
      };

      if (existing2FA) {
        await this.twoFactorModel.updateOne(
          { userId: new Types.ObjectId(userId) },
          { $set: twoFactorData }
        );
      } else {
        await this.twoFactorModel.create(twoFactorData);
      }

      // Generate QR code
      const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

      // Log security event
      await this.securityAuditService.createAuditLog({
        eventType: SecurityEventType.TWO_FA_SETUP_INITIATED,
        description: `User initiated 2FA setup with method: ${setupDto.method}`,
        userId,
        ipAddress,
        userAgent,
        severity: SecurityEventSeverity.LOW,
        metadata: {
          method: setupDto.method,
          email: setupDto.email,
          phoneNumber: setupDto.phoneNumber ? `***-***-${setupDto.phoneNumber.slice(-4)}` : undefined
        }
      });

      this.logger.log(`2FA setup initiated for user ${userId}`);

      return {
        secret: secret.base32,
        qrCodeUrl,
        backupCodes,
        manualEntryKey: secret.base32
      };

    } catch (error) {
      this.logger.error(`Failed to setup 2FA for user ${userId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Verify 2FA setup
   */
  async verifyTwoFactorSetup(
    userId: string,
    verifyDto: TwoFactorVerifyDto,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{ verified: boolean; backupCodes: string[] }> {
    try {
      const twoFactor = await this.twoFactorModel.findOne({ 
        userId: new Types.ObjectId(userId) 
      });

      if (!twoFactor) {
        throw new BadRequestException(SECURITY_CONSTANTS.ERRORS.TWO_FA_NOT_FOUND);
      }

      // Verify the token
      const isValid = speakeasy.totp.verify({
        secret: twoFactor.secret,
        encoding: 'base32',
        token: verifyDto.code,
        window: SECURITY_CONSTANTS.TWO_FA.TOKEN_WINDOW
      });

      if (!isValid) {
        // Log failed attempt
        await this.securityAuditService.createAuditLog({
          eventType: SecurityEventType.TWO_FA_VERIFICATION_FAILED,
          description: 'Failed 2FA setup verification',
          userId,
          ipAddress,
          userAgent,
          severity: SecurityEventSeverity.MEDIUM
        });

        throw new UnauthorizedException(SECURITY_CONSTANTS.ERRORS.INVALID_TWO_FA_CODE);
      }

      // Enable 2FA
      await this.twoFactorModel.updateOne(
        { userId: new Types.ObjectId(userId) },
        {
          $set: {
            isEnabled: true,
            isVerified: true,
            verifiedAt: new Date()
          }
        }
      );

      // Get backup codes (unhashed for display)
      const backupCodes = this.regenerateBackupCodesFromHashed(twoFactor.backupCodes);

      // Log successful setup
      await this.securityAuditService.createAuditLog({
        eventType: SecurityEventType.TWO_FA_ENABLED,
        description: `2FA successfully enabled for user with method: ${twoFactor.method}`,
        userId,
        ipAddress,
        userAgent,
        severity: SecurityEventSeverity.LOW,
        metadata: {
          method: twoFactor.method
        }
      });

      this.logger.log(`2FA successfully enabled for user ${userId}`);

      return {
        verified: true,
        backupCodes
      };

    } catch (error) {
      this.logger.error(`Failed to verify 2FA setup for user ${userId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Verify 2FA code during authentication
   */
  async verifyTwoFactorCode(
    userId: string,
    code: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{ verified: boolean; isBackupCode?: boolean }> {
    try {
      const twoFactor = await this.twoFactorModel.findOne({ 
        userId: new Types.ObjectId(userId),
        isEnabled: true
      });

      if (!twoFactor) {
        throw new UnauthorizedException(SECURITY_CONSTANTS.ERRORS.TWO_FA_NOT_ENABLED);
      }

      // First try TOTP verification
      const totpValid = speakeasy.totp.verify({
        secret: twoFactor.secret,
        encoding: 'base32',
        token: code,
        window: SECURITY_CONSTANTS.TWO_FA.TOKEN_WINDOW
      });

      if (totpValid) {
        // Update last used
        await this.twoFactorModel.updateOne(
          { userId: new Types.ObjectId(userId) },
          { $set: { lastUsed: new Date() } }
        );

        // Log successful verification
        await this.securityAuditService.createAuditLog({
          eventType: SecurityEventType.TWO_FA_VERIFIED,
          description: 'TOTP code verified successfully',
          userId,
          ipAddress,
          userAgent,
          severity: SecurityEventSeverity.LOW
        });

        return { verified: true, isBackupCode: false };
      }

      // Try backup code verification
      const backupCodeValid = await this.verifyBackupCode(twoFactor, code);
      
      if (backupCodeValid) {
        // Mark backup code as used
        await this.markBackupCodeAsUsed(twoFactor._id.toString(), code);

        // Log backup code usage
        await this.securityAuditService.createAuditLog({
          eventType: SecurityEventType.TWO_FA_BACKUP_CODE_USED,
          description: 'Backup code used for 2FA verification',
          userId,
          ipAddress,
          userAgent,
          severity: SecurityEventSeverity.MEDIUM
        });

        return { verified: true, isBackupCode: true };
      }

      // Log failed attempt
      await this.securityAuditService.createAuditLog({
        eventType: SecurityEventType.TWO_FA_VERIFICATION_FAILED,
        description: 'Invalid 2FA code provided',
        userId,
        ipAddress,
        userAgent,
        severity: SecurityEventSeverity.HIGH
      });

      return { verified: false };

    } catch (error) {
      this.logger.error(`Failed to verify 2FA code for user ${userId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Disable 2FA for a user
   */
  async disableTwoFactor(
    userId: string,
    adminId?: string,
    reason?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    try {
      const twoFactor = await this.twoFactorModel.findOne({ 
        userId: new Types.ObjectId(userId) 
      });

      if (!twoFactor) {
        throw new BadRequestException(SECURITY_CONSTANTS.ERRORS.TWO_FA_NOT_FOUND);
      }

      // Disable 2FA
      await this.twoFactorModel.updateOne(
        { userId: new Types.ObjectId(userId) },
        {
          $set: {
            isEnabled: false,
            disabledAt: new Date(),
            disabledBy: adminId ? new Types.ObjectId(adminId) : undefined,
            disableReason: reason
          }
        }
      );

      // Log security event
      await this.securityAuditService.createAuditLog({
        eventType: SecurityEventType.TWO_FA_DISABLED,
        description: `2FA disabled for user${adminId ? ' by admin' : ''}${reason ? ': ' + reason : ''}`,
        userId,
        adminId,
        ipAddress,
        userAgent,
        severity: SecurityEventSeverity.HIGH,
        metadata: {
          reason,
          disabledBy: adminId ? 'admin' : 'user'
        }
      });

      this.logger.warn(`2FA disabled for user ${userId}${adminId ? ` by admin ${adminId}` : ''}`);

    } catch (error) {
      this.logger.error(`Failed to disable 2FA for user ${userId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Generate new backup codes
   */
  async regenerateBackupCodes(
    userId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<string[]> {
    try {
      const twoFactor = await this.twoFactorModel.findOne({ 
        userId: new Types.ObjectId(userId),
        isEnabled: true
      });

      if (!twoFactor) {
        throw new BadRequestException(SECURITY_CONSTANTS.ERRORS.TWO_FA_NOT_ENABLED);
      }

      // Generate new backup codes
      const backupCodes = this.generateBackupCodes();
      const hashedBackupCodes = await Promise.all(
        backupCodes.map(code => this.hashBackupCode(code))
      );

      // Update backup codes
      await this.twoFactorModel.updateOne(
        { userId: new Types.ObjectId(userId) },
        { 
          $set: { 
            backupCodes: hashedBackupCodes,
            backupCodesGeneratedAt: new Date()
          } 
        }
      );

      // Log security event
      await this.securityAuditService.createAuditLog({
        eventType: SecurityEventType.TWO_FA_BACKUP_CODES_REGENERATED,
        description: 'New 2FA backup codes generated',
        userId,
        ipAddress,
        userAgent,
        severity: SecurityEventSeverity.MEDIUM
      });

      this.logger.log(`New backup codes generated for user ${userId}`);

      return backupCodes;

    } catch (error) {
      this.logger.error(`Failed to regenerate backup codes for user ${userId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get 2FA status for a user
   */
  async getTwoFactorStatus(userId: string): Promise<{
    isEnabled: boolean;
    method?: string;
    hasBackupCodes: boolean;
    lastUsed?: Date;
    setupDate?: Date;
  }> {
    const twoFactor = await this.twoFactorModel.findOne({ 
      userId: new Types.ObjectId(userId) 
    });

    if (!twoFactor) {
      return {
        isEnabled: false,
        hasBackupCodes: false
      };
    }

    return {
      isEnabled: twoFactor.isEnabled,
      method: twoFactor.method,
      hasBackupCodes: twoFactor.backupCodes && twoFactor.backupCodes.length > 0,
      lastUsed: twoFactor.lastUsed,
      setupDate: twoFactor.setupDate
    };
  }

  /**
   * Check if user has 2FA enabled
   */
  async isTwoFactorEnabled(userId: string): Promise<boolean> {
    const twoFactor = await this.twoFactorModel.findOne({ 
      userId: new Types.ObjectId(userId),
      isEnabled: true
    });

    return !!twoFactor;
  }

    /**
   * Get all users with 2FA enabled (admin function)
   */
  async getUsersWithTwoFactor(): Promise<TwoFactorAuth[]> {
    return this.twoFactorModel.find({ isEnabled: true }).exec();
  }

  /**
   * Check if current session is 2FA authenticated
   */
  async isSessionTwoFactorAuthenticated(userId: string): Promise<boolean> {
    const auth = await this.twoFactorModel.findOne({ userId, isEnabled: true });
    if (!auth) return false;

    // Check if last successful auth was within the session timeout (30 minutes)
    const sessionTimeout = 30 * 60 * 1000; // 30 minutes
    const now = new Date();
    const lastAuth = auth.lastUsed || new Date(Date.now() - sessionTimeout - 1); // Force re-auth if no lastUsed

    return (now.getTime() - lastAuth.getTime()) < sessionTimeout;
  }

  /**
   * Mark session as 2FA authenticated
   */
  async markSessionAuthenticated(userId: string): Promise<void> {
    await this.twoFactorModel.updateOne(
      { userId, isEnabled: true },
      { lastUsed: new Date() }
    );
  }

  /**
   * Clear 2FA session authentication
   */
  async clearSessionAuthentication(userId: string): Promise<void> {
    await this.twoFactorModel.updateOne(
      { userId, isEnabled: true },
      { $unset: { lastUsed: 1 } }
    );
  }

  // Private helper methods

  private generateBackupCodes(): string[] {
    const codes: string[] = [];
    for (let i = 0; i < SECURITY_CONSTANTS.TWO_FA.BACKUP_CODES_COUNT; i++) {
      codes.push(this.generateRandomCode(8));
    }
    return codes;
  }

  private generateRandomCode(length: number): string {
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  private async hashBackupCode(code: string): Promise<string> {
    return crypto.createHash('sha256').update(code).digest('hex');
  }

  private async verifyBackupCode(twoFactor: TwoFactorAuthDocument, code: string): Promise<boolean> {
    const hashedCode = await this.hashBackupCode(code);
    return twoFactor.backupCodes.some((bc: any) => 
      typeof bc === 'string' ? bc === hashedCode : (bc && bc.code === hashedCode && !bc.used)
    );
  }

  private async markBackupCodeAsUsed(twoFactorId: string, code: string): Promise<void> {
    const hashedCode = await this.hashBackupCode(code);
    
    await this.twoFactorModel.updateOne(
      { 
        _id: new Types.ObjectId(twoFactorId),
        'backupCodes.code': hashedCode 
      },
      { 
        $set: { 
          'backupCodes.$.used': true,
          'backupCodes.$.usedAt': new Date()
        } 
      }
    );
  }

  private regenerateBackupCodesFromHashed(hashedCodes: any[]): string[] {
    // This is a placeholder - in real implementation, you'd store the original codes temporarily
    // or regenerate new ones. For security, original backup codes should not be recoverable.
    return this.generateBackupCodes();
  }
}
