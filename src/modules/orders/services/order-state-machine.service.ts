import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { OrderStatus, PaymentStatus } from '../entities/order.entity';
import { UserRole } from '../../users/entities/user.entity';

export interface OrderStateTransition {
  from: OrderStatus;
  to: OrderStatus;
  action: string;
  condition?: (context: OrderStateMachineContext) => boolean;
  sideEffect?: (context: OrderStateMachineContext) => Promise<void>;
}

export interface OrderStateMachineContext {
  orderId: string;
  userId: string;
  userRole: UserRole;
  reason?: string;
  paymentStatus?: PaymentStatus;
  totalAmount?: number;
  amountPaid?: number;
  remainingAmount?: number;
  hasStockAvailable?: boolean;
  isPaymentPlanEligible?: boolean;
  adminId?: string;
}

@Injectable()
export class OrderStateMachine {
  private readonly logger = new Logger(OrderStateMachine.name);
  
  private readonly transitions: OrderStateTransition[] = [
    // PENDING state transitions
    {
      from: OrderStatus.PENDING,
      to: OrderStatus.PAID,
      action: 'COMPLETE_PAYMENT',
      condition: (ctx) => ctx.hasStockAvailable && ctx.remainingAmount <= 0,
    },
    {
      from: OrderStatus.PENDING,
      to: OrderStatus.SHIPPED,
      action: 'SHIP_PARTIAL_PAYMENT',
      condition: (ctx) => ctx.userRole === UserRole.ADMIN && ctx.amountPaid >= (ctx.totalAmount * 0.5),
    },
    {
      from: OrderStatus.PENDING,
      to: OrderStatus.CANCELLED,
      action: 'CANCEL',
      condition: (ctx) => ctx.userRole === UserRole.ADMIN || ctx.userId === ctx.userId,
    },

    // PAID state transitions
    {
      from: OrderStatus.PAID,
      to: OrderStatus.SHIPPED,
      action: 'SHIP',
      condition: (ctx) => ctx.userRole === UserRole.ADMIN && ctx.hasStockAvailable,
    },
    {
      from: OrderStatus.PAID,
      to: OrderStatus.CANCELLED,
      action: 'CANCEL',
      condition: (ctx) => ctx.userRole === UserRole.ADMIN,
    },

    // SHIPPED state transitions
    {
      from: OrderStatus.SHIPPED,
      to: OrderStatus.DELIVERED,
      action: 'DELIVER',
      condition: (ctx) => ctx.userRole === UserRole.ADMIN || ctx.userRole === UserRole.RIDER,
    },
    {
      from: OrderStatus.SHIPPED,
      to: OrderStatus.CANCELLED,
      action: 'CANCEL_SHIPMENT',
      condition: (ctx) => ctx.userRole === UserRole.ADMIN,
    },

    // DELIVERED state transitions - terminal state for current system
    // In future, could add COMPLETED or RETURNED states

    // CANCELLED state transitions (limited)
    {
      from: OrderStatus.CANCELLED,
      to: OrderStatus.PENDING,
      action: 'REACTIVATE',
      condition: (ctx) => ctx.userRole === UserRole.ADMIN && ctx.hasStockAvailable,
    },
  ];

  /**
   * Check if a state transition is valid
   */
  canTransition(
    from: OrderStatus, 
    to: OrderStatus, 
    action: string, 
    context: OrderStateMachineContext
  ): boolean {
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
    from: OrderStatus, 
    to: OrderStatus, 
    action: string, 
    context: OrderStateMachineContext
  ): Promise<{ success: boolean; newState: OrderStatus; message: string }> {
    
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

    this.logger.log(`Order ${context.orderId} transitioned from ${from} to ${to} via ${action}`);

    return {
      success: true,
      newState: to,
      message: `Successfully transitioned from ${from} to ${to} via ${action}`
    };
  }

  /**
   * Get all valid transitions from a given state
   */
  getValidTransitions(from: OrderStatus, context: OrderStateMachineContext): OrderStateTransition[] {
    return this.transitions
      .filter(t => t.from === from)
      .filter(t => !t.condition || t.condition(context));
  }

  /**
   * Get all possible actions from a given state
   */
  getValidActions(from: OrderStatus, context: OrderStateMachineContext): string[] {
    return this.getValidTransitions(from, context).map(t => t.action);
  }

  /**
   * Validate an order state change
   */
  validateStateChange(
    currentStatus: OrderStatus,
    newStatus: OrderStatus,
    context: OrderStateMachineContext
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
      states: Object.values(OrderStatus),
      transitions: this.transitions.map(t => ({
        from: t.from,
        to: t.to,
        action: t.action,
        hasCondition: !!t.condition,
        hasSideEffect: !!t.sideEffect,
      })),
      rules: [
        'PENDING orders can be paid, shipped with partial payment, or cancelled',
        'PAID orders can be shipped or cancelled (admin only)',
        'SHIPPED orders can be delivered or cancelled (admin only)',
        'DELIVERED orders are terminal in current system',
        'CANCELLED orders can be reactivated (admin only with stock)',
        'All state changes are logged and audited',
        'Conditions must be met for each transition',
        'Payment and stock validation required for most transitions',
      ]
    };
  }
}
