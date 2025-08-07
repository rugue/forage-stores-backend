import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { SecurityController } from './security.controller';
import { TwoFactorAuthGuard } from './guards/two-factor-auth.guard';
import { EnhancedSecurityGuard } from './guards/enhanced-security.guard';
import {
  SecurityAuditService,
  TwoFactorAuthService,
  ThreatDetectionService,
  SecurityAnalyticsService,
  SecurityIntegrationService
} from './services';

// Import schemas
import { SecurityAuditLog, SecurityAuditLogSchema } from './entities/security-audit-log.entity';
import { TwoFactorAuth, TwoFactorAuthSchema } from './entities/two-factor-auth.entity';
import { ThreatDetection, ThreatDetectionSchema } from './entities/threat-detection.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SecurityAuditLog.name, schema: SecurityAuditLogSchema },
      { name: TwoFactorAuth.name, schema: TwoFactorAuthSchema },
      { name: ThreatDetection.name, schema: ThreatDetectionSchema },
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '15m' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [SecurityController],
  providers: [
    SecurityAuditService,
    TwoFactorAuthService,
    ThreatDetectionService,
    SecurityAnalyticsService,
    SecurityIntegrationService,
    TwoFactorAuthGuard,
    EnhancedSecurityGuard,
  ],
  exports: [
    SecurityAuditService,
    TwoFactorAuthService,
    ThreatDetectionService,
    SecurityAnalyticsService,
    SecurityIntegrationService,
    TwoFactorAuthGuard,
    EnhancedSecurityGuard,
  ],
})
export class SecurityModule {}
