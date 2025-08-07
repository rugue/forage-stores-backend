import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ThreatDetection, ThreatDetectionDocument } from '../entities/threat-detection.entity';
import { SecurityAuditService } from './security-audit.service';
import { SecurityEventType, SecurityEventSeverity } from '../entities/security-audit-log.entity';
import { SECURITY_CONSTANTS, THREAT_TYPE_DESCRIPTIONS } from '../constants/security.constants';
import { CreateThreatDetectionDto, ThreatDetectionFilterDto } from '../dto';

@Injectable()
export class ThreatDetectionService {
  private readonly logger = new Logger(ThreatDetectionService.name);
  private readonly suspiciousIPs = new Set<string>();
  private readonly blockedIPs = new Set<string>();
  private readonly failedAttempts = new Map<string, { count: number; lastAttempt: Date }>();

  constructor(
    @InjectModel(ThreatDetection.name) private readonly threatModel: Model<ThreatDetectionDocument>,
    private readonly securityAuditService: SecurityAuditService,
  ) {
    // Initialize with any previously blocked IPs
    this.initializeBlockedIPs();
  }

  /**
   * Detect and analyze potential security threats
   */
  async analyzeSecurityEvent(
    eventType: string,
    userId?: string,
    ipAddress?: string,
    userAgent?: string,
    metadata?: Record<string, any>
  ): Promise<ThreatDetectionDocument | null> {
    try {
      const analysisResult = await this.performThreatAnalysis(
        eventType,
        userId,
        ipAddress,
        userAgent,
        metadata
      );

      if (analysisResult.isThreat) {
        return await this.createThreatRecord({
          threatType: analysisResult.threatType,
          description: analysisResult.description,
          userId,
          ipAddress,
          riskScore: analysisResult.riskScore,
          metadata: {
            ...metadata,
            userAgent,
            eventType,
            detectionReason: analysisResult.detectionReason,
            analysisDetails: analysisResult.analysisDetails
          }
        });
      }

      return null;
    } catch (error) {
      this.logger.error(`Error analyzing security event: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Create a threat detection record
   */
  async createThreatRecord(createDto: CreateThreatDetectionDto): Promise<ThreatDetectionDocument> {
    try {
      const threat = new this.threatModel({
        ...createDto,
        userId: createDto.userId ? new Types.ObjectId(createDto.userId) : undefined,
        detectedAt: new Date(),
        status: 'detected'
      });

      const savedThreat = await threat.save();

      // Auto-block high-risk threats
      if (savedThreat.riskScore >= SECURITY_CONSTANTS.THREAT_DETECTION.AUTO_BLOCK_THRESHOLD) {
        await this.autoBlockThreat(savedThreat);
      }

      // Log threat detection in audit log
      await this.securityAuditService.createAuditLog({
        eventType: SecurityEventType.SUSPICIOUS_ACTIVITY,
        description: `Threat detected: ${createDto.threatType} - ${createDto.description}`,
        userId: createDto.userId,
        ipAddress: createDto.ipAddress,
        severity: this.mapRiskScoreToSeverity(createDto.riskScore || 0),
        metadata: {
          threatId: savedThreat._id.toString(),
          threatType: createDto.threatType,
          riskScore: createDto.riskScore
        }
      });

      this.logger.warn(`Threat detected: ${createDto.threatType} - Risk Score: ${createDto.riskScore}`);

      return savedThreat;
    } catch (error) {
      this.logger.error(`Failed to create threat record: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get threats with filtering
   */
  async getThreats(filterDto: ThreatDetectionFilterDto): Promise<{
    threats: ThreatDetectionDocument[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const {
      threatType,
      userId,
      ipAddress,
      startDate,
      endDate,
      page = 1,
      limit = 20
    } = filterDto;

    const query: any = {};

    // Build query filters
    if (threatType) {
      query.threatType = threatType;
    }

    if (userId) {
      query.userId = new Types.ObjectId(userId);
    }

    if (ipAddress) {
      query.ipAddress = ipAddress;
    }

    if (startDate || endDate) {
      query.detectedAt = {};
      if (startDate) {
        query.detectedAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.detectedAt.$lte = new Date(endDate);
      }
    }

    // Execute query with pagination
    const skip = (page - 1) * limit;
    
    const [threats, total] = await Promise.all([
      this.threatModel
        .find(query)
        .populate('userId', 'name email role')
        .sort({ detectedAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.threatModel.countDocuments(query)
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      threats,
      total,
      page,
      limit,
      totalPages
    };
  }

  /**
   * Check if IP is blocked
   */
  isIPBlocked(ipAddress: string): boolean {
    return this.blockedIPs.has(ipAddress);
  }

  /**
   * Block an IP address
   */
  async blockIP(ipAddress: string, reason: string, duration?: number): Promise<void> {
    this.blockedIPs.add(ipAddress);
    
    // Store in database for persistence
    await this.createThreatRecord({
      threatType: 'IP_BLOCKED',
      description: `IP address blocked: ${reason}`,
      ipAddress,
      riskScore: 100,
      metadata: {
        blockReason: reason,
        blockDuration: duration,
        blockedAt: new Date()
      }
    });

    // Auto-unblock after duration if specified
    if (duration) {
      setTimeout(() => {
        this.unblockIP(ipAddress);
      }, duration);
    }

    this.logger.warn(`IP ${ipAddress} blocked: ${reason}`);
  }

  /**
   * Unblock an IP address
   */
  unblockIP(ipAddress: string): void {
    this.blockedIPs.delete(ipAddress);
    this.logger.log(`IP ${ipAddress} unblocked`);
  }

  /**
   * Get threat analytics
   */
  async getThreatAnalytics(days: number = 30): Promise<any> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const analytics = await this.threatModel.aggregate([
      { $match: { detectedAt: { $gte: startDate } } },
      {
        $facet: {
          // Threat types distribution
          threatTypes: [
            { $group: { _id: '$threatType', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
          ],
          
          // Risk score distribution
          riskDistribution: [
            {
              $group: {
                _id: {
                  $switch: {
                    branches: [
                      { case: { $lt: ['$riskScore', 30] }, then: 'Low' },
                      { case: { $lt: ['$riskScore', 60] }, then: 'Medium' },
                      { case: { $lt: ['$riskScore', 85] }, then: 'High' },
                      { case: { $gte: ['$riskScore', 85] }, then: 'Critical' }
                    ]
                  }
                },
                count: { $sum: 1 }
              }
            }
          ],
          
          // Daily trends
          dailyTrends: [
            {
              $group: {
                _id: {
                  date: { 
                    $dateToString: { 
                      format: '%Y-%m-%d', 
                      date: '$detectedAt' 
                    } 
                  }
                },
                count: { $sum: 1 },
                avgRiskScore: { $avg: '$riskScore' }
              }
            },
            { $sort: { '_id.date': 1 } }
          ],
          
          // Top suspicious IPs
          topIPs: [
            { $match: { ipAddress: { $exists: true, $ne: null } } },
            { $group: { _id: '$ipAddress', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
          ],
          
          // Status distribution
          statusDistribution: [
            { $group: { _id: '$status', count: { $sum: 1 } } }
          ],
          
          // Summary stats
          summary: [
            {
              $group: {
                _id: null,
                totalThreats: { $sum: 1 },
                avgRiskScore: { $avg: '$riskScore' },
                maxRiskScore: { $max: '$riskScore' },
                criticalThreats: { 
                  $sum: { 
                    $cond: [{ $gte: ['$riskScore', 85] }, 1, 0] 
                  } 
                },
                blockedIPs: { 
                  $sum: { 
                    $cond: [{ $eq: ['$threatType', 'IP_BLOCKED'] }, 1, 0] 
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
   * Clean up old threat records
   */
  async cleanupOldThreats(): Promise<{ deletedCount: number }> {
    const retentionDate = new Date();
    retentionDate.setDate(retentionDate.getDate() - SECURITY_CONSTANTS.THREAT_DETECTION.MAX_THREAT_RETENTION_DAYS);

    const result = await this.threatModel.deleteMany({
      detectedAt: { $lt: retentionDate },
      status: { $nin: ['blocked', 'escalated'] }
    });

    this.logger.log(`Cleaned up ${result.deletedCount} old threat records`);
    
    return { deletedCount: result.deletedCount };
  }

  // Private helper methods

  private async performThreatAnalysis(
    eventType: string,
    userId?: string,
    ipAddress?: string,
    userAgent?: string,
    metadata?: Record<string, any>
  ): Promise<{
    isThreat: boolean;
    threatType?: string;
    description?: string;
    riskScore?: number;
    detectionReason?: string;
    analysisDetails?: Record<string, any>;
  }> {
    const analysisResults = [];

    // 1. Brute force detection
    if (eventType === 'LOGIN_FAILED' && ipAddress) {
      const bruteForceAnalysis = this.analyzeeBruteForceAttempt(ipAddress);
      if (bruteForceAnalysis.isThreat) {
        analysisResults.push(bruteForceAnalysis);
      }
    }

    // 2. Rate limiting analysis
    const rateLimitAnalysis = this.analyzeRateLimit(ipAddress, eventType);
    if (rateLimitAnalysis.isThreat) {
      analysisResults.push(rateLimitAnalysis);
    }

    // 3. Suspicious pattern detection
    const patternAnalysis = this.analyzePatterns(eventType, userId, ipAddress, userAgent, metadata);
    if (patternAnalysis.isThreat) {
      analysisResults.push(patternAnalysis);
    }

    // 4. Geographic anomaly detection
    if (ipAddress) {
      const geoAnalysis = await this.analyzeGeographicAnomaly(ipAddress, userId);
      if (geoAnalysis.isThreat) {
        analysisResults.push(geoAnalysis);
      }
    }

    // Return the highest risk analysis result
    if (analysisResults.length > 0) {
      const highestRisk = analysisResults.reduce((max, current) => 
        (current.riskScore || 0) > (max.riskScore || 0) ? current : max
      );
      return highestRisk;
    }

    return { isThreat: false };
  }

  private analyzeeBruteForceAttempt(ipAddress: string): any {
    const key = `brute_force_${ipAddress}`;
    const now = new Date();
    const windowStart = new Date(now.getTime() - SECURITY_CONSTANTS.THREAT_DETECTION.BRUTE_FORCE_WINDOW);

    let attempts = this.failedAttempts.get(key);
    if (!attempts) {
      attempts = { count: 0, lastAttempt: now };
      this.failedAttempts.set(key, attempts);
    }

    // Reset counter if outside window
    if (attempts.lastAttempt < windowStart) {
      attempts.count = 0;
    }

    attempts.count++;
    attempts.lastAttempt = now;

    if (attempts.count >= SECURITY_CONSTANTS.THREAT_DETECTION.BRUTE_FORCE_THRESHOLD) {
      return {
        isThreat: true,
        threatType: 'BRUTE_FORCE_ATTACK',
        description: THREAT_TYPE_DESCRIPTIONS.BRUTE_FORCE_ATTACK,
        riskScore: 80,
        detectionReason: `${attempts.count} failed attempts from ${ipAddress}`,
        analysisDetails: {
          failedAttempts: attempts.count,
          timeWindow: SECURITY_CONSTANTS.THREAT_DETECTION.BRUTE_FORCE_WINDOW
        }
      };
    }

    return { isThreat: false };
  }

  private analyzeRateLimit(ipAddress?: string, eventType?: string): any {
    // Simplified rate limit analysis
    // In production, this would use Redis or similar for distributed rate limiting
    if (!ipAddress) return { isThreat: false };

    // This is a placeholder - implement actual rate limiting logic
    return { isThreat: false };
  }

  private analyzePatterns(
    eventType: string,
    userId?: string,
    ipAddress?: string,
    userAgent?: string,
    metadata?: Record<string, any>
  ): any {
    const suspiciousPatterns = [];

    // Check for suspicious user agent
    if (userAgent && SECURITY_CONSTANTS.PATTERNS.SUSPICIOUS_USER_AGENT.test(userAgent)) {
      suspiciousPatterns.push('suspicious_user_agent');
    }

    // Check for injection attempts in metadata
    if (metadata) {
      const metadataString = JSON.stringify(metadata);
      if (SECURITY_CONSTANTS.PATTERNS.SQL_INJECTION.test(metadataString)) {
        suspiciousPatterns.push('sql_injection_attempt');
      }
      if (SECURITY_CONSTANTS.PATTERNS.XSS.test(metadataString)) {
        suspiciousPatterns.push('xss_attempt');
      }
    }

    if (suspiciousPatterns.length > 0) {
      return {
        isThreat: true,
        threatType: 'SUSPICIOUS_LOGIN_PATTERN',
        description: THREAT_TYPE_DESCRIPTIONS.SUSPICIOUS_LOGIN_PATTERN,
        riskScore: 60,
        detectionReason: `Suspicious patterns detected: ${suspiciousPatterns.join(', ')}`,
        analysisDetails: {
          patterns: suspiciousPatterns,
          userAgent
        }
      };
    }

    return { isThreat: false };
  }

  private async analyzeGeographicAnomaly(ipAddress: string, userId?: string): Promise<any> {
    // Placeholder for geographic analysis
    // In production, this would use IP geolocation services
    // and compare with user's historical locations
    return { isThreat: false };
  }

  private async autoBlockThreat(threat: ThreatDetectionDocument): Promise<void> {
    if (threat.ipAddress) {
      await this.blockIP(
        threat.ipAddress,
        `Auto-blocked due to high-risk threat: ${threat.threatType}`,
        24 * 60 * 60 * 1000 // 24 hours
      );

      // Update threat record
      await this.threatModel.updateOne(
        { _id: threat._id },
        {
          $set: {
            status: 'blocked',
            blockedAt: new Date(),
            autoBlocked: true
          }
        }
      );
    }
  }

  private mapRiskScoreToSeverity(riskScore: number): SecurityEventSeverity {
    if (riskScore >= 85) return SecurityEventSeverity.CRITICAL;
    if (riskScore >= 60) return SecurityEventSeverity.HIGH;
    if (riskScore >= 30) return SecurityEventSeverity.MEDIUM;
    return SecurityEventSeverity.LOW;
  }

  private async initializeBlockedIPs(): Promise<void> {
    try {
      // Load previously blocked IPs from database
      const blockedThreats = await this.threatModel.find({
        threatType: 'IP_BLOCKED',
        status: 'blocked'
      });

      for (const threat of blockedThreats) {
        if (threat.ipAddress) {
          this.blockedIPs.add(threat.ipAddress);
        }
      }

      this.logger.log(`Initialized with ${this.blockedIPs.size} blocked IPs`);
    } catch (error) {
      this.logger.error(`Failed to initialize blocked IPs: ${error.message}`);
    }
  }
}
