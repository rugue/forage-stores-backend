# Orders Module

## Overview

The Orders module manages the complete order lifecycle in the Forage e-commerce platform. It handles order creation, payment processing, delivery management, and order analytics.

## Features

### Core Functionality
- **Order Management**: Create, update, and track orders
- **Multiple Payment Plans**: Support for various payment options
- **Flexible Delivery**: Pickup and home delivery options
- **Payment Processing**: Handle payments and installments
- **Order Analytics**: Comprehensive reporting and insights

### Payment Plans
1. **Pay Now**: Full payment with instant delivery
2. **Price Lock**: Lock price, deliver after 30-45 days
3. **Pay Small Small**: Split into weekly/monthly installments
4. **Pay Later**: Credit check before approving

### Delivery Methods
- **Pickup**: Customer collects from store
- **Home Delivery**: Delivery to customer address

## Structure

```
src/modules/orders/
├── entities/
│   └── order.entity.ts          # Order entity with sub-schemas
├── interfaces/
│   ├── order.interface.ts       # Order-related interfaces
│   └── index.ts
├── dto/
│   ├── order.dto.ts            # Data transfer objects
│   └── index.ts
├── constants/
│   ├── order.constants.ts      # Business rules and configurations
│   └── index.ts
├── test/
│   ├── order.entity.spec.ts    # Entity tests
│   ├── orders.controller.spec.ts # Controller tests
│   └── orders.service.spec.ts   # Service tests
├── orders.controller.ts         # REST API endpoints
├── orders.service.ts           # Business logic
├── orders.module.ts            # Module configuration
└── README.md                   # This file
```

## Entities

### Order
Main order entity with the following sub-schemas:
- **CartItem**: Individual items in the order
- **PaymentSchedule**: Installment payment configuration
- **CreditCheck**: Credit verification for Pay Later orders
- **PaymentHistory**: Record of all payments made
- **DeliveryAddress**: Delivery location details

## API Endpoints

### Order Management
- `POST /orders` - Create new order
- `GET /orders` - List orders with filtering
- `GET /orders/:id` - Get order details
- `PATCH /orders/:id/status` - Update order status
- `DELETE /orders/:id` - Cancel order

### Payment Processing
- `POST /orders/:id/payment` - Process payment
- `GET /orders/:id/payments` - Get payment history

### Analytics & Reporting
- `GET /orders/summary` - Order summary statistics
- `GET /orders/analytics` - Detailed analytics
- `POST /orders/export` - Export orders data

## Business Rules

### Order Creation
- Minimum order amount: ₦500
- Maximum order amount: ₦500,000
- Maximum items per order: 50
- Free delivery for orders above ₦10,000

### Payment Plans
- **Pay Small Small**: Minimum amount ₦5,000
- **Pay Later**: Maximum credit limit ₦50,000
- Credit check required for installments and Pay Later

### Delivery
- Standard delivery: 3 days
- Pickup ready: 24 hours
- Price Lock delivery: 30-45 days

### Order Status Flow
```
PENDING → PAID → SHIPPED → DELIVERED
   ↓
CANCELLED
```

## Configuration

### Environment Variables
```env
# Payment configuration
PAYMENT_GATEWAY_URL=
PAYMENT_GATEWAY_KEY=
NIBIA_CONVERSION_RATE=100

# Delivery configuration
DEFAULT_DELIVERY_FEE=500
FREE_DELIVERY_THRESHOLD=10000
STANDARD_DELIVERY_DAYS=3

# Credit scoring
CREDIT_SCORE_THRESHOLD=650
MAX_CREDIT_LIMIT=50000
```

## Usage Examples

### Creating an Order
```typescript
const orderDto: CreateOrderDto = {
  items: [
    {
      productId: '64f123456789abcdef123458',
      quantity: 2,
    },
  ],
  paymentPlan: PaymentPlan.PAY_NOW,
  deliveryMethod: DeliveryMethod.HOME_DELIVERY,
  deliveryAddress: {
    street: '123 Test Street',
    city: 'Lagos',
    state: 'Lagos',
    country: 'Nigeria',
  },
};

const order = await ordersService.create(orderDto, userId);
```

### Processing Payment
```typescript
const paymentDto: ProcessPaymentDto = {
  amount: 3500,
  paymentMethod: PaymentMethod.CARD,
  transactionRef: 'TXN123456',
};

const updatedOrder = await ordersService.processPayment(orderId, paymentDto);
```

### Order Analytics
```typescript
const analytics = await ordersService.getAnalytics({
  startDate: '2023-10-01',
  endDate: '2023-10-31',
  groupBy: 'day',
});
```

## Testing

Run tests for the orders module:
```bash
# Unit tests
npm run test -- orders

# E2E tests
npm run test:e2e -- orders

# Test coverage
npm run test:cov -- orders
```

## Integration

### Dependencies
- **Users Module**: Customer information
- **Products Module**: Product details and pricing
- **Stores Module**: Store locations for pickup
- **Auth Module**: User authentication

### Events Emitted
- `order.created` - New order placed
- `order.paid` - Payment completed
- `order.shipped` - Order dispatched
- `order.delivered` - Order completed
- `order.cancelled` - Order cancelled

### Events Consumed
- `product.price_updated` - Update order calculations
- `user.credit_score_updated` - Re-evaluate credit limits

## Error Handling

The module includes comprehensive error handling for:
- Invalid order data
- Payment failures
- Credit check failures
- Delivery address validation
- Status transition violations

## Security

- Order access restricted to owner and admins
- Payment information encryption
- Credit check data protection
- Order modification audit trail

## Performance

### Database Indexes
- Order number (unique)
- User ID
- Order status
- Payment plan
- Delivery method
- Creation date
- Expected delivery date

### Caching Strategy
- Order summaries cached for 5 minutes
- Analytics data cached for 1 hour
- Product pricing cached for order calculations

## Monitoring

### Key Metrics
- Order conversion rate
- Average order value
- Payment success rate
- Delivery performance
- Customer satisfaction

### Alerts
- High order cancellation rate
- Payment gateway failures
- Delivery delays
- Credit check service downtime
