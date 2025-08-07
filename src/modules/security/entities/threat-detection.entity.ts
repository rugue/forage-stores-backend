import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { IsString, IsNotEmpty, IsNumber, IsEnum, IsOptional, IsObject, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export type ThreatDetectionDocument = ThreatDetection & Document;

export enum ThreatType {
  BRUTE_FORCE_ATTACK = 'BRUTE_FORCE_ATTACK',
  SUSPICIOUS_LOGIN_PATTERN = 'SUSPICIOUS_LOGIN_PATTERN',
  UNUSUAL_LOCATION_ACCESS = 'UNUSUAL_LOCATION_ACCESS',
  RAPID_API_REQUESTS = 'RAPID_API_REQUESTS',
  PRIVILEGE_ESCALATION_ATTEMPT = 'PRIVILEGE_ESCALATION_ATTEMPT',
  DATA_EXFILTRATION_ATTEMPT = 'DATA_EXFILTRATION_ATTEMPT',
  SQL_INJECTION_ATTEMPT = 'SQL_INJECTION_ATTEMPT',
  XSS_ATTEMPT = 'XSS_ATTEMPT',
  CSRF_ATTEMPT = 'CSRF_ATTEMPT',
  ACCOUNT_TAKEOVER_ATTEMPT = 'ACCOUNT_TAKEOVER_ATTEMPT',
  SUSPICIOUS_PAYMENT_PATTERN = 'SUSPICIOUS_PAYMENT_PATTERN',
  UNUSUAL_ORDER_PATTERN = 'UNUSUAL_ORDER_PATTERN',
  BOT_ACTIVITY = 'BOT_ACTIVITY',
  RATE_LIMIT_VIOLATION = 'RATE_LIMIT_VIOLATION',
  MULTIPLE_ACCOUNT_CREATION = 'MULTIPLE_ACCOUNT_CREATION'
}

export enum ThreatSeverity {
  INFO = 'INFO',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export enum ThreatStatus {
  ACTIVE = 'ACTIVE',
  INVESTIGATING = 'INVESTIGATING',
  MITIGATED = 'MITIGATED',
  FALSE_POSITIVE = 'FALSE_POSITIVE',
  RESOLVED = 'RESOLVED'
}

export enum ResponseAction {
  NONE = 'NONE',
  LOG_ONLY = 'LOG_ONLY',
  RATE_LIMIT = 'RATE_LIMIT',
  TEMPORARY_BLOCK = 'TEMPORARY_BLOCK',
  ACCOUNT_LOCK = 'ACCOUNT_LOCK',
  IP_BLOCK = 'IP_BLOCK',
  ALERT_ADMIN = 'ALERT_ADMIN',
  FORCE_2FA = 'FORCE_2FA',
  REQUIRE_PASSWORD_RESET = 'REQUIRE_PASSWORD_RESET'
}

@Schema({ timestamps: true })
export class ThreatDetection {
  @ApiProperty({ description: 'Type of threat detected', enum: ThreatType })
  @Prop({ required: true, enum: Object.values(ThreatType) })
  @IsEnum(ThreatType)
  threatType: ThreatType;

  @ApiProperty({ description: 'Threat severity level', enum: ThreatSeverity })
  @Prop({ required: true, enum: Object.values(ThreatSeverity) })
  @IsEnum(ThreatSeverity)
  severity: ThreatSeverity;

  @ApiProperty({ description: 'Current status of the threat', enum: ThreatStatus })
  @Prop({ required: true, enum: Object.values(ThreatStatus), default: ThreatStatus.ACTIVE })
  @IsEnum(ThreatStatus)
  status: ThreatStatus;

  @ApiProperty({ description: 'User ID associated with the threat (if applicable)' })
  @Prop({ required: false, type: Types.ObjectId, ref: 'User' })
  @IsOptional()
  userId?: Types.ObjectId;

  @ApiProperty({ description: 'IP address from which the threat originated' })
  @Prop({ required: true, type: String })
  @IsString()
  @IsNotEmpty()
  ipAddress: string;

  @ApiProperty({ description: 'User agent of the threat source' })
  @Prop({ required: false, type: String })
  @IsOptional()
  @IsString()
  userAgent?: string;

  @ApiProperty({ description: 'Risk score (0-100)' })
  @Prop({ required: true, type: Number, min: 0, max: 100 })
  @IsNumber()
  riskScore: number;

  @ApiProperty({ description: 'Confidence level in threat detection (0-100)' })
  @Prop({ required: true, type: Number, min: 0, max: 100 })
  @IsNumber()
  confidenceLevel: number;

  @ApiProperty({ description: 'Description of the threat' })
  @Prop({ required: true, type: String })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ description: 'Detailed analysis of the threat' })
  @Prop({ required: false, type: String })
  @IsOptional()
  @IsString()
  details?: string;

  @ApiProperty({ description: 'Evidence supporting the threat detection' })
  @Prop({ required: false, type: Object })
  @IsOptional()
  @IsObject()
  evidence?: {
    patterns?: string[];
    anomalies?: Record<string, any>;
    timestamps?: Date[];
    requestUrls?: string[];
    payloads?: string[];
    headers?: Record<string, string>;
  };

  @ApiProperty({ description: 'Geolocation information' })
  @Prop({ required: false, type: Object })
  @IsOptional()
  @IsObject()
  geolocation?: {
    country?: string;
    region?: string;
    city?: string;
    latitude?: number;
    longitude?: number;
    timezone?: string;
    isp?: string;
  };

  @ApiProperty({ description: 'Response actions taken', enum: ResponseAction, isArray: true })
  @Prop({ required: false, type: [String], enum: Object.values(ResponseAction) })
  @IsOptional()
  @IsArray()
  responseActions?: ResponseAction[];

  @ApiProperty({ description: 'Automated response taken by the system' })
  @Prop({ required: false, type: String })
  @IsOptional()
  @IsString()
  automatedResponse?: string;

  @ApiProperty({ description: 'Manual actions taken by administrators' })
  @Prop({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  manualActions?: string[];

  @ApiProperty({ description: 'Administrator who handled the threat' })
  @Prop({ required: false, type: Types.ObjectId, ref: 'User' })
  @IsOptional()
  handledBy?: Types.ObjectId;

  @ApiProperty({ description: 'Notes from threat investigation' })
  @Prop({ required: false, type: String })
  @IsOptional()
  @IsString()
  investigationNotes?: string;

  @ApiProperty({ description: 'When the threat was first detected' })
  @Prop({ required: true, type: Date, default: Date.now })
  firstDetectedAt: Date;

  @ApiProperty({ description: 'When the threat was last seen' })
  @Prop({ required: true, type: Date, default: Date.now })
  lastSeenAt: Date;

  @ApiProperty({ description: 'Number of times this threat pattern was detected' })
  @Prop({ required: true, type: Number, default: 1 })
  occurrenceCount: number;

  @ApiProperty({ description: 'Related threat IDs (for pattern analysis)' })
  @Prop({ required: false, type: [Types.ObjectId], ref: 'ThreatDetection' })
  @IsOptional()
  @IsArray()
  relatedThreats?: Types.ObjectId[];

  @ApiProperty({ description: 'Whether this threat is part of a coordinated attack' })
  @Prop({ required: false, type: Boolean, default: false })
  @IsOptional()
  isCoordinated?: boolean;

  @ApiProperty({ description: 'Attack campaign ID (if part of larger campaign)' })
  @Prop({ required: false, type: String })
  @IsOptional()
  @IsString()
  campaignId?: string;

  @ApiProperty({ description: 'Whether alerts were sent for this threat' })
  @Prop({ required: false, type: Boolean, default: false })
  @IsOptional()
  alertsSent?: boolean;

  @ApiProperty({ description: 'Recipients of threat alerts' })
  @Prop({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  alertRecipients?: string[];
}

export const ThreatDetectionSchema = SchemaFactory.createForClass(ThreatDetection);

// Add indexes for efficient querying
ThreatDetectionSchema.index({ threatType: 1, status: 1 });
ThreatDetectionSchema.index({ ipAddress: 1, firstDetectedAt: -1 });
ThreatDetectionSchema.index({ userId: 1, firstDetectedAt: -1 });
ThreatDetectionSchema.index({ severity: 1, status: 1 });
ThreatDetectionSchema.index({ riskScore: -1 });
ThreatDetectionSchema.index({ firstDetectedAt: -1 });
ThreatDetectionSchema.index({ lastSeenAt: -1 });
ThreatDetectionSchema.index({ isCoordinated: 1, campaignId: 1 });
ThreatDetectionSchema.index({ status: 1, handledBy: 1 });

// Compound indexes for complex queries
ThreatDetectionSchema.index({ threatType: 1, severity: 1, status: 1 });
ThreatDetectionSchema.index({ ipAddress: 1, threatType: 1, firstDetectedAt: -1 });

// Text index for searching descriptions and details
ThreatDetectionSchema.index({ 
  description: 'text', 
  details: 'text', 
  investigationNotes: 'text' 
});
