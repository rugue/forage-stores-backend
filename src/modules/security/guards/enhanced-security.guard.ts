import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SecurityIntegrationService } from '../services/security-integration.service';
import { REQUIRE_2FA_KEY, CRITICAL_OPERATION_KEY } from '../decorators/security.decorators';

@Injectable()
export class EnhancedSecurityGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private securityIntegrationService: SecurityIntegrationService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('Authentication required');
    }

    // Check if 2FA is required for this endpoint
    const require2FA = this.reflector.getAllAndOverride<boolean>(
      REQUIRE_2FA_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Check if this is a critical operation
    const criticalOperation = this.reflector.getAllAndOverride<string | boolean>(
      CRITICAL_OPERATION_KEY,
      [context.getHandler(), context.getClass()],
    );

    const ipAddress = request.ip;
    const userAgent = request.headers['user-agent'];
    const action = `${request.method} ${request.path}`;
    
    try {
      if (criticalOperation) {
        const operationName = typeof criticalOperation === 'string' 
          ? criticalOperation 
          : `${request.method} ${request.path}`;

        await this.securityIntegrationService.verifyCriticalOperation(
          user.id,
          operationName,
          ipAddress,
          userAgent,
          {
            endpoint: request.path,
            method: request.method,
            body: request.body ? Object.keys(request.body) : [],
          }
        );
      } else if (require2FA) {
        await this.securityIntegrationService.verifyAdminAction(
          user.id,
          action,
          request.path,
          ipAddress,
          userAgent,
          {
            method: request.method,
            body: request.body ? Object.keys(request.body) : [],
          }
        );
      }

      return true;
    } catch (error) {
      // The SecurityIntegrationService already throws appropriate exceptions
      throw error;
    }
  }
}
