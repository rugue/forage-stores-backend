import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ThreatDetectionService } from '../services/threat-detection.service';
import { SecurityEventType } from '../entities/security-audit-log.entity';

@Injectable()
export class SecurityMiddleware implements NestMiddleware {
  constructor(private readonly threatDetectionService: ThreatDetectionService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'];
    const method = req.method;
    const path = req.path;
    const userId = (req as any).user?.id;

    // Check for blocked IPs
    const isBlocked = await this.threatDetectionService.isIPBlocked(ipAddress);
    if (isBlocked) {
      return res.status(403).json({
        message: 'Access denied',
        error: 'IP_BLOCKED'
      });
    }

    // Track suspicious activities
    try {
      // Monitor failed login attempts
      if (path.includes('/auth/login') && method === 'POST') {
        const originalSend = res.send.bind(res);
        res.send = function(body: any) {
          if (res.statusCode === 401 || res.statusCode === 400) {
            // Potential failed login attempt
            setImmediate(async () => {
              await this.threatDetectionService.analyzeSecurityEvent(
                SecurityEventType.LOGIN_FAILED,
                userId,
                ipAddress,
                userAgent,
                { path, method, statusCode: res.statusCode }
              ).catch(() => {}); // Silently fail to not impact user experience
            });
          }
          return originalSend(body);
        }.bind(this);
      }

      // Monitor admin actions
      if (path.includes('/admin') && userId) {
        await this.threatDetectionService.analyzeSecurityEvent(
          SecurityEventType.ADMIN_ACTION,
          userId,
          ipAddress,
          userAgent,
          { path, method }
        ).catch(() => {}); // Silently fail
      }

      // Monitor high-risk endpoints
      const highRiskPaths = [
        '/users/delete',
        '/admin/',
        '/security/',
        '/config/',
        '/system/'
      ];

      if (highRiskPaths.some(riskPath => path.includes(riskPath))) {
        await this.threatDetectionService.analyzeSecurityEvent(
          SecurityEventType.SUSPICIOUS_ACTIVITY,
          userId,
          ipAddress,
          userAgent,
          { path, method, riskLevel: 'HIGH' }
        ).catch(() => {}); // Silently fail
      }

    } catch (error) {
      // Don't let security monitoring break the app
      console.error('Security middleware error:', error);
    }

    next();
  }
}
