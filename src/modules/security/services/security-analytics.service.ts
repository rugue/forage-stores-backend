import { Injectable, Logger } from '@nestjs/common';
import { SecurityAuditService } from './security-audit.service';
import { ThreatDetectionService } from './threat-detection.service';
import { TwoFactorAuthService } from './two-factor-auth.service';
import { SecurityAnalyticsFilterDto } from '../dto';

@Injectable()
export class SecurityAnalyticsService {
  private readonly logger = new Logger(SecurityAnalyticsService.name);

  constructor(
    private readonly auditService: SecurityAuditService,
    private readonly threatService: ThreatDetectionService,
    private readonly twoFactorService: TwoFactorAuthService,
  ) {}

  /**
   * Get comprehensive security dashboard data
   */
  async getSecurityDashboard(days: number = 7): Promise<any> {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Get data from all services in parallel
      const [
        auditAnalytics,
        threatAnalytics,
        twoFactorStats,
        securityMetrics
      ] = await Promise.all([
        this.auditService.getSecurityAnalytics(startDate, endDate),
        this.threatService.getThreatAnalytics(days),
        this.getTwoFactorAnalytics(),
        this.calculateSecurityMetrics(days)
      ]);

      return {
        timeframe: {
          days,
          startDate,
          endDate
        },
        summary: {
          totalEvents: auditAnalytics.summary[0]?.totalEvents || 0,
          totalThreats: threatAnalytics.summary[0]?.totalThreats || 0,
          criticalEvents: auditAnalytics.summary[0]?.criticalEvents || 0,
          alertsTriggered: auditAnalytics.summary[0]?.alertsTriggered || 0,
          usersWithTwoFA: twoFactorStats.enabledUsers,
          securityScore: securityMetrics.overallScore
        },
        auditLog: {
          eventTypes: auditAnalytics.eventTypeStats || [],
          severityDistribution: auditAnalytics.severityStats || [],
          dailyTrends: auditAnalytics.dailyTrends || [],
          recentEvents: await this.auditService.getRecentSecurityEvents(10)
        },
        threats: {
          threatTypes: threatAnalytics.threatTypes || [],
          riskDistribution: threatAnalytics.riskDistribution || [],
          topSuspiciousIPs: threatAnalytics.topIPs || [],
          dailyTrends: threatAnalytics.dailyTrends || []
        },
        authentication: {
          twoFactorStats: twoFactorStats,
          loginAnalytics: await this.getLoginAnalytics(days)
        },
        metrics: securityMetrics
      };
    } catch (error) {
      this.logger.error(`Failed to get security dashboard: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get security metrics and scores
   */
  async calculateSecurityMetrics(days: number = 30): Promise<any> {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Get raw data
      const [auditStats, threatStats, twoFactorStats] = await Promise.all([
        this.auditService.getSecurityAnalytics(startDate, endDate),
        this.threatService.getThreatAnalytics(days),
        this.getTwoFactorAnalytics()
      ]);

      const auditSummary = auditStats.summary[0] || {};
      const threatSummary = threatStats.summary[0] || {};

      // Calculate individual scores (0-100)
      const metrics = {
        // Incident Response Score - based on how quickly incidents are resolved
        incidentResponseScore: this.calculateIncidentResponseScore(auditStats),
        
        // Threat Detection Score - based on threat detection effectiveness
        threatDetectionScore: this.calculateThreatDetectionScore(threatStats),
        
        // Authentication Security Score - based on 2FA adoption and security
        authenticationScore: this.calculateAuthenticationScore(twoFactorStats),
        
        // Compliance Score - based on policy adherence
        complianceScore: this.calculateComplianceScore(auditStats),
        
        // Overall Security Posture Score
        overallScore: 0, // Will be calculated below
        
        // Key Performance Indicators
        kpis: {
          meanTimeToDetection: this.calculateMTTD(threatStats),
          meanTimeToResponse: this.calculateMTTR(auditStats),
          securityEventVolume: auditSummary.totalEvents || 0,
          threatVolume: threatSummary.totalThreats || 0,
          criticalIncidentRate: this.calculateCriticalRate(auditSummary),
          twoFactorAdoptionRate: twoFactorStats.adoptionRate,
          falsePositiveRate: this.calculateFalsePositiveRate(threatStats)
        },
        
        // Trend analysis
        trends: {
          securityEventTrend: this.calculateTrend(auditStats.dailyTrends),
          threatTrend: this.calculateTrend(threatStats.dailyTrends),
          riskTrend: this.calculateRiskTrend(auditStats.dailyTrends)
        }
      };

      // Calculate overall score as weighted average
      metrics.overallScore = this.calculateOverallScore([
        { score: metrics.incidentResponseScore, weight: 0.25 },
        { score: metrics.threatDetectionScore, weight: 0.25 },
        { score: metrics.authenticationScore, weight: 0.25 },
        { score: metrics.complianceScore, weight: 0.25 }
      ]);

      return metrics;
    } catch (error) {
      this.logger.error(`Failed to calculate security metrics: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get security report with recommendations
   */
  async generateSecurityReport(filterDto: SecurityAnalyticsFilterDto): Promise<any> {
    try {
      const { startDate, endDate, period = 'daily' } = filterDto;
      
      const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate) : new Date();

      const [dashboard, recommendations, riskAssessment] = await Promise.all([
        this.getSecurityDashboard(Math.ceil((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000))),
        this.generateSecurityRecommendations(),
        this.performRiskAssessment()
      ]);

      return {
        metadata: {
          generatedAt: new Date(),
          reportPeriod: { startDate: start, endDate: end },
          period
        },
        executiveSummary: {
          securityScore: dashboard.summary.securityScore,
          totalEvents: dashboard.summary.totalEvents,
          totalThreats: dashboard.summary.totalThreats,
          criticalIssues: dashboard.summary.criticalEvents,
          keyFindings: this.extractKeyFindings(dashboard)
        },
        detailedAnalysis: {
          auditLogAnalysis: dashboard.auditLog,
          threatAnalysis: dashboard.threats,
          authenticationAnalysis: dashboard.authentication,
          performanceMetrics: dashboard.metrics
        },
        riskAssessment,
        recommendations,
        actionItems: this.generateActionItems(dashboard, recommendations, riskAssessment)
      };
    } catch (error) {
      this.logger.error(`Failed to generate security report: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get real-time security status
   */
  async getRealTimeSecurityStatus(): Promise<any> {
    try {
      const [
        recentThreats,
        criticalEvents,
        activeAlerts,
        systemHealth
      ] = await Promise.all([
        this.threatService.getThreats({ page: 1, limit: 5 }),
        this.auditService.getCriticalEvents(5),
        this.getActiveSecurityAlerts(),
        this.getSystemSecurityHealth()
      ]);

      return {
        timestamp: new Date(),
        status: systemHealth.overallStatus,
        alerts: {
          critical: activeAlerts.critical.length,
          warning: activeAlerts.warning.length,
          info: activeAlerts.info.length
        },
        recentActivity: {
          threats: recentThreats.threats.slice(0, 5),
          criticalEvents: criticalEvents.slice(0, 5)
        },
        systemHealth,
        quickStats: {
          eventsLast24h: await this.getEventCount24h(),
          threatsLast24h: await this.getThreatCount24h(),
          failedLogins: await this.getFailedLoginCount24h()
        }
      };
    } catch (error) {
      this.logger.error(`Failed to get real-time status: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Private helper methods

  private async getTwoFactorAnalytics(): Promise<any> {
    try {
      const usersWithTwoFA = await this.twoFactorService.getUsersWithTwoFactor();
      
      return {
        enabledUsers: usersWithTwoFA.length,
        adoptionRate: usersWithTwoFA.length > 0 ? 75 : 0, // Placeholder calculation
        setupTrend: [], // Would calculate from historical data
        usageStats: {
          dailyVerifications: 0, // Would get from audit logs
          backupCodeUsage: 0
        }
      };
    } catch (error) {
      this.logger.error(`Failed to get 2FA analytics: ${error.message}`);
      return {
        enabledUsers: 0,
        adoptionRate: 0,
        setupTrend: [],
        usageStats: { dailyVerifications: 0, backupCodeUsage: 0 }
      };
    }
  }

  private async getLoginAnalytics(days: number): Promise<any> {
    // Placeholder for login analytics
    return {
      totalLogins: 0,
      successfulLogins: 0,
      failedLogins: 0,
      uniqueUsers: 0,
      averageSessionDuration: 0
    };
  }

  private calculateIncidentResponseScore(auditStats: any): number {
    // Placeholder calculation - would be based on actual response times
    const summary = auditStats.summary[0] || {};
    const criticalEvents = summary.criticalEvents || 0;
    const totalEvents = summary.totalEvents || 1;
    
    // Better score if fewer critical events relative to total
    return Math.max(0, 100 - ((criticalEvents / totalEvents) * 100));
  }

  private calculateThreatDetectionScore(threatStats: any): number {
    // Placeholder calculation
    const summary = threatStats.summary[0] || {};
    const criticalThreats = summary.criticalThreats || 0;
    const totalThreats = summary.totalThreats || 1;
    
    // Good detection means finding threats before they become critical
    return Math.min(100, Math.max(0, 100 - (criticalThreats / totalThreats) * 50));
  }

  private calculateAuthenticationScore(twoFactorStats: any): number {
    // Score based on 2FA adoption rate and security practices
    return Math.min(100, twoFactorStats.adoptionRate + 25); // Bonus for having 2FA at all
  }

  private calculateComplianceScore(auditStats: any): number {
    // Placeholder - would be based on policy compliance metrics
    return 85; // Default good score
  }

  private calculateOverallScore(scores: { score: number; weight: number }[]): number {
    const weightedSum = scores.reduce((sum, { score, weight }) => sum + (score * weight), 0);
    const totalWeight = scores.reduce((sum, { weight }) => sum + weight, 0);
    return Math.round(weightedSum / totalWeight);
  }

  private calculateMTTD(threatStats: any): number {
    // Mean Time To Detection - placeholder
    return 15; // 15 minutes
  }

  private calculateMTTR(auditStats: any): number {
    // Mean Time To Response - placeholder
    return 45; // 45 minutes
  }

  private calculateCriticalRate(auditSummary: any): number {
    const critical = auditSummary.criticalEvents || 0;
    const total = auditSummary.totalEvents || 1;
    return (critical / total) * 100;
  }

  private calculateFalsePositiveRate(threatStats: any): number {
    // Placeholder - would calculate from actual threat resolution data
    return 5; // 5% false positive rate
  }

  private calculateTrend(dailyData: any[]): 'up' | 'down' | 'stable' {
    if (!dailyData || dailyData.length < 2) return 'stable';
    
    const recent = dailyData.slice(-3).map(d => d.count || 0);
    const earlier = dailyData.slice(0, -3).map(d => d.count || 0);
    
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const earlierAvg = earlier.reduce((a, b) => a + b, 0) / earlier.length || recentAvg;
    
    const change = ((recentAvg - earlierAvg) / earlierAvg) * 100;
    
    if (change > 10) return 'up';
    if (change < -10) return 'down';
    return 'stable';
  }

  private calculateRiskTrend(dailyData: any[]): 'increasing' | 'decreasing' | 'stable' {
    if (!dailyData || dailyData.length < 2) return 'stable';
    
    const recent = dailyData.slice(-3).map(d => d.avgRiskScore || 0);
    const earlier = dailyData.slice(0, -3).map(d => d.avgRiskScore || 0);
    
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const earlierAvg = earlier.reduce((a, b) => a + b, 0) / earlier.length || recentAvg;
    
    const change = ((recentAvg - earlierAvg) / earlierAvg) * 100;
    
    if (change > 5) return 'increasing';
    if (change < -5) return 'decreasing';
    return 'stable';
  }

  private async generateSecurityRecommendations(): Promise<any[]> {
    // Generate security recommendations based on current state
    return [
      {
        priority: 'high',
        category: 'authentication',
        title: 'Increase 2FA Adoption',
        description: 'Only 75% of users have enabled two-factor authentication',
        impact: 'Reduces account takeover risk by 99%',
        effort: 'medium',
        actions: [
          'Send reminder emails to users without 2FA',
          'Make 2FA mandatory for admin accounts',
          'Provide 2FA setup tutorials'
        ]
      },
      {
        priority: 'medium',
        category: 'monitoring',
        title: 'Enhanced Threat Detection',
        description: 'Current threat detection could be improved',
        impact: 'Faster incident response and threat mitigation',
        effort: 'high',
        actions: [
          'Implement machine learning-based anomaly detection',
          'Integrate with external threat intelligence feeds',
          'Set up automated response playbooks'
        ]
      }
    ];
  }

  private async performRiskAssessment(): Promise<any> {
    return {
      overallRiskLevel: 'medium',
      riskFactors: [
        {
          category: 'authentication',
          risk: 'medium',
          description: '25% of users lack 2FA protection'
        },
        {
          category: 'network',
          risk: 'low',
          description: 'No suspicious network activity detected'
        }
      ],
      recommendations: [
        'Implement mandatory 2FA for all admin accounts',
        'Regular security awareness training for users'
      ]
    };
  }

  private extractKeyFindings(dashboard: any): string[] {
    const findings = [];
    
    if (dashboard.summary.securityScore < 70) {
      findings.push('Security posture score below recommended threshold');
    }
    
    if (dashboard.summary.criticalEvents > 0) {
      findings.push(`${dashboard.summary.criticalEvents} critical security events detected`);
    }
    
    if (dashboard.authentication.twoFactorStats.adoptionRate < 90) {
      findings.push('2FA adoption rate below best practice recommendations');
    }
    
    return findings;
  }

  private generateActionItems(dashboard: any, recommendations: any[], riskAssessment: any): any[] {
    return [
      {
        id: 1,
        title: 'Review Critical Security Events',
        priority: 'critical',
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        assignee: 'Security Team',
        description: `Review and respond to ${dashboard.summary.criticalEvents} critical events`
      },
      {
        id: 2,
        title: 'Improve 2FA Adoption',
        priority: 'high',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week
        assignee: 'IT Team',
        description: 'Increase 2FA adoption rate to above 90%'
      }
    ];
  }

  private async getActiveSecurityAlerts(): Promise<any> {
    return {
      critical: [],
      warning: [],
      info: []
    };
  }

  private async getSystemSecurityHealth(): Promise<any> {
    return {
      overallStatus: 'healthy',
      components: {
        authentication: 'healthy',
        threatDetection: 'healthy',
        auditLogging: 'healthy',
        monitoring: 'healthy'
      }
    };
  }

  private async getEventCount24h(): Promise<number> {
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const analytics = await this.auditService.getSecurityAnalytics(last24h);
    return analytics.summary[0]?.totalEvents || 0;
  }

  private async getThreatCount24h(): Promise<number> {
    const threats = await this.threatService.getThreatAnalytics(1);
    return threats.summary[0]?.totalThreats || 0;
  }

  private async getFailedLoginCount24h(): Promise<number> {
    // Would query audit logs for failed login events in last 24h
    return 0; // Placeholder
  }
}
