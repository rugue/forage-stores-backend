import { IsString, IsNotEmpty, IsEnum, IsOptional, IsNumber, Min, Max, IsBoolean, IsArray, IsObject, IsIP, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SecurityEventType, SecurityEventSeverity, SecurityEventStatus } from '../entities/security-audit-log.entity';
import { ThreatType, ThreatSeverity, ThreatStatus, ResponseAction } from '../entities/threat-detection.entity';

/**
 * Two-Factor Authentication DTOs
 */

export class Enable2FADto {
  @ApiProperty({ 
    description: 'User password for verification',
    example: 'currentPassword123'
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}

export class Verify2FADto {
  @ApiProperty({ 
    description: '6-digit TOTP token',
    example: '123456'
  })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiPropertyOptional({ 
    description: 'Whether this is a backup code instead of TOTP',
    default: false
  })
  @IsOptional()
  @IsBoolean()
  isBackupCode?: boolean;
}

export class Disable2FADto {
  @ApiProperty({ 
    description: 'Current password for verification',
    example: 'currentPassword123'
  })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiProperty({ 
    description: '6-digit TOTP token or backup code',
    example: '123456'
  })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiPropertyOptional({ 
    description: 'Reason for disabling 2FA',
    example: 'Lost phone'
  })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class Generate2FABackupCodesDto {
  @ApiProperty({ 
    description: 'Current password for verification',
    example: 'currentPassword123'
  })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiProperty({ 
    description: '6-digit TOTP token',
    example: '123456'
  })
  @IsString()
  @IsNotEmpty()
  token: string;
}

// Additional 2FA DTOs for the service
export class TwoFactorSetupDto {
  @ApiProperty({ description: 'Email address for 2FA' })
  @IsString()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: '2FA method', enum: ['app', 'sms', 'email'] })
  @IsEnum(['app', 'sms', 'email'])
  method: 'app' | 'sms' | 'email';

  @ApiPropertyOptional({ description: 'Phone number for SMS 2FA' })
  @IsString()
  @IsOptional()
  phoneNumber?: string;
}

export class TwoFactorVerifyDto {
  @ApiProperty({ description: '6-digit verification code' })
  @IsString()
  @IsNotEmpty()
  code: string;
}

export class TwoFactorBackupCodesDto {
  @ApiProperty({ description: 'Backup code to verify' })
  @IsString()
  @IsNotEmpty()
  code: string;
}

/**
 * Security Audit Log DTOs
 */

export class CreateAuditLogDto {
  @ApiProperty({ description: 'Event type', enum: SecurityEventType })
  @IsEnum(SecurityEventType)
  eventType: SecurityEventType;

  @ApiProperty({ description: 'User ID associated with the event', required: false })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiProperty({ description: 'Admin ID who created the log', required: false })
  @IsOptional()
  @IsString()
  adminId?: string;

  @ApiProperty({ description: 'Action performed', required: false })
  @IsOptional()
  @IsString()
  action?: string;

  @ApiProperty({ description: 'Resource affected', required: false })
  @IsOptional()
  @IsString()
  resource?: string;

  @ApiProperty({ description: 'IP address', required: false })
  @IsOptional()
  @IsString()
  ipAddress?: string;

  @ApiProperty({ description: 'User agent', required: false })
  @IsOptional()
  @IsString()
  userAgent?: string;

  @ApiProperty({ description: 'Event description', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Event severity', enum: SecurityEventSeverity, required: false })
  @IsOptional()
  @IsEnum(SecurityEventSeverity)
  severity?: SecurityEventSeverity;

  @ApiProperty({ description: 'Additional metadata', required: false })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class UpdateAuditLogStatusDto {
  @ApiProperty({ 
    description: 'New status for the audit log',
    enum: SecurityEventStatus
  })
  @IsEnum(SecurityEventStatus)
  status: SecurityEventStatus;

  @ApiPropertyOptional({ 
    description: 'Resolution notes'
  })
  @IsOptional()
  @IsString()
  resolutionNotes?: string;
}

export class AuditLogFilterDto {
  @ApiPropertyOptional({ 
    description: 'Filter by event types',
    enum: SecurityEventType,
    isArray: true
  })
  @IsOptional()
  @IsArray()
  @IsEnum(SecurityEventType, { each: true })
  eventTypes?: SecurityEventType[];

  @ApiPropertyOptional({ 
    description: 'Filter by severity levels',
    enum: SecurityEventSeverity,
    isArray: true
  })
  @IsOptional()
  @IsArray()
  @IsEnum(SecurityEventSeverity, { each: true })
  severities?: SecurityEventSeverity[];

  @ApiPropertyOptional({ 
    description: 'Filter by user ID'
  })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({ 
    description: 'Filter by IP address'
  })
  @IsOptional()
  @IsIP()
  ipAddress?: string;

  @ApiPropertyOptional({ 
    description: 'Start date for filtering'
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ 
    description: 'End date for filtering'
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ 
    description: 'Search text in description or details'
  })
  @IsOptional()
  @IsString()
  searchText?: string;

  @ApiPropertyOptional({ 
    description: 'Page number',
    default: 1
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ 
    description: 'Number of items per page',
    default: 20
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;
}

/**
 * Threat Detection DTOs
 */

export class CreateThreatDto {
  @ApiProperty({ 
    description: 'Type of threat detected',
    enum: ThreatType
  })
  @IsEnum(ThreatType)
  threatType: ThreatType;

  @ApiProperty({ 
    description: 'Threat severity level',
    enum: ThreatSeverity
  })
  @IsEnum(ThreatSeverity)
  severity: ThreatSeverity;

  @ApiProperty({ 
    description: 'IP address of threat source'
  })
  @IsIP()
  ipAddress: string;

  @ApiProperty({ 
    description: 'Risk score (0-100)',
    minimum: 0,
    maximum: 100
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  riskScore: number;

  @ApiProperty({ 
    description: 'Confidence level (0-100)',
    minimum: 0,
    maximum: 100
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  confidenceLevel: number;

  @ApiProperty({ 
    description: 'Threat description'
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({ 
    description: 'User ID associated with threat'
  })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({ 
    description: 'User agent string'
  })
  @IsOptional()
  @IsString()
  userAgent?: string;

  @ApiPropertyOptional({ 
    description: 'Detailed threat information'
  })
  @IsOptional()
  @IsString()
  details?: string;

  @ApiPropertyOptional({ 
    description: 'Evidence supporting the threat detection'
  })
  @IsOptional()
  @IsObject()
  evidence?: Record<string, any>;

  @ApiPropertyOptional({ 
    description: 'Geolocation information'
  })
  @IsOptional()
  @IsObject()
  geolocation?: Record<string, any>;
}

export class UpdateThreatStatusDto {
  @ApiProperty({ 
    description: 'New threat status',
    enum: ThreatStatus
  })
  @IsEnum(ThreatStatus)
  status: ThreatStatus;

  @ApiPropertyOptional({ 
    description: 'Investigation notes'
  })
  @IsOptional()
  @IsString()
  investigationNotes?: string;

  @ApiPropertyOptional({ 
    description: 'Response actions taken',
    enum: ResponseAction,
    isArray: true
  })
  @IsOptional()
  @IsArray()
  @IsEnum(ResponseAction, { each: true })
  responseActions?: ResponseAction[];

  @ApiPropertyOptional({ 
    description: 'Manual actions taken'
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  manualActions?: string[];
}

export class ThreatFilterDto {
  @ApiPropertyOptional({ 
    description: 'Filter by threat types',
    enum: ThreatType,
    isArray: true
  })
  @IsOptional()
  @IsArray()
  @IsEnum(ThreatType, { each: true })
  threatTypes?: ThreatType[];

  @ApiPropertyOptional({ 
    description: 'Filter by severity levels',
    enum: ThreatSeverity,
    isArray: true
  })
  @IsOptional()
  @IsArray()
  @IsEnum(ThreatSeverity, { each: true })
  severities?: ThreatSeverity[];

  @ApiPropertyOptional({ 
    description: 'Filter by status',
    enum: ThreatStatus,
    isArray: true
  })
  @IsOptional()
  @IsArray()
  @IsEnum(ThreatStatus, { each: true })
  statuses?: ThreatStatus[];

  @ApiPropertyOptional({ 
    description: 'Filter by IP address'
  })
  @IsOptional()
  @IsIP()
  ipAddress?: string;

  @ApiPropertyOptional({ 
    description: 'Minimum risk score'
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  minRiskScore?: number;

  @ApiPropertyOptional({ 
    description: 'Start date for filtering'
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ 
    description: 'End date for filtering'
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ 
    description: 'Page number',
    default: 1
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ 
    description: 'Number of items per page',
    default: 20
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;
}

/**
 * Security Analytics DTOs
 */

export class SecurityAnalyticsFilterDto {
  @ApiPropertyOptional({ 
    description: 'Start date for analytics period'
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ 
    description: 'End date for analytics period'
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ 
    description: 'Grouping period',
    enum: ['hourly', 'daily', 'weekly', 'monthly'],
    default: 'daily'
  })
  @IsOptional()
  @IsEnum(['hourly', 'daily', 'weekly', 'monthly'])
  period?: 'hourly' | 'daily' | 'weekly' | 'monthly';

  @ApiPropertyOptional({ 
    description: 'Include threat trends',
    default: true
  })
  @IsOptional()
  @IsBoolean()
  includeThreatTrends?: boolean;

  @ApiPropertyOptional({ 
    description: 'Include audit log statistics',
    default: true
  })
  @IsOptional()
  @IsBoolean()
  includeAuditStats?: boolean;

  @ApiPropertyOptional({ 
    description: 'Include 2FA statistics',
    default: true
  })
  @IsOptional()
  @IsBoolean()
  include2FAStats?: boolean;
}

export class SecurityReportDto {
  @ApiProperty({ 
    description: 'Report type',
    enum: ['summary', 'detailed', 'threats', 'audit', 'compliance']
  })
  @IsEnum(['summary', 'detailed', 'threats', 'audit', 'compliance'])
  reportType: 'summary' | 'detailed' | 'threats' | 'audit' | 'compliance';

  @ApiPropertyOptional({ 
    description: 'Start date for report period'
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ 
    description: 'End date for report period'
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ 
    description: 'Export format',
    enum: ['json', 'pdf', 'csv'],
    default: 'json'
  })
  @IsOptional()
  @IsEnum(['json', 'pdf', 'csv'])
  format?: 'json' | 'pdf' | 'csv';

  @ApiPropertyOptional({ 
    description: 'Include charts in report',
    default: false
  })
  @IsOptional()
  @IsBoolean()
  includeCharts?: boolean;
}

// Additional DTOs for threat detection service
export class CreateThreatDetectionDto {
  @ApiProperty({ description: 'Type of threat' })
  @IsString()
  @IsNotEmpty()
  threatType: string;

  @ApiProperty({ description: 'Threat description' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({ description: 'User ID associated with threat' })
  @IsString()
  @IsOptional()
  userId?: string;

  @ApiPropertyOptional({ description: 'IP address of threat source' })
  @IsString()
  @IsOptional()
  ipAddress?: string;

  @ApiPropertyOptional({ description: 'Risk score (0-100)', minimum: 0, maximum: 100 })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  riskScore?: number;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  metadata?: Record<string, any>;
}

export class ThreatDetectionFilterDto {
  @ApiPropertyOptional({ description: 'Filter by threat type' })
  @IsString()
  @IsOptional()
  threatType?: string;

  @ApiPropertyOptional({ description: 'Filter by user ID' })
  @IsString()
  @IsOptional()
  userId?: string;

  @ApiPropertyOptional({ description: 'Filter by IP address' })
  @IsString()
  @IsOptional()
  ipAddress?: string;

  @ApiPropertyOptional({ description: 'Start date for filtering' })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date for filtering' })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsNumber()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsNumber()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number = 20;
}

export class SecurityDashboardDto {
  @ApiProperty({ description: 'Number of days for dashboard data', required: false, default: 7 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(90)
  days?: number;
}
