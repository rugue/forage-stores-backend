import { createParamDecorator, ExecutionContext, BadRequestException } from '@nestjs/common';
import { registerDecorator, ValidationOptions, ValidatorConstraint, ValidatorConstraintInterface, ValidationArguments } from 'class-validator';
import { PaymentPlan, PaymentFrequency } from '../../orders/entities/order.entity';
import { SubscriptionStatus } from '../entities/subscription.entity';
import { SUBSCRIPTION_CONSTANTS } from '../constants/subscription.constants';

/**
 * Custom decorator to extract subscription ID from request
 */
export const SubscriptionId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const subscriptionId = request.params.id || request.params.subscriptionId;
    
    if (!subscriptionId) {
      throw new BadRequestException('Subscription ID is required');
    }
    
    return subscriptionId;
  },
);

/**
 * Custom decorator to validate subscription ownership
 */
export const SubscriptionOwnership = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    const subscriptionUserId = request.params.userId || request.body.userId;
    
    if (!user) {
      throw new BadRequestException('User authentication required');
    }
    
    // Admin can access any subscription
    if (user.role === 'admin') {
      return true;
    }
    
    // Users can only access their own subscriptions
    if (user._id.toString() !== subscriptionUserId) {
      throw new BadRequestException('You can only access your own subscriptions');
    }
    
    return true;
  },
);

/**
 * Custom validator for subscription amount constraints
 */
@ValidatorConstraint({ async: false })
export class IsValidSubscriptionAmountConstraint implements ValidatorConstraintInterface {
  validate(amount: number, args: ValidationArguments) {
    const paymentPlan = (args.object as any).paymentPlan;
    
    if (!amount || amount <= 0) {
      return false;
    }
    
    // Check minimum amount based on payment plan
    if (paymentPlan === PaymentPlan.PAY_SMALL_SMALL) {
      return amount >= SUBSCRIPTION_CONSTANTS.MIN_SUBSCRIPTION_AMOUNT;
    }
    
    if (paymentPlan === PaymentPlan.PRICE_LOCK) {
      return amount >= 5000; // Min price lock amount
    }
    
    return amount >= SUBSCRIPTION_CONSTANTS.MIN_SUBSCRIPTION_AMOUNT;
  }

  defaultMessage(args: ValidationArguments) {
    const paymentPlan = (args.object as any).paymentPlan;
    const minAmount = paymentPlan === PaymentPlan.PRICE_LOCK 
      ? 5000 
      : SUBSCRIPTION_CONSTANTS.MIN_SUBSCRIPTION_AMOUNT;
    
    return `Subscription amount must be at least ${minAmount} NGN for ${paymentPlan} plan`;
  }
}

export function IsValidSubscriptionAmount(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidSubscriptionAmountConstraint,
    });
  };
}

/**
 * Custom validator for payment frequency based on payment plan
 */
@ValidatorConstraint({ async: false })
export class IsValidPaymentFrequencyConstraint implements ValidatorConstraintInterface {
  validate(frequency: PaymentFrequency, args: ValidationArguments) {
    const paymentPlan = (args.object as any).paymentPlan;
    
    if (!frequency) {
      return false;
    }
    
    // Price lock doesn't use frequency (fixed 2 payments)
    if (paymentPlan === PaymentPlan.PRICE_LOCK) {
      return true; // Frequency is optional for price lock
    }
    
    // Pay Small Small must have a valid frequency
    if (paymentPlan === PaymentPlan.PAY_SMALL_SMALL) {
      return [PaymentFrequency.WEEKLY, PaymentFrequency.BIWEEKLY, PaymentFrequency.MONTHLY].includes(frequency);
    }
    
    return true;
  }

  defaultMessage() {
    return 'Payment frequency must be weekly, biweekly, or monthly for Pay Small Small plan';
  }
}

export function IsValidPaymentFrequency(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidPaymentFrequencyConstraint,
    });
  };
}

/**
 * Custom validator for drop schedule validation
 */
@ValidatorConstraint({ async: false })
export class IsValidDropScheduleConstraint implements ValidatorConstraintInterface {
  validate(dropSchedule: any[], args: ValidationArguments) {
    if (!Array.isArray(dropSchedule) || dropSchedule.length === 0) {
      return false;
    }
    
    // Check that all drops have required fields
    for (const drop of dropSchedule) {
      if (!drop.scheduledDate || !drop.amount || drop.amount <= 0) {
        return false;
      }
      
      // Check that dates are in the future (except for first drop which might be immediate)
      const dropDate = new Date(drop.scheduledDate);
      const now = new Date();
      
      if (dropDate < now && dropSchedule.indexOf(drop) > 0) {
        return false;
      }
    }
    
    // Check that drops are in chronological order
    for (let i = 1; i < dropSchedule.length; i++) {
      const prevDate = new Date(dropSchedule[i-1].scheduledDate);
      const currDate = new Date(dropSchedule[i].scheduledDate);
      
      if (currDate <= prevDate) {
        return false;
      }
    }
    
    return true;
  }

  defaultMessage() {
    return 'Drop schedule must contain valid drops with future dates in chronological order';
  }
}

export function IsValidDropSchedule(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidDropScheduleConstraint,
    });
  };
}

/**
 * Custom validator for subscription business rules
 */
@ValidatorConstraint({ async: false })
export class IsValidSubscriptionBusinessRulesConstraint implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    const subscription = args.object as any;
    
    // Check total amount consistency
    if (subscription.totalAmount && subscription.dropSchedule) {
      const scheduleTotal = subscription.dropSchedule.reduce((sum: number, drop: any) => sum + drop.amount, 0);
      if (Math.abs(scheduleTotal - subscription.totalAmount) > 1) { // Allow 1 NGN difference for rounding
        return false;
      }
    }
    
    // Check payment plan specific rules
    if (subscription.paymentPlan === PaymentPlan.PAY_SMALL_SMALL) {
      // Must have more than 1 drop
      if (!subscription.dropSchedule || subscription.dropSchedule.length <= 1) {
        return false;
      }
    }
    
    if (subscription.paymentPlan === PaymentPlan.PRICE_LOCK) {
      // Must have exactly 2 drops
      if (!subscription.dropSchedule || subscription.dropSchedule.length !== 2) {
        return false;
      }
    }
    
    return true;
  }

  defaultMessage(args: ValidationArguments) {
    return 'Subscription violates business rules: check amount consistency and payment plan requirements';
  }
}

export function IsValidSubscriptionBusinessRules(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidSubscriptionBusinessRulesConstraint,
    });
  };
}

/**
 * Decorator to validate subscription state transitions
 */
export function ValidateStateTransition(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'validateStateTransition',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: SubscriptionStatus, args: ValidationArguments) {
          const currentStatus = (args.object as any).currentStatus;
          
          if (!currentStatus || !value) {
            return true; // Let other validators handle required checks
          }
          
          // Define valid state transitions
          const validTransitions: Record<SubscriptionStatus, SubscriptionStatus[]> = {
            [SubscriptionStatus.ACTIVE]: [SubscriptionStatus.PAUSED, SubscriptionStatus.CANCELLED, SubscriptionStatus.COMPLETED],
            [SubscriptionStatus.PAUSED]: [SubscriptionStatus.ACTIVE, SubscriptionStatus.CANCELLED],
            [SubscriptionStatus.CANCELLED]: [SubscriptionStatus.ACTIVE], // Only admin can reactivate
            [SubscriptionStatus.COMPLETED]: [], // Terminal state
          };
          
          return validTransitions[currentStatus]?.includes(value) || false;
        },
        defaultMessage(args: ValidationArguments) {
          const currentStatus = (args.object as any).currentStatus;
          return `Invalid state transition from ${currentStatus} to ${args.value}`;
        }
      }
    });
  };
}
