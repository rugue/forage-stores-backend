# Forage Stores Backend - Complete API Testing Guide via Swagger

This comprehensive guide covers **ALL** endpoints and features of the Forage Stores Backend API using Swagger UI. The API is designed for a food marketplace platform with authentication, role-based access control, and comprehensive business logic.

## 🚀 Getting Started

### 1. Start the Application
```bash
npm run start:dev
```

### 2. Access Swagger Documentation
Navigate to: `http://localhost:3000/api`

The Swagger UI provides an interactive interface to test all API endpoints with proper documentation, request/response schemas, and authentication.

## 🔐 Authentication Flow

### Step 1: Register a New User
**Endpoint:** `POST /auth/register`

**Test Data:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "password": "MySecure123!",
  "accountType": "family",
  "role": "user",
  "city": "New York",
  "referralCode": "REF123456"
}
```

**Expected Response:**
- Status: 201
- Returns user object and JWT access token
- Note the `accessToken` for authentication

### Step 2: Login (Alternative to Registration)
**Endpoint:** `POST /auth/login`

**Test Data (using email):**
```json
{
  "email": "john@example.com",
  "password": "MySecure123!"
}
```

**Alternative Test Data (using phone):**
```json
{
  "phone": "+1234567890",
  "password": "MySecure123!"
}
```

### Step 3: Get Profile
**Endpoint:** `GET /auth/profile`
- Returns current user profile information

### Step 4: Refresh Token
**Endpoint:** `POST /auth/refresh`
- Refreshes the JWT access token

### Step 5: Logout
**Endpoint:** `POST /auth/logout`
- Invalidates the current session

### Step 6: Authorize in Swagger
1. Copy the `accessToken` from registration/login response
2. Click the "Authorize" button (🔒) at the top of Swagger UI
3. Enter: `Bearer YOUR_ACCESS_TOKEN_HERE`
4. Click "Authorize"

Now you can test protected endpoints!

## 📊 Complete Feature Testing Workflow

### 🏪 1. Store Management

#### Create a Store
**Endpoint:** `POST /stores`
```json
{
  "name": "Fresh Foods Market",
  "description": "Premium fresh foods and groceries",
  "address": "123 Market Street, Lagos",
  "phone": "+2348123456789",
  "email": "contact@freshfoods.com",
  "category": "GROCERY",
  "isActive": true
}
```

#### Get All Stores
**Endpoint:** `GET /stores`
- No authentication required
- Returns list of all active stores

#### Get Store by ID
**Endpoint:** `GET /stores/{id}`
- Use store ID from previous response

#### Update Store
**Endpoint:** `PATCH /stores/{id}`
```json
{
  "name": "Updated Store Name",
  "description": "Updated description",
  "isActive": true
}
```

#### Delete Store
**Endpoint:** `DELETE /stores/{id}`
- Requires admin privileges

### 👥 2. User Management (Comprehensive)

#### Create User (Admin)
**Endpoint:** `POST /users`
```json
{
  "name": "Jane Smith",
  "email": "jane.smith@example.com",
  "phone": "+2348123456790",
  "password": "SecurePassword456!",
  "role": "customer",
  "accountType": "customer"
}
```

#### Get All Users (Admin)
**Endpoint:** `GET /users`
- Filter parameters: `?role=USER&isActive=true&page=1&limit=10`

#### Get User by ID
**Endpoint:** `GET /users/{id}`

#### Update User
**Endpoint:** `PATCH /users/{id}`
```json
{
  "name": "Updated Name",
  "phone": "+2348123456791",
  "accountType": "customer"
}
```

#### Update User Credit Score (Admin)
**Endpoint:** `PATCH /users/{id}/credit-score`
```json
{
  "score": 750,
  "reason": "Good payment history"
}
```

#### Delete User (Admin)
**Endpoint:** `DELETE /users/{id}`

#### Filter Users by Role
**Endpoint:** `GET /users/filter/role/{role}`
- Replace {role} with: USER, ADMIN, RIDER

#### Filter Users by Account Type
**Endpoint:** `GET /users/filter/account-type/{accountType}`
- Replace {accountType} with: BASIC, PREMIUM, VIP

#### Filter Users by City
**Endpoint:** `GET /users/filter/city/{city}`
- Replace {city} with any city name

#### Get User Profile
**Endpoint:** `GET /users/profile/{id}`

#### Update User Profile
**Endpoint:** `PATCH /users/profile/{id}`
```json
{
  "name": "John Updated Doe",
  "phone": "+2348123456790"
}
```

#### Change Password
**Endpoint:** `PATCH /users/profile/{id}/password`
```json
{
  "currentPassword": "SecurePassword123!",
  "newPassword": "NewSecurePassword456!"
}
```

### 🛍️ 3. Product Management (Complete)

#### Create a Product (Requires Authentication)
**Endpoint:** `POST /products`
```json
{
  "name": "Fresh Organic Apples",
  "description": "Premium organic apples from local farms",
  "price": 500,
  "priceInNibia": 50,
  "category": "FRUITS",
  "sellerId": "STORE_ID_FROM_PREVIOUS_STEP",
  "stockQuantity": 100,
  "deliveryType": "HOME_DELIVERY",
  "location": {
    "city": "Lagos",
    "state": "Lagos",
    "address": "Victoria Island"
  },
  "tags": ["organic", "fresh", "healthy"],
  "isActive": true
}
```

#### Search Products with Filters
**Endpoint:** `GET /products`

**Test various filters:**
- `?search=apple` - Search by name
- `?category=FRUITS` - Filter by category
- `?city=Lagos` - Filter by location
- `?minPrice=100&maxPrice=1000` - Price range
- `?page=1&limit=10` - Pagination

#### Get My Products (As Seller)
**Endpoint:** `GET /products/my-products`
- Shows products created by authenticated user

#### Get Products by City
**Endpoint:** `GET /products/city/{city}`

#### Get Products by Category
**Endpoint:** `GET /products/category/{category}`

#### Get Products by Seller
**Endpoint:** `GET /products/seller/{sellerId}`

#### Get Product Statistics
**Endpoint:** `GET /products/statistics`
- Returns analytics about products

#### Get Product by ID
**Endpoint:** `GET /products/{id}`

#### Update Product
**Endpoint:** `PATCH /products/{id}`
```json
{
  "name": "Updated Product Name",
  "price": 600,
  "stockQuantity": 150
}
```

#### Delete Product
**Endpoint:** `DELETE /products/{id}`

#### Update Product Stock
**Endpoint:** `PATCH /products/{id}/stock`
```json
{
  "quantity": 200,
  "operation": "ADD"
}
```

#### Admin: Bulk Stock Update
**Endpoint:** `POST /products/admin/bulk-stock-update`
```json
{
  "updates": [
    {"productId": "PRODUCT_ID_1", "quantity": 100, "operation": "SET"},
    {"productId": "PRODUCT_ID_2", "quantity": 50, "operation": "ADD"}
  ]
}
```

#### Admin: Create Product for Seller
**Endpoint:** `POST /products/admin/{sellerId}`
```json
{
  "name": "Admin Created Product",
  "description": "Product created by admin for seller",
  "price": 1000,
  "category": "GROCERY",
  "stockQuantity": 50
}
```

#### Admin: Get Seller Products
**Endpoint:** `GET /products/admin/seller/{sellerId}`

#### Admin: Update Product Status
**Endpoint:** `PATCH /products/admin/{id}/status`
```json
{
  "status": "ACTIVE",
  "reason": "Approved by admin"
}
```

### 🛒 4. Shopping Cart & Orders (Complete)

#### Add Item to Cart
**Endpoint:** `POST /orders/cart/add`
```json
{
  "productId": "PRODUCT_ID_FROM_PREVIOUS_STEP",
  "quantity": 2,
  "notes": "Extra fresh please"
}
```

#### Update Cart Item
**Endpoint:** `PATCH /orders/cart/{productId}`
```json
{
  "quantity": 3
}
```

#### Remove Item from Cart
**Endpoint:** `DELETE /orders/cart/remove`
```json
{
  "productId": "PRODUCT_ID_TO_REMOVE"
}
```

#### View Cart
**Endpoint:** `GET /orders/cart`
- Returns current user's cart items

#### Clear Cart
**Endpoint:** `DELETE /orders/cart`
- Removes all items from cart

#### Checkout Cart
**Endpoint:** `POST /orders/checkout`
```json
{
  "deliveryAddress": {
    "street": "45 Allen Avenue",
    "city": "Lagos",
    "state": "Lagos",
    "postalCode": "100001"
  },
  "paymentMethod": "FOOD_MONEY",
  "notes": "Please deliver before 6 PM"
}
```

#### Process Payment
**Endpoint:** `POST /orders/{orderId}/payment`
```json
{
  "paymentMethod": "FOOD_MONEY",
  "amount": 1000
}
```

#### Get All Orders (with filters)
**Endpoint:** `GET /orders`
- Filter parameters: `?status=PENDING&page=1&limit=10`

#### Get Order Analytics
**Endpoint:** `GET /orders/analytics`
- Returns order statistics and analytics

#### Get Order by ID
**Endpoint:** `GET /orders/{id}`

#### Update Order
**Endpoint:** `PATCH /orders/{id}`
```json
{
  "status": "PROCESSING",
  "notes": "Order being prepared"
}
```

#### Cancel Order
**Endpoint:** `POST /orders/{id}/cancel`
```json
{
  "reason": "Customer requested cancellation"
}
```

#### Credit Approval for Order
**Endpoint:** `POST /orders/{id}/credit-approval`
```json
{
  "approved": true,
  "creditLimit": 5000,
  "notes": "Approved based on credit score"
}
```

### 💰 5. Wallet Management (Complete)

#### Check My Wallet Balance
**Endpoint:** `GET /wallets/my-wallet`
- Returns Food Money, Food Points, and Food Safe balances

#### Create Wallet
**Endpoint:** `POST /wallets/create`
```json
{
  "initialBalance": 1000
}
```

#### Transfer Funds Between Wallets
**Endpoint:** `POST /wallets/transfer`
```json
{
  "recipientId": "RECIPIENT_USER_ID",
  "amount": 500,
  "type": "FOOD_MONEY",
  "description": "Payment for shared order"
}
```

#### Lock Funds
**Endpoint:** `POST /wallets/lock-funds`
```json
{
  "amount": 1000,
  "type": "FOOD_MONEY",
  "reason": "Order escrow",
  "orderId": "ORDER_ID"
}
```

#### Unlock Funds
**Endpoint:** `POST /wallets/unlock-funds`
```json
{
  "amount": 1000,
  "type": "FOOD_MONEY",
  "reason": "Order cancelled",
  "orderId": "ORDER_ID"
}
```

#### Admin: Get All Wallets
**Endpoint:** `GET /wallets/admin/all`

#### Admin: Get Wallet Statistics
**Endpoint:** `GET /wallets/admin/stats`

#### Admin: Get User Wallet
**Endpoint:** `GET /wallets/admin/user/{userId}`

#### Admin: Get Wallet by ID
**Endpoint:** `GET /wallets/admin/{walletId}`

#### Admin: Create Wallet for User
**Endpoint:** `POST /wallets/admin/{userId}/create`
```json
{
  "initialBalance": 5000,
  "type": "FOOD_MONEY"
}
```

#### Admin: Update User Balance
**Endpoint:** `PATCH /wallets/admin/{userId}/balance`
```json
{
  "amount": 5000,
  "type": "FOOD_MONEY",
  "operation": "ADD",
  "description": "Initial balance top-up"
}
```

#### Admin: Update Wallet Status
**Endpoint:** `PATCH /wallets/admin/{walletId}/status`
```json
{
  "status": "ACTIVE",
  "reason": "Account verified"
}
```

### 🏆 6. Auctions System (Complete)

#### Create Auction (Admin Only)
**Endpoint:** `POST /auctions`
```json
{
  "productId": "PRODUCT_ID",
  "startingBid": 1000,
  "reservePrice": 1500,
  "startTime": "2024-07-22T10:00:00Z",
  "endTime": "2024-07-23T10:00:00Z",
  "description": "Premium organic apple auction"
}
```

#### Browse Active Auctions
**Endpoint:** `GET /auctions`
- Filter: `?status=ACTIVE&category=FRUITS`

#### Get Auction by ID
**Endpoint:** `GET /auctions/{id}`

#### Get My Bids
**Endpoint:** `GET /auctions/user/bids`

#### Get Won Auctions
**Endpoint:** `GET /auctions/user/won`

#### Update Auction (Admin)
**Endpoint:** `PATCH /auctions/{id}`
```json
{
  "endTime": "2024-07-24T10:00:00Z",
  "description": "Extended auction time"
}
```

#### Place a Bid
**Endpoint:** `POST /auctions/{id}/bid`
```json
{
  "amount": 1200
}
```

#### Cancel Auction (Admin)
**Endpoint:** `POST /auctions/{id}/cancel`
```json
{
  "reason": "Product no longer available"
}
```

#### Finalize Auction (Admin)
**Endpoint:** `POST /auctions/{id}/finalize`
```json
{
  "winnerId": "USER_ID_OF_WINNER"
}
```

### 🚚 7. Delivery Management (Complete)

#### Create Delivery (Admin Only)
**Endpoint:** `POST /delivery`
```json
{
  "orderId": "ORDER_ID_FROM_CHECKOUT",
  "pickupAddress": "Store address",
  "deliveryAddress": "Customer address",
  "estimatedDeliveryTime": "2024-07-22T18:00:00Z"
}
```

#### Get All Deliveries (with filters)
**Endpoint:** `GET /delivery`
- Filters based on user role automatically applied

#### Get My Deliveries
**Endpoint:** `GET /delivery/my-deliveries`
- Shows deliveries for current user

#### Get Delivery by Order ID
**Endpoint:** `GET /delivery/order/{orderId}`

#### Get Delivery by ID
**Endpoint:** `GET /delivery/{id}`

#### Assign Rider to Delivery
**Endpoint:** `POST /delivery/{id}/assign`
```json
{
  "riderId": "RIDER_USER_ID"
}
```

#### Rider Response to Assignment
**Endpoint:** `POST /delivery/{id}/respond`
```json
{
  "response": "ACCEPT",
  "estimatedPickupTime": "2024-07-22T16:00:00Z"
}
```

#### Update Delivery Status
**Endpoint:** `PATCH /delivery/{id}/status`
```json
{
  "status": "IN_TRANSIT",
  "notes": "Package picked up from store"
}
```

#### Release Payment (Admin)
**Endpoint:** `POST /delivery/{id}/release-payment`
```json
{
  "amount": 500,
  "description": "Delivery completed successfully"
}
```

#### Rate Delivery
**Endpoint:** `POST /delivery/{id}/rate`
```json
{
  "rating": 5,
  "feedback": "Excellent delivery service",
  "deliveryTime": "2024-07-22T18:30:00Z"
}
```

### 🏍️ 8. Riders Management (Complete)

#### Create Rider Profile
**Endpoint:** `POST /riders`
```json
{
  "userId": "USER_ID",
  "vehicleType": "MOTORCYCLE",
  "vehicleDetails": {
    "make": "Honda",
    "model": "CB125F",
    "year": 2023,
    "plateNumber": "ABC-123-DE"
  },
  "drivingLicenseNumber": "DL123456789",
  "city": "Lagos",
  "availability": {
    "monday": {"start": "08:00", "end": "20:00"},
    "tuesday": {"start": "08:00", "end": "20:00"}
  }
}
```

#### Get All Riders (Admin)
**Endpoint:** `GET /riders`
- Filter: `?city=Lagos&status=ACTIVE&page=1&limit=10`

#### Get Eligible Riders (Admin)
**Endpoint:** `GET /riders/eligible?city=Lagos`

#### Get My Rider Profile
**Endpoint:** `GET /riders/my-profile`

#### Check Security Deposit Status
**Endpoint:** `GET /riders/deposit-status`

#### Get Rider by ID
**Endpoint:** `GET /riders/{id}`

#### Update Rider Profile
**Endpoint:** `PATCH /riders/{id}`
```json
{
  "vehicleType": "BICYCLE",
  "city": "Abuja",
  "availability": {
    "monday": {"start": "09:00", "end": "18:00"}
  }
}
```

#### Add Verification Document
**Endpoint:** `POST /riders/{id}/documents`
```json
{
  "documentType": "DRIVING_LICENSE",
  "documentUrl": "https://example.com/license.jpg",
  "documentNumber": "DL123456789"
}
```

#### Verify Document (Admin)
**Endpoint:** `PATCH /riders/{id}/documents/{index}`
```json
{
  "verified": true,
  "verificationNotes": "Document verified successfully"
}
```

#### Update Rider Location
**Endpoint:** `PATCH /riders/{id}/location`
```json
{
  "latitude": 6.5244,
  "longitude": 3.3792,
  "address": "Victoria Island, Lagos"
}
```

#### Update Security Deposit (Admin)
**Endpoint:** `PATCH /riders/{id}/security-deposit`
```json
{
  "amount": 50000,
  "status": "PAID",
  "paymentMethod": "BANK_TRANSFER"
}
```

#### Delete Rider Profile (Admin)
**Endpoint:** `DELETE /riders/{id}`

### 🎯 9. Referral System (Complete)

#### Create Referral
**Endpoint:** `POST /referrals`
```json
{
  "referrerId": "REFERRING_USER_ID",
  "referredUserId": "NEW_USER_ID",
  "type": "USER_REGISTRATION"
}
```

#### Get All Referrals (Admin)
**Endpoint:** `GET /referrals`
- Filter: `?status=ACTIVE&page=1&limit=10`

#### View My Referrals
**Endpoint:** `GET /referrals/my-referrals`

#### Get Referral Statistics
**Endpoint:** `GET /referrals/stats`

#### Generate Referral Code
**Endpoint:** `GET /referrals/generate-code`

#### Get Referral by ID
**Endpoint:** `GET /referrals/{id}`

#### Update Referral
**Endpoint:** `PATCH /referrals/{id}`
```json
{
  "status": "COMPLETED",
  "commissionAmount": 100
}
```

#### Process Commission
**Endpoint:** `POST /referrals/process-commission/{userId}`
```json
{
  "amount": 100,
  "description": "Registration bonus"
}
```

### 📱 10. Subscriptions & Payment Plans (Complete)

#### Create Subscription Plan (Admin)
**Endpoint:** `POST /subscriptions`
```json
{
  "name": "Premium Monthly",
  "description": "Monthly premium subscription with perks",
  "price": 2000,
  "duration": 30,
  "benefits": ["Free delivery", "10% discount", "Priority support"]
}
```

#### Get All Subscription Plans
**Endpoint:** `GET /subscriptions`

#### View My Subscriptions
**Endpoint:** `GET /subscriptions/my-subscriptions`

#### Get Subscription Plan by ID
**Endpoint:** `GET /subscriptions/{id}`

#### Update Subscription Plan (Admin)
**Endpoint:** `PATCH /subscriptions/{id}`
```json
{
  "price": 2500,
  "benefits": ["Free delivery", "15% discount", "Priority support", "Monthly rewards"]
}
```

#### Process Subscription Drop
**Endpoint:** `POST /subscriptions/{id}/process-drop`
```json
{
  "paymentMethod": "FOOD_MONEY"
}
```

#### Admin: Process Subscription Drop
**Endpoint:** `POST /subscriptions/admin/{id}/process-drop`
```json
{
  "userId": "USER_ID",
  "paymentMethod": "FOOD_MONEY",
  "adminNotes": "Manual processing required"
}
```

### � 11. Admin Features (Complete)

#### Get All Users
**Endpoint:** `GET /admin/users`

#### Get User by ID
**Endpoint:** `GET /admin/users/{userId}`

#### Get All Wallets
**Endpoint:** `GET /admin/wallets`

#### Get Wallet by ID
**Endpoint:** `GET /admin/wallets/{walletId}`

#### Get User Wallet
**Endpoint:** `GET /admin/users/{userId}/wallet`

#### Fund User Wallet (Requires Admin Password)
**Endpoint:** `POST /admin/wallets/fund`
```json
{
  "userId": "USER_ID",
  "amount": 10000,
  "type": "FOOD_MONEY",
  "description": "Admin fund addition",
  "adminPassword": "ADMIN_PASSWORD"
}
```

#### Wipe User Wallet (Requires Admin Password)
**Endpoint:** `POST /admin/wallets/wipe`
```json
{
  "userId": "USER_ID",
  "adminPassword": "ADMIN_PASSWORD",
  "reason": "Security concern"
}
```

#### Get Orders Analytics
**Endpoint:** `GET /admin/analytics/orders`
- Filter: `?startDate=2024-01-01&endDate=2024-12-31`

#### Get Subscription Analytics
**Endpoint:** `GET /admin/analytics/subscriptions`

#### Get Commission Analytics
**Endpoint:** `GET /admin/analytics/commissions`

#### Get All Categories
**Endpoint:** `GET /admin/categories`

#### Get Category by ID
**Endpoint:** `GET /admin/categories/{categoryId}`

#### Create Category
**Endpoint:** `POST /admin/categories`
```json
{
  "name": "Organic Foods",
  "description": "Certified organic food products",
  "isActive": true
}
```

#### Update Category
**Endpoint:** `PATCH /admin/categories/{categoryId}`
```json
{
  "name": "Premium Organic Foods",
  "description": "Premium certified organic food products"
}
```

#### Delete Category
**Endpoint:** `DELETE /admin/categories/{categoryId}`

#### Get Product Price History
**Endpoint:** `GET /admin/products/{productId}/price-history`

#### Add Price History Entry
**Endpoint:** `POST /admin/products/price-history`
```json
{
  "productId": "PRODUCT_ID",
  "price": 600,
  "priceInNibia": 60,
  "reason": "Market price adjustment"
}
```

### 📧 12. Notifications System (Complete)

#### Send Email Notification (Admin)
**Endpoint:** `POST /notifications/email`
```json
{
  "to": "user@example.com",
  "subject": "Welcome to Forage",
  "body": "Thank you for joining Forage!",
  "type": "MARKETING"
}
```

#### Send Push Notification (Admin)
**Endpoint:** `POST /notifications/push`
```json
{
  "userId": "USER_ID",
  "title": "Order Update",
  "body": "Your order is ready for pickup",
  "data": {"orderId": "ORDER_ID"}
}
```

#### Send WhatsApp Message (Admin)
**Endpoint:** `POST /notifications/whatsapp`
```json
{
  "phoneNumber": "+2348123456789",
  "message": "Your order #12345 is ready for delivery",
  "type": "ORDER_UPDATE"
}
```

#### Notify Order Status Update (Admin)
**Endpoint:** `POST /notifications/order/{orderId}/status-update`
```json
{
  "userId": "USER_ID",
  "status": "SHIPPED",
  "additionalInfo": {"trackingNumber": "TRK123456"}
}
```

#### Notify Late Payment (Admin)
**Endpoint:** `POST /notifications/payment/{subscriptionId}/late`
```json
{
  "userId": "USER_ID",
  "daysLate": 5,
  "amountDue": 2000,
  "currency": "NGN"
}
```

#### Notify Auction Event (Admin)
**Endpoint:** `POST /notifications/auction/{auctionId}/event`
```json
{
  "userId": "USER_ID",
  "eventType": "outbid",
  "additionalInfo": {"newHighBid": 1500}
}
```

#### Notify Rider Assignment (Admin)
**Endpoint:** `POST /notifications/rider/{riderId}/assignment`
```json
{
  "orderId": "ORDER_ID",
  "expiryTime": "2024-07-22T16:00:00Z",
  "deliveryDetails": {
    "pickupAddress": "Store Address",
    "deliveryAddress": "Customer Address"
  }
}
```

### 🎧 13. Support System (Complete)

#### Create Support Ticket
**Endpoint:** `POST /support/tickets`
```json
{
  "title": "Payment Issue",
  "description": "Unable to process payment for order #12345",
  "category": "PAYMENT",
  "priority": "HIGH"
}
```

#### Get My Tickets
**Endpoint:** `GET /support/tickets`
- Filter: `?status=OPEN&category=PAYMENT`

#### Get Ticket by ID
**Endpoint:** `GET /support/tickets/{id}`

#### Get Ticket Messages
**Endpoint:** `GET /support/tickets/{id}/messages`

#### Add Message to Ticket
**Endpoint:** `POST /support/tickets/{id}/messages`
```json
{
  "content": "I tried again but still getting the same error",
  "attachments": ["https://example.com/screenshot.jpg"]
}
```

#### Admin: Get All Tickets
**Endpoint:** `GET /support/admin/tickets`
- Filter: `?status=OPEN&priority=HIGH&page=1&limit=10`

#### Admin: Update Ticket
**Endpoint:** `PATCH /support/admin/tickets/{id}`
```json
{
  "status": "IN_PROGRESS",
  "assignedTo": "ADMIN_ID",
  "priority": "MEDIUM"
}
```

#### Admin: Close Ticket
**Endpoint:** `POST /support/admin/tickets/{id}/close`
```json
{
  "message": "Issue has been resolved. Payment processed successfully."
}
```

#### Admin: Get Support Analytics
**Endpoint:** `GET /support/admin/analytics`

### 🏠 14. Application Health & Status

#### Get Application Status
**Endpoint:** `GET /`
- Public endpoint to check if API is running

#### Health Check
**Endpoint:** `GET /health`
- Public endpoint for health monitoring

## 🧪 Advanced Testing Scenarios

### Multi-User Testing Flow

1. **Create Admin User**: Register with role "ADMIN"
2. **Create Regular Users**: Register multiple users with different roles (USER, RIDER)
3. **Create Stores**: Admin or users create stores
4. **Add Products**: Users add products to stores
5. **Set up Riders**: Create rider profiles and verify documents
6. **Shopping Flow**: Different users add items to cart, checkout
7. **Delivery Flow**: Admin creates deliveries, assigns riders, track status
8. **Auction Flow**: Create auctions, place bids from different users
9. **Payment Flow**: Test wallet transfers, payments, escrow
10. **Support Flow**: Create tickets, admin responses, resolution

### Complete Role-Based Testing

#### Admin User Testing
1. **User Management**: Create, update, delete users
2. **Financial Operations**: Fund wallets, process payments
3. **Product Management**: Approve products, manage categories
4. **Analytics**: View all dashboard statistics
5. **Support**: Manage tickets and customer issues
6. **Delivery Management**: Assign riders, track deliveries

#### Regular User Testing
1. **Profile Management**: Update profile, change password
2. **Shopping**: Browse products, add to cart, checkout
3. **Wallet Operations**: Check balance, transfer funds
4. **Referrals**: Refer friends, earn commissions
5. **Support**: Create tickets, communicate with support

#### Rider Testing
1. **Profile Setup**: Create rider profile, upload documents
2. **Delivery Management**: Accept assignments, update status
3. **Location Updates**: Update current location
4. **Earnings**: Track delivery payments and ratings

### Error Testing

Test these error scenarios:
- **401 Unauthorized**: Access protected routes without authentication
- **403 Forbidden**: Access admin routes with user role
- **404 Not Found**: Use invalid IDs for all endpoints
- **409 Conflict**: Try to register with existing email/phone
- **400 Bad Request**: Send invalid data formats to all endpoints
- **422 Validation Error**: Send incomplete required fields
- **429 Too Many Requests**: Test rate limiting on auth endpoints

### Edge Cases

- **Empty Cart Checkout**: Try to checkout with empty cart
- **Insufficient Funds**: Try payment with insufficient wallet balance
- **Expired Auctions**: Test bidding on expired auctions
- **Out of Stock**: Order quantity exceeding stock
- **Self-Referral**: Try to refer yourself
- **Double Delivery Assignment**: Assign same delivery to multiple riders
- **Invalid Rider Assignment**: Assign delivery to inactive rider
- **Concurrent Bid**: Multiple users bidding simultaneously
- **Wallet Lock Conflicts**: Test fund locking edge cases

## 📝 Complete Testing Checklist

### ✅ Authentication & Authorization
- [ ] User registration with valid data
- [ ] User registration with invalid data (errors)
- [ ] User login with correct credentials
- [ ] User login with incorrect credentials
- [ ] Access protected routes with valid token
- [ ] Access protected routes without token
- [ ] Admin access with user role (should fail)
- [ ] Token refresh functionality
- [ ] Get user profile
- [ ] Logout functionality
- [ ] Rate limiting on auth endpoints

### ✅ User Management
- [ ] Create user (admin)
- [ ] Get all users with filters
- [ ] Get user by ID
- [ ] Update user profile
- [ ] Update user credit score (admin)
- [ ] Delete user (admin)
- [ ] Filter users by role
- [ ] Filter users by account type
- [ ] Filter users by city
- [ ] Change password functionality

### ✅ Store Management
- [ ] Create store with valid data
- [ ] Create store with invalid data
- [ ] List all stores
- [ ] Get store by valid ID
- [ ] Get store by invalid ID
- [ ] Update store information
- [ ] Delete store

### ✅ Product Management
- [ ] Create product as authenticated user
- [ ] Create product with invalid data
- [ ] List products with no filters
- [ ] List products with various filters
- [ ] Search products by name
- [ ] Get products by city/category/seller
- [ ] Get product statistics
- [ ] Get product by ID
- [ ] Update product (owner only)
- [ ] Delete product (owner only)
- [ ] Update product stock
- [ ] Admin bulk stock update
- [ ] Admin create product for seller
- [ ] Admin update product status

### ✅ Shopping & Orders
- [ ] Add item to cart
- [ ] Update cart item quantity
- [ ] Remove item from cart
- [ ] View cart contents
- [ ] Clear entire cart
- [ ] Checkout with valid address
- [ ] Process payment with sufficient funds
- [ ] Process payment with insufficient funds
- [ ] View order history with filters
- [ ] Get order analytics
- [ ] Get order by ID
- [ ] Update order status
- [ ] Cancel order
- [ ] Credit approval process

### ✅ Wallet Operations
- [ ] Check wallet balance
- [ ] Create wallet
- [ ] Transfer funds between users
- [ ] Lock funds for orders
- [ ] Unlock funds
- [ ] Admin get all wallets
- [ ] Admin get wallet statistics
- [ ] Admin create wallet for user
- [ ] Admin balance updates
- [ ] Admin wallet status updates

### ✅ Delivery System
- [ ] Create delivery for order
- [ ] Get deliveries with filters
- [ ] Get my deliveries
- [ ] Get delivery by order ID
- [ ] Get delivery by ID
- [ ] Assign rider to delivery
- [ ] Rider response to assignment
- [ ] Update delivery status
- [ ] Release payment (admin)
- [ ] Rate completed delivery

### ✅ Riders Management
- [ ] Create rider profile
- [ ] Get all riders (admin)
- [ ] Get eligible riders
- [ ] Get my rider profile
- [ ] Check deposit status
- [ ] Get rider by ID
- [ ] Update rider profile
- [ ] Add verification documents
- [ ] Verify documents (admin)
- [ ] Update rider location
- [ ] Update security deposit (admin)
- [ ] Delete rider profile (admin)

### ✅ Auctions
- [ ] Create auction (admin)
- [ ] Browse active auctions
- [ ] Get auction by ID
- [ ] Get my bids
- [ ] Get won auctions
- [ ] Update auction (admin)
- [ ] Place bids on auctions
- [ ] Cancel auction (admin)
- [ ] Finalize auction (admin)

### ✅ Referrals
- [ ] Create referral relationship
- [ ] Get all referrals (admin)
- [ ] View my referrals
- [ ] Get referral statistics
- [ ] Generate referral code
- [ ] Get referral by ID
- [ ] Update referral
- [ ] Process referral commissions

### ✅ Subscriptions
- [ ] Create subscription plan (admin)
- [ ] Get all subscription plans
- [ ] Get my subscriptions
- [ ] Get subscription by ID
- [ ] Update subscription plan (admin)
- [ ] Process subscription drop
- [ ] Admin process subscription drop

### ✅ Admin Features
- [ ] Get all users
- [ ] Get user by ID
- [ ] Get all wallets
- [ ] Get wallet by ID
- [ ] Get user wallet
- [ ] Fund user wallet (with password)
- [ ] Wipe user wallet (with password)
- [ ] Get orders analytics
- [ ] Get subscription analytics
- [ ] Get commission analytics
- [ ] Manage categories (CRUD)
- [ ] Product price history

### ✅ Notifications
- [ ] Send email notifications
- [ ] Send push notifications
- [ ] Send WhatsApp messages
- [ ] Order status notifications
- [ ] Late payment notifications
- [ ] Auction event notifications
- [ ] Rider assignment notifications

### ✅ Support System
- [ ] Create support tickets
- [ ] Get my tickets
- [ ] Get ticket by ID
- [ ] Get ticket messages
- [ ] Add messages to tickets
- [ ] Admin get all tickets
- [ ] Admin update tickets
- [ ] Admin close tickets
- [ ] Support analytics

### ✅ Application Health
- [ ] Application status endpoint
- [ ] Health check endpoint

## 🐛 Common Issues & Solutions

### Authentication Issues
- **Token Expired**: Get new token via login endpoint
- **Invalid Token Format**: Ensure "Bearer " prefix in authorization header
- **Role Mismatch**: Verify user has required role for endpoint access
- **Rate Limiting**: Wait before retrying auth endpoints (5 login attempts, 3 registrations per minute)

### Database Issues
- **Duplicate Key Error**: Ensure unique emails/phone numbers across users
- **Validation Error**: Check required fields and data types in request body
- **Reference Error**: Ensure referenced documents (users, products, orders) exist
- **ObjectId Format**: Use valid MongoDB ObjectId format for ID parameters

### Business Logic Issues
- **Insufficient Stock**: Check product inventory before ordering
- **Invalid Order State**: Follow proper order workflow (cart → checkout → payment)
- **Auction Rules**: Respect bidding rules, timing, and minimum bid increments
- **Wallet Balance**: Ensure sufficient funds before transactions
- **Delivery Assignment**: Only assign to active, verified riders in correct city

### API-Specific Issues
- **Missing Required Fields**: Check Swagger documentation for required parameters
- **Invalid Enum Values**: Use correct enum values for status, role, type fields
- **Date Format**: Use ISO 8601 format for date/time fields
- **Pagination**: Use valid page and limit values for list endpoints
- **File Uploads**: Ensure proper file format and size for document uploads

## 📞 Support & Resources

### If you encounter issues during testing:

1. **Check Swagger Documentation**: Each endpoint has detailed parameter requirements
2. **Verify Authentication**: Ensure JWT tokens are valid and properly formatted
3. **Check Server Logs**: Look for detailed error messages in application logs
4. **Database Status**: Ensure MongoDB is running and accessible
5. **Environment Variables**: Verify all required environment variables are set
6. **Network Issues**: Check for firewall or network connectivity problems

### Useful Debug Information:
- **API Base URL**: `http://localhost:3000`
- **Swagger URL**: `http://localhost:3000/api`
- **Default Port**: 3000
- **Auth Header**: `Authorization: Bearer <token>`
- **Content Type**: `application/json`

### Testing Tools:
- **Swagger UI**: Primary testing interface
- **Postman**: Alternative API testing tool
- **curl**: Command-line testing
- **Browser DevTools**: Network tab for debugging

## 🔄 Continuous Testing Strategy

### For ongoing development:

1. **Endpoint Coverage**: Test all endpoints after code changes
2. **Role Verification**: Verify role-based access controls work correctly
3. **Error Scenarios**: Test both success and failure paths
4. **Data Consistency**: Validate data integrity across related modules
5. **Performance Testing**: Test with multiple concurrent users
6. **Security Testing**: Verify authorization and input validation
7. **Integration Testing**: Test complete user workflows end-to-end

### Automated Testing Recommendations:

1. **Unit Tests**: Test individual service methods
2. **Integration Tests**: Test API endpoints with real database
3. **E2E Tests**: Test complete user workflows
4. **Load Tests**: Test performance under high traffic
5. **Security Tests**: Test for common vulnerabilities

### Test Data Management:

1. **Clean State**: Start each test session with clean database
2. **Seed Data**: Use consistent test data for reproducible results
3. **Isolation**: Ensure tests don't interfere with each other
4. **Cleanup**: Remove test data after completion

## 🎯 Quick Testing Scenarios

### 🚀 **5-Minute Quick Test**
1. Register user → Login → Create product → Add to cart → Checkout

### ⏱️ **15-Minute Comprehensive Test**
1. User registration and authentication
2. Store and product creation
3. Shopping cart workflow
4. Wallet operations
5. Basic admin functions

### 📋 **30-Minute Full Integration Test**
1. Multi-user setup (Admin, User, Rider)
2. Complete e-commerce workflow
3. Delivery management
4. Auction participation
5. Support ticket creation
6. Analytics verification

### 🧪 **1-Hour Stress Test**
1. All endpoint coverage
2. Error scenario testing
3. Role-based access verification
4. Performance under load
5. Data consistency checks

---

**🚀 Happy Testing!**

This guide covers all **190+ endpoints** in the Forage Stores Backend API. Remember to test both success and failure scenarios to ensure robust application behavior. Each endpoint has been designed with proper authentication, authorization, validation, and error handling.

For the most up-to-date API documentation and real-time testing, always refer to the Swagger UI at `http://localhost:3000/api` when the application is running.
