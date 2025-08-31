import { Injectable, BadRequestException } from '@nestjs/common';
import { SubscriptionStatus } from '../entities/subscription.entity';

export interface StateTransition {
  from: SubscriptionStatus;
  to: SubscriptionStatus;
  action: string;
  condition?: (context: any) => boolean;
  sideEffect?: (context: any) => Promise<void>;
}

export interface StateMachineContext {
  subscriptionId: string;
  userId: string;
  userRole: string;
  reason?: string;
  dropsPaid?: number;
  totalDrops?: number;
  hasUnpaidDrops?: boolean;
  hasSufficientBalance?: boolean;
}

@Injectable()
export class SubscriptionStateMachine {
  private readonly transitions: StateTransition[] = [
    // ACTIVE state transitions
    {
      from: SubscriptionStatus.ACTIVE,
      to: SubscriptionStatus.PAUSED,
      action: 'PAUSE',
      condition: (ctx) => ctx.userRole === 'admin' || ctx.reason === 'payment_failure',
    },
    {
      from: SubscriptionStatus.ACTIVE,
      to: SubscriptionStatus.CANCELLED,
      action: 'CANCEL',
      condition: (ctx) => ctx.userRole === 'admin' || ctx.userId === ctx.subscriptionUserId,
    },
    {
      from: SubscriptionStatus.ACTIVE,
      to: SubscriptionStatus.COMPLETED,
      action: 'COMPLETE',
      condition: (ctx) => ctx.dropsPaid >= ctx.totalDrops,
    },

    // PAUSED state transitions
    {
      from: SubscriptionStatus.PAUSED,
      to: SubscriptionStatus.ACTIVE,
      action: 'RESUME',
      condition: (ctx) => ctx.hasSufficientBalance && ctx.hasUnpaidDrops,
    },
    {
      from: SubscriptionStatus.PAUSED,
      to: SubscriptionStatus.CANCELLED,
      action: 'CANCEL',
      condition: (ctx) => ctx.userRole === 'admin' || ctx.userId === ctx.subscriptionUserId,
    },

    // CANCELLED state transitions (limited)
    {
      from: SubscriptionStatus.CANCELLED,
      to: SubscriptionStatus.ACTIVE,
      action: 'REACTIVATE',
      condition: (ctx) => ctx.userRole === 'admin' && ctx.hasUnpaidDrops,
    },

    // COMPLETED state is terminal (no transitions)
  ];

  /**
   * Check if a state transition is valid
   */
  canTransition(from: SubscriptionStatus, to: SubscriptionStatus, action: string, context: StateMachineContext): boolean {
    const transition = this.transitions.find(t => 
      t.from === from && 
      t.to === to && 
      t.action === action
    );

    if (!transition) {
      return false;
    }

    // Check condition if exists
    if (transition.condition) {
      return transition.condition(context);
    }

    return true;
  }

  /**
   * Execute a state transition
   */
  async executeTransition(
    from: SubscriptionStatus, 
    to: SubscriptionStatus, 
    action: string, 
    context: StateMachineContext
  ): Promise<{ success: boolean; newState: SubscriptionStatus; message: string }> {
    
    if (!this.canTransition(from, to, action, context)) {
      throw new BadRequestException(
        `Invalid transition: Cannot ${action} from ${from} to ${to}. Check conditions.`
      );
    }

    const transition = this.transitions.find(t => 
      t.from === from && 
      t.to === to && 
      t.action === action
    );

    // Execute side effect if exists
    if (transition?.sideEffect) {
      await transition.sideEffect(context);
    }

    return {
      success: true,
      newState: to,
      message: `Successfully transitioned from ${from} to ${to} via ${action}`
    };
  }

  /**
   * Get all valid transitions from a given state
   */
  getValidTransitions(from: SubscriptionStatus, context: StateMachineContext): StateTransition[] {
    return this.transitions
      .filter(t => t.from === from)
      .filter(t => !t.condition || t.condition(context));
  }

  /**
   * Get all possible actions from a given state
   */
  getValidActions(from: SubscriptionStatus, context: StateMachineContext): string[] {
    return this.getValidTransitions(from, context).map(t => t.action);
  }

  /**
   * Validate a subscription state change
   */
  validateStateChange(
    currentStatus: SubscriptionStatus,
    newStatus: SubscriptionStatus,
    context: StateMachineContext
  ): { valid: boolean; reason?: string } {
    // Same state is always valid
    if (currentStatus === newStatus) {
      return { valid: true };
    }

    // Find valid transitions
    const validTransitions = this.getValidTransitions(currentStatus, context);
    const isValidTransition = validTransitions.some(t => t.to === newStatus);

    if (!isValidTransition) {
      return { 
        valid: false, 
        reason: `No valid transition from ${currentStatus} to ${newStatus}` 
      };
    }

    return { valid: true };
  }

  /**
   * Get state machine rules and documentation
   */
  getStateMachineDocumentation() {
    return {
      states: Object.values(SubscriptionStatus),
      transitions: this.transitions.map(t => ({
        from: t.from,
        to: t.to,
        action: t.action,
        hasCondition: !!t.condition,
        hasSideEffect: !!t.sideEffect,
      })),
      rules: [
        'ACTIVE subscriptions can be paused, cancelled, or completed',
        'PAUSED subscriptions can be resumed (if conditions met) or cancelled',
        'CANCELLED subscriptions can only be reactivated by admin',
        'COMPLETED subscriptions are terminal and cannot be changed',
        'All state changes are logged and audited',
        'Conditions must be met for each transition',
      ]
    };
  }
}
