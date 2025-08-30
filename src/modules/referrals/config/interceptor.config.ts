import { APP_INTERCEPTOR } from '@nestjs/core';
import { CommissionInterceptor, ReferralTrackingInterceptor } from '../interceptors/commission.interceptor';

export const globalInterceptorProviders = [
  {
    provide: APP_INTERCEPTOR,
    useClass: CommissionInterceptor,
  },
  {
    provide: APP_INTERCEPTOR,
    useClass: ReferralTrackingInterceptor,
  },
];
