# Payment Processing Core Module

A comprehensive, production-ready payment processing module for NestJS applications with support for multiple payment gateways, installment plans, background processing, and advanced analytics.

## 🚀 Features

### Core Payment Processing
- **Multiple Payment Gateways**: Paystack, Flutterwave (extensible architecture)
- **Payment Methods**: Debit Card, Credit Card, Bank Transfer, Food Money, Food Points, Wallet Transfer, Cash on Delivery
- **Payment Types**: Pay Now, Pay Later, Pay Small Small, Price Lock, Exclusive Year Payment
- **Transaction States**: Pending, Processing, Completed, Failed, Cancelled, Refunded, Disputed, Expired

### Advanced Features
- **Payment Plans & Installments**: Support for various payment plans with configurable terms
- **Background Processing**: Retry mechanisms, batch verification, and reconciliation
- **Webhook Processing**: Secure webhook handling for real-time payment updates
- **Analytics & Reporting**: Comprehensive payment analytics and insights
- **Fee Management**: Automatic fee calculation and breakdown
- **Security**: Payment guards, signature validation, and secure processing

## 📁 Module Structure

```
src/modules/payments/
├── constants/
│   └── payment.constants.ts           # Enums and constants
├── interfaces/
│   └── payment.interface.ts           # TypeScript interfaces
├── entities/
│   ├── payment.entity.ts              # Payment schema
│   ├── refund.entity.ts               # Refund schema
│   └── payment-plan.entity.ts         # Payment plan schema
├── dto/
│   └── payment.dto.ts                 # Data Transfer Objects
├── strategies/
│   ├── payment-strategy.factory.ts    # Strategy pattern factory
│   └── paystack.strategy.ts           # Paystack implementation
├── services/
│   └── payment.service.ts             # Main payment service
├── controllers/
│   └── payment.controller.ts          # REST API endpoints
├── processors/
│   ├── payment.processor.ts           # Background job processing
│   ├── webhook.processor.ts           # Webhook processing
│   └── reconciliation.processor.ts    # Daily reconciliation
├── guards/
│   └── payment.guard.ts               # Payment validation guard
├── tests/
│   └── payment.service.spec.ts        # Unit tests
└── payment.module.ts                  # Module configuration
```

## 🛠 Installation & Setup

### 1. Install Dependencies

```bash
npm install @nestjs/bull @nestjs/event-emitter bull ioredis
npm install --save-dev @types/bull
```

### 2. Environment Configuration

Add to your `.env` file:

```env
# Payment Gateway Configuration
PAYSTACK_SECRET_KEY=sk_test_your_secret_key
PAYSTACK_PUBLIC_KEY=pk_test_your_public_key
FLUTTERWAVE_SECRET_KEY=flw_test_your_secret_key

# Webhook Configuration
PAYMENT_WEBHOOK_SECRET=your_webhook_secret

# Redis Configuration (for Bull queues)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
```

### 3. Module Integration

```typescript
// app.module.ts
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { PaymentModule } from './modules/payments/payment.module';

@Module({
  imports: [
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT),
        password: process.env.REDIS_PASSWORD,
      },
    }),
    EventEmitterModule.forRoot(),
    PaymentModule,
    // ... other modules
  ],
})
export class AppModule {}
```

## 📚 API Usage

### Payment Initiation

```typescript
POST /api/payments/initiate

{
  "orderId": "order_123",
  "paymentType": "PAY_NOW",
  "paymentMethod": "DEBIT_CARD",
  "gateway": "PAYSTACK",
  "amount": 10000,
  "metadata": {
    "description": "Product purchase"
  },
  "returnUrl": "https://yourapp.com/success",
  "cancelUrl": "https://yourapp.com/cancel"
}
```

### Payment Verification

```typescript
POST /api/payments/verify

{
  "transactionReference": "txn_abc123"
}
```

### Payment Analytics

```typescript
GET /api/payments/analytics?period=2023-12
```

### Admin Endpoints

```typescript
GET /api/admin/payments/analytics
GET /api/admin/payments/{id}
POST /api/admin/payments/{id}/refund
```

## 🔧 Configuration

### Payment Gateway Configuration

```typescript
// config/payment.config.ts
export default () => ({
  payment: {
    paystack: {
      secretKey: process.env.PAYSTACK_SECRET_KEY,
      publicKey: process.env.PAYSTACK_PUBLIC_KEY,
      baseUrl: 'https://api.paystack.co',
    },
    flutterwave: {
      secretKey: process.env.FLUTTERWAVE_SECRET_KEY,
      baseUrl: 'https://api.flutterwave.com/v3',
    },
    webhook: {
      secret: process.env.PAYMENT_WEBHOOK_SECRET,
    },
  },
});
```

## 🏗 Architecture Patterns

### Strategy Pattern
Payment gateways are implemented using the Strategy pattern, making it easy to add new gateways:

```typescript
// Adding a new gateway
export class FlutterwaveStrategy implements IPaymentStrategy {
  async initializePayment(data: IPaymentData): Promise<IGatewayResponse> {
    // Implementation
  }
  
  async verifyPayment(transactionId: string): Promise<IGatewayResponse> {
    // Implementation
  }
  
  calculateFees(amount: number): number {
    // Implementation
  }
}

// Register in factory
export class PaymentStrategyFactory {
  createPaymentStrategy(gateway: PaymentGateway): IPaymentStrategy {
    switch (gateway) {
      case PaymentGateway.PAYSTACK:
        return this.paystackStrategy;
      case PaymentGateway.FLUTTERWAVE:
        return new FlutterwaveStrategy(this.configService);
      default:
        throw new Error(`Payment gateway ${gateway} not supported`);
    }
  }
}
```

### Background Processing
The module uses Bull queues for background processing:

- **Payment Retry Queue**: Handles failed payment retries
- **Reconciliation Queue**: Daily payment reconciliation
- **Webhook Queue**: Processes incoming webhooks

### Event-Driven Architecture
Payment events are emitted for loose coupling:

```typescript
// Listen to payment events
@OnEvent('payment.completed')
async handlePaymentCompleted(payload: IPaymentCompletedEvent) {
  // Update order status, send notifications, etc.
}

@OnEvent('payment.failed')
async handlePaymentFailed(payload: IPaymentFailedEvent) {
  // Handle failed payments, retry logic, notifications
}
```

## 💾 Database Schema

### Payment Entity
```typescript
{
  transactionId: string,           // Unique transaction identifier
  orderId: string,                 // Associated order ID
  userId: string,                  // User making the payment
  amount: number,                  // Amount in kobo (smallest currency unit)
  currency: string,                // Currency code (NGN)
  status: PaymentStatus,           // Current payment status
  paymentMethod: PaymentMethod,    // Payment method used
  gateway: PaymentGateway,         // Payment gateway used
  paymentType: PaymentType,        // Type of payment
  fees: {
    gatewayFee: number,
    processingFee: number,
    totalFees: number
  },
  metadata: {
    orderId: string,
    bundleId?: string,
    subscriptionId?: string,
    description?: string
  },
  gatewayResponse: {
    gatewayTransactionId: string,
    status: string,
    message: string,
    authorizationCode?: string,
    cardType?: string,
    lastFourDigits?: string,
    bank?: string
  },
  planId?: string,                 // Associated payment plan
  installmentNumber?: number,      // For installment payments
  parentTransactionId?: string,    // For linked transactions
  expiresAt?: Date,                // Payment expiration
  completedAt?: Date,              // Completion timestamp
  createdAt: Date,
  updatedAt: Date
}
```

## 🔐 Security Features

### Webhook Validation
- Signature verification for incoming webhooks
- Timestamp validation to prevent replay attacks
- IP whitelisting for gateway endpoints

### Payment Guards
- Request validation and sanitization
- Rate limiting for payment endpoints
- User authentication and authorization

### Data Protection
- Sensitive data encryption
- PCI DSS compliance considerations
- Audit logging for all payment operations

## 📊 Analytics & Monitoring

### Available Metrics
- Transaction volume and success rates
- Revenue analytics by period
- Payment method and gateway performance
- Failure analysis and trends
- Fee breakdown and optimization insights

### Monitoring Integration
- Payment status tracking
- Failed payment alerts
- Reconciliation discrepancy notifications
- Performance metrics and thresholds

## 🧪 Testing

Run the payment module tests:

```bash
npm test -- src/modules/payments/tests/payment.service.spec.ts
```

## 🚀 Production Deployment

### Prerequisites
1. Configure payment gateway accounts (Paystack, Flutterwave)
2. Set up Redis for Bull queues
3. Configure webhook endpoints
4. Set up monitoring and alerting

### Environment Variables
Ensure all required environment variables are set in production:
- Payment gateway credentials
- Webhook secrets
- Redis configuration
- Database connection strings

### Security Checklist
- [ ] Enable HTTPS for all payment endpoints
- [ ] Configure webhook IP whitelisting
- [ ] Set up proper authentication and authorization
- [ ] Enable request rate limiting
- [ ] Configure audit logging
- [ ] Test webhook signature validation

## 🔄 Background Jobs

### Payment Retry Jobs
Automatically retry failed payments based on configurable rules:
- Maximum retry attempts
- Exponential backoff
- Retry conditions based on failure reason

### Daily Reconciliation
Automated daily reconciliation with payment gateways:
- Compare local records with gateway records
- Identify and flag discrepancies
- Generate reconciliation reports

### Batch Operations
- Bulk payment verification
- Batch refund processing
- Mass payment status updates

## 📈 Extensibility

### Adding New Payment Gateways
1. Implement the `IPaymentStrategy` interface
2. Register the strategy in `PaymentStrategyFactory`
3. Add gateway-specific configuration
4. Update webhook processor for new gateway events

### Custom Payment Plans
1. Define new payment plan types in constants
2. Implement plan-specific logic in `PaymentService`
3. Add validation rules for plan eligibility
4. Update analytics to include new plan metrics

### Additional Features
- Multi-currency support
- Subscription billing
- Split payments
- Payment scheduling
- Advanced fraud detection

## 🐛 Troubleshooting

### Common Issues

1. **Payment Verification Fails**
   - Check gateway credentials
   - Verify webhook configuration
   - Ensure transaction ID format is correct

2. **Background Jobs Not Processing**
   - Verify Redis connection
   - Check Bull queue configuration
   - Monitor queue health metrics

3. **Webhook Authentication Errors**
   - Validate webhook secret configuration
   - Check signature generation algorithm
   - Verify timestamp tolerance settings

### Debug Mode
Enable detailed logging by setting the log level to `debug` in your configuration.

## 📄 License

This module is part of the Forage Stores Backend application.

## 🤝 Contributing

Please follow the existing code patterns and ensure all tests pass before submitting changes.

---

For detailed API documentation, visit `/api/docs` when the application is running.
