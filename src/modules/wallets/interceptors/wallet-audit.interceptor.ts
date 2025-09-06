import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

export interface WalletAuditLog {
  userId: string;
  action: string;
  endpoint: string;
  method: string;
  requestData: any;
  responseData?: any;
  success: boolean;
  error?: string;
  timestamp: Date;
  userAgent?: string;
  ipAddress?: string;
  executionTime: number;
}

@Injectable()
export class WalletAuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(WalletAuditInterceptor.name);
  private readonly auditLogs: WalletAuditLog[] = []; // In production, use a database or external logging service

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const startTime = Date.now();

    // Extract user information
    const user = request.user;
    const userId = user?.id || user?._id?.toString() || 'anonymous';

    // Extract request details
    const method = request.method;
    const endpoint = request.url;
    const requestData = this.sanitizeRequestData({ ...request.body, ...request.query });
    const userAgent = request.headers['user-agent'];
    const ipAddress = request.ip || request.connection.remoteAddress;

    // Determine action based on endpoint
    const action = this.determineAction(method, endpoint);

    return next.handle().pipe(
      tap((responseData) => {
        const executionTime = Date.now() - startTime;
        
        // Create audit log entry
        const auditLog: WalletAuditLog = {
          userId,
          action,
          endpoint,
          method,
          requestData,
          responseData: this.sanitizeResponseData(responseData),
          success: true,
          timestamp: new Date(),
          userAgent,
          ipAddress,
          executionTime,
        };

        this.logAuditEvent(auditLog);
      }),
      catchError((error) => {
        const executionTime = Date.now() - startTime;
        
        // Create audit log entry for error
        const auditLog: WalletAuditLog = {
          userId,
          action,
          endpoint,
          method,
          requestData,
          success: false,
          error: error.message,
          timestamp: new Date(),
          userAgent,
          ipAddress,
          executionTime,
        };

        this.logAuditEvent(auditLog);
        throw error;
      }),
    );
  }

  private determineAction(method: string, endpoint: string): string {
    if (endpoint.includes('/my-wallet')) return 'VIEW_WALLET';
    if (endpoint.includes('/create')) return 'CREATE_WALLET';
    if (endpoint.includes('/transfer')) return 'TRANSFER_FUNDS';
    if (endpoint.includes('/lock-funds')) return 'LOCK_FUNDS';
    if (endpoint.includes('/unlock-funds')) return 'UNLOCK_FUNDS';
    if (endpoint.includes('/balance')) return 'UPDATE_BALANCE';
    if (endpoint.includes('/status')) return 'UPDATE_STATUS';
    if (endpoint.includes('/withdrawal')) return 'WITHDRAWAL_REQUEST';
    if (endpoint.includes('/admin')) return 'ADMIN_ACTION';
    return 'WALLET_OPERATION';
  }

  private sanitizeRequestData(data: any): any {
    if (!data) return null;
    
    // Remove sensitive fields
    const sanitized = { ...data };
    delete sanitized.password;
    delete sanitized.adminPassword;
    delete sanitized.pin;
    delete sanitized.otp;
    
    return sanitized;
  }

  private sanitizeResponseData(data: any): any {
    if (!data) return null;
    
    // Only log relevant response data, avoid large objects
    if (typeof data === 'object' && data.success !== undefined) {
      return { success: data.success, message: data.message };
    }
    
    if (typeof data === 'object' && data.foodMoney !== undefined) {
      return {
        foodMoney: data.foodMoney,
        foodPoints: data.foodPoints,
        foodSafe: data.foodSafe,
        totalBalance: data.totalBalance,
      };
    }
    
    return null;
  }

  private logAuditEvent(auditLog: WalletAuditLog): void {
    // Store audit log (in production, save to database or external service)
    this.auditLogs.push(auditLog);
    
    // Log important events
    if (!auditLog.success) {
      this.logger.error(`Wallet audit - Failed action: ${auditLog.action}`, {
        userId: auditLog.userId,
        endpoint: auditLog.endpoint,
        error: auditLog.error,
        executionTime: auditLog.executionTime,
      });
    } else if (auditLog.action.includes('ADMIN') || auditLog.action.includes('TRANSFER')) {
      this.logger.warn(`Wallet audit - Sensitive action: ${auditLog.action}`, {
        userId: auditLog.userId,
        endpoint: auditLog.endpoint,
        executionTime: auditLog.executionTime,
      });
    } else {
      this.logger.log(`Wallet audit - Action: ${auditLog.action}`, {
        userId: auditLog.userId,
        executionTime: auditLog.executionTime,
      });
    }

    // Keep only recent logs in memory (last 1000 entries)
    if (this.auditLogs.length > 1000) {
      this.auditLogs.splice(0, this.auditLogs.length - 1000);
    }
  }

  // Method to retrieve audit logs (for admin dashboard)
  getAuditLogs(userId?: string, limit: number = 100): WalletAuditLog[] {
    let logs = this.auditLogs;
    
    if (userId) {
      logs = logs.filter(log => log.userId === userId);
    }
    
    return logs.slice(-limit).reverse(); // Most recent first
  }

  // Method to get audit statistics
  getAuditStats(): {
    totalOperations: number;
    successfulOperations: number;
    failedOperations: number;
    averageExecutionTime: number;
    topActions: Array<{ action: string; count: number }>;
  } {
    const totalOperations = this.auditLogs.length;
    const successfulOperations = this.auditLogs.filter(log => log.success).length;
    const failedOperations = totalOperations - successfulOperations;
    
    const totalExecutionTime = this.auditLogs.reduce((sum, log) => sum + log.executionTime, 0);
    const averageExecutionTime = totalOperations > 0 ? totalExecutionTime / totalOperations : 0;
    
    // Count actions
    const actionCounts: Record<string, number> = {};
    this.auditLogs.forEach(log => {
      actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;
    });
    
    const topActions = Object.entries(actionCounts)
      .map(([action, count]) => ({ action, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalOperations,
      successfulOperations,
      failedOperations,
      averageExecutionTime,
      topActions,
    };
  }
}
