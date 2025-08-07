import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { IsString, IsNotEmpty, IsEnum, IsOptional, IsObject, IsIP, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export type SecurityAuditLogDocument = SecurityAuditLog & Document;

export enum SecurityEventType {
  // Authentication Events
  LOGIN_SUCCESS = 'login_success',
  LOGIN_FAILED = 'login_failed',
  LOGIN_BLOCKED = 'login_blocked',
  PASSWORD_CHANGED = 'password_changed',
  
  // Two-Factor Authentication Events
  TWO_FACTOR_ENABLED = 'two_factor_enabled',
  TWO_FACTOR_DISABLED = 'two_factor_disabled',
  TWO_FACTOR_SUCCESS = 'two_factor_success',
  TWO_FACTOR_FAILED = 'two_factor_failed',
  TWO_FA_ENABLED = 'two_factor_enabled',
  TWO_FA_DISABLED = 'two_factor_disabled', 
  TWO_FA_SUCCESS = 'two_factor_success',
  TWO_FA_FAILED = 'two_factor_failed',
  TWO_FA_SETUP_INITIATED = 'two_fa_setup_initiated',
  TWO_FA_VERIFICATION_FAILED = 'two_fa_verification_failed',
  TWO_FA_VERIFIED = 'two_fa_verified',
  TWO_FA_BACKUP_CODE_USED = 'two_fa_backup_code_used',
  TWO_FA_BACKUP_CODES_REGENERATED = 'two_fa_backup_codes_regenerated',
  BACKUP_CODE_USED = 'backup_code_used',
  
  // Admin & Privileged Actions
  ADMIN_ACTION = 'admin_action',
  CRITICAL_OPERATION = 'critical_operation',
  PERMISSION_CHANGED = 'permission_changed',
  USER_DELETED = 'user_deleted',
  DATA_EXPORT = 'data_export',
  ADMIN_WALLET_WIPE = 'admin_wallet_wipe',
  ADMIN_WALLET_FUND = 'admin_wallet_fund',
  
  // Security Events
  SECURITY_VIOLATION = 'security_violation',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  ACCOUNT_LOCKED = 'account_locked',
  ACCOUNT_UNLOCKED = 'account_unlocked',
  IP_BLOCKED = 'ip_blocked',
  IP_UNBLOCKED = 'ip_unblocked',
  FAILED_PERMISSION_ACCESS = 'failed_permission_access',
  MULTIPLE_FAILED_ATTEMPTS = 'multiple_failed_attempts',
  
  // System Events
  CONFIG_CHANGED = 'config_changed',
  SYSTEM_ACCESS = 'system_access',
  API_KEY_CREATED = 'api_key_created',
  API_KEY_REVOKED = 'api_key_revoked',
}

export enum SecurityEventSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export enum SecurityEventStatus {
  DETECTED = 'DETECTED',
  INVESTIGATING = 'INVESTIGATING',
  RESOLVED = 'RESOLVED',
  FALSE_POSITIVE = 'FALSE_POSITIVE',
  ESCALATED = 'ESCALATED'
}

@Schema({ timestamps: true })
export class SecurityAuditLog {
  @ApiProperty({ description: 'Event type', enum: SecurityEventType })
  @Prop({ required: true, enum: Object.values(SecurityEventType) })
  @IsEnum(SecurityEventType)
  eventType: SecurityEventType;

  @ApiProperty({ description: 'Event severity level', enum: SecurityEventSeverity })
  @Prop({ required: true, enum: Object.values(SecurityEventSeverity), default: SecurityEventSeverity.LOW })
  @IsEnum(SecurityEventSeverity)
  severity: SecurityEventSeverity;

  @ApiProperty({ description: 'Event status', enum: SecurityEventStatus })
  @Prop({ required: true, enum: Object.values(SecurityEventStatus), default: SecurityEventStatus.DETECTED })
  @IsEnum(SecurityEventStatus)
  status: SecurityEventStatus;

  @ApiProperty({ description: 'User ID associated with the event' })
  @Prop({ required: false, type: Types.ObjectId, ref: 'User' })
  @IsOptional()
  userId?: Types.ObjectId;

  @ApiProperty({ description: 'Admin ID who performed the action (for admin events)' })
  @Prop({ required: false, type: Types.ObjectId, ref: 'User' })
  @IsOptional()
  adminId?: Types.ObjectId;

  @ApiProperty({ description: 'Event description' })
  @Prop({ required: true, type: String })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ description: 'Detailed event message' })
  @Prop({ required: false, type: String })
  @IsOptional()
  @IsString()
  details?: string;

  @ApiProperty({ description: 'IP address from which the event originated' })
  @Prop({ required: false, type: String })
  @IsOptional()
  @IsIP()
  ipAddress?: string;

  @ApiProperty({ description: 'User agent information' })
  @Prop({ required: false, type: String })
  @IsOptional()
  @IsString()
  userAgent?: string;

  @ApiProperty({ description: 'Geographic location of the event' })
  @Prop({ required: false, type: Object })
  @IsOptional()
  @IsObject()
  location?: {
    country?: string;
    region?: string;
    city?: string;
    latitude?: number;
    longitude?: number;
  };

  @ApiProperty({ description: 'Additional metadata about the event' })
  @Prop({ required: false, type: Object })
  @IsOptional()
  @IsObject()
  metadata?: {
    endpoint?: string;
    method?: string;
    statusCode?: number;
    responseTime?: number;
    resourceId?: string;
    oldValue?: any;
    newValue?: any;
    additionalData?: Record<string, any>;
  };

  @ApiProperty({ description: 'Risk score associated with the event (0-100)' })
  @Prop({ required: false, type: Number, default: 0 })
  @IsOptional()
  riskScore?: number;

  @ApiProperty({ description: 'Whether this event triggered an alert' })
  @Prop({ required: false, type: Boolean, default: false })
  @IsOptional()
  alertTriggered?: boolean;

  @ApiProperty({ description: 'Alert recipients who were notified' })
  @Prop({ required: false, type: [String] })
  @IsOptional()
  alertRecipients?: string[];

  @ApiProperty({ description: 'Resolution notes (for resolved events)' })
  @Prop({ required: false, type: String })
  @IsOptional()
  @IsString()
  resolutionNotes?: string;

  @ApiProperty({ description: 'Admin who resolved the event' })
  @Prop({ required: false, type: Types.ObjectId, ref: 'User' })
  @IsOptional()
  resolvedBy?: Types.ObjectId;

  @ApiProperty({ description: 'Date when the event was resolved' })
  @Prop({ required: false, type: Date })
  @IsOptional()
  @IsDateString()
  resolvedAt?: Date;

  @ApiProperty({ description: 'Session ID associated with the event' })
  @Prop({ required: false, type: String })
  @IsOptional()
  @IsString()
  sessionId?: string;

  @ApiProperty({ description: 'Request ID for tracing' })
  @Prop({ required: false, type: String })
  @IsOptional()
  @IsString()
  requestId?: string;
}

export const SecurityAuditLogSchema = SchemaFactory.createForClass(SecurityAuditLog);

// Add indexes for better query performance
SecurityAuditLogSchema.index({ eventType: 1, createdAt: -1 });
SecurityAuditLogSchema.index({ userId: 1, createdAt: -1 });
SecurityAuditLogSchema.index({ adminId: 1, createdAt: -1 });
SecurityAuditLogSchema.index({ severity: 1, status: 1 });
SecurityAuditLogSchema.index({ ipAddress: 1, createdAt: -1 });
SecurityAuditLogSchema.index({ createdAt: -1 });
SecurityAuditLogSchema.index({ riskScore: -1 });
SecurityAuditLogSchema.index({ alertTriggered: 1, status: 1 });

// Add text index for searching descriptions and details
SecurityAuditLogSchema.index({ 
  description: 'text', 
  details: 'text', 
  resolutionNotes: 'text' 
});
