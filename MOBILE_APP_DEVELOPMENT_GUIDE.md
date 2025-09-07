# 📱 FORAGE STORES MOBILE APP DEVELOPMENT GUIDE

## 🎯 PROJECT OVERVIEW

**Project Name:** Forage Stores Mobile App  
**Backend API:** https://forage-stores-backend.onrender.com  
**Technology Stack:** NestJS Backend + MongoDB + Mongoose  
**Mobile Platform:** React Native / Flutter (to be decided)  
**Authentication:** JWT-based with email verification  

---

## 🏗️ BACKEND ARCHITECTURE OVERVIEW

### **Core Technologies**
- **Framework:** NestJS (Node.js)
- **Database:** MongoDB with Mongoose ODM
- **Authentication:** JWT + Passport.js
- **Documentation:** Swagger/OpenAPI at `/api`
- **Deployment:** Render.com
- **Real-time:** Server-Sent Events (SSE)

### **Backend Modules Structure**
```
src/modules/
├── auth/           # Authentication & Authorization
├── users/          # User Management
├── products/       # Product Catalog
├── orders/         # Shopping Cart & Orders
├── wallets/        # Digital Wallet System
├── delivery/       # Delivery Management
├── auctions/       # Product Auctions
├── referrals/      # Referral & Commission System
├── credit-scoring/ # Credit Assessment
├── admin/          # Admin Management
└── notifications/  # Push Notifications
```

---

## 🔐 AUTHENTICATION SYSTEM

### **Authentication Flow**
```typescript
// Register → Email Verification → Login → Access Protected Routes
POST /auth/register → POST /auth/verify-email → POST /auth/login → Access APIs
```

### **User States & Roles**
```typescript
enum UserRole {
  CUSTOMER = 'customer',           // Regular buyer
  SELLER = 'seller',              // Product seller
  RIDER = 'rider',                // Delivery rider
  GROWTH_ASSOCIATE = 'growth_associate',  // GA (referral agent)
  GROWTH_ELITE = 'growth_elite',  // GE (premium referral agent)
  ADMIN = 'admin'                 // System administrator
}

enum AccountStatus {
  PENDING = 'pending',            // Email not verified
  ACTIVE = 'active',              // Fully active account
  SUSPENDED = 'suspended',        // Temporarily disabled
  DEACTIVATED = 'deactivated'     // Permanently disabled
}
```

### **API Endpoints**
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/verify-email` - Email verification
- `POST /auth/forgot-password` - Password reset request
- `POST /auth/reset-password` - Password reset
- `GET /auth/profile` - Get current user profile
- `POST /auth/logout` - User logout

### **JWT Token Structure**
```typescript
{
  id: string,           // User ID
  email: string,        // User email
  role: UserRole,       // User role
  accountStatus: AccountStatus,
  emailVerified: boolean,
  iat: number,          // Issued at
  exp: number           // Expires at
}
```

---

## 👤 USER MANAGEMENT

### **User Entity Schema**
```typescript
interface User {
  _id: ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  password: string;         // Hashed with bcrypt
  phoneNumber?: string;
  role: UserRole;
  accountStatus: AccountStatus;
  emailVerified: boolean;
  referralCode?: string;    // Unique referral code
  referrerId?: ObjectId;    // Who referred this user
  creditScore?: number;     // Credit rating (300-850)
  address?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### **API Endpoints**
- `GET /users/profile` - Get current user profile
- `PATCH /users/profile` - Update user profile
- `GET /users/:id` - Get user by ID (admin only)
- `GET /users/search` - Search users (admin only)

---

## 🛍️ PRODUCT MANAGEMENT

### **Product Entity Schema**
```typescript
interface Product {
  _id: ObjectId;
  name: string;
  description: string;
  category: string;
  price: number;
  discountPrice?: number;
  stock: number;
  images: string[];         // Array of image URLs
  sellerId: ObjectId;       // Reference to seller
  isActive: boolean;
  tags: string[];
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  nutritionalInfo?: object;
  expiryDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

### **API Endpoints**
- `GET /products` - Get products with filtering/pagination
- `GET /products/:id` - Get product details
- `GET /products/categories` - Get product categories
- `GET /products/search` - Search products
- `POST /products` - Create product (seller/admin only)
- `PATCH /products/:id` - Update product (seller/admin only)
- `DELETE /products/:id` - Delete product (seller/admin only)

### **Product Filtering Options**
```typescript
interface ProductFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  sellerId?: string;
  tags?: string[];
  search?: string;      // Search in name/description
  sortBy?: 'price' | 'name' | 'createdAt' | 'rating';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}
```

---

## 🛒 SHOPPING CART & ORDERS

### **Shopping Flow**
```
Add to Cart → View Cart → Checkout → Payment → Order Tracking
```

### **Cart Management**
- `POST /orders/cart/add` - Add item to cart
- `PATCH /orders/cart/:productId` - Update cart item quantity
- `DELETE /orders/cart/remove` - Remove item from cart
- `GET /orders/cart` - Get current cart
- `DELETE /orders/cart` - Clear entire cart

### **Order Entity Schema**
```typescript
interface Order {
  _id: ObjectId;
  orderNumber: string;      // Unique order identifier
  userId: ObjectId;
  items: CartItem[];
  totalAmount: number;
  status: OrderStatus;
  paymentPlan: PaymentPlan;
  deliveryMethod: 'home_delivery' | 'pickup';
  deliveryAddress?: DeliveryAddress;
  deliveryFee: number;
  estimatedDeliveryTime?: Date;
  paymentHistory: PaymentRecord[];
  createdAt: Date;
  updatedAt: Date;
}

interface CartItem {
  productId: ObjectId;
  product: Product;         // Populated product details
  quantity: number;
  priceAtTime: number;      // Price when added to cart
  subtotal: number;
}

enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PREPARING = 'preparing',
  READY_FOR_PICKUP = 'ready_for_pickup',
  OUT_FOR_DELIVERY = 'out_for_delivery',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded'
}
```

### **Payment Plans**
```typescript
interface PaymentPlan {
  type: 'pay_now' | 'pay_later' | 'installments' | 'price_lock';
  payNowDetails?: {};
  payLaterDetails?: {
    creditCheckRequired: boolean;
    dueDate: Date;
  };
  installmentDetails?: {
    numberOfInstallments: number;
    installmentAmount: number;
    frequency: 'weekly' | 'monthly';
    firstPaymentDate: Date;
  };
  priceLockDetails?: {
    lockDuration: number;     // Days
    lockAmount: number;       // Amount to lock price
  };
}
```

### **Order API Endpoints**
- `POST /orders/checkout` - Create order from cart
- `GET /orders` - Get user's orders
- `GET /orders/:id` - Get order details
- `POST /orders/:id/payment` - Make payment for order
- `GET /orders/:id/track` - Track order status
- `POST /orders/:id/cancel` - Cancel order
- `POST /orders/:id/rate` - Rate completed order

---

## 💳 DIGITAL WALLET SYSTEM

### **Three Wallet Types**
```typescript
interface Wallet {
  _id: ObjectId;
  userId: ObjectId;
  foodMoney: number;        // Nigerian Naira (NGN)
  foodPoints: number;       // Nibia points (loyalty currency)
  foodSafe: number;         // Savings account
  totalBalance: number;     // Auto-calculated total
  status: WalletStatus;
  nibiaWithdrawEnabled: boolean;  // Only for GA/GE users
  lastTransactionAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

enum WalletStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  FROZEN = 'frozen'
}
```

### **Wallet API Endpoints**
- `GET /wallets/my-wallet` - Get current user's wallet
- `POST /wallets/create` - Create wallet for user
- `POST /wallets/fund` - Add money to wallet
- `POST /wallets/transfer` - Transfer money between wallets
- `GET /wallets/transactions` - Get transaction history
- `POST /wallets/withdraw` - Request withdrawal (GA/GE only)

### **Transaction Types**
```typescript
enum TransactionType {
  DEPOSIT = 'deposit',
  WITHDRAWAL = 'withdrawal',
  TRANSFER_IN = 'transfer_in',
  TRANSFER_OUT = 'transfer_out',
  PURCHASE = 'purchase',
  REFUND = 'refund',
  COMMISSION = 'commission',
  PENALTY = 'penalty'
}
```

---

## 🚚 DELIVERY SYSTEM

### **Delivery Entity Schema**
```typescript
interface Delivery {
  _id: ObjectId;
  orderId: ObjectId;
  riderId?: ObjectId;
  customerId: ObjectId;
  pickupAddress: string;
  deliveryAddress: string;
  status: DeliveryStatus;
  estimatedDeliveryTime: Date;
  actualDeliveryTime?: Date;
  deliveryFee: number;
  paymentStatus: PaymentStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

enum DeliveryStatus {
  PENDING = 'pending',
  ASSIGNED = 'assigned',
  PICKED_UP = 'picked_up',
  IN_TRANSIT = 'in_transit',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}
```

### **Rider Entity Schema**
```typescript
interface Rider {
  _id: ObjectId;
  userId: ObjectId;
  vehicleType: 'bicycle' | 'motorcycle' | 'car';
  licenseNumber?: string;
  isAvailable: boolean;
  isOnDelivery: boolean;
  currentLocation?: {
    latitude: number;
    longitude: number;
  };
  rating: number;
  totalDeliveries: number;
  status: RiderStatus;
  createdAt: Date;
  updatedAt: Date;
}
```

### **Delivery API Endpoints**
- `GET /delivery/track/:orderId` - Track delivery status
- `GET /delivery/riders/nearby` - Find nearby riders
- `POST /delivery/assign` - Assign rider to delivery (admin)
- `PATCH /delivery/:id/status` - Update delivery status (rider)

---

## 🎪 AUCTION SYSTEM

### **Auction Entity Schema**
```typescript
interface Auction {
  _id: ObjectId;
  productId: ObjectId;
  product: Product;         // Populated product details
  startingBid: number;
  currentBid: number;
  minimumBidIncrement: number;
  currentTopBidder?: ObjectId;
  startTime: Date;
  endTime: Date;
  status: AuctionStatus;
  bids: Bid[];
  winnerId?: ObjectId;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

enum AuctionStatus {
  UPCOMING = 'upcoming',
  ACTIVE = 'active',
  ENDED = 'ended',
  CANCELLED = 'cancelled'
}

interface Bid {
  bidderId: ObjectId;
  amount: number;
  timestamp: Date;
}
```

### **Auction API Endpoints**
- `GET /auctions` - Get active auctions
- `GET /auctions/:id` - Get auction details
- `POST /auctions/:id/bid` - Place bid on auction
- `GET /auctions/user/bids` - Get user's bids
- `GET /auctions/user/won` - Get user's won auctions

---

## 🤝 REFERRAL & COMMISSION SYSTEM

### **Referral Tiers**
```typescript
enum ReferralTier {
  BRONZE = 'bronze',        // Regular users
  SILVER = 'silver',        // 5+ referrals
  GOLD = 'gold',           // 15+ referrals
  GROWTH_ASSOCIATE = 'growth_associate',  // 30+ referrals
  GROWTH_ELITE = 'growth_elite'           // 50+ referrals
}
```

### **Commission Structure**
```typescript
const REFERRAL_TIER_CONFIG = {
  bronze: { commissionPercentage: 2.0, maxCommission: 500 },
  silver: { commissionPercentage: 3.0, maxCommission: 1000 },
  gold: { commissionPercentage: 4.0, maxCommission: 2000 },
  growth_associate: { commissionPercentage: 5.0, maxCommission: 5000 },
  growth_elite: { commissionPercentage: 7.0, maxCommission: 10000 }
};
```

### **Referral API Endpoints**
- `GET /referrals/my-referrals` - Get user's referrals
- `GET /referrals/my-commissions` - Get commission history
- `POST /referrals/apply-code` - Apply referral code
- `GET /referrals/stats` - Get referral statistics

---

## 📊 ADMIN DASHBOARD FEATURES

### **User Management**
- View all users with filtering
- Suspend/activate user accounts
- Reset user passwords
- View user activity logs

### **Order Management**
- View all orders with status filtering
- Update order statuses
- Process refunds and cancellations
- Generate order reports

### **Product Management**
- Approve/reject seller products
- Bulk stock updates
- Category management
- Product analytics

### **Financial Management**
- Wallet management and adjustments
- Commission calculations and payments
- Transaction monitoring and reporting
- Withdrawal request approvals

### **Delivery Management**
- Rider assignment and tracking
- Delivery route optimization
- Performance metrics and reporting

---

## 🔔 NOTIFICATION SYSTEM

### **Notification Types**
```typescript
enum NotificationType {
  ORDER_CONFIRMED = 'order_confirmed',
  ORDER_SHIPPED = 'order_shipped',
  ORDER_DELIVERED = 'order_delivered',
  PAYMENT_RECEIVED = 'payment_received',
  COMMISSION_EARNED = 'commission_earned',
  AUCTION_WON = 'auction_won',
  AUCTION_OUTBID = 'auction_outbid',
  WALLET_CREDITED = 'wallet_credited',
  REFERRAL_JOINED = 'referral_joined'
}
```

### **Notification API Endpoints**
- `GET /notifications` - Get user notifications
- `PATCH /notifications/:id/read` - Mark notification as read
- `POST /notifications/subscribe` - Subscribe to push notifications

---

## 📱 MOBILE APP FEATURES TO IMPLEMENT

### **🔐 Authentication Screens**
1. **Splash Screen** - App loading
2. **Onboarding** - App introduction slides
3. **Register Screen** - User registration form
4. **Login Screen** - Email/password login
5. **Email Verification** - OTP or link verification
6. **Forgot Password** - Password reset flow
7. **Profile Setup** - Additional user details

### **🏠 Main App Screens**

#### **Home Tab**
- **Home Screen** - Featured products, categories, search
- **Product List** - Browse products with filters
- **Product Detail** - Product info, reviews, add to cart
- **Search Screen** - Product search with filters
- **Category Screen** - Products by category

#### **Cart Tab**
- **Cart Screen** - View cart items, quantities
- **Checkout Screen** - Select payment method, delivery address
- **Payment Screen** - Payment processing
- **Order Confirmation** - Order success/failure

#### **Orders Tab**
- **Orders List** - All user orders with status
- **Order Detail** - Order tracking, items, payments
- **Order Tracking** - Real-time delivery tracking
- **Rate Order** - Order rating and review

#### **Wallet Tab**
- **Wallet Overview** - Balance display (3 wallet types)
- **Fund Wallet** - Add money via payment gateway
- **Transfer Money** - Send money to other users
- **Transaction History** - All wallet transactions
- **Withdrawal** - Request withdrawal (GA/GE only)

#### **Profile Tab**
- **Profile Screen** - User info, settings
- **Edit Profile** - Update user details
- **Referrals** - Referral code, commission history
- **Settings** - App preferences, notifications
- **Help & Support** - FAQ, contact support

### **🎪 Additional Features**
- **Auctions Screen** - Live auction participation
- **Notifications** - Push notification center
- **QR Code Scanner** - Quick product lookup
- **Voice Search** - Voice-powered product search
- **Wishlist** - Save favorite products
- **Reviews** - Product reviews and ratings

### **🚚 Delivery Features**
- **Delivery Tracking** - Real-time order tracking
- **Delivery Address** - Manage delivery addresses
- **Delivery Schedule** - Schedule delivery times

### **🤝 Referral Features**
- **Referral Dashboard** - Commission tracking
- **Share Referral Code** - Social sharing
- **Tier Progress** - Referral tier advancement
- **Commission History** - Detailed commission records

---

## 🔗 API INTEGRATION GUIDELINES

### **Base Configuration**
```typescript
const API_CONFIG = {
  BASE_URL: 'https://forage-stores-backend.onrender.com',
  TIMEOUT: 10000,
  HEADERS: {
    'Content-Type': 'application/json',
  },
};
```

### **Authentication Headers**
```typescript
// Include JWT token in all authenticated requests
headers: {
  'Authorization': `Bearer ${jwt_token}`,
  'Content-Type': 'application/json',
}
```

### **Error Handling**
```typescript
// Common HTTP error codes to handle
401 - Unauthorized (redirect to login)
403 - Forbidden (show access denied)
404 - Not Found (show not found message)
422 - Validation Error (show field errors)
500 - Server Error (show generic error)
```

### **Pagination Pattern**
```typescript
// Most list endpoints support pagination
GET /products?page=1&limit=20&sortBy=createdAt&sortOrder=desc
```

### **Real-time Updates**
```typescript
// Use Server-Sent Events for real-time order updates
GET /orders/events/subscribe
```

---

## 📊 KEY BUSINESS LOGIC

### **Shopping Cart Logic**
- Cart persists on backend per user
- Price lock available for 7 days
- Automatic stock validation on checkout
- Multiple payment plans supported

### **Commission Calculation**
- Commissions calculated on completed orders
- Tier-based percentage rates
- Maximum commission limits per tier
- Automatic wallet crediting

### **Wallet Management**
- Three separate wallet types
- Automatic balance calculations
- Transaction history tracking
- Withdrawal restrictions (GA/GE only)

### **Order State Machine**
```
PENDING → CONFIRMED → PREPARING → READY_FOR_PICKUP/OUT_FOR_DELIVERY → DELIVERED
     ↓
CANCELLED ← (possible from PENDING/CONFIRMED)
     ↓
REFUNDED ← (possible from CANCELLED/DELIVERED)
```

---

## 🔧 TECHNICAL SPECIFICATIONS

### **Authentication Requirements**
- JWT token storage in secure storage
- Automatic token refresh
- Biometric authentication (optional)
- Session timeout handling

### **Offline Capabilities**
- Cache product data
- Store cart items locally
- Sync when connection restored
- Offline notification queue

### **Performance Requirements**
- Image lazy loading
- Infinite scroll for product lists
- Local data caching
- Optimistic UI updates

### **Security Requirements**
- HTTPS only communication
- Input validation on all forms
- Secure storage for sensitive data
- Protection against common attacks

---

## 🚀 DEPLOYMENT INFORMATION

**Backend URL:** https://forage-stores-backend.onrender.com  
**API Documentation:** https://forage-stores-backend.onrender.com/api  
**Environment:** Production-ready  
**Database:** MongoDB Atlas (Cloud)  

### **Admin Test Credentials**
```
Email: admin@forage.com
Password: AdminSecure123!
```

### **CORS Configuration**
The backend is configured to accept requests from:
- Mobile development environments
- Production mobile apps
- Web applications

---

## 📋 DEVELOPMENT CHECKLIST

### **Phase 1: Core Features**
- [ ] Authentication system (register, login, verification)
- [ ] User profile management
- [ ] Product browsing and search
- [ ] Shopping cart functionality
- [ ] Basic order placement

### **Phase 2: Advanced Features**
- [ ] Wallet system integration
- [ ] Payment processing
- [ ] Order tracking
- [ ] Push notifications
- [ ] Referral system

### **Phase 3: Premium Features**
- [ ] Auction participation
- [ ] Advanced analytics
- [ ] Social features
- [ ] Voice search
- [ ] AR product preview

---

## 🎯 SUCCESS METRICS

### **User Engagement**
- Daily Active Users (DAU)
- Session duration
- Cart abandonment rate
- Order completion rate

### **Business Metrics**
- Gross Merchandise Value (GMV)
- Average Order Value (AOV)
- Customer Lifetime Value (CLV)
- Referral conversion rate

### **Technical Metrics**
- App crash rate
- API response times
- App store ratings
- Load times

---

This comprehensive guide provides all the context needed to build a complete mobile application for the Forage Stores backend. The backend is fully functional and deployed, ready for mobile app integration.
