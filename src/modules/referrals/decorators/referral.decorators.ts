import { SetMetadata, createParamDecorator, ExecutionContext } from '@nestjs/common';

// Metadata keys
export const TRACK_REFERRAL_KEY = 'trackReferral';
export const REFERRAL_COMMISSION_KEY = 'referralCommission';

// Decorator to mark endpoints for referral tracking
export const TrackReferral = (options?: {
  trackCommission?: boolean;
  commissionType?: string;
  autoProcess?: boolean;
}) => SetMetadata(TRACK_REFERRAL_KEY, {
  trackCommission: options?.trackCommission ?? true,
  commissionType: options?.commissionType ?? 'default',
  autoProcess: options?.autoProcess ?? true,
});

// Decorator to enable commission processing for an endpoint
export const ProcessCommission = (options?: {
  type?: string;
  autoDeduct?: boolean;
  rollbackOnFailure?: boolean;
}) => SetMetadata(REFERRAL_COMMISSION_KEY, {
  type: options?.type ?? 'purchase',
  autoDeduct: options?.autoDeduct ?? true,
  rollbackOnFailure: options?.rollbackOnFailure ?? true,
});

// Parameter decorator to extract referral code from request
export const ReferralCode = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string | null => {
    const request = ctx.switchToHttp().getRequest();
    
    // Check multiple sources for referral code
    return (
      request.body?.referralCode ||
      request.query?.referralCode ||
      request.headers['x-referral-code'] ||
      null
    );
  },
);

// Parameter decorator to extract referrer information
export const ReferrerInfo = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    
    return {
      referralCode: request.body?.referralCode || request.query?.referralCode,
      referrerId: request.body?.referrerId || request.query?.referrerId,
      source: request.headers['referral-source'] || 'direct',
    };
  },
);

// Parameter decorator to extract commission context
export const CommissionContext = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    
    return {
      orderId: request.body?.orderId || request.params?.orderId,
      orderAmount: request.body?.orderAmount || request.body?.totalAmount,
      userId: request.user?.userId || request.body?.userId,
      type: request.body?.commissionType || 'purchase',
    };
  },
);
