import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { SecurityAuditLog, SecurityAuditLogDocument, SecurityEventType, SecurityEventSeverity } from '../entities/security-audit-log.entity';
import { CreateAuditLogDto, UpdateAuditLogStatusDto, AuditLogFilterDto } from '../dto';
import { SECURITY_CONSTANTS } from '../constants';

@Injectable()
export class SecurityAuditService {
  private readonly logger = new Logger(SecurityAuditService.name);

  constructor(
    @InjectModel(SecurityAuditLog.name) private readonly auditLogModel: Model<SecurityAuditLogDocument>,
  ) {}

  /**
   * Create a security audit log entry
   */
  async createAuditLog(createDto: CreateAuditLogDto): Promise<SecurityAuditLogDocument> {
    try {
      // Calculate risk score based on event type and severity
      const riskScore = this.calculateRiskScore(createDto.eventType, createDto.severity);
      
      // Determine if this event should trigger an alert
      const alertTriggered = this.shouldTriggerAlert(createDto.eventType, createDto.severity, riskScore);

      const auditLog = new this.auditLogModel({
        ...createDto,
        severity: createDto.severity || SecurityEventSeverity.LOW,
        riskScore,
        alertTriggered,
        userId: createDto.userId ? new Types.ObjectId(createDto.userId) : undefined
      });

      const savedLog = await auditLog.save();

      // If alert should be triggered, handle alerting
      if (alertTriggered) {
        await this.handleSecurityAlert(savedLog);
      }

      this.logger.log(`Security audit log created: ${createDto.eventType} - ${createDto.description}`);
      
      return savedLog;
    } catch (error) {
      this.logger.error(`Failed to create audit log: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get audit logs with filtering
   */
  async getAuditLogs(filterDto: AuditLogFilterDto): Promise<{
    logs: SecurityAuditLogDocument[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const {
      eventTypes,
      severities,
      userId,
      ipAddress,
      startDate,
      endDate,
      searchText,
      page = 1,
      limit = 20
    } = filterDto;

    const query: any = {};

    // Build query filters
    if (eventTypes && eventTypes.length > 0) {
      query.eventType = { $in: eventTypes };
    }

    if (severities && severities.length > 0) {
      query.severity = { $in: severities };
    }

    if (userId) {
      query.userId = new Types.ObjectId(userId);
    }

    if (ipAddress) {
      query.ipAddress = ipAddress;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }

    if (searchText) {
      query.$text = { $search: searchText };
    }

    // Execute query with pagination
    const skip = (page - 1) * limit;
    
    const [logs, total] = await Promise.all([
      this.auditLogModel
        .find(query)
        .populate('userId', 'name email role')
        .populate('adminId', 'name email role')
        .populate('resolvedBy', 'name email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.auditLogModel.countDocuments(query)
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      logs,
      total,
      page,
      limit,
      totalPages
    };
  }

  /**
   * Get audit log by ID
   */
  async getAuditLogById(id: string): Promise<SecurityAuditLogDocument> {
    const auditLog = await this.auditLogModel
      .findById(id)
      .populate('userId', 'name email role')
      .populate('adminId', 'name email role')
      .populate('resolvedBy', 'name email role')
      .exec();

    if (!auditLog) {
      throw new Error(SECURITY_CONSTANTS.ERRORS.AUDIT_LOG_NOT_FOUND);
    }

    return auditLog;
  }

  /**
   * Update audit log status
   */
  async updateAuditLogStatus(
    id: string, 
    updateDto: UpdateAuditLogStatusDto,
    resolvedBy?: string
  ): Promise<SecurityAuditLogDocument> {
    const updateData: any = {
      status: updateDto.status,
      resolutionNotes: updateDto.resolutionNotes
    };

    if (resolvedBy) {
      updateData.resolvedBy = new Types.ObjectId(resolvedBy);
      updateData.resolvedAt = new Date();
    }

    const updatedLog = await this.auditLogModel
      .findByIdAndUpdate(id, { $set: updateData }, { new: true })
      .populate('userId', 'name email role')
      .populate('adminId', 'name email role')
      .populate('resolvedBy', 'name email role')
      .exec();

    if (!updatedLog) {
      throw new Error(SECURITY_CONSTANTS.ERRORS.AUDIT_LOG_NOT_FOUND);
    }

    this.logger.log(`Audit log ${id} status updated to ${updateDto.status}`);

    return updatedLog;
  }

  /**
   * Get security analytics
   */
  async getSecurityAnalytics(startDate?: Date, endDate?: Date): Promise<any> {
    const matchFilter: any = {};
    
    if (startDate || endDate) {
      matchFilter.createdAt = {};
      if (startDate) {
        matchFilter.createdAt.$gte = startDate;
      }
      if (endDate) {
        matchFilter.createdAt.$lte = endDate;
      }
    }

    const analytics = await this.auditLogModel.aggregate([
      { $match: matchFilter },
      {
        $facet: {
          // Event types distribution
          eventTypeStats: [
            { $group: { _id: '$eventType', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
          ],
          
          // Severity distribution
          severityStats: [
            { $group: { _id: '$severity', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
          ],
          
          // Daily trends
          dailyTrends: [
            {
              $group: {
                _id: { 
                  date: { 
                    $dateToString: { 
                      format: '%Y-%m-%d', 
                      date: '$createdAt' 
                    } 
                  }
                },
                count: { $sum: 1 },
                avgRiskScore: { $avg: '$riskScore' }
              }
            },
            { $sort: { '_id.date': 1 } }
          ],
          
          // High-risk events
          highRiskEvents: [
            { $match: { riskScore: { $gte: SECURITY_CONSTANTS.AUDIT.HIGH_RISK_THRESHOLD } } },
            { $sort: { createdAt: -1 } },
            { $limit: 10 }
          ],
          
          // Top IPs by event count
          topIPs: [
            { $match: { ipAddress: { $exists: true, $ne: null } } },
            { $group: { _id: '$ipAddress', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
          ],
          
          // User activity stats
          userStats: [
            { $match: { userId: { $exists: true, $ne: null } } },
            { $group: { _id: '$userId', eventCount: { $sum: 1 } } },
            { $sort: { eventCount: -1 } },
            { $limit: 10 }
          ],

          // Summary stats
          summary: [
            {
              $group: {
                _id: null,
                totalEvents: { $sum: 1 },
                avgRiskScore: { $avg: '$riskScore' },
                maxRiskScore: { $max: '$riskScore' },
                alertsTriggered: { $sum: { $cond: ['$alertTriggered', 1, 0] } },
                criticalEvents: { 
                  $sum: { 
                    $cond: [
                      { $eq: ['$severity', SecurityEventSeverity.CRITICAL] }, 
                      1, 
                      0
                    ] 
                  } 
                },
                highSeverityEvents: { 
                  $sum: { 
                    $cond: [
                      { $eq: ['$severity', SecurityEventSeverity.HIGH] }, 
                      1, 
                      0
                    ] 
                  } 
                }
              }
            }
          ]
        }
      }
    ]);

    return analytics[0];
  }

  /**
   * Get recent security events
   */
  async getRecentSecurityEvents(limit: number = 50): Promise<SecurityAuditLogDocument[]> {
    return this.auditLogModel
      .find()
      .populate('userId', 'name email role')
      .populate('adminId', 'name email role')
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
  }

  /**
   * Get security events for a specific user
   */
  async getUserSecurityEvents(userId: string, limit: number = 20): Promise<SecurityAuditLogDocument[]> {
    return this.auditLogModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
  }

  /**
   * Get critical security events
   */
  async getCriticalEvents(limit: number = 10): Promise<SecurityAuditLogDocument[]> {
    return this.auditLogModel
      .find({
        $or: [
          { severity: SecurityEventSeverity.CRITICAL },
          { riskScore: { $gte: SECURITY_CONSTANTS.AUDIT.CRITICAL_RISK_THRESHOLD } },
          { alertTriggered: true }
        ]
      })
      .populate('userId', 'name email role')
      .populate('adminId', 'name email role')
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
  }

  /**
   * Clean up old audit logs (retention policy)
   */
  async cleanupOldLogs(): Promise<{ deletedCount: number }> {
    const retentionDate = new Date();
    retentionDate.setDate(retentionDate.getDate() - SECURITY_CONSTANTS.AUDIT.RETENTION_DAYS);

    const result = await this.auditLogModel.deleteMany({
      createdAt: { $lt: retentionDate },
      severity: { $nin: [SecurityEventSeverity.CRITICAL, SecurityEventSeverity.HIGH] }
    });

    this.logger.log(`Cleaned up ${result.deletedCount} old audit log entries`);
    
    return { deletedCount: result.deletedCount };
  }

  // Private helper methods

  private calculateRiskScore(eventType: SecurityEventType, severity?: SecurityEventSeverity): number {
    let baseScore = 0;

    // Base score by severity
    switch (severity) {
      case SecurityEventSeverity.CRITICAL:
        baseScore = 90;
        break;
      case SecurityEventSeverity.HIGH:
        baseScore = 70;
        break;
      case SecurityEventSeverity.MEDIUM:
        baseScore = 40;
        break;
      case SecurityEventSeverity.LOW:
        baseScore = 10;
        break;
      default:
        baseScore = 5;
    }

    // Adjust score based on event type
    const highRiskEvents = [
      SecurityEventType.ADMIN_WALLET_WIPE,
      SecurityEventType.ADMIN_WALLET_FUND,
      SecurityEventType.TWO_FA_DISABLED,
      SecurityEventType.MULTIPLE_FAILED_ATTEMPTS,
      SecurityEventType.SUSPICIOUS_ACTIVITY
    ];

    if (highRiskEvents.includes(eventType)) {
      baseScore += 20;
    }

    return Math.min(baseScore, 100);
  }

  private shouldTriggerAlert(
    eventType: SecurityEventType,
    severity?: SecurityEventSeverity,
    riskScore?: number
  ): boolean {
    // Always alert for critical events
    if (SECURITY_CONSTANTS.ALERTS.CRITICAL_EVENTS.includes(eventType.toString())) {
      return true;
    }

    // Alert for high severity events
    if (severity === SecurityEventSeverity.CRITICAL || severity === SecurityEventSeverity.HIGH) {
      return true;
    }

    // Alert for high-risk events
    if (riskScore && riskScore >= SECURITY_CONSTANTS.AUDIT.HIGH_RISK_THRESHOLD) {
      return true;
    }

    return false;
  }

  private async handleSecurityAlert(auditLog: SecurityAuditLogDocument): Promise<void> {
    // This would implement actual alerting mechanisms:
    // - Send email notifications
    // - Send Slack notifications
    // - Call webhook endpoints
    // - Send SMS alerts for critical events
    
    this.logger.warn(`Security alert triggered: ${auditLog.eventType} - ${auditLog.description}`);
    
    // Update the audit log with alert information
    await this.auditLogModel.updateOne(
      { _id: auditLog._id },
      {
        $set: {
          alertsSent: true,
          alertRecipients: ['admin@forage.com', 'security@forage.com'] // Would be configurable
        }
      }
    );
  }
}
