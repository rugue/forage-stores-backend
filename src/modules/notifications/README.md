# Notifications Module

This module provides a unified interface for sending notifications through various channels:
- Email (using nodemailer)
- Push notifications (using Firebase Cloud Messaging)
- WhatsApp messages (using Twilio's WhatsApp Business API)

## Features

- Send notifications for:
  - Order updates
  - Late payments
  - Auction events
  - Rider assignments
  - Custom notifications

- Track notification delivery and status
- Templated messages for each notification type
- Admin-only API endpoints for manual notification sending

## Configuration

Copy the `notifications.env.example` file to your `.env` file and update the values:

```
# Email Configuration
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=notifications@yourcompany.com
EMAIL_PASSWORD=your_email_password
EMAIL_FROM=Forage Stores <notifications@yourcompany.com>

# Firebase Configuration (for push notifications)
FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json
FIREBASE_DATABASE_URL=https://your-project-id.firebaseio.com

# WhatsApp Configuration (using Twilio)
ENABLE_WHATSAPP_NOTIFICATIONS=false
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
WHATSAPP_FROM_NUMBER=+14155238886  # This should be your Twilio WhatsApp number
```

## Usage

### Inject the service into your module

```typescript
import { NotificationsService } from '../notifications/notifications.service';

constructor(private notificationsService: NotificationsService) {}
```

### Send Order Updates

```typescript
await this.notificationsService.notifyOrderUpdate(
  userId,
  orderId,
  'DELIVERED',
  { 
    deliveryTime: new Date(),
    deliveredBy: 'John Doe' 
  }
);
```

### Send Late Payment Reminders

```typescript
await this.notificationsService.notifyLatePayment(
  userId,
  subscriptionId,
  3, // days late
  50.00, // amount due
  'foodMoney'
);
```

### Send Auction Events

```typescript
await this.notificationsService.notifyAuctionEvent(
  userId,
  auctionId,
  'outbid',
  { 
    previousBid: 100,
    currentBid: 120, 
    remainingTime: '2 hours'
  }
);
```

### Send Rider Assignments

```typescript
await this.notificationsService.notifyRiderAssignment(
  riderId,
  orderId,
  new Date(Date.now() + 30 * 60000), // expires in 30 minutes
  {
    pickup: '123 Main St',
    destination: '456 Oak Ave',
    customerPhone: '+1234567890',
    items: ['Item 1', 'Item 2']
  }
);
```

## API Endpoints

### Email Notification

```
POST /notifications/email
Authorization: Bearer {admin_token}

{
  "type": "ORDER_UPDATE",
  "title": "Order Shipped",
  "message": "Your order #12345 has been shipped and is on its way!",
  "recipientEmail": "customer@example.com",
  "recipientId": "60f1a2b3c4d5e6f7a8b9c0d1",
  "metadata": {
    "orderId": "12345",
    "trackingNumber": "TRACK123456"
  }
}
```

### Push Notification

```
POST /notifications/push
Authorization: Bearer {admin_token}

{
  "type": "AUCTION_EVENT",
  "title": "Auction Ending Soon",
  "message": "The auction for Product XYZ ends in 1 hour. Last chance to bid!",
  "deviceToken": "firebase-device-token",
  "recipientId": "60f1a2b3c4d5e6f7a8b9c0d1",
  "data": {
    "auctionId": "auction123",
    "productId": "product456",
    "endTime": "2023-07-20T15:00:00Z"
  }
}
```

### WhatsApp Message

```
POST /notifications/whatsapp
Authorization: Bearer {admin_token}

{
  "type": "PAYMENT_REMINDER",
  "title": "Payment Reminder",
  "message": "Your payment for subscription #12345 is 3 days late. Please make a payment to avoid service interruption.",
  "phoneNumber": "+1234567890",
  "recipientId": "60f1a2b3c4d5e6f7a8b9c0d1",
  "templateName": "payment_reminder",
  "templateParams": ["12345", "3", "50.00", "foodMoney"]
}
```

## Extending the Module

To add new notification types:
1. Update the `NotificationType` enum in `notification.entity.ts`
2. Add appropriate templates in the service methods
3. Create a new notification method in the service

To add new notification channels:
1. Update the `NotificationChannel` enum in `notification.entity.ts`
2. Add appropriate client initialization in the service constructor
3. Create a new send method in the service
4. Add a new controller endpoint if needed
