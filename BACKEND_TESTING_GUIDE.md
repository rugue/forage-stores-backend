# 🧪 FORAGE STORES BACKEND - COMPREHENSIVE TESTING GUIDE

## 📋 Table of Contents
1. [Getting Started](#getting-started)
2. [Authentication Testing](#authentication-testing)
3. [User Management Testing](#user-management-testing)
4. [Product Management Testing](#product-management-testing)
5. [Shopping Cart & Orders Testing](#shopping-cart--orders-testing)
6. [Digital Wallet System Testing](#digital-wallet-system-testing)
7. [Delivery System Testing](#delivery-system-testing)
8. [Auction System Testing](#auction-system-testing)
9. [Referral & Commission Testing](#referral--commission-testing)
10. [Admin Dashboard Testing](#admin-dashboard-testing)
11. [Notification System Testing](#notification-system-testing)
12. [Error Scenarios & Edge Cases](#error-scenarios--edge-cases)
13. [Testing Completion Checklist](#testing-completion-checklist)

---

## 🚀 Getting Started

### Prerequisites
- **Swagger UI:** https://forage-stores-backend.onrender.com/api
- **Backend URL:** https://forage-stores-backend.onrender.com
- **Admin Credentials:** admin@forage.com / AdminSecure123!

### Initial Setup
1. Open Swagger UI in your browser
2. Test health endpoint: `GET /health`
3. Expected response: `{ "status": "ok", "timestamp": "..." }`

### How to Use This Guide
- 🔐 **Admin tests** require admin login first
- 👤 **User tests** require user account creation and login
- 📋 **Follow the sequence** - tests build on each other
- ✅ **Check expected responses** to verify success
- ⚠️ **Error tests** should fail as expected

---

## 🔐 Authentication Testing

### Test 1: Admin Login (CRITICAL)
**Purpose:** Get admin access token for protected endpoints
**Endpoint:** `POST /auth/login`

**Step 1:** In Swagger UI, find "auth" section → click "POST /auth/login"
**Step 2:** Click "Try it out"
**Step 3:** Enter request body:

```json
{
  "email": "admin@forage.com",
  "password": "AdminSecure123!"
}
```

**Step 4:** Click "Execute"

**✅ Expected Response (Status: 200):**
```json
{
  "user": {
    "id": "...",
    "email": "admin@forage.com",
    "name": "Admin User",
    "role": "admin",
    "accountStatus": "ACTIVE"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**📝 Important:** Copy the `accessToken` - you'll need it for admin operations!

### Test 2: Create Test User Account
**Purpose:** Create a user account for user testing
**Endpoint:** `POST /auth/register`

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john.doe@test.com",
  "password": "TestPassword123!",
  "phone": "+2348012345678",
  "city": "Lagos"
}
```

**✅ Expected Response (Status: 201):**
```json
{
  "message": "Registration successful. Please check your email to verify your account.",
  "user": {
    "id": "...",
    "email": "john.doe@test.com",
    "name": "John Doe",
    "role": "user",
    "accountStatus": "PENDING",
    "emailVerified": false
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**📝 Note:** User account will be in PENDING status until activated by admin.

### Test 3: Activate User Account (Admin Required)
**Purpose:** Activate the test user account
**Endpoint:** `PATCH /admin/users/{userId}/activate`

**Step 1:** Get the userId from Test 2 response
**Step 2:** In Swagger, click the 🔓 "Authorize" button
**Step 3:** Enter: `Bearer <your_admin_token>`
**Step 4:** Find "admin" section → "PATCH /admin/users/{userId}/activate"
**Step 5:** Enter the userId in path parameter
**Step 6:** Execute

**✅ Expected Response (Status: 200):**
```json
{
  "message": "User activated successfully",
  "user": {
    "id": "...",
    "accountStatus": "ACTIVE"
  }
}
```

### Test 4: User Login
**Purpose:** Test user authentication
**Endpoint:** `POST /auth/login`

**Request Body:**
```json
{
  "email": "john.doe@test.com",
  "password": "TestPassword123!"
}
```

**✅ Expected Response (Status: 200):**
```json
{
  "user": {
    "id": "...",
    "email": "john.doe@test.com",
    "name": "John Doe",
    "role": "user",
    "accountStatus": "ACTIVE"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**📝 Important:** Copy this user token for user operations!

### Test 5: Get Profile (Protected Route)
**Purpose:** Test JWT token validation
**Endpoint:** `GET /auth/profile`

**Step 1:** Authorize with user token
**Step 2:** Execute GET /auth/profile

**✅ Expected Response (Status: 200):**
```json
{
  "id": "...",
  "email": "john.doe@test.com",
  "name": "John Doe",
  "role": "user",
  "accountStatus": "ACTIVE",
  "emailVerified": true,
  "phone": "+2348012345678",
  "city": "Lagos"
}
```

---

## 👤 User Management Testing

### Test 6: Get All Users (Admin Only)
**Purpose:** Test admin user listing
**Endpoint:** `GET /admin/users`

**Prerequisites:** Admin authorization required

**Query Parameters:**
- page: 1
- limit: 10

**✅ Expected Response (Status: 200):**
```json
{
  "users": [
    {
      "id": "...",
      "email": "admin@forage.com",
      "name": "Admin User",
      "role": "admin",
      "accountStatus": "ACTIVE"
    },
    {
      "id": "...",
      "email": "john.doe@test.com", 
      "name": "John Doe",
      "role": "user",
      "accountStatus": "ACTIVE"
    }
  ],
  "total": 2,
  "page": 1,
  "limit": 10
}
```

### Test 7: Update User Profile
**Purpose:** Test profile update functionality
**Endpoint:** `PATCH /users/profile/{userId}`

**Prerequisites:** User authorization required

**Request Body:**
```json
{
  "name": "Johnny Smith",
  "phone": "+2348087654321",
  "city": "Abuja",
  "address": "123 Test Street, Abuja"
}
```

**✅ Expected Response (Status: 200):**
```json
{
  "id": "...",
  "name": "Johnny Smith",
  "phone": "+2348087654321",
  "city": "Abuja",
  "address": "123 Test Street, Abuja",
  "email": "john.doe@test.com",
  "role": "user",
  "accountStatus": "ACTIVE"
}
```

---

## 🛍️ Product Management Testing

### Test 8: Create Product (Admin Only)
**Purpose:** Test product creation
**Endpoint:** `POST /products`

**Prerequisites:** Admin authorization required

**Request Body:**
```json
{
  "name": "Fresh Tomatoes",
  "description": "Farm fresh tomatoes from local farmers",
  "price": 2500,
  "priceInNibia": 625,
  "weight": 1000,
  "city": "Lagos",
  "category": "vegetables",
  "tags": ["fresh", "organic", "local"],
  "deliveryType": "free",
  "stock": 100,
  "images": ["https://example.com/tomatoes.jpg"]
}
```

**✅ Expected Response (Status: 201):**
```json
{
  "id": "...",
  "name": "Fresh Tomatoes",
  "description": "Farm fresh tomatoes from local farmers",
  "price": 2500,
  "priceInNibia": 625,
  "weight": 1000,
  "city": "Lagos",
  "category": "vegetables",
  "tags": ["fresh", "organic", "local"],
  "deliveryType": "free",
  "stock": 100,
  "images": ["https://example.com/tomatoes.jpg"],
  "isActive": true,
  "createdAt": "...",
  "updatedAt": "..."
}
```

**📝 Important:** Save the product ID for cart testing!

### Test 9: Get All Products (Public)
**Purpose:** Test public product listing
**Endpoint:** `GET /products`

**Query Parameters:**
- page: 1
- limit: 10
- category: vegetables

**✅ Expected Response (Status: 200):**
```json
{
  "products": [
    {
      "id": "...",
      "name": "Fresh Tomatoes",
      "price": 2500,
      "priceInNibia": 625,
      "category": "vegetables",
      "stock": 100,
      "images": ["https://example.com/tomatoes.jpg"],
      "isActive": true,
      "city": "Lagos",
      "weight": 1000
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10,
  "totalPages": 1
}
```

### Test 10: Get Single Product
**Purpose:** Test product details retrieval
**Endpoint:** `GET /products/{productId}`

**Path Parameter:** Use product ID from Test 8

**✅ Expected Response (Status: 200):**
```json
{
  "id": "...",
  "name": "Fresh Tomatoes",
  "description": "Farm fresh tomatoes from local farmers",
  "price": 2500,
  "priceInNibia": 625,
  "category": "vegetables",
  "stock": 100,
  "weight": 1000,
  "tags": ["fresh", "organic", "local"],
  "images": ["https://example.com/tomatoes.jpg"],
  "isActive": true,
  "city": "Lagos",
  "deliveryType": "free",
  "createdAt": "...",
  "updatedAt": "..."
}
```

### Test 11: Search Products
**Purpose:** Test product search functionality
**Endpoint:** `GET /products/search`

**Query Parameters:**
- q: tomatoes
- limit: 10

**✅ Expected Response (Status: 200):**
```json
{
  "products": [
    {
      "id": "...",
      "name": "Fresh Tomatoes",
      "price": 2500,
      "category": "vegetables"
    }
  ],
  "total": 1,
  "searchTerm": "tomatoes"
}
```

---

## 🛒 Shopping Cart & Orders Testing

### Test 12: Add Item to Cart
**Purpose:** Test cart functionality
**Endpoint:** `POST /orders/cart/add`

**Prerequisites:** User authorization required

**Request Body:**
```json
{
  "productId": "<product_id_from_test_8>",
  "quantity": 3
}
```

**✅ Expected Response (Status: 201):**
```json
{
  "message": "Item added to cart successfully",
  "cartItem": {
    "productId": "...",
    "quantity": 3,
    "product": {
      "name": "Fresh Tomatoes",
      "price": 2500,
      "priceInNibia": 625
    }
  }
}
```

### Test 13: Get Cart
**Purpose:** Test cart retrieval
**Endpoint:** `GET /orders/cart`

**Prerequisites:** User authorization required

**✅ Expected Response (Status: 200):**
```json
{
  "items": [
    {
      "productId": "...",
      "product": {
        "name": "Fresh Tomatoes",
        "price": 2500,
        "priceInNibia": 625
      },
      "quantity": 3,
      "subtotal": 7500
    }
  ],
  "totalItems": 1,
  "totalAmount": 7500,
  "totalAmountInNibia": 1875
}
```

### Test 14: Update Cart Item
**Purpose:** Test cart item quantity update
**Endpoint:** `PATCH /orders/cart/{productId}`

**Path Parameter:** Use product ID
**Prerequisites:** User authorization required

**Request Body:**
```json
{
  "quantity": 5
}
```

**✅ Expected Response (Status: 200):**
```json
{
  "message": "Cart item updated successfully",
  "cartItem": {
    "productId": "...",
    "quantity": 5,
    "subtotal": 12500
  }
}
```

### Test 15: Checkout Cart
**Purpose:** Test order creation from cart
**Endpoint:** `POST /orders/checkout`

**Prerequisites:** User authorization required

**Request Body:**
```json
{
  "deliveryMethod": "home_delivery",
  "deliveryAddress": {
    "street": "123 Test Street",
    "city": "Lagos",
    "state": "Lagos",
    "postalCode": "100001",
    "country": "Nigeria",
    "instructions": "Call when you arrive"
  },
  "paymentPlan": {
    "type": "pay_now"
  }
}
```

**✅ Expected Response (Status: 201):**
```json
{
  "order": {
    "id": "...",
    "orderNumber": "ORD-...",
    "status": "pending",
    "items": [
      {
        "productId": "...",
        "quantity": 5,
        "priceAtTime": 2500,
        "subtotal": 12500
      }
    ],
    "totalAmount": 12500,
    "deliveryFee": 500,
    "grandTotal": 13000,
    "deliveryAddress": {...},
    "paymentPlan": {...}
  }
}
```

**📝 Important:** Save the order ID for payment testing!

### Test 16: Get User Orders
**Purpose:** Test order history retrieval
**Endpoint:** `GET /orders`

**Prerequisites:** User authorization required

**✅ Expected Response (Status: 200):**
```json
{
  "orders": [
    {
      "id": "...",
      "orderNumber": "ORD-...",
      "status": "pending",
      "totalAmount": 12500,
      "deliveryFee": 500,
      "grandTotal": 13000,
      "createdAt": "...",
      "updatedAt": "..."
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10
}
```

### Test 17: Get Order Details
**Purpose:** Test single order retrieval
**Endpoint:** `GET /orders/{orderId}`

**Path Parameter:** Use order ID from Test 15
**Prerequisites:** User authorization required

**✅ Expected Response (Status: 200):**
```json
{
  "id": "...",
  "orderNumber": "ORD-...",
  "status": "pending",
  "items": [...],
  "totalAmount": 12500,
  "deliveryFee": 500,
  "grandTotal": 13000,
  "deliveryAddress": {...},
  "paymentPlan": {...},
  "paymentHistory": [],
  "createdAt": "...",
  "updatedAt": "..."
}
```

---

## 💳 Digital Wallet System Testing

### Test 18: Create User Wallet
**Purpose:** Test wallet creation
**Endpoint:** `POST /wallets/create`

**Prerequisites:** User authorization required

**✅ Expected Response (Status: 201):**
```json
{
  "id": "...",
  "userId": "...",
  "foodMoney": 0,
  "foodPoints": 0,
  "foodSafe": 0,
  "status": "active",
  "nibiaWithdrawEnabled": false,
  "createdAt": "...",
  "updatedAt": "..."
}
```

### Test 19: Get User Wallet
**Purpose:** Test wallet balance retrieval
**Endpoint:** `GET /wallets/my-wallet`

**Prerequisites:** User authorization required

**✅ Expected Response (Status: 200):**
```json
{
  "foodMoney": 0,
  "foodPoints": 0,
  "foodSafe": 0,
  "totalBalance": 0,
  "status": "active",
  "lastTransactionAt": null
}
```

### Test 20: Credit User Wallet (Admin Only)
**Purpose:** Test wallet funding
**Endpoint:** `POST /admin/wallets/fund`

**Prerequisites:** Admin authorization required

**Request Body:**
```json
{
  "userId": "<user_id_from_test_4>",
  "amount": 50000,
  "walletType": "foodMoney",
  "description": "Test wallet credit",
  "adminPassword": "AdminSecure123!"
}
```

**✅ Expected Response (Status: 201):**
```json
{
  "message": "Wallet funded successfully",
  "transaction": {
    "id": "...",
    "amount": 50000,
    "type": "deposit",
    "walletType": "foodMoney",
    "description": "Test wallet credit",
    "balance": 50000,
    "timestamp": "..."
  }
}
```

### Test 21: Get Wallet Transactions
**Purpose:** Test transaction history
**Endpoint:** `GET /wallets/transactions`

**Prerequisites:** User authorization required

**Query Parameters:**
- page: 1
- limit: 10

**✅ Expected Response (Status: 200):**
```json
{
  "transactions": [
    {
      "id": "...",
      "amount": 50000,
      "type": "deposit",
      "walletType": "foodMoney",
      "description": "Test wallet credit",
      "balance": 50000,
      "createdAt": "..."
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10
}
```

### Test 22: Make Order Payment
**Purpose:** Test order payment with wallet
**Endpoint:** `POST /orders/{orderId}/payment`

**Path Parameter:** Use order ID from Test 15
**Prerequisites:** User authorization required

**Request Body:**
```json
{
  "paymentMethod": "wallet",
  "walletType": "foodMoney",
  "amount": 13000
}
```

**✅ Expected Response (Status: 200):**
```json
{
  "message": "Payment processed successfully",
  "payment": {
    "id": "...",
    "orderId": "...",
    "amount": 13000,
    "paymentMethod": "wallet",
    "status": "completed",
    "transactionRef": "TXN-..."
  },
  "order": {
    "id": "...",
    "status": "confirmed",
    "paymentStatus": "paid"
  }
}
```

---

## 🚚 Delivery System Testing

### Test 23: Create Rider Profile (Admin Only)
**Purpose:** Test rider creation
**Endpoint:** `POST /riders`

**Prerequisites:** Admin authorization required

**Request Body:**
```json
{
  "userId": "<user_id_from_test_4>",
  "vehicle": {
    "type": "motorcycle",
    "licensePlate": "KJA-123-ABC",
    "model": "Honda CBR",
    "year": 2023,
    "color": "Red"
  },
  "serviceAreas": ["Lagos", "Ikeja"],
  "maxDeliveryDistance": 20
}
```

**✅ Expected Response (Status: 201):**
```json
{
  "id": "...",
  "userId": "...",
  "status": "pending_verification",
  "isAvailable": false,
  "isOnDelivery": false,
  "vehicle": {
    "type": "motorcycle",
    "licensePlate": "KJA-123-ABC",
    "model": "Honda CBR"
  },
  "serviceAreas": ["Lagos", "Ikeja"],
  "deliveryStats": {
    "completedDeliveries": 0,
    "averageRating": 0
  }
}
```

### Test 24: Assign Order to Rider (Admin Only)
**Purpose:** Test delivery assignment
**Endpoint:** `POST /delivery`

**Prerequisites:** Admin authorization required

**Request Body:**
```json
{
  "orderId": "<order_id_from_test_15>",
  "riderId": "<rider_id_from_test_23>",
  "deliveryAddress": "123 Test Street, Lagos",
  "estimatedDeliveryTime": "2025-09-08T14:00:00.000Z",
  "deliveryFee": 500
}
```

**✅ Expected Response (Status: 201):**
```json
{
  "id": "...",
  "orderId": "...",
  "riderId": "...",
  "customerId": "...",
  "status": "assigned",
  "deliveryAddress": "123 Test Street, Lagos",
  "estimatedDeliveryTime": "2025-09-08T14:00:00.000Z",
  "deliveryFee": 500
}
```

### Test 25: Track Order Delivery
**Purpose:** Test delivery tracking
**Endpoint:** `GET /delivery/track/{orderId}`

**Path Parameter:** Use order ID from Test 15
**Prerequisites:** User authorization required

**✅ Expected Response (Status: 200):**
```json
{
  "orderId": "...",
  "status": "assigned",
  "rider": {
    "id": "...",
    "firstName": "Mike",
    "lastName": "Rider",
    "phoneNumber": "+2348098765432",
    "vehicleType": "motorcycle"
  },
  "estimatedDeliveryTime": "2025-09-08T14:00:00.000Z",
  "currentLocation": null,
  "deliveryProgress": "Order assigned to rider"
}
```

### Test 26: Update Delivery Status (Admin Only)
**Purpose:** Test delivery status update
**Endpoint:** `PATCH /delivery/{deliveryId}/status`

**Path Parameter:** Use delivery ID from Test 24
**Prerequisites:** Admin authorization required

**Request Body:**
```json
{
  "status": "picked_up",
  "notes": "Order picked up from seller"
}
```

**✅ Expected Response (Status: 200):**
```json
{
  "message": "Delivery status updated successfully",
  "delivery": {
    "id": "...",
    "status": "picked_up",
    "statusHistory": [
      {
        "status": "assigned",
        "timestamp": "...",
        "notes": "Order assigned to rider"
      },
      {
        "status": "picked_up",
        "timestamp": "...",
        "notes": "Order picked up from seller"
      }
    ]
  }
}
```

---

## 🎪 Auction System Testing

### Test 27: Create Auction (Admin Only)
**Purpose:** Test auction creation
**Endpoint:** `POST /auctions`

**Prerequisites:** Admin authorization required

**Request Body:**
```json
{
  "productId": "<product_id_from_test_8>",
  "startingBid": 1500,
  "minimumBidIncrement": 100,
  "startTime": "2025-09-07T10:00:00.000Z",
  "endTime": "2025-09-07T18:00:00.000Z",
  "description": "Fresh tomatoes auction - highest bidder wins!"
}
```

**✅ Expected Response (Status: 201):**
```json
{
  "id": "...",
  "productId": "...",
  "product": {
    "name": "Fresh Tomatoes",
    "images": ["..."]
  },
  "startingBid": 1500,
  "currentBid": 1500,
  "minimumBidIncrement": 100,
  "startTime": "2025-09-07T10:00:00.000Z",
  "endTime": "2025-09-07T18:00:00.000Z",
  "status": "active",
  "totalBids": 0,
  "description": "Fresh tomatoes auction - highest bidder wins!"
}
```

**📝 Important:** Save the auction ID for bidding!

### Test 28: Get All Auctions
**Purpose:** Test auction listing
**Endpoint:** `GET /auctions`

**Query Parameters:**
- status: active
- page: 1
- limit: 10

**✅ Expected Response (Status: 200):**
```json
{
  "auctions": [
    {
      "id": "...",
      "product": {
        "name": "Fresh Tomatoes",
        "images": ["..."]
      },
      "currentBid": 1500,
      "totalBids": 0,
      "status": "active",
      "endTime": "2025-09-07T18:00:00.000Z",
      "timeRemaining": "8h 45m"
    }
  ],
  "total": 1
}
```

### Test 29: Place Bid on Auction
**Purpose:** Test bidding functionality
**Endpoint:** `POST /auctions/{auctionId}/bid`

**Path Parameter:** Use auction ID from Test 27
**Prerequisites:** User authorization required

**Request Body:**
```json
{
  "amount": 1600
}
```

**✅ Expected Response (Status: 201):**
```json
{
  "message": "Bid placed successfully",
  "bid": {
    "id": "...",
    "auctionId": "...",
    "bidderId": "...",
    "amount": 1600,
    "timestamp": "...",
    "status": "winning"
  },
  "auction": {
    "currentBid": 1600,
    "currentTopBidder": "...",
    "totalBids": 1
  }
}
```

### Test 30: Get Auction Details
**Purpose:** Test auction details with bids
**Endpoint:** `GET /auctions/{auctionId}`

**Path Parameter:** Use auction ID from Test 27

**✅ Expected Response (Status: 200):**
```json
{
  "id": "...",
  "product": {
    "name": "Fresh Tomatoes",
    "description": "Farm fresh tomatoes from local farmers",
    "images": ["..."]
  },
  "startingBid": 1500,
  "currentBid": 1600,
  "minimumBidIncrement": 100,
  "currentTopBidder": "...",
  "totalBids": 1,
  "status": "active",
  "endTime": "2025-09-07T18:00:00.000Z",
  "timeRemaining": "8h 30m",
  "bidHistory": [
    {
      "bidderId": "...",
      "amount": 1600,
      "timestamp": "..."
    }
  ]
}
```

### Test 31: Get User's Bids
**Purpose:** Test user bid history
**Endpoint:** `GET /auctions/user/bids`

**Prerequisites:** User authorization required

**✅ Expected Response (Status: 200):**
```json
{
  "bids": [
    {
      "auctionId": "...",
      "auction": {
        "product": {
          "name": "Fresh Tomatoes"
        },
        "currentBid": 1600,
        "status": "active"
      },
      "amount": 1600,
      "status": "winning",
      "timestamp": "..."
    }
  ],
  "total": 1
}
```

---

## 🤝 Referral & Commission Testing

### Test 32: Get User Referral Code
**Purpose:** Test referral code retrieval
**Endpoint:** `GET /referrals/my-code`

**Prerequisites:** User authorization required

**✅ Expected Response (Status: 200):**
```json
{
  "referralCode": "JOHN123ABC",
  "referralLink": "https://forage-stores.com/register?ref=JOHN123ABC",
  "isActive": true,
  "expiryDate": null
}
```

### Test 33: Get Referral Statistics
**Purpose:** Test referral stats retrieval
**Endpoint:** `GET /referrals/my-referrals`

**Prerequisites:** User authorization required

**✅ Expected Response (Status: 200):**
```json
{
  "totalReferrals": 0,
  "activeReferrals": 0,
  "completedReferrals": 0,
  "totalCommissionEarned": 0,
  "pendingCommission": 0,
  "currentTier": "bronze",
  "nextTierRequirement": {
    "tier": "silver",
    "referralsNeeded": 5
  },
  "referrals": []
}
```

### Test 34: Create Referral (Admin Only)
**Purpose:** Test referral creation for testing
**Endpoint:** `POST /admin/referrals/create`

**Prerequisites:** Admin authorization required

**Request Body:**
```json
{
  "referrerId": "<user_id_from_test_4>",
  "referredUserEmail": "jane.doe@test.com",
  "referredUserFirstName": "Jane",
  "referredUserLastName": "Doe"
}
```

**✅ Expected Response (Status: 201):**
```json
{
  "id": "...",
  "referrerId": "...",
  "referredUserId": "...",
  "status": "active",
  "tier": "bronze",
  "commissionPercentage": 2,
  "totalCommissionsEarned": 0,
  "referralDate": "..."
}
```

### Test 35: Get Commission History
**Purpose:** Test commission tracking
**Endpoint:** `GET /referrals/my-commissions`

**Prerequisites:** User authorization required

**✅ Expected Response (Status: 200):**
```json
{
  "commissions": [],
  "totalEarned": 0,
  "pendingAmount": 0,
  "availableForWithdraw": 0,
  "currentTier": "bronze",
  "commissionRate": 2
}
```

---

## 📊 Admin Dashboard Testing

### Test 36: Get Dashboard Statistics (Admin Only)
**Purpose:** Test admin dashboard data
**Endpoint:** `GET /admin/dashboard/stats`

**Prerequisites:** Admin authorization required

**✅ Expected Response (Status: 200):**
```json
{
  "users": {
    "total": 2,
    "active": 2,
    "pending": 0,
    "suspended": 0
  },
  "orders": {
    "total": 1,
    "pending": 0,
    "confirmed": 1,
    "delivered": 0,
    "cancelled": 0
  },
  "products": {
    "total": 1,
    "active": 1,
    "inactive": 0
  },
  "revenue": {
    "total": 10500,
    "thisMonth": 10500,
    "thisWeek": 10500,
    "today": 10500
  },
  "auctions": {
    "active": 1,
    "completed": 0,
    "totalBids": 1
  }
}
```

### Test 37: Get All Orders (Admin Only)
**Purpose:** Test admin order management
**Endpoint:** `GET /admin/orders`

**Prerequisites:** Admin authorization required

**Query Parameters:**
- page: 1
- limit: 10
- status: all

**✅ Expected Response (Status: 200):**
```json
{
  "orders": [
    {
      "id": "...",
      "orderNumber": "ORD-...",
      "user": {
        "firstName": "Johnny",
        "lastName": "Smith",
        "email": "john.doe@test.com"
      },
      "totalAmount": 10000,
      "deliveryFee": 500,
      "grandTotal": 10500,
      "status": "confirmed",
      "paymentStatus": "paid",
      "createdAt": "..."
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10
}
```

### Test 38: Update Order Status (Admin Only)
**Purpose:** Test order status management
**Endpoint:** `PATCH /orders/{orderId}`

**Path Parameter:** Use order ID from Test 15
**Prerequisites:** Admin authorization required

**Request Body:**
```json
{
  "status": "preparing",
  "adminNotes": "Order is being prepared for delivery"
}
```

**✅ Expected Response (Status: 200):**
```json
{
  "message": "Order updated successfully",
  "order": {
    "id": "...",
    "status": "preparing",
    "statusHistory": [
      {
        "status": "pending",
        "timestamp": "...",
        "notes": "Order created"
      },
      {
        "status": "confirmed",
        "timestamp": "...",
        "notes": "Payment received"
      },
      {
        "status": "preparing",
        "timestamp": "...",
        "notes": "Order is being prepared for delivery"
      }
    ]
  }
}
```

### Test 39: Get Wallet Analytics (Admin Only)
**Purpose:** Test wallet system analytics
**Endpoint:** `GET /admin/wallets/analytics`

**Prerequisites:** Admin authorization required

**✅ Expected Response (Status: 200):**
```json
{
  "totalWallets": 2,
  "activeWallets": 2,
  "totalBalance": {
    "foodMoney": 39500,
    "foodPoints": 0,
    "foodSafe": 0
  },
  "totalTransactions": 2,
  "transactionVolume": {
    "deposits": 50000,
    "withdrawals": 0,
    "transfers": 0,
    "purchases": 10500
  }
}
```

---

## 🔔 Notification System Testing

### Test 40: Get User Notifications
**Purpose:** Test notification retrieval
**Endpoint:** `GET /notifications`

**Prerequisites:** User authorization required

**✅ Expected Response (Status: 200):**
```json
{
  "notifications": [
    {
      "id": "...",
      "title": "Order Confirmed",
      "message": "Your order #ORD-... has been confirmed and payment received",
      "type": "order_update",
      "isRead": false,
      "metadata": {
        "orderId": "...",
        "orderNumber": "ORD-..."
      },
      "createdAt": "..."
    },
    {
      "id": "...",
      "title": "Wallet Credited",
      "message": "Your wallet has been credited with ₦50,000",
      "type": "wallet_update",
      "isRead": false,
      "createdAt": "..."
    }
  ],
  "total": 2,
  "unreadCount": 2
}
```

### Test 41: Mark Notification as Read
**Purpose:** Test notification status update
**Endpoint:** `PATCH /notifications/{notificationId}/read`

**Path Parameter:** Use notification ID from Test 40
**Prerequisites:** User authorization required

**✅ Expected Response (Status: 200):**
```json
{
  "message": "Notification marked as read",
  "notification": {
    "id": "...",
    "isRead": true,
    "readAt": "..."
  }
}
```

### Test 42: Send Test Notification (Admin Only)
**Purpose:** Test notification sending
**Endpoint:** `POST /admin/notifications/send`

**Prerequisites:** Admin authorization required

**Request Body:**
```json
{
  "userId": "<user_id_from_test_4>",
  "title": "Test Notification",
  "message": "This is a test notification from admin",
  "type": "admin_message"
}
```

**✅ Expected Response (Status: 201):**
```json
{
  "message": "Notification sent successfully",
  "notification": {
    "id": "...",
    "title": "Test Notification",
    "message": "This is a test notification from admin",
    "type": "admin_message",
    "sentAt": "..."
  }
}
```

---

## ⚠️ Error Scenarios & Edge Cases

### Test 43: Invalid Login Credentials
**Purpose:** Test authentication error handling
**Endpoint:** `POST /auth/login`

**Request Body:**
```json
{
  "email": "wrong@email.com",
  "password": "wrongpassword"
}
```

**✅ Expected Response (Status: 401):**
```json
{
  "statusCode": 401,
  "message": "Invalid credentials",
  "error": "Unauthorized"
}
```

### Test 44: Access Protected Route Without Token
**Purpose:** Test authorization error handling
**Endpoint:** `GET /auth/profile`

**Step:** Execute without Authorization header

**✅ Expected Response (Status: 401):**
```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

### Test 45: Access Admin Route as User
**Purpose:** Test role-based access control
**Endpoint:** `GET /admin/users`

**Prerequisites:** User authorization (not admin)

**✅ Expected Response (Status: 403):**
```json
{
  "statusCode": 403,
  "message": "Forbidden resource",
  "error": "Forbidden"
}
```

### Test 46: Create Order with Insufficient Wallet Balance
**Purpose:** Test wallet balance validation
**Endpoint:** `POST /orders/checkout`

**Prerequisites:** 
1. User authorization
2. Empty user wallet (balance = 0)
3. Cart with expensive items

**Request Body:**
```json
{
  "deliveryMethod": "home_delivery",
  "deliveryAddress": {...},
  "paymentPlan": {
    "type": "pay_now",
    "payNowDetails": {}
  }
}
```

**✅ Expected Response (Status: 400):**
```json
{
  "statusCode": 400,
  "message": "Insufficient wallet balance",
  "error": "Bad Request",
  "details": {
    "required": 10500,
    "available": 0,
    "shortfall": 10500
  }
}
```

### Test 47: Invalid Product ID
**Purpose:** Test not found error handling
**Endpoint:** `GET /products/invalid-product-id`

**✅ Expected Response (Status: 404):**
```json
{
  "statusCode": 404,
  "message": "Product not found",
  "error": "Not Found"
}
```

### Test 48: Duplicate Email Registration
**Purpose:** Test validation error handling
**Endpoint:** `POST /auth/register`

**Request Body:** (Use existing email from Test 2)
```json
{
  "email": "john.doe@test.com",
  "password": "AnotherPassword123!",
  "firstName": "Another",
  "lastName": "User"
}
```

**✅ Expected Response (Status: 409):**
```json
{
  "statusCode": 409,
  "message": "Email already exists",
  "error": "Conflict"
}
```

### Test 49: Invalid Bid Amount
**Purpose:** Test business logic validation
**Endpoint:** `POST /auctions/{auctionId}/bid`

**Request Body:** (Amount less than current bid + increment)
```json
{
  "amount": 1550
}
```

**✅ Expected Response (Status: 400):**
```json
{
  "statusCode": 400,
  "message": "Bid amount must be at least ₦1,700 (current bid + minimum increment)",
  "error": "Bad Request",
  "details": {
    "currentBid": 1600,
    "minimumIncrement": 100,
    "minimumBidRequired": 1700
  }
}
```

### Test 50: Add Out of Stock Product to Cart
**Purpose:** Test stock validation
**Endpoint:** `POST /orders/cart/add`

**Step 1:** First update product stock to 0 (Admin only)
**Endpoint:** `PATCH /admin/products/{productId}/stock`

**Request Body:**
```json
{
  "stock": 0,
  "reason": "Out of stock for testing"
}
```

**Step 2:** Try to add to cart
**Endpoint:** `POST /orders/cart/add`

**Request Body:**
```json
{
  "productId": "<product_id>",
  "quantity": 1
}
```

**✅ Expected Response (Status: 400):**
```json
{
  "statusCode": 400,
  "message": "Product is out of stock",
  "error": "Bad Request",
  "details": {
    "requestedQuantity": 1,
    "availableStock": 0
  }
}
```

---

## ✅ Testing Completion Checklist

### 🔐 Authentication & Authorization
- [ ] Admin login successful (Test 1)
- [ ] User registration successful (Test 2)
- [ ] User account activation works (Test 3)
- [ ] User login after activation (Test 4)
- [ ] Profile retrieval works (Test 5)
- [ ] Invalid credentials rejected (Test 43)
- [ ] Unauthorized access blocked (Test 44)
- [ ] Role-based access control works (Test 45)

### 👤 User Management
- [ ] Get all users (admin) (Test 6)
- [ ] Update user profile (Test 7)
- [ ] User profile validation

### 🛍️ Product Management
- [ ] Product creation (admin) (Test 8)
- [ ] Product listing (public) (Test 9)
- [ ] Product details retrieval (Test 10)
- [ ] Product search functionality (Test 11)
- [ ] Invalid product ID handling (Test 47)
- [ ] Stock management works

### 🛒 Shopping & Orders
- [ ] Add items to cart (Test 12)
- [ ] View cart contents (Test 13)
- [ ] Update cart quantities (Test 14)
- [ ] Checkout process (Test 15)
- [ ] View order history (Test 16)
- [ ] Order details retrieval (Test 17)
- [ ] Out of stock validation (Test 50)

### 💳 Digital Wallet System
- [ ] Wallet creation (Test 18)
- [ ] View wallet balances (Test 19)
- [ ] Credit wallet (admin) (Test 20)
- [ ] Transaction history (Test 21)
- [ ] Order payment processing (Test 22)
- [ ] Insufficient balance handling (Test 46)
- [ ] Wallet analytics (admin) (Test 39)

### 🚚 Delivery System
- [ ] Rider creation (admin) (Test 23)
- [ ] Delivery assignment (Test 24)
- [ ] Order tracking (Test 25)
- [ ] Delivery status updates (Test 26)

### 🎪 Auction System
- [ ] Auction creation (admin) (Test 27)
- [ ] Auction listing (Test 28)
- [ ] Bid placement (Test 29)
- [ ] Auction details (Test 30)
- [ ] User bid history (Test 31)
- [ ] Invalid bid validation (Test 49)

### 🤝 Referral System
- [ ] Referral code generation (Test 32)
- [ ] Referral statistics (Test 33)
- [ ] Referral creation (admin) (Test 34)
- [ ] Commission tracking (Test 35)

### 📊 Admin Operations
- [ ] Dashboard statistics (Test 36)
- [ ] Order management (Test 37)
- [ ] Order status updates (Test 38)
- [ ] User management features
- [ ] Product management features

### 🔔 Notifications
- [ ] Notification retrieval (Test 40)
- [ ] Mark as read functionality (Test 41)
- [ ] Send notifications (admin) (Test 42)

### ⚠️ Error Handling
- [ ] Authentication errors
- [ ] Authorization errors
- [ ] Validation errors
- [ ] Not found errors
- [ ] Business logic errors
- [ ] Duplicate data errors

---

## 📊 Testing Summary & Reporting

### Testing Metrics
- **Total Test Cases:** 50
- **Critical Features:** 10
- **Admin Operations:** 18
- **User Operations:** 25
- **Error Scenarios:** 8

### Test Categories
- **Authentication & Security:** 8 tests
- **User Management:** 2 tests
- **Product Management:** 5 tests
- **Shopping & Orders:** 6 tests
- **Wallet System:** 5 tests
- **Delivery System:** 4 tests
- **Auction System:** 5 tests
- **Referral System:** 4 tests
- **Admin Dashboard:** 4 tests
- **Notifications:** 3 tests
- **Error Handling:** 8 tests

### Success Criteria
✅ **API Functionality:** All endpoints respond correctly  
✅ **Authentication:** Login/logout works for all user types  
✅ **Authorization:** Role-based access control functions  
✅ **Data Validation:** Input validation prevents invalid data  
✅ **Business Logic:** All business rules enforced  
✅ **Error Handling:** Appropriate errors returned  
✅ **Performance:** Reasonable response times  

### Pre-Mobile Development Checklist
- [ ] All critical user journeys tested
- [ ] All admin functions verified
- [ ] Error scenarios handled gracefully
- [ ] API documentation matches implementation
- [ ] Response formats consistent
- [ ] Authentication flow robust
- [ ] Data validation comprehensive

### Next Steps
1. **Document any issues found** during testing
2. **Verify all critical paths** work end-to-end
3. **Confirm API contracts** match mobile app expectations
4. **Test edge cases** specific to your business logic
5. **Validate performance** under expected load
6. **Security testing** completed

---

## 🎉 Congratulations!

Once you've completed all tests in this guide and verified the expected responses, your **Forage Stores Backend is fully ready for mobile app integration!**

The comprehensive testing ensures:
- ✅ All core features work correctly
- ✅ User authentication and authorization are secure
- ✅ Business logic is properly implemented
- ✅ Error handling is robust
- ✅ API contracts are stable

**Your backend is production-ready for mobile app development!** 🚀

---

## 📞 Support & Troubleshooting

### Common Issues
1. **401 Unauthorized:** Check your JWT token is valid and properly formatted
2. **403 Forbidden:** Verify you have the correct role for the operation
3. **404 Not Found:** Ensure the resource ID exists and is valid
4. **400 Bad Request:** Check request body format and required fields

### Quick Debugging Tips
- Use browser developer tools to inspect requests/responses
- Check Swagger UI for exact parameter requirements
- Verify your authorization token hasn't expired
- Ensure you're using the correct HTTP method

### API Documentation
- **Swagger UI:** https://forage-stores-backend.onrender.com/api
- **Base URL:** https://forage-stores-backend.onrender.com

Happy Testing! 🎯