# Advanced Subscription Management Features Implementation

## Overview
This document outlines the advanced features implemented to complete the comprehensive subscription management system for the Forage Stores backend.

## ✅ Implemented Features

### 1. Bull Queue Integration for Subscription Payment Retries

**Files Added:**
- `src/modules/subscriptions/processors/subscription.processor.ts`
- `src/modules/subscriptions/processors/subscription-retry.processor.ts`
- `src/modules/subscriptions/processors/subscription-notifications.processor.ts`

**Features:**
- **Queue-based Drop Processing**: Asynchronous processing of subscription drops
- **Intelligent Retry Logic**: Exponential backoff for failed payments (24h, 48h, 72h)
- **Payment Failure Handling**: Automatic subscription pausing after max retries
- **Background Notifications**: Queue-based email notifications for all subscription events
- **Scalable Architecture**: Three separate queues for processing, retries, and notifications

**Queue Names:**
- `subscription-processing`: Main drop processing
- `subscription-retry`: Payment retry logic
- `subscription-notifications`: Email/SMS notifications

### 2. State Machine for Subscription Lifecycle Management

**File Added:**
- `src/modules/subscriptions/services/subscription-state-machine.service.ts`

**Features:**
- **Defined State Transitions**: Clear rules for status changes
- **Conditional Logic**: Context-aware transition validation
- **Side Effects**: Automated actions on state changes
- **Documentation**: Built-in state machine documentation

**Supported States:**
- `ACTIVE` → `PAUSED`, `CANCELLED`, `COMPLETED`
- `PAUSED` → `ACTIVE`, `CANCELLED` (with conditions)
- `CANCELLED` → `ACTIVE` (admin only)
- `COMPLETED` (terminal state)

**Validation Context:**
```typescript
interface StateMachineContext {
  subscriptionId: string;
  userId: string;
  userRole: string;
  reason?: string;
  dropsPaid?: number;
  totalDrops?: number;
  hasUnpaidDrops?: boolean;
  hasSufficientBalance?: boolean;
}
```

### 3. Custom Decorators for Subscription Validation

**File Added:**
- `src/modules/subscriptions/decorators/subscription.decorators.ts`

**Custom Decorators:**
- **`@SubscriptionId`**: Parameter decorator for subscription ID extraction
- **`@SubscriptionOwnership`**: Authorization decorator for subscription access
- **`@IsValidSubscriptionAmount`**: Validates amount based on payment plan
- **`@IsValidPaymentFrequency`**: Validates frequency compatibility
- **`@IsValidDropSchedule`**: Validates drop schedule chronology and amounts
- **`@IsValidSubscriptionBusinessRules`**: Complex business rule validation
- **`@ValidateStateTransition`**: State transition validation

**Enhanced DTOs:**
- Updated `CreateSubscriptionDto` with custom validation
- Updated `UpdateSubscriptionDto` with state transition validation

### 4. Convenience Fee Provider

**File Added:**
- `src/modules/subscriptions/services/convenience-fee.provider.ts`

**Features:**
- **Dynamic Fee Calculation**: Based on payment plan and frequency
- **Discount System**: Early payment and loyalty discounts
- **Configurable Rates**: Environment-based configuration
- **Fee Breakdown**: Detailed fee calculation explanation
- **Min/Max Limits**: Configurable fee boundaries

**Fee Structure:**
- Base: 2.5% or 50 NGN minimum
- Payment Plan Multipliers:
  - PAY_NOW: 0.5x (lower fee)
  - PRICE_LOCK: 1.0x (standard)
  - PAY_SMALL_SMALL: 1.2x
  - PAY_LATER: 1.5x (highest)
- Frequency Multipliers:
  - Weekly: 1.3x
  - Biweekly: 1.1x
  - Monthly: 1.0x

**Discounts:**
- Early Payment: 10% discount
- Loyalty (3+ subscriptions): 15% discount

### 5. Advanced Conflict Resolution System

**File Added:**
- `src/modules/subscriptions/services/conflict-resolution.service.ts`

**Conflict Types Detected:**
- **Payment Mismatch**: Subscription vs order payment discrepancies
- **Duplicate Payment**: Same transaction references in drops
- **Insufficient Funds**: Wallet balance vs next drop amount
- **Schedule Conflict**: Overdue drops and date inconsistencies
- **Status Mismatch**: Status vs completion state conflicts
- **Order Conflict**: Order-subscription relationship issues
- **Wallet Discrepancy**: Wallet-related inconsistencies

**Resolution Strategies:**
- **Auto Retry**: Automatic retry for temporary issues
- **Manual Review**: Admin intervention required
- **Force Reconcile**: Automatic data reconciliation
- **Pause Subscription**: Temporary suspension
- **Cancel Subscription**: Permanent cancellation
- **Adjust Schedule**: Schedule recalculation
- **Refund Excess**: Excess payment refunds

**Conflict Priority Levels:**
- `Critical`: Immediate attention required
- `High`: Same-day resolution needed
- `Medium`: Resolution within 48 hours
- `Low`: Non-urgent, resolve within a week

## Integration Points

### Updated Services
- **SubscriptionsService**: Integrated all new services
- **Enhanced Error Handling**: Better conflict detection
- **Queue Integration**: Background processing support

### Updated Module
- **subscriptions.module.ts**: Added all new providers
- **Bull Queue Registration**: Three separate queues configured
- **Service Dependencies**: All services properly injected

### Database Enhancements
- **User Schema**: Added for notification processing
- **Enhanced Validation**: Custom decorators in DTOs
- **State Management**: Integrated with existing entities

## Configuration Requirements

### Environment Variables
```env
# Convenience Fee Configuration
CONVENIENCE_FEE_BASE_PERCENTAGE=2.5
CONVENIENCE_FEE_FLAT=50
CONVENIENCE_FEE_MAX=5000
CONVENIENCE_FEE_MIN=25
EARLY_PAYMENT_DISCOUNT=0.1
LOYALTY_DISCOUNT=0.15

# Bull Queue Configuration (if not already set)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password
```

## Usage Examples

### 1. Using Custom Decorators
```typescript
export class CreateSubscriptionDto {
  @IsValidSubscriptionAmount()
  @IsNumber({ maxDecimalPlaces: 2 })
  totalAmount: number;

  @IsValidPaymentFrequency()
  @IsEnum(PaymentFrequency)
  frequency: PaymentFrequency;
}
```

### 2. State Machine Usage
```typescript
const canTransition = await stateMachine.canTransition(
  SubscriptionStatus.ACTIVE,
  SubscriptionStatus.PAUSED,
  'PAUSE',
  context
);

if (canTransition) {
  await stateMachine.executeTransition(
    SubscriptionStatus.ACTIVE,
    SubscriptionStatus.PAUSED,
    'PAUSE',
    context
  );
}
```

### 3. Convenience Fee Calculation
```typescript
const feeResult = convenienceFeeProvider.calculateConvenienceFee({
  amount: 25000,
  paymentPlan: PaymentPlan.PAY_SMALL_SMALL,
  frequency: PaymentFrequency.WEEKLY,
  isEarlyPayment: true,
  userId: userId
});

console.log(feeResult.convenienceFee); // 750
console.log(feeResult.totalAmount); // 25750
```

### 4. Queue-based Processing
```typescript
// Queue a drop for processing
await this.processingQueue.add('process-drop', {
  subscriptionId,
  userId,
  isAutomatic: true
});

// Queue retry for failed payment
await this.retryQueue.add('retry-payment', {
  subscriptionId,
  userId,
  dropIndex,
  attempt: 1,
  maxAttempts: 3,
  reason: 'insufficient_balance'
}, {
  delay: 24 * 60 * 60 * 1000 // 24 hour delay
});
```

### 5. Conflict Resolution
```typescript
// Detect conflicts
const conflicts = await conflictResolver.detectAndResolveConflicts(subscriptionId);

// Manual resolution
await conflictResolver.resolveConflictManually(
  conflictId,
  ConflictResolution.PAUSE_SUBSCRIPTION,
  adminUserId,
  'Pausing due to repeated payment failures'
);
```

## Testing Recommendations

1. **Unit Tests**: Test each service independently
2. **Integration Tests**: Test queue processing end-to-end
3. **State Machine Tests**: Test all valid and invalid transitions
4. **Custom Decorator Tests**: Test validation logic with various inputs
5. **Fee Calculation Tests**: Test all fee scenarios and discounts
6. **Conflict Resolution Tests**: Test automatic and manual resolution

## Performance Considerations

- **Queue Processing**: Uses Bull queues for scalability
- **Exponential Backoff**: Reduces load during high failure rates
- **Batch Processing**: Cron jobs handle scheduled operations
- **Memory Management**: Conflicts stored in memory with cleanup
- **Database Optimization**: Indexed queries for conflict detection

## Security Features

- **Authorization**: Subscription ownership validation
- **State Validation**: Prevents unauthorized state changes
- **Audit Trail**: All conflicts and resolutions are logged
- **Role-based Access**: Admin-only operations clearly defined

## Monitoring & Observability

- **Structured Logging**: Comprehensive logging throughout
- **Conflict Statistics**: Built-in analytics for conflict tracking
- **Queue Monitoring**: Bull dashboard support
- **State Machine Metrics**: Transition tracking
- **Fee Calculation Audit**: Detailed fee breakdowns

## Future Enhancements

1. **Machine Learning**: Predictive conflict detection
2. **Advanced Analytics**: Subscription health scoring
3. **Real-time Dashboard**: Conflict monitoring UI
4. **Webhook Support**: External system notifications
5. **Multi-tenant Support**: Organization-based isolation

---

**Summary**: The subscription management system now includes advanced Bull queue integration, sophisticated state machine logic, custom validation decorators, dynamic convenience fee calculation, and intelligent conflict resolution. These features provide enterprise-level reliability, scalability, and maintainability for the subscription workflow.
