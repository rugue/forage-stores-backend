import { SetMetadata } from '@nestjs/common';

export const REQUIRE_2FA_KEY = 'require2fa';
export const CRITICAL_OPERATION_KEY = 'criticalOperation';

/**
 * Decorator to require 2FA authentication for an endpoint
 */
export const Require2FA = () => SetMetadata(REQUIRE_2FA_KEY, true);

/**
 * Decorator to mark an operation as critical (requiring enhanced security)
 */
export const CriticalOperation = (operationName?: string) => 
  SetMetadata(CRITICAL_OPERATION_KEY, operationName || true);

/**
 * Combined decorator for admin actions requiring 2FA
 */
export const SecureAdminAction = (operationName?: string) => {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    SetMetadata(REQUIRE_2FA_KEY, true)(target, propertyKey, descriptor);
    SetMetadata(CRITICAL_OPERATION_KEY, operationName || propertyKey)(target, propertyKey, descriptor);
    return descriptor;
  };
};
