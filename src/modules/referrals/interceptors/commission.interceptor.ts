import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, tap, catchError } from 'rxjs';
import { CommissionService } from '../services/commission.service';
import { ReferralsService } from '../referrals.service';
import { REFERRAL_COMMISSION_KEY } from '../decorators/referral.decorators';

@Injectable()
export class CommissionInterceptor implements NestInterceptor {
  private readonly logger = new Logger(CommissionInterceptor.name);

  constructor(
    private reflector: Reflector,
    private commissionService: CommissionService,
    private referralsService: ReferralsService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const commissionMetadata = this.reflector.get(
      REFERRAL_COMMISSION_KEY,
      context.getHandler(),
    );

    if (!commissionMetadata) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const { autoDeduct, rollbackOnFailure } = commissionMetadata;

    return next.handle().pipe(
      tap(async (response) => {
        if (autoDeduct && response?.orderId) {
          try {
            await this.processCommissionForOrder(response.orderId, request);
          } catch (error) {
            this.logger.error(`Commission processing failed: ${error.message}`);
            if (rollbackOnFailure) {
              // Rollback logic would be handled here
              this.logger.warn(`Rollback required for order: ${response.orderId}`);
            }
          }
        }
      }),
      catchError(async (error) => {
        if (rollbackOnFailure && request.body?.orderId) {
          this.logger.warn(`Rolling back commission for failed order: ${request.body.orderId}`);
          await this.rollbackCommission(request.body.orderId);
        }
        throw error;
      }),
    );
  }

  private async processCommissionForOrder(orderId: string, request: any): Promise<void> {
    this.logger.log(`Processing commission for order: ${orderId}`);
    
    try {
      const commissions = await this.commissionService.processCommissionsForOrder(orderId);
      this.logger.log(`Created ${commissions.length} commissions for order: ${orderId}`);
    } catch (error) {
      this.logger.error(`Failed to process commissions for order ${orderId}: ${error.message}`);
      throw error;
    }
  }

  private async rollbackCommission(orderId: string): Promise<void> {
    this.logger.log(`Rolling back commissions for order: ${orderId}`);
    
    try {
      // Implementation would reverse commission processing
      // This is a placeholder for rollback logic
      this.logger.warn(`Rollback not yet implemented for order: ${orderId}`);
    } catch (error) {
      this.logger.error(`Failed to rollback commissions for order ${orderId}: ${error.message}`);
    }
  }
}

@Injectable()
export class ReferralTrackingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(ReferralTrackingInterceptor.name);

  constructor(
    private reflector: Reflector,
    private referralsService: ReferralsService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const trackingMetadata = this.reflector.get(
      'trackReferral',
      context.getHandler(),
    );

    if (!trackingMetadata) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    
    return next.handle().pipe(
      tap(async (response) => {
        await this.trackReferralUsage(request, response, trackingMetadata);
      }),
    );
  }

  private async trackReferralUsage(request: any, response: any, metadata: any): Promise<void> {
    const { referralCode, referrerId } = request.body || {};
    
    if (referralCode || referrerId) {
      this.logger.log(`Tracking referral usage: ${referralCode || referrerId}`);
      
      try {
        // Track referral usage if user registration or significant action
        if (response?.user?.id || response?.userId) {
          const userId = response.user?.id || response.userId;
          
          if (referralCode && !referrerId) {
            // Create referral relationship
            await this.referralsService.create({
              referralCode,
              referredUserId: userId,
            });
          }
        }
      } catch (error) {
        this.logger.error(`Failed to track referral: ${error.message}`);
      }
    }
  }
}
