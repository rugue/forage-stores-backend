# Forage Stores Backend - Complete API Testing Guide for Beginners

This comprehensive guide will teach you how to test **ALL** endpoints and features of the Forage Stores Backend API. Whether you're a beginner or experienced developer, this guide will walk you through every step.

## 📋 What You'll Learn

- How to set up and access the API
- How to authenticate (login/register) 
- How to test every endpoint step-by-step
- How to handle different user roles and permissions
- Real-world examples with sample data
- Common troubleshooting tips

## 🛠️ Prerequisites

Before we begin, make sure you have:
- ✅ Node.js installed on your computer
- ✅ The Forage Stores Backend project running
- ✅ A web browser (Chrome, Firefox, Safari, etc.)
- ✅ Basic understanding of JSON format (we'll explain as we go)

## 🚀 Getting Started

### Step 1: Start the Application

Open your terminal/command prompt and run:
```bash
# Navigate to the project folder
cd forage-stores-backend

# Install dependencies (if not already done)
npm install

# Start the development server
npm run start:dev
```

**What this does:** Starts the API server on your local machine (usually port 3000)

### Step 2: Access the Interactive API Documentation (Swagger)

1. Open your web browser
2. Go to: `http://localhost:3000/api`
3. You should see a page with all the API endpoints listed

**What is Swagger?** It's a visual interface that lets you test APIs directly from your browser without writing code. Think of it as a "control panel" for your API.

## 🔐 Understanding Authentication

**What is Authentication?** 
Authentication is like showing your ID card to prove who you are. Most API endpoints require you to be "logged in" before you can use them.

**How it works:**
1. You register an account or login with existing credentials
2. The API gives you a special "token" (like a temporary pass)
3. You include this token with future requests to prove you're authorized

### 🎯 Complete Authentication Workflow

Let's walk through the complete process of getting authenticated and creating your first store:

## � Step-by-Step: How to Get Authenticated and Create a Store

### Step 1: Register a New User Account

**Why do this?** You need an account to create stores and access protected features.

**Endpoint:** `POST /auth/register`

**What to do:**
1. In Swagger, find the "auth" section
2. Click on `POST /auth/register`
3. Click "Try it out"
4. Replace the example data with:

```json
{
  "name": "John Store Owner",
  "email": "john.storeowner@example.com",
  "phone": "+2348123456789",
  "password": "MySecure123!",
  "accountType": "business",
  "role": "user",
  "city": "Lagos",
  "referralCode": "REF123456"
}
```

**Important Fields Explained:**
- `name`: Your full name (required)
- `email`: Must be unique (no one else can use this email) (required)
- `phone`: Your phone number (include country code) (optional)
- `password`: Must be strong (8+ chars, uppercase, lowercase, number, special char) (required)
- `accountType`: Use "business" if you plan to create stores, "family" for regular users (optional)
- `role`: Always use "user" (admin accounts are created separately) (optional)
- `city`: Your city/location (optional)
- `referralCode`: Code from someone who referred you (optional)

5. Click "Execute"

**Expected Response:**
```json
{
  "user": {
    "id": "64f123456789abcdef123456",
    "name": "John Store Owner",
    "email": "john.storeowner@example.com",
    "phone": "+2348123456789",
    "accountType": "business",
    "role": "user"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NGYxMjM0NTY3ODlhYmNkZWYxMjM0NTYiLCJlbWFpbCI6ImpvaG5AZXhhbXBsZS5jb20iLCJyb2xlIjoidXNlciIsImFjY291bnRUeXBlIjoiYnVzaW5lc3MiLCJpYXQiOjE2OTA0NzM2MDAsImV4cCI6MTY5MDU2MDAwMH0.example_token_signature"
}
```

**🔑 IMPORTANT:** Copy the `accessToken` value (the long string starting with "eyJ"). You'll need this for the next steps!

### Step 2: Alternative - Login (if you already have an account)

**If you already registered before, use this instead:**

**Endpoint:** `POST /auth/login`

```json
{
  "email": "john.storeowner@example.com",
  "password": "MySecure123!"
}
```

### Step 3: Authenticate Your Requests

**What is this?** Every time you want to access protected endpoints, you need to include your token.

**How to do it in Swagger:**
1. Look for the "Authorize" button at the top of the Swagger page (🔒 icon)
2. Click it
3. In the "Value" field, type: `Bearer ` followed by your token
   
   Example: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   
   **Note:** Don't forget the space after "Bearer"!

4. Click "Authorize"
5. Close the dialog

**What this does:** Now all your requests will automatically include the authentication token.

### Step 4: Create Your First Store

**Now the fun part!** Let's create your store.

**Endpoint:** `POST /stores`

**What to do:**
1. Find the "stores" section in Swagger
2. Click on `POST /stores`
3. Click "Try it out"
4. Use this data:

```json
{
  "name": "Fresh Foods Market",
  "description": "Premium fresh foods and organic groceries delivered to your door",
  "address": "123 Market Street, Lagos, Nigeria",
  "phone": "+2348123456789",
  "email": "contact@freshfoods.com"
}
```

**Field Explanations:**
- `name`: Your store's name (will be visible to customers) (required)
- `description`: What your store sells (helps customers understand your business) (optional)
- `address`: Physical location of your store (required)
- `phone`: Store contact number (optional)
- `email`: Store contact email (optional)
- `phone`: Store contact number
- `email`: Store contact email

5. Click "Execute"

**Expected Response:**
```json
{
  "id": "64f987654321abcdef654321",
  "name": "Fresh Foods Market",
  "description": "Premium fresh foods and organic groceries delivered to your door",
  "address": "123 Market Street, Lagos, Nigeria",
  "phone": "+2348123456789",
  "email": "contact@freshfoods.com",
  "createdAt": "2025-07-25T10:30:00.000Z",
  "updatedAt": "2025-07-25T10:30:00.000Z"
}
```

**🎉 Congratulations!** You've successfully:
- ✅ Created a user account
- ✅ Authenticated with the API
- ✅ Created your first store

**📝 Important Notes:**
- **Save your store ID:** Copy the `id` from the response (you'll need it for adding products)
- **Token expires:** Your access token expires after 24 hours, then you'll need to login again
- **Store ownership:** Only you can update/delete stores you created

## 🔍 Testing Other Endpoints

Now that you're authenticated, you can test any endpoint marked with a 🔒 lock icon. Here are some next steps:

1. **View your profile:** `GET /auth/profile`
2. **Browse all stores:** `GET /stores` (no authentication needed)
3. **Add products to your store:** `POST /products`
4. **Create orders:** `POST /orders/checkout`

## 💰 Profit Pool System Testing (NEW - August 2025)

The Profit Pool system distributes 1% of monthly city revenue to Growth Elite users as Nibia rewards! Here's how to test it:

### 🔧 Prerequisites for Testing
- **Admin access required** for most operations
- **Growth Elite users** needed for distributions
- **Revenue data** in orders, subscriptions, and deliveries

### 📊 View Profit Pool Statistics
**Endpoint:** `GET /profit-pool/stats`  
**Description:** Get overall profit pool statistics

**Request Example:**
```bash
curl -X GET "http://localhost:3000/profit-pool/stats?city=Lagos&year=2025" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "totalPools": 12,
  "totalRevenue": 50000000,
  "totalPoolAmount": 500000,
  "totalDistributed": 450000,
  "calculatedPools": 2,
  "distributedPools": 10,
  "failedPools": 0,
  "distributionRate": 90.0
}
```

### 📋 List All Profit Pools  
**Endpoint:** `GET /profit-pool`
**Description:** Get paginated list of profit pools with filtering

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `city`: Filter by city (e.g., "Lagos")
- `month`: Filter by month (e.g., "2025-08")
- `status`: Filter by status ("calculated", "distributed", "failed")

**Request Example:**
```bash
curl -X GET "http://localhost:3000/profit-pool?city=Lagos&status=distributed&limit=5" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 💼 Admin: Create Profit Pool (Manual)
**Endpoint:** `POST /profit-pool`
**Description:** Manually create a profit pool for a city/month

**Request Body:**
```json
{
  "city": "Lagos",
  "month": "2025-08",
  "force": false
}
```

**What happens:**
1. System calculates total revenue for Lagos in August 2025
2. Computes 1% as pool amount (e.g., 50M revenue → 500K Nibia pool)
3. Counts Growth Elite users in Lagos
4. Calculates amount per GE (e.g., 500K ÷ 10 GEs = 50K each)

### 🎯 Admin: Distribute Profit Pool
**Endpoint:** `POST /profit-pool/distribute`
**Description:** Distribute a profit pool to Growth Elite users

**Request Body:**
```json
{
  "poolId": "64a7b12c8f9e4d5a6b7c8901",
  "notes": "Monthly distribution for Lagos - August 2025"
}
```

**What happens:**
1. Finds all active Growth Elite users in the city
2. Credits each user's wallet with their share (as Nibia/FoodPoints)
3. Records complete audit trail of distributions
4. Marks pool as "distributed" or "failed"

### 👤 User: View My Profit Pool History
**Endpoint:** `GET /profit-pool/my-history`
**Description:** Growth Elite users can see their distribution history

**Response Example:**
```json
[
  {
    "poolId": "64a7b12c8f9e4d5a6b7c8901",
    "city": "Lagos",
    "month": "2025-08",
    "nibiaAmount": 50000,
    "creditedAt": "2025-09-02T00:00:00.000Z",
    "totalPoolAmount": 500000,
    "numberOfRecipients": 10,
    "credited": true
  }
]
```

### 🔍 View Specific Profit Pool Details
**Endpoint:** `GET /profit-pool/:poolId`
**Description:** Get detailed information about a specific profit pool

**Response includes:**
- Pool creation and distribution dates
- Revenue breakdown and calculations  
- List of all recipients and amounts
- Success/failure status for each distribution

### 🤖 Automated Monthly Process

The system runs two automated jobs:
1. **1st of each month (2 AM):** Creates profit pools for all supported cities
2. **2nd of each month (3 AM):** Distributes all calculated pools

**Supported Cities:**
- Lagos, Abuja, Port Harcourt, Kano, Ibadan
- Benin City, Enugu, Kaduna, Jos, Ilorin

**Testing Tips:**
- Use admin authentication for create/distribute operations
- Check Growth Elite users exist in test cities
- Verify wallet balances before/after distributions
- Monitor automated job logs for monthly processing

## ❗ Common Issues and Solutions

### Issue: "Unauthorized" or "Access token is required"
**Solution:** Make sure you:
1. Completed the authentication step (Step 3 above)
2. Your token hasn't expired (login again if needed)
3. Used "Bearer " before your token (with a space)

### Issue: "User already exists"
**Solution:** 
1. Try logging in instead of registering
2. Use a different email address

### Issue: "Validation failed"
**Solution:** 
1. Check your JSON format (use the examples provided)
2. Make sure all required fields are included
3. Check password requirements (8+ chars, mixed case, numbers, special chars)

---

# 📚 Complete API Feature Guide

Now that you've mastered authentication and store creation, let's explore **ALL** the amazing features this API offers! We'll go through each section step-by-step.

## 🔐 Authentication Features (What You've Already Learned)

### 📝 User Registration & Login
- ✅ **Register:** `POST /auth/register` - Create a new account
- ✅ **Login:** `POST /auth/login` - Sign in with email/phone + password
- ✅ **Profile:** `GET /auth/profile` - View your profile info
- ✅ **Refresh:** `POST /auth/refresh` - Get a new token when yours expires
- ✅ **Logout:** `POST /auth/logout` - Sign out securely

**🔒 Authentication Required:** All endpoints marked with 🔒 need you to be logged in.

## 🏪 Store Management Features

### What You Can Do With Stores:

#### 🆕 Create Your Store (🔒 Authentication Required)
**What:** Set up your business on the platform
**Endpoint:** `POST /stores`
**You've already done this!** ✅

#### 🔍 Browse All Stores (Public - No Authentication)
**What:** See all stores on the platform
**Endpoint:** `GET /stores`
**Try it:** Just click and execute - no login needed!

#### 👀 View a Specific Store (Public)
**What:** Get detailed info about one store
**Endpoint:** `GET /stores/{id}`
**How to test:**
1. First get all stores to find a store ID
2. Copy any store's `id` from the response
3. Use that ID in this endpoint

#### ✏️ Update Your Store (🔒 Owner Only)
**What:** Change your store's information
**Endpoint:** `PATCH /stores/{id}`
**Test Data:**
```json
{
  "name": "Fresh Foods Market - Updated",
  "description": "Now with even more organic options!"
}
```
**Note:** You can only update stores you created!

#### 🗑️ Delete a Store (🔒 Admin Only)
**What:** Remove a store permanently
**Endpoint:** `DELETE /stores/{id}`
**Note:** Only administrators can delete stores.

## 👥 User Management Features

### What You Can Do With User Accounts:

#### 👀 View Your Own Profile (🔒 Authentication Required)
**What:** See your account information
**Endpoint:** `GET /auth/profile`
**Try it:** You're already authenticated, so this should work!

#### 📝 Update Your Profile (🔒 Authentication Required)
**What:** Change your personal information
**Endpoint:** `PATCH /users/profile/{id}`
**Test Data:**
```json
{
  "name": "John Updated Store Owner",
  "phone": "+2348123456790"
}
```
**How to get your ID:** Use the `id` from your registration response or profile.

#### 🔑 Change Your Password (🔒 Authentication Required)
**What:** Update your account password
**Endpoint:** `PATCH /users/profile/{id}/password`
**Test Data:**
```json
{
  "currentPassword": "MySecure123!",
  "newPassword": "MyNewSecure456!"
}
```

**Latest and updated Data:**
```json
{
  "email": "john.doe@example.com",
  "password": "MyNewSecure456!"
}
```

#### 👥 View All Users (🔒 Admin Only)
**What:** See all registered users
**Endpoint:** `GET /users`
**Note:** Only administrators can see all users.

#### 🏘️ Find Users by City (🔒 Admin Only)
**What:** Find users in a specific location
**Endpoint:** `GET /users/filter/city/{city}`
**Example:** `GET /users/filter/city/Lagos`

#### 🏷️ Find Users by Role (🔒 Admin Only)
**What:** Filter users by their role (user, admin, etc.)
**Endpoint:** `GET /users/filter/role/{role}`
**Options:** `user`, `admin`

## 🛍️ Product Management Features

### What You Can Do With Products:

#### ➕ Add Products to Your Store (🔒 Store Owner Required)
**What:** List items for sale in your store
**Endpoint:** `POST /products`
**Test Data:**
```json
{
  "name": "Fresh Organic Apples",
  "description": "Sweet and crispy organic apples, perfect for snacking",
  "price": 800,
  "priceInNibia": 200.00,
  "weight": 1000,
  "city": "Lagos",
  "category": "fruits",
  "sellerId": "YOUR_STORE_ID_HERE",
  "tags": ["organic", "fresh", "healthy"],
  "deliveryType": "free",
  "stock": 25,
  "images": ["https://example.com/apple1.jpg"]
}
```
**Important:** Replace `YOUR_STORE_ID_HERE` with your store's ID from earlier!

**Field Explanations:**
- `name`: Product name (required)
- `description`: Product description (required)
- `price`: Price in Nigerian Naira (required)
- `priceInNibia`: Price in Nibia points (required)
- `weight`: Weight in grams (required)
- `city`: City where product is available (required)
- `category`: Product category - options: "fruits", "vegetables", "grains", "dairy", "meat", "beverages", "snacks", "spices", "seafood", "others" (required)
- `sellerId`: Your store ID (optional for admin)
- `tags`: Tags for search and filtering (required)
- `deliveryType`: "free" or "paid" (required)
- `stock`: Available quantity (required)
- `images`: Array of image URLs (optional)

#### 🔍 Browse All Products (Public)
**What:** See all products available on the platform
**Endpoint:** `GET /products`
**Try it:** No authentication needed!

**Advanced Searching:**
- Search by name: `GET /products?search=apple`
- Filter by category: `GET /products?category=fruits`
- Filter by city: `GET /products?city=Lagos`
- Price range: `GET /products?minPrice=100&maxPrice=1000`
- Pagination: `GET /products?page=1&limit=10`

#### 📦 View Your Products (🔒 Store Owner Required)
**What:** See all products you've added to your store
**Endpoint:** `GET /products/my-products`
**Perfect for:** Managing your inventory

#### 🏪 View Products by Store
**What:** See all products from a specific store
**Endpoint:** `GET /products/seller/{sellerId}`
**How to test:** Use any store ID you've seen in responses

#### 🏙️ Products in Your City
**What:** Find products available in a specific city
**Endpoint:** `GET /products/city/{city}`
**Example:** `GET /products/city/Lagos`

#### 📊 Product Statistics (🔒 Admin Only)
**What:** Get analytics about products on the platform
**Endpoint:** `GET /products/statistics`
**Shows:** Total products, categories, average prices, etc.
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

#### Update Product Stock (🔒 Store Owner Required)
**Endpoint:** `PATCH /products/{id}/stock`

**⚡ NEW ENHANCED STOCK MANAGEMENT!**

**Request Body:**
```json
{
  "quantity": 25,
  "operation": "add"
}
```

**Stock Operations:**
- `"add"`: Add to current stock (increase inventory)
- `"subtract"`: Remove from current stock (decrease inventory, default)

**Examples:**

**Add Stock (Restocking):**
```json
{
  "quantity": 50,
  "operation": "add"
}
```

**Remove Stock (Sales, Damage, etc.):**
```json
{
  "quantity": 10,
  "operation": "subtract"
}
```

**Default Operation (Subtract):**
```json
{
  "quantity": 5
}
```

**What Happens:**
- ✅ Validates you own the product
- ✅ Performs the specified operation on current stock
- ✅ Prevents stock from going below 0 for subtract operations
- ✅ Updates product immediately in database
- ✅ Returns updated product with new stock level

**Expected Response:**
```json
{
  "message": "Stock updated successfully",
  "product": {
    "id": "64f987654321abcdef654321",
    "name": "Premium Organic Bananas",
    "stock": 75,
    "previousStock": 50,
    "operation": "add",
    "quantityChanged": 25,
    "updatedAt": "2025-07-30T10:30:00.000Z"
  }
}
```

**Error Handling:**
- `404 Not Found`: Product doesn't exist or you don't own it
- `400 Bad Request`: Trying to subtract more than available stock
- `400 Bad Request`: Invalid quantity (must be positive number)

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

### 🛒 4. Shopping Cart & Orders (Complete) - NEW PERSISTENT CART SYSTEM! 

**🎉 MAJOR UPDATE:** The cart system now uses **persistent database storage** with automatic expiration and validation!

**Key Features:**
- ✅ **Persistent Storage:** Your cart is saved in the database, not memory
- ✅ **Auto-Expiration:** Carts automatically expire after 30 days
- ✅ **Real-time Validation:** Stock levels checked on every operation
- ✅ **Price Tracking:** Prices locked when items added to prevent surprises
- ✅ **Scheduled Cleanup:** Expired carts cleaned automatically daily at 2 AM
- ✅ **Detailed Responses:** Rich product information in all cart operations

#### Add Item to Cart (🔒 Authentication Required)
**Endpoint:** `POST /orders/cart/add`

**Request Body:**
```json
{
  "productId": "PRODUCT_ID_FROM_PREVIOUS_STEP",
  "quantity": 2
}
```

**What Happens:**
- ✅ Validates product exists and has sufficient stock
- ✅ Creates new cart if none exists (expires in 30 days)
- ✅ Adds new item OR increases quantity if already in cart
- ✅ Locks current product price and details
- ✅ Validates total quantity doesn't exceed available stock
- ✅ Extends cart expiration to 30 days from now

**Expected Response:**
```json
{
  "message": "Item added to cart successfully",
  "cart": {
    "items": [
      {
        "_id": "64f123456789abcdef123456",
        "productId": {
          "_id": "64f987654321abcdef654321",
          "name": "Premium Organic Bananas",
          "price": 500,
          "priceInNibia": 50,
          "category": "Fruits",
          "images": ["image1.jpg"],
          "seller": "64f111222333abcdef111222",
          "stock": 48
        },
        "productName": "Premium Organic Bananas",
        "productDescription": "Fresh organic bananas from local farms",
        "quantity": 2,
        "unitPrice": 500,
        "unitPriceInNibia": 50,
        "totalPrice": 1000,
        "totalPriceInNibia": 100,
        "addedAt": "2025-07-30T10:30:00.000Z",
        "updatedAt": "2025-07-30T10:30:00.000Z"
      }
    ],
    "totalPriceInNaira": 1000,
    "totalPriceInNibia": 100,
    "itemCount": 1
  }
}
```

#### Update Cart Item Quantity (🔒 Authentication Required)
**Endpoint:** `PATCH /orders/cart/{productId}`

**Request Body:**
```json
{
  "quantity": 3
}
```

**What Happens:**
- ✅ Validates product still exists and has sufficient stock
- ✅ Updates quantity to the exact number specified (not additive)
- ✅ Recalculates totals using locked-in prices
- ✅ Extends cart expiration

**Expected Response:**
```json
{
  "message": "Cart item updated successfully",
  "cart": {
    // Same structure as add to cart response with updated quantities
  }
}
```

#### Remove Item from Cart (🔒 Authentication Required)
**Endpoint:** `DELETE /orders/cart/remove`

**Request:** No body needed, just the productId in the URL path.

**What Happens:**
- ✅ Removes the specific product from cart completely
- ✅ Recalculates cart totals
- ✅ Returns updated cart

**Expected Response:**
```json
{
  "message": "Item removed from cart successfully",
  "cart": {
    // Updated cart without the removed item
  }
}
```

#### View Cart (🔒 Authentication Required)
**Endpoint:** `GET /orders/cart`

**What Happens:**
- ✅ Returns only non-expired cart items
- ✅ Populates full product details for each item
- ✅ Filters out items where products have been deleted
- ✅ Calculates current totals

**Expected Response:**
```json
{
  "items": [
    {
      "_id": "64f123456789abcdef123456",
      "productId": {
        "_id": "64f987654321abcdef654321",
        "name": "Premium Organic Bananas",
        "price": 500,
        "priceInNibia": 50,
        "category": "Fruits",
        "images": ["image1.jpg"],
        "seller": "64f111222333abcdef111222",
        "stock": 48
      },
      "productName": "Premium Organic Bananas",
      "productDescription": "Fresh organic bananas from local farms",
      "quantity": 2,
      "unitPrice": 500,
      "unitPriceInNibia": 50,
      "totalPrice": 1000,
      "totalPriceInNibia": 100,
      "addedAt": "2025-07-30T10:30:00.000Z",
      "updatedAt": "2025-07-30T10:30:00.000Z"
    }
  ],
  "totalPriceInNaira": 1000,
  "totalPriceInNibia": 100,
  "itemCount": 1
}
```

**Empty Cart Response:**
```json
{
  "items": [],
  "totalPriceInNaira": 0,
  "totalPriceInNibia": 0,
  "itemCount": 0
}
```

#### Clear Cart (🔒 Authentication Required)
**Endpoint:** `DELETE /orders/cart`

**What Happens:**
- ✅ Removes ALL items from your cart
- ✅ Cart record remains for future use
- ✅ Returns empty cart confirmation

**Expected Response:**
```json
{
  "message": "Cart cleared successfully",
  "cart": {
    "items": [],
    "totalPriceInNaira": 0,
    "totalPriceInNibia": 0,
    "itemCount": 0
  }
}
```

#### 🚨 Important Cart Behaviors

**Cart Expiration:**
- Carts automatically expire after 30 days of inactivity
- Any cart operation extends expiration to 30 days from that moment
- Expired carts are automatically cleaned up daily at 2 AM

**Stock Validation:**
- Stock is checked in real-time for every cart operation
- If a product goes out of stock, you'll get an error when trying to add/update
- The system prevents adding more items than available stock

**Price Locking:**
- Prices are locked when items are added to cart
- Even if product prices change, your cart keeps the original prices
- This prevents checkout surprises

**Error Handling:**
- `404 Not Found`: Product doesn't exist or cart is empty
- `400 Bad Request`: Invalid quantity, insufficient stock, or general validation errors
- All errors include descriptive messages

#### Checkout Cart (🔒 Authentication Required)
**Endpoint:** `POST /orders/checkout`

**⚠️ Prerequisites:** You must have items in your cart before checkout!

**Request Body:**
```json
{
  "paymentPlan": {
    "type": "pay_now",
    "payNowDetails": {}
  },
  "deliveryMethod": "home_delivery",
  "deliveryAddress": {
    "street": "45 Allen Avenue",
    "city": "Lagos",
    "state": "Lagos",
    "postalCode": "100001",
    "country": "Nigeria",
    "instructions": "Please call when you arrive"
  },
  "notes": "Please deliver before 6 PM"
}
```

**Payment Plan Options:**
```json
// Option 1: Pay Now (immediate payment)
{
  "paymentPlan": {
    "type": "pay_now",
    "payNowDetails": {}
  }
}

// Option 2: Pay Later (credit-based)
{
  "paymentPlan": {
    "type": "pay_later",
    "payLaterDetails": {
      "creditLimit": 5000,
      "dueDate": "2025-08-15T00:00:00.000Z"
    }
  }
}

// Option 3: Pay Small Small (installments)
{
  "paymentPlan": {
    "type": "pay_small_small",
    "paySmallSmallDetails": {
      "initialPayment": 500,
      "installmentAmount": 250,
      "installmentFrequency": "weekly",
      "numberOfInstallments": 4
    }
  }
}

// Option 4: Price Lock (reserve at current price)
{
  "paymentPlan": {
    "type": "price_lock",
    "priceLockDetails": {
      "lockDuration": 7,
      "lockAmount": 100
    }
  }
}
```

**Delivery Method Options:**
- `"home_delivery"`: Delivery to specified address (deliveryAddress required)
- `"pickup"`: Customer pickup (deliveryAddress optional)

**What Happens During Checkout:**
- ✅ Validates you have items in cart
- ✅ Checks all products still exist and have sufficient stock
- ✅ Calculates total amount including delivery fees
- ✅ Creates order from cart items using locked-in prices
- ✅ Clears your cart automatically
- ✅ Generates order tracking ID
- ✅ Sets initial order status to "pending"

**Expected Success Response:**
```json
{
  "order": {
    "id": "64f555666777abcdef555666",
    "orderNumber": "ORD-1690473600-ABC123",
    "status": "pending",
    "items": [
      {
        "productId": "64f987654321abcdef654321",
        "productName": "Premium Organic Bananas",
        "quantity": 2,
        "unitPrice": 500,
        "unitPriceInNibia": 50,
        "totalPrice": 1000,
        "totalPriceInNibia": 100,
        "seller": "64f111222333abcdef111222"
      }
    ],
    "totalAmount": 1000,
    "totalAmountInNibia": 100,
    "deliveryFee": 200,
    "grandTotal": 1200,
    "paymentPlan": {
      "type": "pay_now",
      "payNowDetails": {}
    },
    "deliveryMethod": "home_delivery",
    "deliveryAddress": {
      "street": "45 Allen Avenue",
      "city": "Lagos",
      "state": "Lagos",
      "postalCode": "100001",
      "country": "Nigeria",
      "instructions": "Please call when you arrive"
    },
    "notes": "Please deliver before 6 PM",
    "createdAt": "2025-07-30T10:30:00.000Z",
    "estimatedDeliveryTime": "2025-07-30T16:00:00.000Z"
  },
  "message": "Order placed successfully! Your cart has been cleared."
}
```

**Common Checkout Errors:**
- `400 Bad Request - "Cart is empty"`: Add items to cart first
- `400 Bad Request - "Insufficient stock"`: One or more products don't have enough stock
- `400 Bad Request - "Product no longer available"`: Product was deleted after adding to cart
- `400 Bad Request - "Invalid delivery address"`: Required address fields missing for home delivery

**🚨 Recently Fixed Issues:**
- ✅ **DTO Validation Error**: Fixed incorrect `CheckoutDto` export that was causing validation errors for `amount` and `paymentMethod` fields
- ✅ **ObjectId Error**: Fixed "input must be a 24 character hex string" error when processing populated cart items during checkout

**💳 Payment Process - IMPORTANT WORKFLOW:**

⚠️ **CRITICAL**: You MUST complete checkout first before making payment!

**Step 1: Complete Checkout Process**
```bash
POST /orders/checkout
# This creates an order and returns an order ID
```

**Step 2: Use the Returned Order ID for Payment**
```bash
POST /orders/{ORDER_ID_FROM_CHECKOUT}/payment
# Use the "_id" field from checkout response as the order ID
```

**📋 Example Checkout Response:**
```json
{
  "orderNumber": "ORD-926860154",
  "_id": "688a01eeabaaabdea89fa204",  // ← THIS is the Order ID to use!
  "remainingAmount": 1000,           // ← Use this as payment amount
  "finalTotal": 1000,
  "status": "pending",
  // ... other fields
}
```

**📝 Payment Request Example:**
```bash
POST /orders/688a01eeabaaabdea89fa204/payment
{
  "amount": 1000,                    // ← Must match remainingAmount
  "paymentMethod": "food_money",
  "transactionRef": "TXN123456789",
  "notes": "Payment via Food Money wallet"
}
```

**🚨 Common Mistakes:**
- ❌ Using `orderNumber` instead of `_id`
- ❌ Using `productId` instead of order `_id`
- ❌ Wrong payment amount (must match `remainingAmount`)

**🔍 Troubleshooting Payment Errors:**

**Error: "Order not found" (404)**
- ✅ **Most Common Cause**: Using an invalid or non-existent order ID
- ✅ **Solution**: First complete checkout to get a valid order ID
- ✅ **Check**: Ensure the order ID is exactly as returned from checkout response

**Error: "You can only make payments for your own orders" (403)**
- ✅ **Cause**: Authentication mismatch - you're not logged in as the user who created the order
- ✅ **Solution**: Login as the same user who created the order
- ✅ **Check**: Compare your current user ID with the order's `userId` field

**Error: "Wallet not found for this user" (404)**
- ✅ **Cause**: You don't have a wallet created yet
- ✅ **Solution**: Create a wallet first before making payments
- ✅ **Check**: GET `/wallets/my-wallet` should return your wallet details

**🔧 Quick Fixes for Wallet Issues:**
```bash
# 1. Create your wallet first (No request body needed!)
POST /wallets/create

# 2. Verify wallet creation
GET /wallets/my-wallet

# 3. If wallet has 0 balance, get admin to top up:
# Admin endpoint to add funds:
PATCH /wallets/admin/{YOUR_USER_ID}/balance
{
  "amount": 2000.00,
  "walletType": "foodMoney",
  "transactionType": "credit",
  "description": "Initial wallet funding"
}

# 4. Then make payment
POST /orders/{ORDER_ID}/payment
{
  "amount": 1000,
  "paymentMethod": "food_money"
}
```

**Alternative Payment Methods if No Wallet Balance:**
- `"cash"`: Cash on delivery
- `"card"`: Credit/debit card payment
- `"bank_transfer"`: Bank transfer payment

**💡 Pro Tip:** For testing purposes, use admin endpoints to fund your wallet, or use alternative payment methods like `"cash"` which don't require wallet balance.

**🚨 Non-Admin Users:** If you don't have admin privileges, use these payment methods instead:
- ✅ `"cash"` - Cash on delivery (works without wallet)
- ✅ `"card"` - Credit/debit card payment (works without wallet)  
- ✅ `"bank_transfer"` - Bank transfer payment (works without wallet)

**🔑 For Admin Testing:** Create an admin user to test wallet top-up features:
```bash
POST /auth/register
{
  "name": "Admin Tester",
  "email": "admin@test.com", 
  "password": "AdminPass123!",
  "accountType": "business",
  "role": "admin"
}
```

**🔧 Quick Fixes for 403 Error:**
```bash
# 1. Check your current user
GET /users/profile

# 2. Check the order details
GET /orders/{ORDER_ID}

# 3. Login as the correct user
POST /auth/login
{
  "email": "correct_user_email",
  "password": "correct_password"
}

# 4. Then retry payment
POST /orders/{ORDER_ID}/payment
```

**Steps to Fix:**
1. **First, add items to cart**: `POST /orders/cart/add`
2. **Then checkout**: `POST /orders/checkout` → Save the returned order ID!
3. **Finally, make payment**: `POST /orders/{ACTUAL_ORDER_ID}/payment`

**🚨 IMPORTANT - Don't Confuse Checkout with Payment!**

**Checkout vs Payment:**
- **Checkout (`POST /orders/checkout`)**: Creates an order from your cart items. Uses `CheckoutDto` format shown above.
- **Payment (`POST /orders/{orderId}/payment`)**: Processes payment for an existing order. Uses `PaymentDto` format below.

**If you get validation errors mentioning `amount` and `paymentMethod` on checkout:**
This likely means there's a DTO configuration issue. The checkout endpoint should NOT require these fields - they're for the payment endpoint. Restart the server to ensure the latest DTO fixes are applied.

#### Process Payment for Order (🔒 Authentication Required)
**Endpoint:** `POST /orders/{orderId}/payment`

**⚠️ Prerequisites:** You must have a created order from checkout first!

**Request Body:**
```json
{
  "amount": 1200,
  "paymentMethod": "food_money",
  "transactionRef": "TXN123456789",
  "notes": "Payment via Food Money wallet"
}
```

**Payment Method Options:**
- `"food_money"`: Payment from Food Money wallet
- `"food_points"`: Payment using Food Points
- `"cash"`: Cash payment (for pickup orders)
- `"card"`: Credit/debit card payment
- `"bank_transfer"`: Bank transfer payment

**Expected Response:**
```json
{
  "payment": {
    "id": "64f777888999abcdef777888",
    "orderId": "64f555666777abcdef555666",
    "amount": 1200,
    "paymentMethod": "food_money",
    "status": "completed",
    "transactionRef": "TXN123456789",
    "processedAt": "2025-07-30T11:00:00.000Z"
  },
  "order": {
    "id": "64f555666777abcdef555666",
    "status": "paid",
    "paymentStatus": "completed"
  },
  "message": "Payment processed successfully"
}
```

---

## 🧪 NEW CART SYSTEM - COMPREHENSIVE TESTING SCENARIOS

**Test these scenarios to understand the new cart system's capabilities:**

### Scenario 1: Basic Shopping Flow
```bash
# Step 1: Add items to cart
POST /orders/cart/add
{
  "productId": "PRODUCT_ID_1",
  "quantity": 2
}

# Step 2: Add another item
POST /orders/cart/add
{
  "productId": "PRODUCT_ID_2", 
  "quantity": 1
}

# Step 3: View cart
GET /orders/cart

# Step 4: Update quantity
PATCH /orders/cart/PRODUCT_ID_1
{
  "quantity": 3
}

# Step 5: Checkout
POST /orders/checkout
{
  "paymentPlan": {"type": "pay_now", "payNowDetails": {}},
  "deliveryMethod": "home_delivery",
  "deliveryAddress": {"street": "123 Test St", "city": "Lagos", "state": "Lagos", "postalCode": "100001"}
}
```

### Scenario 2: Stock Validation Testing
```bash
# Test stock limits - try adding more than available
POST /orders/cart/add
{
  "productId": "PRODUCT_WITH_LOW_STOCK",
  "quantity": 999  # This should fail with stock error
}

# Add valid quantity first
POST /orders/cart/add
{
  "productId": "PRODUCT_ID",
  "quantity": 5
}

# Try adding more than remaining stock
POST /orders/cart/add
{
  "productId": "PRODUCT_ID",  # Same product
  "quantity": 10  # If total exceeds stock, this fails
}
```

### Scenario 3: Cart Persistence Testing
```bash
# Add items to cart
POST /orders/cart/add
{
  "productId": "PRODUCT_ID",
  "quantity": 2
}

# Wait some time or logout/login

# Check cart is still there
GET /orders/cart  # Should return items added before
```

### Scenario 4: Price Locking Testing
```bash
# Step 1: Add item to cart (price locked)
POST /orders/cart/add
{
  "productId": "PRODUCT_ID",
  "quantity": 1
}

# Step 2: Store owner updates product price
PATCH /products/PRODUCT_ID
{
  "price": 2000  # Changed from 1000 to 2000
}

# Step 3: Check cart still has old price
GET /orders/cart  # unitPrice should still be 1000, not 2000

# Step 4: Checkout uses locked price
POST /orders/checkout
# Order total uses the locked price (1000), not new price (2000)
```

### Scenario 5: Cart Expiration Testing
```bash
# This would require waiting 30 days or manually updating database
# For testing, admin can manually set expiration date in past

# Check expired cart behavior
GET /orders/cart  # Should return empty cart if expired

# Add to expired cart creates new cart
POST /orders/cart/add
{
  "productId": "PRODUCT_ID",
  "quantity": 1
}
```

### Scenario 6: Error Handling Testing
```bash
# Test empty cart checkout
DELETE /orders/cart  # Clear cart first
POST /orders/checkout  # Should fail with "Cart is empty"

# Test invalid product
POST /orders/cart/add
{
  "productId": "000000000000000000000000",  # Invalid ID
  "quantity": 1
}

# Test negative quantity
POST /orders/cart/add
{
  "productId": "VALID_PRODUCT_ID",
  "quantity": -1  # Should fail validation
}
```

---

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

## � Shopping & Orders Features

### What You Can Do As a Customer:

#### 🛍️ Place an Order (🔒 Authentication Required)
**What:** Buy products from stores
**This is the main shopping feature!**

**Step-by-Step Shopping Process:**

**Step 1: Find products you want to buy**
Use `GET /products` to browse available items and note the product IDs.

**Step 2: Add items to your cart**
**Endpoint:** `POST /orders/cart/add`
```json
{
  "productId": "PRODUCT_ID_FROM_STEP_1",
  "quantity": 2
}
```
Repeat this for each product you want to buy.

**Step 3: View your cart**
**Endpoint:** `GET /orders/cart`
This shows all items in your cart with prices and totals.

**Step 4: Checkout your cart**
**Endpoint:** `POST /orders/checkout`
```json
{
  "paymentPlan": {
    "type": "pay_now",
    "payNowDetails": {}
  },
  "deliveryMethod": "home_delivery",
  "deliveryAddress": {
    "street": "456 Customer Street",
    "city": "Lagos",
    "state": "Lagos",
    "postalCode": "100001",
    "country": "Nigeria",
    "instructions": "Please call when you arrive"
  },
  "notes": "Handle with care"
}
```

**Field Explanations:**
- `paymentPlan.type`: Payment plan - options: "pay_now", "price_lock", "pay_small_small", "pay_later"
- `deliveryMethod`: Delivery method - options: "home_delivery", "pickup"
- `deliveryAddress`: Required for home delivery (optional for pickup)
- `notes`: Optional special instructions

**What happens:** 
- Order is created from your cart items
- Total amount is calculated automatically (including delivery fee if applicable)
- Your cart is cleared
- You get an order confirmation with tracking ID

#### 📋 View Your Orders (🔒 Authentication Required)
**What:** See all your past and current orders
**Endpoint:** `GET /orders/my-orders`
**Perfect for:** Tracking your shopping history

#### 🔍 Track a Specific Order (🔒 Authentication Required)
**What:** Get detailed info about one order
**Endpoint:** `GET /orders/{orderId}`
**Use the order ID from your checkout response**

#### ⭐ Rate an Order (🔒 Authentication Required)
**What:** Leave feedback about your shopping experience
**Endpoint:** `POST /orders/{orderId}/rate`
```json
{
  "rating": 5,
  "review": "Excellent products and fast delivery!",
  "deliveryRating": 5
}
```

### What Store Owners Can Do:

#### 📦 View Orders for Your Store (🔒 Store Owner Required)
**What:** See orders placed at your store
**Endpoint:** `GET /orders/store-orders`
**Perfect for:** Managing your business

#### ✅ Update Order Status (🔒 Store Owner Required)
**What:** Mark orders as prepared, ready, etc.
**Endpoint:** `PATCH /orders/{orderId}/status`
```json
{
  "status": "confirmed",
  "notes": "Order is being prepared"
}
```

**Status Options:**
- `pending` - Just placed
- `confirmed` - Store accepted the order
- `preparing` - Store is making/packing the order
- `ready` - Ready for pickup/delivery
- `completed` - Order finished
- `cancelled` - Order was cancelled

## 💰 Wallet & Payment Features (Complete with All Operations)

### 🏦 User Wallet Management

#### 💳 Check Your Balance (🔒 Authentication Required)
**Endpoint:** `GET /wallets/my-wallet`
**What:** See how much money you have in all your wallet currencies

**Expected Response:**
```json
{
  "foodMoney": 5000.50,
  "foodPoints": 1250.75,
  "foodSafe": 2000.00,
  "totalBalance": 7000.50,
  "status": "active",
  "lastTransactionAt": "2025-07-30T12:00:00.000Z"
}
```

#### 🆕 Create Your Wallet (🔒 Authentication Required)
**Endpoint:** `POST /wallets/create`
**What:** Set up your payment account (No request body needed!)
**Note:** Creates a wallet with default balances (typically starts with 0 in all currencies)

**Expected Response:**
```json
{
  "_id": "688a123456789abcdef12345",
  "userId": "6887e979193e051560861753",
  "foodMoney": 0,
  "foodPoints": 0,
  "foodSafe": 0,
  "status": "active",
  "createdAt": "2025-07-30T12:00:00.000Z",
  "updatedAt": "2025-07-30T12:00:00.000Z"
}
```

#### 💸 Send Money to Another User (🔒 Authentication Required)
**Endpoint:** `POST /wallets/transfer`
**What:** Transfer money to friends or pay for shared orders

**Request Body:**
```json
{
  "toUserId": "FRIEND_USER_ID",
  "amount": 500.00,
  "description": "Splitting dinner order"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Successfully transferred ₦500.00 to recipient",
  "transactionId": "TXN_1234567890_abc123def"
}
```

#### 🔒 Lock Funds in Food Safe (🔒 Authentication Required)
**Endpoint:** `POST /wallets/lock-funds`
**What:** Move money from Food Money to Food Safe (savings)

**Request Body:**
```json
{
  "amount": 200.00,
  "description": "Saving for future orders"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Successfully locked ₦200.00 in food safe"
}
```

#### 🔓 Unlock Funds from Food Safe (🔒 Authentication Required)
**Endpoint:** `POST /wallets/unlock-funds`
**What:** Move money from Food Safe back to Food Money (for spending)

**Request Body:**
```json
{
  "amount": 100.00,
  "description": "Unlocking for current order"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Successfully unlocked ₦100.00 from food safe"
}
```

### 🏛️ Admin Wallet Management (Admin Only)

#### 📊 View All Wallets (🔒 Admin Only)
**Endpoint:** `GET /wallets/admin/all`
**What:** See all user wallets in the system

#### 📈 Get Wallet Statistics (🔒 Admin Only)
**Endpoint:** `GET /wallets/admin/stats`
**What:** View system-wide wallet statistics

**Expected Response:**
```json
{
  "totalWallets": 1500,
  "activeWallets": 1450,
  "totalFoodMoney": 2500000.50,
  "totalFoodPoints": 875000.25,
  "totalFoodSafe": 1200000.00,
  "totalBalance": 3700000.50
}
```

#### 👤 Get User Wallet (🔒 Admin Only)
**Endpoint:** `GET /wallets/admin/user/{userId}`
**What:** View specific user's wallet details

#### 💰 Top-Up User Wallet (🔒 Admin Only)
**Endpoint:** `PATCH /wallets/admin/{userId}/balance`
**What:** Add or subtract money from any user's wallet

**Request Body:**
```json
{
  "amount": 1000.00,
  "walletType": "foodMoney",
  "transactionType": "credit",
  "description": "Admin wallet top-up",
  "reference": "ADMIN_TOPUP_001"
}
```

**Wallet Types:**
- `"foodMoney"`: Regular spending money
- `"foodPoints"`: Loyalty points
- `"foodSafe"`: Savings account

**Transaction Types:**
- `"credit"`: Add money to wallet
- `"debit"`: Remove money from wallet

#### 🔧 Update Wallet Status (🔒 Admin Only)
**Endpoint:** `PATCH /wallets/admin/{walletId}/status`
**What:** Change wallet status (active, suspended, frozen)

**Request Body:**
```json
{
  "status": "active"
}
```

**Status Options:**
- `"active"`: Wallet can be used normally
- `"suspended"`: Temporarily disabled
- `"frozen"`: Locked pending investigation

#### 🏗️ Create Wallet for User (🔒 Admin Only)
**Endpoint:** `POST /wallets/admin/{userId}/create`
**What:** Create wallet for specific user (No request body needed)

### 💱 Money Types Explained

- **Food Money:** Regular cash for buying food (primary spending currency)
- **Food Points:** Loyalty points earned from purchases (can be used for discounts)
- **Food Safe:** Savings account for future use (locked funds that earn interest)

### 🔄 Complete Wallet Workflow for New Users

1. **Create Account:** `POST /auth/register`
2. **Create Wallet:** `POST /wallets/create`
3. **🚨 IMPORTANT: Wallet Top-Up Limitation**
   - ❌ **Users CANNOT add money to their own wallets**
   - ✅ **Only admins can add money using:** `PATCH /wallets/admin/{userId}/balance`
   - ✅ **This is by design for security and compliance**

---

## 🏧 Nibia Withdrawal System (GA/GE Users Only)

### 🎯 Overview
Growth Associates (GA) and Growth Elites (GE) can withdraw their Nibia (Food Points) and convert them to Nigerian Naira at a 1:1 rate. This feature is automatically enabled when users are promoted to GA/GE status.

### 💰 User Withdrawal Operations (GA/GE Only)

#### Create Withdrawal Request
**Endpoint:** `POST /wallets/withdrawals/request`  
**Authentication:** GA/GE users only
**Description:** Convert Nibia to NGN with admin approval process

**Request Body:**
```json
{
  "nibiaAmount": 1000.0,
  "userReason": "Emergency cash needed"
}
```

**Response:**
```json
{
  "id": "withdrawal_request_id",
  "nibiaAmount": 1000.0,
  "ngnAmount": 1000.0,
  "status": "pending",
  "priority": 1,
  "userRole": "growth_associate",
  "createdAt": "2025-08-17T18:00:00.000Z"
}
```

**Limits & Rules:**
- **Conversion Rate:** 1 Nibia = 1 NGN
- **Min Amount:** 1 Nibia per request
- **Max Amount:** 100,000 Nibia per request
- **Daily Limit:** 500,000 Nibia per user
- **Monthly Limit:** 2,000,000 Nibia per user
- **Priority:** GE users processed first, then GA users

#### Get My Withdrawal Requests
**Endpoint:** `GET /wallets/withdrawals/my-requests`
**Description:** View your withdrawal history and status

**Query Parameters:**
```
?status=pending&page=1&limit=20
```

**Response:**
```json
{
  "requests": [
    {
      "id": "req_123",
      "nibiaAmount": 1000,
      "ngnAmount": 1000,
      "status": "pending",
      "userReason": "Emergency cash",
      "createdAt": "2025-08-17T18:00:00.000Z"
    }
  ],
  "total": 5,
  "page": 1,
  "limit": 20
}
```

#### Get Withdrawal Request Details
**Endpoint:** `GET /wallets/withdrawals/{requestId}`
**Description:** Get detailed information about a specific withdrawal request

**Response includes:**
- Request details and current status
- Processing timeline and admin notes
- Transaction reference (if completed)
- User and admin information

### 🛠️ Admin Withdrawal Management

#### Get All Withdrawal Requests (Admin)
**Endpoint:** `GET /wallets/withdrawals/admin/all`
**Authentication:** Admin only
**Description:** View all withdrawal requests system-wide with priority ordering

**Query Parameters:**
```
?status=pending&userId=user123&page=1&limit=20
```

**Features:**
- **Priority Ordering:** GE requests → GA requests → Creation date
- **Status Filtering:** pending, approved, rejected, completed
- **User Filtering:** View requests from specific users
- **Full User Details:** Names, emails, roles populated

#### Process Withdrawal Request (Admin)
**Endpoint:** `PATCH /wallets/withdrawals/admin/{requestId}/process`
**Authentication:** Admin with password verification
**Description:** Approve or reject withdrawal requests

**Request Body:**
```json
{
  "action": "approved",
  "adminNotes": "User verified, withdrawal approved", 
  "adminPassword": "your_admin_password"
}
```

**Approval Process:**
1. **Admin Password Verification:** Ensures request authenticity
2. **Balance Check:** Confirms user has sufficient Nibia
3. **Transaction Execution:** 
   - Deducts Nibia from user wallet
   - Credits equivalent NGN to FoodMoney balance
   - Creates transaction reference
4. **Status Update:** Marks as 'completed' with timestamp

#### Get Withdrawal Statistics (Admin)
**Endpoint:** `GET /wallets/withdrawals/admin/stats`
**Description:** Comprehensive withdrawal system metrics

**Response:**
```json
{
  "totalPending": 45,
  "totalCompleted": 156,
  "totalRejected": 12,
  "totalNibiaPending": 125000,
  "totalNibiaWithdrawn": 2500000,
  "totalNgnDisbursed": 2500000,
  "avgProcessingTimeHours": 8.5
}
```

#### Manual Withdrawal Control (Admin)
**Enable:** `POST /wallets/withdrawals/admin/enable-withdrawal/{userId}`
**Disable:** `POST /wallets/withdrawals/admin/disable-withdrawal/{userId}`

**Use Cases:**
- Enable withdrawal for manually promoted GA/GE users
- Emergency suspension of withdrawal privileges  
- Troubleshooting and account management

### 🧪 Testing Withdrawal System

#### Scenario 1: GA User Withdrawal Journey
```bash
# 1. Check if withdrawal is enabled
GET /wallets/my-wallet
# Look for: "nibiaWithdrawEnabled": true

# 2. Check Nibia balance
# Response should show available foodPoints (Nibia)

# 3. Create withdrawal request
POST /wallets/withdrawals/request
{
  "nibiaAmount": 500,
  "userReason": "Test withdrawal"
}

# 4. Track request status
GET /wallets/withdrawals/my-requests

# 5. Get specific request details
GET /wallets/withdrawals/{requestId}
```

#### Scenario 2: Admin Processing Workflow
```bash
# 1. View pending requests (priority ordered)
GET /wallets/withdrawals/admin/all?status=pending

# 2. Review system statistics
GET /wallets/withdrawals/admin/stats

# 3. Process high-priority GE request first
PATCH /wallets/withdrawals/admin/{requestId}/process
{
  "action": "approved",
  "adminNotes": "Priority GE user - approved",
  "adminPassword": "admin_password"
}

# 4. Verify user wallet updated
GET /wallets/admin/user/{userId}
# Should show reduced Nibia, increased NGN
```

#### Scenario 3: Error Testing
```bash
# Test insufficient balance
POST /wallets/withdrawals/request
{ "nibiaAmount": 999999 }
# Expected: 400 Bad Request

# Test exceeded limits  
POST /wallets/withdrawals/request
{ "nibiaAmount": 150000 }
# Expected: 400 - Exceeds max per request

# Test regular user access
# Use regular user token with withdrawal endpoint
# Expected: 403 Forbidden
```

### 💡 Key Integration Points

#### Automatic Promotion Integration
When users are promoted to GA/GE via the referrals system:
```typescript
// Automatically called during promotion
await walletsService.enableNibiaWithdrawal(userId);
```

#### Commission System Integration
- GA/GE users earn higher commission rates (7%, 10%)
- Accumulated commissions paid as Nibia can be withdrawn
- Withdrawal system provides liquidity for high-performing users

#### Security & Compliance
- All withdrawals require admin approval (no auto-approval)
- Admin password verification for all processing actions
- Complete audit trail with timestamps and admin notes
- Rate limiting and daily/monthly caps per user
4. **For Payments: Use Alternative Methods**
   - `"cash"` - Cash on delivery (no wallet needed)
   - `"card"` - Credit/debit card (no wallet needed)
   - `"bank_transfer"` - Bank transfer (no wallet needed)
5. **For Testing: Create Admin Account** to manage wallet top-ups

### 💡 **Why Can't Users Add Money to Their Own Wallets?**

**Security Reasons:**
- Prevents unauthorized money creation
- Ensures proper financial audit trails
- Requires external payment validation
- Complies with financial regulations

**In Production:**
- Users would top up via payment gateways (Paystack, Flutterwave, etc.)
- Bank transfers verified by admins
- Card payments processed by payment processors
- All transactions properly tracked and verified

### 🎯 **Recommended Testing Approach:**

**Option 1: Use Non-Wallet Payments** (Easiest)
```bash
POST /orders/{ORDER_ID}/payment
{
  "amount": 1000,
  "paymentMethod": "cash",  # No wallet required
  "transactionRef": "CASH_001"
}
```

**Option 2: Create Admin for Wallet Testing**
```bash
# 1. Register admin
POST /auth/register
{
  "name": "Test Admin",
  "email": "admin@test.com",
  "password": "AdminPass123!",
  "role": "admin"
}

# 2. Login as admin and fund user wallets
PATCH /wallets/admin/{USER_ID}/balance
{
  "amount": 2000.00,
  "walletType": "foodMoney",
  "transactionType": "credit"
}
```

## 🎯 Special Features (Advanced)

### 🏆 Auctions (For Special Products)

#### 🔍 Browse Active Auctions (Public)
**What:** See special products being auctioned
**Endpoint:** `GET /auctions`
**Filter:** `?status=ACTIVE` to see only active auctions

#### 💰 Place a Bid (🔒 Authentication Required)
**What:** Bid on auction items
**Endpoint:** `POST /auctions/{auctionId}/bid`
```json
{
  "amount": 1200
}
```
**Note:** Your bid must be higher than the current highest bid!

#### 🏅 Check Your Bids (🔒 Authentication Required)
**What:** See auctions you've bid on
**Endpoint:** `GET /auctions/user/bids`

#### 🎉 Check Won Auctions (🔒 Authentication Required)
**What:** See auctions you've won
**Endpoint:** `GET /auctions/user/won`

### 🚚 Delivery Tracking

#### � Track Your Delivery (🔒 Authentication Required)
**What:** See where your order is in the delivery process
**Endpoint:** `GET /delivery/order/{orderId}`
**Use your order ID from checkout**

#### ⭐ Rate Your Delivery (🔒 Authentication Required)
**What:** Give feedback on delivery service
**Endpoint:** `POST /delivery/{deliveryId}/rate`
```json
{
  "rating": 5,
  "feedback": "Driver was very professional and fast!",
  "deliveryTime": "2024-07-22T18:30:00Z"
}
```

---

## 🔧 Admin-Only Features

**Note:** These features are only available if you have admin privileges.

### 👥 Admin User Management
- **View all users:** `GET /users`
- **Create new users:** `POST /users`
- **Update any user:** `PATCH /users/{id}`
- **Delete users:** `DELETE /users/{id}`

### 🏪 Admin Store Management
- **Delete any store:** `DELETE /stores/{id}`
- **View store statistics:** Various admin endpoints

### 🛍️ Admin Product Management
- **View product statistics:** `GET /products/statistics`
- **Manage any product:** Various admin endpoints

### 💰 Admin Wallet Management
- **View all wallets:** `GET /wallets/admin/all`
- **Add money to user accounts:** `PATCH /wallets/admin/{userId}/balance`
- **View financial statistics:** `GET /wallets/admin/stats`

### 🛒 NEW: Admin Cart Management & Cleanup System
**🆕 Automated Cart Cleanup System Active!**

The system now includes an automated cart cleanup service that:

**📅 Daily Cleanup (2 AM):**
- Automatically removes expired carts (older than 30 days)
- Logs cleanup activities for monitoring
- Runs every day at 2:00 AM server time

**🔍 How the Cleanup Works:**
- Finds all carts with `expiresAt` date in the past
- Safely deletes expired cart documents from database
- Logs the number of carts cleaned up
- Prevents database bloat from abandoned carts

**📊 Cleanup Monitoring:**
- Check server logs for cleanup reports: `"Cart cleanup completed. Removed X expired carts"`
- Cleanup runs automatically via @Cron decorator
- No manual intervention needed

**⚙️ Technical Details:**
- Uses NestJS @Cron and ScheduleModule
- Cleanup method: `CartService.cleanupExpiredCarts()`
- Service: `CartCleanupService` with scheduled task
- Frequency: Daily at 2 AM (configurable)

**🛠️ Admin Cart Monitoring (Future Enhancement):**
```bash
# Potential admin endpoints for cart monitoring:
GET /admin/carts/statistics     # Cart usage stats
GET /admin/carts/expired        # View expired carts before cleanup
POST /admin/carts/cleanup       # Manual cleanup trigger
GET /admin/carts/cleanup-logs   # View cleanup history
```

*Note: The cleanup system is fully automated and requires no admin intervention. These monitoring endpoints could be added for advanced cart management.*

### 🚚 Admin Delivery Management
- **Create deliveries:** `POST /delivery`
- **Assign riders:** `POST /delivery/{id}/assign`
- **Release payments:** `POST /delivery/{id}/release-payment`

### 🏆 Admin Auction Management
- **Create auctions:** `POST /auctions`
- **Update auctions:** `PATCH /auctions/{id}`
- **Cancel auctions:** `POST /auctions/{id}/cancel`
- **Finalize auctions:** `POST /auctions/{id}/finalize`

---

## 🔐 COMPLETE ADMIN ENDPOINTS GUIDE

**⚠️ IMPORTANT:** All admin endpoints require authentication with admin role. To test these endpoints:

1. **Create or get admin credentials**
2. **Login as admin** to get JWT token
3. **Include token** in `Authorization: Bearer <token>` header

### 🎯 Prerequisites for Admin Testing

Before testing admin endpoints, ensure you have admin access:

#### Option 1: Create Admin User (Backend/Database)
```javascript
// In MongoDB shell or database tool
db.users.insertOne({
  email: "admin@forage.com",
  name: "System Admin",
  password: "$2b$10$hashed_password_here", // Use bcrypt to hash "admin123"
  role: "admin",
  isVerified: true,
  createdAt: new Date(),
  updatedAt: new Date()
});
```

#### Option 2: Promote Existing User to Admin
```javascript
// In MongoDB shell
db.users.updateOne(
  { email: "your-email@example.com" },
  { $set: { role: "admin" } }
);
```

#### Option 3: Use Admin Login Endpoint (if available)
```bash
POST /admin/auth/login
Content-Type: application/json

{
  "email": "admin@forage.com",
  "password": "your-admin-password"
}
```

---

## 👑 ADMIN MODULE ENDPOINTS

### 👥 User Management

#### Get All Users
**Endpoint:** `GET /admin/users`
**Description:** Retrieve all users in the system with pagination and filtering
**Response:** Array of user objects with all user details

#### Get User by ID
**Endpoint:** `GET /admin/users/{userId}`
**Description:** Get detailed information about a specific user
**Parameters:** 
- `userId` (path): MongoDB ObjectId of the user

#### Get User Wallet (Admin View)
**Endpoint:** `GET /admin/users/{userId}/wallet`
**Description:** View any user's wallet details
**Parameters:**
- `userId` (path): User ID to check wallet for

---

### 💰 Wallet Management (Admin)

#### Get All Wallets
**Endpoint:** `GET /admin/wallets`
**Description:** View all user wallets in the system

#### Get Wallet by ID
**Endpoint:** `GET /admin/wallets/{walletId}`
**Description:** Get detailed wallet information by wallet ID
**Parameters:**
- `walletId` (path): Wallet MongoDB ObjectId

#### Fund User Wallet (Requires Admin Password)
**Endpoint:** `POST /admin/wallets/fund`
**Description:** Add money to any user's wallet (requires admin password verification)
**Request Body:**
```json
{
  "userId": "64a1234567890abcdef12345",
  "amount": 1000.00,
  "currencyType": "foodMoney",
  "adminPassword": "your-admin-password",
  "reason": "Promotional credit for user"
}
```
**Notes:**
- `currencyType`: "foodMoney" or "foodPoints"
- `adminPassword`: Required for security verification
- `reason`: Mandatory description for audit trail

#### Wipe User Wallet (Requires Admin Password)
**Endpoint:** `POST /admin/wallets/wipe`
**Description:** Clear/reset any user's wallet balance
**Request Body:**
```json
{
  "userId": "64a1234567890abcdef12345",
  "currencyType": "both",
  "adminPassword": "your-admin-password",
  "reason": "Account suspension - fraud investigation"
}
```
**Notes:**
- `currencyType`: "foodMoney", "foodPoints", or "both"
- Use with extreme caution - this action is irreversible

---

### 📊 Analytics & Reporting

#### Orders Analytics
**Endpoint:** `GET /admin/analytics/orders`
**Description:** Get comprehensive order statistics and trends
**Query Parameters:**
```json
{
  "dateRange": {
    "startDate": "2024-01-01T00:00:00.000Z",
    "endDate": "2024-12-31T23:59:59.999Z"
  },
  "categoryId": "64a1234567890abcdef12345",
  "productId": "64a1234567890abcdef12345",
  "city": "Lagos"
}
```

#### Subscription Analytics
**Endpoint:** `GET /admin/analytics/subscriptions`
**Description:** View subscription service usage and statistics

#### Commission Analytics
**Endpoint:** `GET /admin/analytics/commissions`
**Description:** Track commission earnings and payouts

---

### 🏷️ Category Management

#### Get All Categories (Admin)
**Endpoint:** `GET /admin/categories`
**Description:** View all product categories with admin details

#### Get Category by ID
**Endpoint:** `GET /admin/categories/{categoryId}`
**Parameters:**
- `categoryId` (path): Category MongoDB ObjectId

#### Create New Category
**Endpoint:** `POST /admin/categories`
**Request Body:**
```json
{
  "name": "Electronics",
  "description": "Electronic devices and gadgets",
  "iconUrl": "https://example.com/electronics-icon.png",
  "parentCategoryId": "64a1234567890abcdef12345"
}
```

#### Update Category
**Endpoint:** `PATCH /admin/categories/{categoryId}`
**Request Body:**
```json
{
  "name": "Updated Electronics",
  "description": "Updated description",
  "isActive": true
}
```

#### Delete Category
**Endpoint:** `DELETE /admin/categories/{categoryId}`
**Note:** Cannot delete categories that are in use by products

---

### 💰 Price History Management

#### Get Product Price History
**Endpoint:** `GET /admin/products/{productId}/price-history`
**Description:** View complete price change history for any product

#### Add Price History & Update Product
**Endpoint:** `POST /admin/products/price-history`
**Description:** Record price change and update product price
**Request Body:**
```json
{
  "productId": "64a1234567890abcdef12345",
  "price": 2500.00,
  "effectiveDate": "2024-01-15T00:00:00.000Z",
  "reason": "Market adjustment due to supply chain costs"
}
```

---

## 🏪 WALLET MODULE (Admin Endpoints)

### Get All Wallets (Admin)
**Endpoint:** `GET /wallets/admin/all`
**Description:** Comprehensive view of all system wallets

### Get Wallet Statistics
**Endpoint:** `GET /wallets/admin/stats`
**Description:** System-wide wallet statistics
**Response Example:**
```json
{
  "totalWallets": 1500,
  "activeWallets": 1450,
  "totalFoodMoney": 2500000.50,
  "totalFoodPoints": 875000.25,
  "totalFoodSafe": 1200000.00,
  "totalBalance": 3700000.50
}
```

### Get User Wallet by User ID
**Endpoint:** `GET /wallets/admin/user/{userId}`
**Description:** Get wallet details for specific user

### Get Wallet by Wallet ID
**Endpoint:** `GET /wallets/admin/{walletId}`
**Description:** Get wallet details by wallet ID

### Create Wallet for User
**Endpoint:** `POST /wallets/admin/{userId}/create`
**Description:** Create wallet for specific user (admin only)

### Update User Wallet Balance
**Endpoint:** `PATCH /wallets/admin/{userId}/balance`
**Description:** Directly modify user wallet balance
**Request Body:**
```json
{
  "operation": "add",
  "amount": 500.00,
  "currencyType": "foodMoney",
  "description": "Admin credit adjustment"
}
```

### Update Wallet Status
**Endpoint:** `PATCH /wallets/admin/{walletId}/status`
**Description:** Change wallet status (active/suspended/frozen)
**Request Body:**
```json
{
  "status": "suspended"
}
```

---

## 🎪 AUCTIONS MODULE (Admin Endpoints)

### Create Auction
**Endpoint:** `POST /auctions`
**Description:** Create new product auction
**Request Body:**
```json
{
  "productId": "64a1234567890abcdef12345",
  "startingBid": 1000.00,
  "minimumBidIncrement": 50.00,
  "startTime": "2024-02-01T10:00:00.000Z",
  "endTime": "2024-02-07T22:00:00.000Z",
  "description": "Weekly fresh produce auction"
}
```

### Update Auction
**Endpoint:** `PATCH /auctions/{id}`
**Description:** Modify auction details (admin only)

### Cancel Auction
**Endpoint:** `POST /auctions/{id}/cancel`
**Description:** Cancel auction and refund all bids

### Finalize Auction
**Endpoint:** `POST /auctions/{id}/finalize`
**Description:** Manually finalize auction and determine winner

---

## 🛒 ORDERS MODULE (Admin Endpoints)

### Get Order Analytics
**Endpoint:** `GET /orders/analytics`
**Description:** Comprehensive order statistics and insights
**Query Parameters:**
- `startDate`: Filter orders from date
- `endDate`: Filter orders to date
- `status`: Filter by order status
- `city`: Filter by delivery city

### Update Order (Admin)
**Endpoint:** `PATCH /orders/{orderId}/admin`
**Description:** Admin override for order modifications
**Request Body:**
```json
{
  "status": "confirmed",
  "deliveryAddress": "Updated delivery address",
  "adminNotes": "Order manually verified and approved"
}
```

### Approve/Reject Credit Check
**Endpoint:** `POST /orders/{orderId}/credit-check`
**Description:** Approve or reject Pay Later orders
**Request Body:**
```json
{
  "decision": "approved",
  "creditLimit": 50000.00,
  "notes": "Good credit history, approved for pay later"
}
```

---

## 🛍️ PRODUCTS MODULE (Admin Endpoints)

### Get Product Statistics
**Endpoint:** `GET /products/statistics`
**Description:** Overall product statistics and insights

### Bulk Stock Update
**Endpoint:** `POST /products/admin/bulk-stock-update`
**Description:** Update stock for multiple products at once
**Request Body:**
```json
{
  "updates": [
    {
      "productId": "64a1234567890abcdef12345",
      "stock": 100,
      "operation": "set"
    },
    {
      "productId": "64a1234567890abcdef12346",
      "stock": 50,
      "operation": "add"
    }
  ]
}
```

### Create Product for Seller
**Endpoint:** `POST /products/admin/{sellerId}`
**Description:** Create product on behalf of specific seller

### Get Products by Seller (Admin)
**Endpoint:** `GET /products/admin/seller/{sellerId}`
**Description:** View all products for specific seller

### Update Product Status
**Endpoint:** `PATCH /products/admin/{id}/status`
**Description:** Change product status (active/inactive/suspended)
**Request Body:**
```json
{
  "status": "suspended",
  "reason": "Policy violation - inappropriate content"
}
```

---

## 👥 USERS MODULE (Admin Endpoints)

### Get All Users
**Endpoint:** `GET /users/admin/all`
**Description:** List all users with admin details and filters
**Query Parameters:**
- `role`: Filter by user role
- `city`: Filter by user city
- `isVerified`: Filter by verification status
- `page`: Pagination
- `limit`: Items per page

### Get User by ID (Admin)
**Endpoint:** `GET /users/admin/{userId}`
**Description:** Get complete user profile (admin view)

### Create User (Admin)
**Endpoint:** `POST /users/admin/create`
**Description:** Create new user account
**Request Body:**
```json
{
  "email": "newuser@example.com",
  "name": "New User",
  "password": "securePassword123",
  "role": "user",
  "phoneNumber": "+2341234567890",
  "city": "Lagos"
}
```

---

## 🚀 NEW ENHANCED ADMIN FEATURES

### 🏢 Growth Associates/Growth Elites Management

#### Get Growth Users by City
**Endpoint:** `GET /admin/growth-users/city`
**Description:** View GA/GE users organized by city with comprehensive analytics
**Authentication:** Admin only
**Query Parameters:**
```
?city=Lagos&role=GrowthElite&status=active&dateFrom=2024-01-01&dateTo=2024-12-31&page=1&limit=20
```

**Response Format:**
```json
{
  "cityBreakdown": {
    "Lagos": {
      "totalUsers": 15,
      "growthElites": 8,
      "growthAssociates": 7,
      "totalReferrals": 145,
      "totalSpend": 450000,
      "averageSpendPerUser": 30000,
      "users": [
        {
          "_id": "64a1234567890abcdef12345",
          "email": "ge1@example.com",
          "name": "John Doe",
          "role": "GrowthElite",
          "city": "Lagos",
          "referralCount": 25,
          "totalSpend": 75000,
          "joinedAt": "2024-01-15T10:30:00.000Z",
          "lastActive": "2024-02-01T14:20:00.000Z"
        }
      ]
    }
  },
  "summary": {
    "totalCities": 5,
    "totalGrowthUsers": 42,
    "totalReferrals": 380,
    "totalSpend": 1250000
  }
}
```

**Key Features:**
- **City Organization**: Users grouped by city with aggregated metrics
- **Role Analytics**: Separate counts for GA vs GE users
- **Performance Metrics**: Referral counts and spending analytics per user
- **Filtering**: Comprehensive filtering by city, role, status, and date range
- **Detailed User Info**: Complete user profiles with activity timestamps

### 💰 Enhanced Nibia Withdrawal Management

#### Approve Withdrawal Request
**Endpoint:** `PUT /admin/withdrawals/{requestId}/approve`
**Description:** Approve a pending withdrawal request with admin verification
**Authentication:** Admin with password verification
**Request Body:**
```json
{
  "adminPassword": "your-admin-password",
  "adminNotes": "User verified, withdrawal approved for legitimate business expense"
}
```

**Response:**
```json
{
  "requestId": "64a1234567890abcdef12345",
  "status": "approved",
  "processedAt": "2024-02-01T15:30:00.000Z",
  "adminId": "64a9876543210fedcba54321",
  "adminNotes": "User verified, withdrawal approved for legitimate business expense"
}
```

#### Reject Withdrawal Request
**Endpoint:** `PUT /admin/withdrawals/{requestId}/reject`
**Description:** Reject a withdrawal request with detailed reasoning
**Request Body:**
```json
{
  "adminPassword": "your-admin-password",
  "rejectionReason": "Insufficient documentation provided",
  "adminNotes": "User needs to provide additional proof of business registration"
}
```

#### Bulk Process Withdrawals
**Endpoint:** `POST /admin/withdrawals/bulk-process`
**Description:** Process multiple withdrawal requests in a single operation
**Request Body:**
```json
{
  "adminPassword": "your-admin-password",
  "requests": [
    {
      "requestId": "64a1234567890abcdef12345",
      "action": "approve",
      "adminNotes": "Verified business expense"
    },
    {
      "requestId": "64a1234567890abcdef12346",
      "action": "reject",
      "rejectionReason": "Duplicate request"
    }
  ]
}
```

**Features:**
- **Security**: Admin password verification for all actions
- **Audit Trail**: Complete logging of admin decisions
- **Bulk Operations**: Process multiple requests efficiently
- **Detailed Reasoning**: Mandatory notes for all decisions
- **Email Notifications**: Users notified of approval/rejection (ready for integration)

### 🔄 Referral Commission Override System

#### Override Referral Commission
**Endpoint:** `POST /admin/referrals/{referralId}/override-commission`
**Description:** Apply bonus or penalty to referral commission
**Authentication:** Admin with password verification
**Request Body:**
```json
{
  "adminPassword": "your-admin-password",
  "referralId": "64a7b12c8f9e4d5a6b7c8901",
  "newCommissionAmount": 5000,
  "overrideType": "bonus",
  "reason": "Exceptional performance bonus for top referrer",
  "adminNotes": "User exceeded monthly target by 200%"
}
```

**Parameters:**
- `adminPassword`: Admin password for verification (required)
- `referralId`: ID of the referral to override (required)
- `newCommissionAmount`: New commission amount in Nibia (required)
- `overrideType`: "bonus", "penalty", or "adjustment" (required)
- `reason`: Required explanation for override (required)
- `adminNotes`: Additional admin notes (optional)

**Response:**
```json
{
  "success": true,
  "message": "Commission override applied successfully",
  "referral": {
    "id": "64a7b12c8f9e4d5a6b7c8901",
    "originalCommission": 3000,
    "newCommission": 5000,
    "overrideType": "bonus",
    "reason": "Exceptional performance bonus for top referrer",
    "adminNotes": "User exceeded monthly target by 200%",
    "processedAt": "2025-08-18T16:45:00.000Z",
    "processedBy": "64a9876543210fedcba54321"
  }
}
```

#### Get Commission Override History
**Endpoint:** `GET /admin/referrals/commission-history`
**Description:** View all commission override actions with filtering
**Query Parameters:**
```
?userId=64a123...&overrideType=bonus&dateFrom=2024-01-01&page=1&limit=20
```

**Response:**
```json
{
  "overrides": [
    {
      "referralId": "64a1234567890abcdef12345",
      "userId": "64a1234567890abcdef12346",
      "originalCommission": 5000,
      "adjustmentApplied": 1250,
      "newCommission": 6250,
      "overrideType": "bonus",
      "reason": "Exceptional performance bonus",
      "adminId": "64a9876543210fedcba54321",
      "processedAt": "2024-02-01T16:45:00.000Z"
    }
  ],
  "summary": {
    "totalOverrides": 45,
    "totalBonuses": 38,
    "totalPenalties": 7,
    "totalAdjustmentValue": 125000
  }
}
```

### 🎯 Advanced Profit Pool Management

#### Get Profit Pool Details
**Endpoint:** `GET /admin/profit-pools/{poolId}/details`
**Description:** View comprehensive profit pool information with distribution details
**Authentication:** Admin only

**Response:**
```json
{
  "poolId": "64a1234567890abcdef12345",
  "city": "Lagos",
  "month": "2024-02",
  "poolAmount": 50000,
  "totalDistributed": 45000,
  "status": "distributed",
  "distributionDetails": [
    {
      "userId": "64a1234567890abcdef12346",
      "amount": 7500,
      "distributedAt": "2024-02-01T12:00:00.000Z",
      "user": {
        "email": "ge1@example.com",
        "name": "John Doe",
        "city": "Lagos",
        "role": "GrowthElite"
      }
    }
  ],
  "calculatedMetrics": {
    "percentageDistributed": 90,
    "remainingAmount": 5000,
    "averageAmountPerRecipient": 7500
  },
  "createdAt": "2024-02-01T00:00:00.000Z"
}
```

#### Adjust Profit Pool
**Endpoint:** `PUT /admin/profit-pools/{poolId}/adjust`
**Description:** Increase, decrease, or redistribute profit pool amounts
**Request Body:**
```json
{
  "adminPassword": "your-admin-password",
  "adjustmentType": "increase",
  "adjustmentAmount": 10000,
  "reason": "Additional revenue from late orders included"
}
```

**Adjustment Types:**
- `increase`: Add funds to pool
- `decrease`: Remove funds from pool  
- `redistribute`: Reset and recalculate distributions

#### Redistribute Profit Pool
**Endpoint:** `POST /admin/profit-pools/{poolId}/redistribute`
**Description:** Reset pool distributions and prepare for redistribution
**Request Body:**
```json
{
  "adminPassword": "your-admin-password"
}
```

**Response:**
```json
{
  "poolId": "64a1234567890abcdef12345",
  "message": "Profit pool prepared for redistribution",
  "originalDistributedAmount": 45000,
  "originalRecipientsCount": 6,
  "resetAt": "2024-02-01T17:30:00.000Z"
}
```

#### Monthly Profit Pool Report
**Endpoint:** `GET /admin/profit-pools/monthly-report`
**Description:** Comprehensive monthly analytics with city breakdowns
**Query Parameters:**
```
?month=2024-02&city=Lagos&includeDetails=true
```

**Response:**
```json
{
  "month": "2024-02",
  "summary": {
    "totalPools": 5,
    "totalAmount": 250000,
    "totalDistributed": 225000,
    "totalRemaining": 25000,
    "completedPools": 4,
    "pendingPools": 1
  },
  "cityBreakdown": {
    "Lagos": {
      "totalAmount": 150000,
      "distributedAmount": 135000,
      "poolsCount": 3
    },
    "Abuja": {
      "totalAmount": 100000,
      "distributedAmount": 90000,
      "poolsCount": 2
    }
  },
  "pools": [
    // Detailed pool information if includeDetails=true
  ]
}
```

**Advanced Features:**
- **Comprehensive Analytics**: City-wise breakdowns and metrics
- **Distribution Tracking**: See exactly who received what amounts
- **Admin Controls**: Adjust, redistribute, and override pool calculations
- **Audit Trails**: Complete logging of all admin actions
- **Integration Ready**: Works seamlessly with existing profit pool service

---

### Update User (Admin)
**Endpoint:** `PATCH /users/admin/{userId}`
**Description:** Modify any user account details

### Update User Credit Score
**Endpoint:** `PATCH /users/admin/{userId}/credit-score`
**Description:** Adjust user credit score for Pay Later eligibility
**Request Body:**
```json
{
  "creditScore": 750,
  "reason": "Manual adjustment after verification"
}
```

### Delete User
**Endpoint:** `DELETE /users/admin/{userId}`
**Description:** Permanently delete user account
**Note:** Use with extreme caution - this action is irreversible

### Get User Statistics
**Endpoint:** `GET /users/admin/statistics`
**Description:** User registration and activity statistics

---

## 🚚 DELIVERY MODULE (Admin Endpoints)

### Create Delivery
**Endpoint:** `POST /delivery`
**Description:** Create delivery record for an order
**Request Body:**
```json
{
  "orderId": "64a1234567890abcdef12345",
  "deliveryAddress": "123 Main St, Lagos",
  "estimatedDeliveryTime": "2024-01-15T14:00:00.000Z",
  "deliveryFee": 500.00
}
```

### Assign Rider to Delivery
**Endpoint:** `POST /delivery/{id}/assign`
**Description:** Assign specific rider to delivery
**Request Body:**
```json
{
  "riderId": "64a1234567890abcdef12345",
  "notes": "Priority delivery - handle with care"
}
```

### Release Payment to Rider
**Endpoint:** `POST /delivery/{id}/release-payment`
**Description:** Release payment to rider for completed delivery
**Request Body:**
```json
{
  "amount": 1500.00,
  "bonusAmount": 200.00,
  "notes": "Excellent service, bonus included"
}
```

---

## 🏍️ RIDERS MODULE (Admin Endpoints)

### Get All Riders
**Endpoint:** `GET /riders/admin/all`
**Description:** List all registered riders

### Create Rider Account
**Endpoint:** `POST /riders/admin/create`
**Description:** Create new rider account

### Update Rider Status
**Endpoint:** `PATCH /riders/admin/{riderId}/status`
**Description:** Change rider status (active/inactive/suspended)

### Get Rider Statistics
**Endpoint:** `GET /riders/admin/{riderId}/stats`
**Description:** View rider performance statistics

### Delete Rider
**Endpoint:** `DELETE /riders/admin/{riderId}`
**Description:** Remove rider from system

---

## 🎫 SUPPORT MODULE (Admin Endpoints)

### Get All Support Tickets
**Endpoint:** `GET /support/admin/tickets`
**Description:** View all support tickets with filtering
**Query Parameters:**
- `status`: Filter by ticket status
- `priority`: Filter by priority level
- `category`: Filter by issue category
- `assignedTo`: Filter by assigned admin

### Update Support Ticket
**Endpoint:** `PATCH /support/admin/tickets/{id}`
**Description:** Update ticket status, priority, or assignment
**Request Body:**
```json
{
  "status": "in_progress",
  "priority": "high",
  "assignedTo": "64a1234567890abcdef12345",
  "adminNotes": "Escalated to technical team"
}
```

### Close Support Ticket
**Endpoint:** `POST /support/admin/tickets/{id}/close`
**Description:** Close support ticket with resolution
**Request Body:**
```json
{
  "message": "Issue resolved. User account reactivated and wallet restored."
}
```

### Get Support Analytics
**Endpoint:** `GET /support/admin/analytics`
**Description:** Support ticket statistics and trends

---

## 🔔 SUBSCRIPTIONS MODULE (Admin Endpoints)

### Cancel User Subscription
**Endpoint:** `DELETE /subscriptions/admin/{userId}/cancel`
**Description:** Cancel any user's subscription (admin override)

---

## 🤝 ENHANCED REFERRALS MODULE (Admin Endpoints)

### Growth Associates & Growth Elites Management

#### Get Growth Program Statistics
**Endpoint:** `GET /referrals/growth/stats`
**Description:** View comprehensive GA/GE program metrics and performance
**Authentication:** Admin JWT required
**Response includes:**
- Total GA/GE counts by city
- Commission totals and breakdowns  
- Performance metrics and trends
- Top performers and qualification pipeline

#### Promote User to Growth Associate
**Endpoint:** `POST /referrals/growth/promote-ga`
**Description:** Manually promote qualified user to GA status
**Requires:** Admin JWT + 2FA + Admin Password
```json
{
  "userId": "user_id_to_promote",
  "adminPassword": "your_admin_password", 
  "reason": "Manual promotion - exceptional performance"
}
```

#### Promote Growth Associate to Growth Elite
**Endpoint:** `POST /referrals/growth/promote-ge` 
**Description:** Promote GA to GE with city assignment
**Requires:** Admin JWT + 2FA + Admin Password
```json
{
  "userId": "ga_user_id_to_promote",
  "adminPassword": "your_admin_password",
  "city": "Lagos", 
  "reason": "Leadership excellence and qualification met"
}
```

#### Trigger System-Wide Qualification Check
**Endpoint:** `POST /referrals/growth/check-all-qualifications`
**Description:** Run automatic qualification check and promote eligible users
**Authentication:** Admin JWT required
**Response:** Summary of new promotions and qualification status

### Commission Management

#### Get User Commission Details  
**Endpoint:** `GET /referrals/admin/commissions/{userId}`
**Description:** View detailed commission history for any user
**Authentication:** Admin JWT required
**Includes:** Complete commission trail, performance metrics, earnings breakdown

#### Process All Pending Commissions
**Endpoint:** `POST /referrals/admin/process-pending-commissions`
**Description:** Batch process all pending commission payments
**Requires:** Admin JWT + 2FA + Admin Password
```json
{
  "adminPassword": "your_admin_password",
  "batchLimit": 100,    // Optional processing limit
  "dryRun": false       // Preview mode (true = no actual processing)
}
```

### Legacy Referral Management

### Get All Referrals
**Endpoint:** `GET /referrals/admin/all` 
**Description:** View all referral activities system-wide (legacy endpoint)

### Process Referral Payout
**Endpoint:** `POST /referrals/admin/{referralId}/payout`
**Description:** Manually process referral commission payout (legacy endpoint)

---

## 🔐 Admin Testing Workflow

### 1. Authentication Setup
```bash
# Login as admin
POST /auth/login
{
  "email": "admin@forage.com",
  "password": "your-admin-password"
}

# Copy the JWT token from response
# Use in all subsequent requests as: Authorization: Bearer <token>
```

### 2. System Overview Dashboard
```bash
# Get user statistics
GET /users/admin/statistics

# Get wallet statistics  
GET /wallets/admin/stats

# Get order analytics
GET /orders/analytics

# Get support ticket count
GET /support/admin/analytics
```

### 3. User Management Tasks
```bash
# View all users
GET /users/admin/all?page=1&limit=20

# Create new user
POST /users/admin/create

# Update user role
PATCH /users/admin/{userId}

# Fund user wallet
POST /admin/wallets/fund
```

### 4. Content Management
```bash
# Manage categories
GET /admin/categories
POST /admin/categories

# Manage products
GET /products/admin/seller/{sellerId}
PATCH /products/admin/{id}/status

# Manage auctions
POST /auctions
POST /auctions/{id}/finalize
```

### 5. Support & Monitoring
```bash
# Review support tickets
GET /support/admin/tickets

# Monitor deliveries
GET /delivery?page=1&limit=50

# Check system health
GET /wallets/admin/stats
GET /orders/analytics
```

---

## ⚠️ Admin Security Best Practices

### Authentication
- Always verify admin JWT token is valid
- Use strong, unique passwords for admin accounts
- Regularly rotate admin passwords
- Monitor admin activity logs

### Authorization
- Verify admin role before accessing any admin endpoint
- Some endpoints require additional password verification
- Log all admin actions for audit trail
- Use principle of least privilege

### Data Protection
- Be extremely careful with destructive operations (delete, wipe)
- Always include reason/notes for admin actions
- Backup data before bulk operations
- Verify user consent for sensitive operations

### Monitoring
- Monitor admin endpoint usage
- Set up alerts for unusual admin activity
- Regular security audits of admin accounts
- Track admin action success/failure rates

---

## 🚀 Real-World Testing Scenarios

Here are some complete workflows you can test:

### 🛒 **Scenario 1: Complete Shopping Experience**
1. **Browse products:** `GET /products`
2. **Register/Login:** `POST /auth/register` or `POST /auth/login`
3. **Create wallet:** `POST /wallets/create`
4. **Place order:** `POST /orders/checkout`
5. **Track order:** `GET /orders/{orderId}`
6. **Rate order:** `POST /orders/{orderId}/rate`

### 🏪 **Scenario 2: Store Owner Experience**
1. **Register as business:** `POST /auth/register` (accountType: "business")
2. **Create store:** `POST /stores`
3. **Add products:** `POST /products`
4. **View incoming orders:** `GET /orders/store-orders`
5. **Update order status:** `PATCH /orders/{orderId}/status`

### 🤝 **Scenario 3: Social Shopping**
1. **User A creates order:** `POST /orders/checkout`
2. **User B transfers money to User A:** `POST /wallets/transfer`
3. **Both users rate the experience:** `POST /orders/{orderId}/rate`

### 🎯 **Scenario 4: Auction Participation**
1. **Browse auctions:** `GET /auctions`
2. **Place bid:** `POST /auctions/{auctionId}/bid`
3. **Check if you won:** `GET /auctions/user/won`
4. **If won, create order for the item**

### 🚀 **Scenario 5: Growth Associates (GA) & Growth Elites (GE) Journey**
**Complete workflow for testing the enhanced referral system:**

#### Phase 1: Starting as Regular User
1. **Register with referral:** `POST /auth/register` (include referralCode)
2. **Check initial qualification:** `GET /referrals/growth/qualification`
3. **View commission history:** `GET /referrals/commissions` (should be empty initially)

#### Phase 2: Building Referral Network  
1. **Generate referral code:** Share your user ID or referral code
2. **Get friends to register:** Have 5+ people register with your referral code
3. **Create orders:** Generate ₦500,000+ in referral-linked orders
4. **Check qualification progress:** `GET /referrals/growth/qualification`

#### Phase 3: Growth Associate Promotion
1. **Automatic qualification:** System checks daily at 2 AM (or admin triggers)
2. **Manual check:** Admin can run `POST /referrals/growth/check-all-qualifications`
3. **Verify GA status:** `GET /referrals/growth/qualification` (role should be "ga")
4. **Enhanced commissions:** Start earning 7% instead of 5% on referrals

#### Phase 4: Growth Elite Qualification  
1. **Expand network:** Reach 20+ direct referrals
2. **Increase volume:** Generate ₦2,000,000+ in total referral revenue
3. **Time requirement:** Maintain GA status for 3+ months
4. **GE promotion:** Admin promotes with city assignment `POST /referrals/growth/promote-ge`

#### Phase 5: Growth Elite Benefits
1. **Premium commissions:** Earn 10% on direct referrals
2. **City revenue sharing:** Get 5% of total city revenue monthly  
3. **Leadership dashboard:** Access `GET /referrals/growth/stats` for city metrics
4. **Commission tracking:** Monitor all earnings via `GET /referrals/commissions/stats`

#### Admin Management Flow:
1. **Monitor growth program:** `GET /referrals/growth/stats`
2. **Review qualifications:** Check user progress and promote manually if needed
3. **Process commissions:** `POST /referrals/admin/process-pending-commissions`
4. **Audit user performance:** `GET /referrals/admin/commissions/{userId}`

**Testing Tips:**
- Use the provided test script: `node test-enhanced-referrals.js`
- Create multiple test users to simulate referral networks
- Test both automatic and manual promotion workflows
- Verify commission calculations at each tier (5%, 7%, 10%)
- Test city revenue sharing for GE users

### 💰 **Scenario 6: Nibia Withdrawal System (GA/GE Users)**
**Complete workflow for testing withdrawal functionality:**

#### Phase 1: Prerequisites Setup
1. **Ensure GA/GE status:** User must be Growth Associate or Growth Elite
2. **Check withdrawal enabled:** `GET /wallets/my-wallet` (nibiaWithdrawEnabled: true)
3. **Verify Nibia balance:** Ensure sufficient foodPoints for withdrawal
4. **Admin setup:** Have admin credentials ready for processing

#### Phase 2: User Withdrawal Request
1. **Create withdrawal request:**
   ```bash
   POST /wallets/withdrawals/request
   {
     "nibiaAmount": 1000,
     "userReason": "Emergency cash needed"
   }
   ```

2. **Check request status:**
   ```bash
   GET /wallets/withdrawals/my-requests
   # Should show pending request with priority based on user tier
   ```

3. **Get request details:**
   ```bash
   GET /wallets/withdrawals/{requestId}
   # Should show full request information
   ```

#### Phase 3: Admin Processing Workflow
1. **Review pending requests:**
   ```bash
   GET /wallets/withdrawals/admin/all?status=pending
   # GE requests appear first (priority 2), then GA (priority 1)
   ```

2. **Check system statistics:**
   ```bash
   GET /wallets/withdrawals/admin/stats
   # Shows pending amounts, processing times, etc.
   ```

3. **Process withdrawal request:**
   ```bash
   PATCH /wallets/withdrawals/admin/{requestId}/process
   {
     "action": "approved",
     "adminNotes": "User verified, withdrawal approved",
     "adminPassword": "your_admin_password"
   }
   ```

#### Phase 4: Verification & Testing
1. **Verify wallet updates:**
   ```bash
   GET /wallets/my-wallet
   # Should show reduced Nibia, increased NGN (1:1 rate)
   ```

2. **Check transaction reference:**
   ```bash
   GET /wallets/withdrawals/{requestId}
   # Should show transactionRef and completed status
   ```

3. **Admin monitoring:**
   ```bash
   GET /wallets/withdrawals/admin/stats
   # Should show updated statistics
   ```

#### Phase 5: Error Testing
1. **Test insufficient balance:**
   ```bash
   POST /wallets/withdrawals/request
   { "nibiaAmount": 999999 }
   # Expected: 400 - Insufficient balance
   ```

2. **Test exceeded limits:**
   ```bash
   POST /wallets/withdrawals/request
   { "nibiaAmount": 150000 }
   # Expected: 400 - Exceeds 100k per request limit
   ```

3. **Test regular user access:**
   ```bash
   # Use regular user token
   POST /wallets/withdrawals/request
   # Expected: 403 - Only GA/GE can withdraw
   ```

4. **Test admin password:**
   ```bash
   # Use wrong admin password
   PATCH /wallets/withdrawals/admin/{requestId}/process
   # Expected: 401 - Invalid admin password
   ```

#### Integration Testing:
1. **Promotion → Withdrawal enabled:** Verify new GA/GE users can withdraw
2. **Commission → Withdrawal:** Test withdrawing earned commission Nibia
3. **Daily/Monthly limits:** Test multiple withdrawals within limits
4. **Priority processing:** Verify GE requests processed before GA requests

**Testing Scripts:**
- Use: `node test-nibia-withdrawal.js` (comprehensive test suite)
- Configure real JWT tokens for GA, GE, and admin users
- Test with actual Nibia balances and admin credentials

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

### 🎯 9. Enhanced Referral System with Growth Associates (GA) & Growth Elites (GE)

#### 📊 User Commission Endpoints

#### Get My Commissions
**Endpoint:** `GET /referrals/commissions`
**Description:** Get your personal commission history and earnings
**Authentication:** Required (User JWT)
```json
// Response includes:
{
  "commissions": [
    {
      "id": "commission_id",
      "type": "REFERRAL_COMMISSION",
      "amount": 1000,
      "currency": "FoodMoney",
      "status": "PROCESSED",
      "userId": "your_user_id",
      "orderId": "related_order_id",
      "createdAt": "2025-08-17T10:00:00.000Z"
    }
  ],
  "stats": {
    "totalEarned": 15000,
    "totalPending": 2500,
    "totalProcessed": 12500,
    "thisMonth": 3000
  }
}
```

#### Get Commission Statistics  
**Endpoint:** `GET /referrals/commissions/stats`
**Description:** Get detailed commission statistics and breakdowns
**Authentication:** Required (User JWT)
```json
// Response includes commission breakdown by type, period, currency
{
  "totalCommissions": 25000,
  "byType": {
    "REFERRAL_COMMISSION": 20000,
    "GA_COMMISSION": 3000,
    "GE_CITY_REVENUE": 2000
  },
  "byPeriod": {
    "thisWeek": 1500,
    "thisMonth": 5000,
    "thisYear": 25000
  }
}
```

#### 🚀 Growth Management Endpoints

#### Check Growth Qualification
**Endpoint:** `GET /referrals/growth/qualification`
**Description:** Check your qualification status for Growth Associate (GA) or Growth Elite (GE)
**Authentication:** Required (User JWT)
```json
// Response shows qualification progress:
{
  "currentRole": "user", // or "ga" or "ge"
  "gaQualification": {
    "qualified": false,
    "requirements": {
      "directReferrals": { "current": 3, "required": 5, "met": false },
      "totalGenerated": { "current": 300000, "required": 500000, "met": false }
    }
  },
  "geQualification": {
    "qualified": false,
    "requirements": {
      "directReferrals": { "current": 3, "required": 20, "met": false },
      "totalGenerated": { "current": 300000, "required": 2000000, "met": false },
      "gaForMonths": { "current": 0, "required": 3, "met": false }
    }
  }
}
```

#### 👑 Admin Growth Management Endpoints

#### Get Growth Statistics (Admin Only)
**Endpoint:** `GET /referrals/growth/stats`
**Description:** Get system-wide growth statistics for GA/GE program
**Authentication:** Required (Admin JWT)
```json
// Response includes GA/GE counts and performance metrics
{
  "totalUsers": 1500,
  "growthAssociates": 45,
  "growthElites": 12,
  "totalCommissionsPaid": 500000,
  "cityBreakdown": {
    "Lagos": { "gas": 20, "ges": 5 },
    "Abuja": { "gas": 15, "ges": 4 }
  }
}
```

#### Promote User to GA (Admin Only)
**Endpoint:** `POST /referrals/growth/promote-ga`
**Description:** Manually promote a user to Growth Associate
**Authentication:** Required (Admin JWT + 2FA)
```json
{
  "userId": "USER_ID_TO_PROMOTE",
  "adminPassword": "your_admin_password",
  "reason": "Manual promotion - met all requirements"
}
```

#### Promote User to GE (Admin Only)  
**Endpoint:** `POST /referrals/growth/promote-ge`
**Description:** Manually promote a Growth Associate to Growth Elite
**Authentication:** Required (Admin JWT + 2FA)
```json
{
  "userId": "GA_USER_ID_TO_PROMOTE", 
  "adminPassword": "your_admin_password",
  "city": "Lagos",
  "reason": "Exceptional performance and leadership"
}
```

#### Check All User Qualifications (Admin Only)
**Endpoint:** `POST /referrals/growth/check-all-qualifications`
**Description:** Trigger system-wide qualification check and automatic promotions
**Authentication:** Required (Admin JWT)
```json
// Response shows promotion results:
{
  "newGAs": 5,
  "newGEs": 2, 
  "promotedUsers": [
    { "userId": "123", "newRole": "ga", "previousRole": "user" },
    { "userId": "456", "newRole": "ge", "previousRole": "ga" }
  ],
  "processedAt": "2025-08-17T10:30:00.000Z"
}
```

#### 💰 Admin Commission Management

#### Get User Commissions (Admin Only)
**Endpoint:** `GET /referrals/admin/commissions/{userId}`
**Description:** Get detailed commission history for any user
**Authentication:** Required (Admin JWT)
```json
// Response includes full commission history with metadata
{
  "user": {
    "id": "user_id", 
    "name": "John Doe",
    "role": "ga"
  },
  "commissions": [...], // Full commission history
  "stats": {
    "totalEarned": 50000,
    "avgMonthly": 5000,
    "topPerformingMonth": "2025-07"
  }
}
```

#### Process Pending Commissions (Admin Only)
**Endpoint:** `POST /referrals/admin/process-pending-commissions`
**Description:** Process all pending commissions system-wide
**Authentication:** Required (Admin JWT + 2FA)
```json
{
  "adminPassword": "your_admin_password",
  "batchLimit": 100, // Optional: limit processing batch size
  "dryRun": false    // Optional: set true to preview without processing
}
// Response shows processing results:
{
  "processedCount": 45,
  "totalAmount": 125000,
  "errors": [],
  "processedAt": "2025-08-17T11:00:00.000Z"
}
```

#### 🎯 Legacy Referral Endpoints (Still Active)

#### Create Referral
**Endpoint:** `POST /referrals`
**Description:** Create a new referral relationship (auto-created during user registration)
```json
{
  "referrerId": "REFERRING_USER_ID",
  "referredUserId": "NEW_USER_ID", 
  "type": "USER_REGISTRATION"
}
```

#### Get All Referrals (Admin)
**Endpoint:** `GET /referrals`
**Description:** View all referral relationships system-wide
**Filter:** `?status=ACTIVE&page=1&limit=10`

#### View My Referrals
**Endpoint:** `GET /referrals/my-referrals`
**Description:** Get your referral network and earnings

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

### ⏰ 13. Scheduled Jobs Management (Admin Only)

The scheduled jobs system provides automated backend processes for GA/GE management, profit pool distribution, and user notifications. These jobs run automatically based on cron schedules, but can also be triggered manually by administrators.

#### View Scheduled Jobs Status
**Endpoint:** `GET /scheduled-jobs/status`
**Authentication:** Admin only
**What:** View status and schedules of all automated jobs

**Response includes:**
- Job names and descriptions
- Cron schedule expressions  
- Next execution times
- Current status (active/inactive)

#### Manual GA/GE Qualification Check
**Endpoint:** `POST /scheduled-jobs/manual/qualification-check`
**Authentication:** Admin only
**What:** Manually trigger the nightly GA/GE qualification and promotion process

**This job:**
- Evaluates all users for GA/GE qualification
- Promotes eligible users based on referral performance
- Demotes users who no longer meet requirements
- Respects city capacity limits
- Updates user roles and Nibia withdrawal permissions
- Sends notifications to affected users

#### Manual Profit Pool Distribution
**Endpoint:** `POST /scheduled-jobs/manual/profit-distribution`
**Authentication:** Admin only
**What:** Manually trigger the monthly profit pool distribution

**This job:**
- Calculates monthly profit pools per city
- Distributes 1% of city revenue to Growth Elites
- Creates profit pool records
- Distributes Nibia credits to GE wallets
- Generates distribution reports

#### Manual Daily GA/GE Notifications
**Endpoint:** `POST /scheduled-jobs/manual/daily-notifications`
**Authentication:** Admin only
**What:** Manually trigger daily notifications for GA/GE users

**This job:**
- Sends personalized updates to all GA/GE users
- Includes recent referral activity
- Shows pending withdrawal status
- Displays weekly commission earnings
- Provides role-specific insights

#### View City Capacity Limits
**Endpoint:** `GET /scheduled-jobs/city-caps`
**Authentication:** Admin only
**What:** View GA/GE capacity limits and current counts per city

**Shows:**
- Maximum GA slots per city
- Maximum GE slots per city
- Current GA/GE counts
- Available promotion slots

### 🎧 14. Support System (Complete)

#### Create Support Ticket
**Endpoint:** `POST /support/tickets`
```json
{
  "subject": "Payment Issue",
  "message": "Unable to process payment for order #12345",
  "category": "PAYMENT",
  "priority": "HIGH",
  "attachments": ["https://example.com/screenshot.jpg"],
  "metadata": {"orderId": "12345"}
}
```

**Field Explanations:**
- `subject`: Ticket title/subject (required, max 100 chars)
- `message`: Detailed description of the issue (required)
- `category`: Issue category (required) - check entity for valid values
- `priority`: Priority level (optional) - check entity for valid values
- `attachments`: Array of attachment URLs (optional)
- `metadata`: Additional data (optional)

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

## 🏛️ **Complete Admin-Only Features Testing Guide**

As an admin, you have access to powerful management tools across all aspects of the platform. This comprehensive section covers **ALL** admin-only endpoints for thorough testing.

### 🔑 **Admin Authentication Setup**

Before testing admin features, create an admin account:

**Endpoint:** `POST /auth/register`
```json
{
  "name": "Admin Tester",
  "email": "admin@forage.com",
  "phone": "+2348000000000", 
  "password": "AdminSecure123!",
  "city": "Lagos",
  "role": "ADMIN"
}
```

Then login to get your admin JWT token.

---

### 👥 **User Management (Admin)**

#### Get All Users with Advanced Filtering
**Endpoint:** `GET /admin/users`
**Query Parameters:**
- `page`: Page number for pagination
- `limit`: Items per page
- `role`: Filter by user role (USER, GROWTH_ASSOCIATE, GROWTH_ELITE, ADMIN, RIDER)
- `city`: Filter by city
- `isVerified`: Filter by verification status
- `createdFrom`: Start date filter
- `createdTo`: End date filter

**Test Examples:**
```
GET /admin/users?role=GROWTH_ELITE&city=Lagos&page=1&limit=10
GET /admin/users?isVerified=true&createdFrom=2025-01-01
```

#### Get Specific User Details
**Endpoint:** `GET /admin/users/{userId}`
**What:** View complete user profile, verification status, activity history
**Test:** Use various user IDs to check different user types

#### Get Growth Users by City (Enhanced GA/GE Management)
**Endpoint:** `GET /admin/growth-users/{city}`
**Query Parameters:**
- `role`: GROWTH_ASSOCIATE or GROWTH_ELITE
- `sortBy`: referralCount, totalSpending, lastActive
- `order`: asc or desc
- `dateFrom`: Start date for activity filter
- `dateTo`: End date for activity filter

**Test Examples:**
```
GET /admin/growth-users/Lagos?role=GROWTH_ELITE&sortBy=totalSpending&order=desc
GET /admin/growth-users/Abuja?sortBy=referralCount&dateFrom=2025-01-01
```

#### Get Detailed Growth User Statistics
**Endpoint:** `GET /admin/growth-users/{userId}/detailed-stats`
**What:** Comprehensive analytics for specific GA/GE users
- Referral performance metrics
- Commission earnings breakdown
- Monthly activity trends
- Withdrawal history
- Rank progression history

---

### 💰 **Wallet Management (Admin)**

#### View All Wallets with Filtering
**Endpoint:** `GET /admin/wallets`
**Query Parameters:**
- `hasBalance`: Filter wallets with/without balance
- `currency`: Filter by currency (NGN, USD, NIBIA)
- `canWithdrawNibia`: Filter by Nibia withdrawal capability
- `minBalance`: Minimum balance filter
- `maxBalance`: Maximum balance filter

**Test Examples:**
```
GET /admin/wallets?canWithdrawNibia=true&minBalance=1000
GET /admin/wallets?currency=NIBIA&hasBalance=true
```

#### Get Wallet by ID
**Endpoint:** `GET /admin/wallets/{walletId}`
**What:** View complete wallet details, transaction history, locks

#### Get User's Wallet
**Endpoint:** `GET /admin/users/{userId}/wallet`
**What:** Direct access to any user's wallet information

#### Fund User Wallet (Admin Password Required)
**Endpoint:** `POST /admin/wallets/fund`
```json
{
  "userId": "USER_ID_HERE",
  "amount": 10000,
  "currency": "NGN",
  "description": "Admin funding for testing",
  "reference": "ADMIN_FUND_001",
  "adminPassword": "your_admin_password"
}
```
**Test Scenarios:**
- Fund with different currencies (NGN, USD, NIBIA)
- Test with insufficient admin password
- Fund wallets for GA/GE users vs regular users

#### Wipe User Wallet (Admin Password Required)
**Endpoint:** `POST /admin/wallets/wipe`
```json
{
  "userId": "USER_ID_HERE",
  "reason": "Testing wallet reset functionality",
  "adminPassword": "your_admin_password"
}
```
**⚠️ Warning:** This removes ALL funds from the user's wallet

---

### 📊 **Analytics & Reporting (Admin)**

#### Orders Analytics
**Endpoint:** `GET /admin/analytics/orders`
**Query Parameters:**
- `startDate`: Start date for analytics period
- `endDate`: End date for analytics period
- `city`: Filter by city
- `status`: Filter by order status
- `groupBy`: Group results (daily, weekly, monthly)

**Test Examples:**
```
GET /admin/analytics/orders?startDate=2025-01-01&endDate=2025-01-31&city=Lagos
GET /admin/analytics/orders?groupBy=weekly&status=completed
```

#### Subscriptions Analytics
**Endpoint:** `GET /admin/analytics/subscriptions`
**Query Parameters:**
- `startDate`: Analytics period start
- `endDate`: Analytics period end
- `planType`: Filter by subscription plan
- `status`: Active, cancelled, expired
- `city`: City-wise breakdown

#### Commission Analytics
**Endpoint:** `GET /admin/analytics/commissions`
**Query Parameters:**
- `startDate`: Period start
- `endDate`: Period end
- `userRole`: GROWTH_ASSOCIATE, GROWTH_ELITE
- `city`: City filter
- `commissionType`: REFERRAL, BONUS, OVERRIDE

**Test Examples:**
```
GET /admin/analytics/commissions?userRole=GROWTH_ELITE&city=Lagos
GET /admin/analytics/commissions?commissionType=OVERRIDE&startDate=2025-01-01
```

---

### 🏷️ **Category Management (Admin)**

#### Get All Categories
**Endpoint:** `GET /admin/categories`
**What:** View all product categories with stats

#### Get Category by ID
**Endpoint:** `GET /admin/categories/{categoryId}`
**What:** View specific category details and associated products

#### Create New Category
**Endpoint:** `POST /admin/categories`
```json
{
  "name": "Admin Test Category",
  "description": "Category created for testing admin functions",
  "icon": "test-icon",
  "isActive": true,
  "sortOrder": 10
}
```

#### Update Category
**Endpoint:** `PATCH /admin/categories/{categoryId}`
```json
{
  "name": "Updated Category Name",
  "description": "Updated description",
  "isActive": false
}
```

#### Delete Category
**Endpoint:** `DELETE /admin/categories/{categoryId}`
**Test:** Try deleting categories with/without associated products

---

### 🛍️ **Product Management (Admin)**

#### Get Product Price History
**Endpoint:** `GET /admin/products/{productId}/price-history`
**What:** View all price changes for a product with timestamps

#### Record Price History
**Endpoint:** `POST /admin/products/price-history`
```json
{
  "productId": "PRODUCT_ID_HERE",
  "oldPrice": 1500,
  "newPrice": 1800,
  "priceInNibia": 60,
  "reason": "Market price adjustment",
  "effectiveDate": "2025-01-15T00:00:00Z"
}
```

---

### 💳 **Withdrawal Management (Admin)**

#### View Pending Withdrawals
**Endpoint:** `GET /admin/withdrawals/pending`
**Query Parameters:**
- `priority`: HIGH, MEDIUM, LOW (based on user role)
- `city`: Filter by user city
- `minAmount`: Minimum withdrawal amount
- `maxAmount`: Maximum withdrawal amount
- `dateFrom`: Submitted from date
- `dateTo`: Submitted to date

**Test Examples:**
```
GET /admin/withdrawals/pending?priority=HIGH&city=Lagos
GET /admin/withdrawals/pending?minAmount=50000&dateFrom=2025-01-01
```

#### Approve/Reject Withdrawal
**Endpoint:** `PATCH /admin/withdrawals/{withdrawalId}/decision`
```json
{
  "decision": "APPROVE",
  "adminPassword": "your_admin_password",
  "adminNotes": "Withdrawal approved after verification",
  "processedAmount": 50000
}
```
**Test Both:**
- `decision`: "APPROVE" or "REJECT"
- Test with correct/incorrect admin password

#### Bulk Process Withdrawals
**Endpoint:** `POST /admin/withdrawals/bulk-process`
```json
{
  "withdrawalIds": ["id1", "id2", "id3"],
  "decision": "APPROVE",
  "adminPassword": "your_admin_password",
  "adminNotes": "Bulk approval after batch verification"
}
```

---

### 💰 **Commission Override System (Admin)**

#### Override Referral Commission
**Endpoint:** `POST /admin/commissions/override`
```json
{
  "referralId": "REFERRAL_ID_HERE",
  "overrideType": "BONUS",
  "adjustmentType": "PERCENTAGE",
  "adjustmentValue": 25,
  "reason": "Exceptional performance bonus",
  "adminPassword": "your_admin_password"
}
```
**Test Scenarios:**
- `overrideType`: BONUS, PENALTY, CORRECTION
- `adjustmentType`: PERCENTAGE, FIXED_AMOUNT
- Different adjustment values
- Various reasons and admin notes

#### Get Commission Override History
**Endpoint:** `GET /admin/commissions/override-history`
**Query Parameters:**
- `overrideType`: BONUS, PENALTY, CORRECTION
- `adjustmentType`: PERCENTAGE, FIXED_AMOUNT
- `adminId`: Filter by admin who made override
- `startDate`: Override date range start
- `endDate`: Override date range end
- `minAdjustment`: Minimum adjustment value
- `maxAdjustment`: Maximum adjustment value

#### Get Specific Referral Commission History
**Endpoint:** `GET /admin/commissions/{referralId}/history`
**What:** Complete commission history for a specific referral including all overrides

---

### 🏦 **Profit Pool Management (Admin)**

#### Get All Profit Pools
**Endpoint:** `GET /admin/profit-pools`
**Query Parameters:**
- `city`: Filter by city
- `status`: PENDING, DISTRIBUTED, FAILED
- `month`: Filter by specific month (YYYY-MM format)
- `year`: Filter by year
- `hasDistributions`: Pools with/without distributions

**Test Examples:**
```
GET /admin/profit-pools?city=Lagos&status=DISTRIBUTED&year=2025
GET /admin/profit-pools?month=2025-01&hasDistributions=true
```

#### Get Profit Pool Details
**Endpoint:** `GET /admin/profit-pools/{poolId}`
**What:** Complete pool information including:
- Revenue calculation breakdown
- Growth Elite beneficiaries list
- Distribution amounts per user
- Transaction references
- Admin action history

#### Adjust Profit Pool
**Endpoint:** `POST /admin/profit-pools/{poolId}/adjust`
```json
{
  "adjustmentType": "INCREASE",
  "adjustmentAmount": 50000,
  "reason": "Additional revenue discovered for the month",
  "adminPassword": "your_admin_password"
}
```
**Test Options:**
- `adjustmentType`: INCREASE, DECREASE
- Various adjustment amounts
- Different reasons

#### Generate Monthly Profit Pool Report
**Endpoint:** `GET /admin/profit-pools/reports/monthly`
**Query Parameters:**
- `month`: Specific month (YYYY-MM)
- `year`: Specific year
- `city`: City-specific report
- `includeProjections`: Include next month projections

**Test Examples:**
```
GET /admin/profit-pools/reports/monthly?month=2025-01&city=Lagos
GET /admin/profit-pools/reports/monthly?year=2025&includeProjections=true
```

#### Force Profit Pool Redistribution
**Endpoint:** `POST /admin/profit-pools/{poolId}/redistribute`
```json
{
  "adminPassword": "your_admin_password"
}
```
**⚠️ Warning:** This recalculates and redistributes the entire pool

---

### 🚚 **Delivery Management (Admin)**

#### Create Delivery Assignment
**Endpoint:** `POST /delivery`
**Admin Only:** Assign any order to any rider
```json
{
  "orderId": "ORDER_ID_HERE",
  "riderId": "RIDER_ID_HERE",
  "pickupAddress": "Store pickup location",
  "deliveryAddress": "Customer delivery address",
  "estimatedDeliveryTime": "2025-01-15T18:00:00Z",
  "deliveryFee": 1500
}
```

#### Get All Deliveries (Admin View)
**Endpoint:** `GET /delivery`
**Admin Benefits:**
- See all deliveries across all cities
- Access to all rider assignments
- View delivery statistics and performance

#### Assign Rider to Delivery
**Endpoint:** `PATCH /delivery/{deliveryId}/assign-rider`
```json
{
  "riderId": "RIDER_ID_HERE",
  "estimatedDeliveryTime": "2025-01-15T18:00:00Z"
}
```

#### Release Delivery Payment
**Endpoint:** `POST /delivery/{deliveryId}/release-payment`
**Admin Only:** Release payment to rider after delivery completion
```json
{
  "adminPassword": "your_admin_password",
  "releaseAmount": 1500,
  "adminNotes": "Payment released after successful delivery"
}
```

---

### 🏍️ **Rider Management (Admin)**

#### Get All Riders
**Endpoint:** `GET /riders`
**Admin View:** Access to all riders regardless of city
**Query Parameters:**
- `city`: Filter by rider city
- `isVerified`: Filter by verification status
- `hasDeposit`: Filter by security deposit status
- `status`: ACTIVE, INACTIVE, SUSPENDED

#### Verify Rider Documents
**Endpoint:** `PATCH /riders/{riderId}/verify`
```json
{
  "documentType": "LICENSE",
  "verificationStatus": "APPROVED",
  "adminNotes": "Documents verified successfully",
  "adminPassword": "your_admin_password"
}
```
**Document Types:** LICENSE, INSURANCE, IDENTITY, VEHICLE_REGISTRATION

#### Update Rider Security Deposit
**Endpoint:** `PATCH /riders/{riderId}/deposit`
```json
{
  "depositAmount": 50000,
  "depositStatus": "PAID",
  "adminNotes": "Security deposit confirmed",
  "adminPassword": "your_admin_password"
}
```

#### Suspend/Activate Rider
**Endpoint:** `PATCH /riders/{riderId}/status`
```json
{
  "status": "SUSPENDED",
  "reason": "Multiple delivery delays",
  "adminPassword": "your_admin_password"
}
```

---

### 🏺 **Auction Management (Admin)**

#### Create Auction
**Endpoint:** `POST /auctions`
```json
{
  "productId": "PRODUCT_ID_HERE",
  "startingBid": 5000,
  "reservePrice": 8000,
  "auctionDuration": 24,
  "description": "Admin created auction for testing",
  "images": ["auction-image-url.jpg"]
}
```

#### Update Auction
**Endpoint:** `PATCH /auctions/{auctionId}`
```json
{
  "reservePrice": 9000,
  "description": "Updated auction description",
  "endTime": "2025-01-20T18:00:00Z"
}
```

#### Cancel Auction
**Endpoint:** `DELETE /auctions/{auctionId}/cancel`
```json
{
  "reason": "Auction cancelled due to product unavailability",
  "adminPassword": "your_admin_password"
}
```

#### Finalize Auction
**Endpoint:** `POST /auctions/{auctionId}/finalize`
```json
{
  "winningBidId": "BID_ID_HERE",
  "adminNotes": "Auction finalized, payment processed",
  "adminPassword": "your_admin_password"
}
```

---

### 📧 **Notifications Management (Admin)**

#### Send Email Notification
**Endpoint:** `POST /notifications/email`
```json
{
  "recipientEmail": "user@example.com",
  "type": "MARKETING",
  "title": "Special Offer",
  "message": "Limited time offer on your favorite products!",
  "metadata": {
    "campaign": "admin_test",
    "priority": "HIGH"
  }
}
```

#### Send Push Notification  
**Endpoint:** `POST /notifications/push`
```json
{
  "deviceToken": "user_device_token_here",
  "type": "ORDER_UPDATE", 
  "title": "Order Update",
  "message": "Your order is ready for pickup",
  "data": {
    "orderId": "ORDER_ID",
    "action": "pickup_ready"
  }
}
```

#### Send WhatsApp Message
**Endpoint:** `POST /notifications/whatsapp`
```json
{
  "phoneNumber": "+2348123456789",
  "message": "Your order #12345 is ready for delivery",
  "type": "ORDER_UPDATE",
  "metadata": {
    "orderId": "ORDER_ID",
    "priority": "NORMAL"
  }
}
```

#### Notify Order Status Update
**Endpoint:** `POST /notifications/order/{orderId}/status-update`
```json
{
  "userId": "USER_ID",
  "status": "SHIPPED",
  "additionalInfo": {
    "trackingNumber": "TRK123456",
    "estimatedDelivery": "2025-01-20T16:00:00Z"
  }
}
```

#### Notify Late Payment
**Endpoint:** `POST /notifications/payment/{subscriptionId}/late`
```json
{
  "userId": "USER_ID",
  "daysLate": 5,
  "amountDue": 2000,
  "currency": "NGN"
}
```

#### Notify Rider Assignment
**Endpoint:** `POST /notifications/rider/{riderId}/assignment`
```json
{
  "orderId": "ORDER_ID",
  "expiryTime": "2025-01-20T16:00:00Z",
  "deliveryDetails": {
    "pickupAddress": "Store Address",
    "deliveryAddress": "Customer Address",
    "customerPhone": "+2348123456789"
  }
}
```

---

## 🧪 **Admin Testing Workflows**

### **Complete Admin Onboarding Test**
1. **Authentication Setup:**
   - Create admin account → Login → Verify admin JWT token
   - Test admin role validation on protected endpoints
   - Verify admin password requirement for sensitive operations

2. **User & Growth Management:**
   - Test all user management endpoints with filtering
   - Review GA/GE users by city with detailed statistics
   - Test user role updates and verification status changes

3. **Financial Operations:**
   - Test wallet funding and management across currencies
   - Process withdrawal requests (individual and bulk)
   - Test commission override system (bonus/penalty)
   - Review analytics across different date ranges

4. **Content & Product Management:**
   - Test category and product management (CRUD operations)
   - Record product price changes with admin notes
   - Review price history and audit trails

5. **Operational Management:**
   - Test delivery creation and rider assignment
   - Process auction creation and finalization
   - Send various types of notifications to users
   - Manage support tickets and analytics

### **GA/GE Advanced Management Workflow**
1. **User Analysis & Promotion:**
   - View growth users by city with performance sorting
   - Check detailed user statistics and qualification metrics
   - Review referral performance and commission earnings

2. **Financial Control:**
   - Process GA/GE withdrawal requests with priority handling
   - Override commissions with bonus/penalty adjustments
   - Review commission history and override audit trails

3. **Profit Pool Administration:**
   - Review monthly profit pool distributions by city
   - Adjust pool amounts and force redistributions
   - Generate comprehensive monthly reports

4. **Scheduled Jobs Monitoring:**
   - Review scheduled job execution status
   - Manually trigger GA/GE qualification checks
   - Monitor daily notification delivery and engagement

### **Financial Operations Complete Workflow**
1. **Wallet Management:**
   - Review all wallet statistics across currencies
   - Fund test user wallets for different scenarios
   - Test wallet wipe functionality with proper authentication

2. **Withdrawal Processing:**
   - Review pending withdrawals with priority filtering
   - Process individual approvals/rejections with admin notes
   - Execute bulk processing for multiple requests
   - Verify withdrawal limit enforcement and validation

3. **Analytics & Reporting:**
   - Generate orders analytics with various filters
   - Review subscription performance by city and plan
   - Analyze commission trends by user role and type
   - Export comprehensive financial reports

### **Operational Management Workflow**
1. **Delivery Operations:**
   - Create delivery assignments across all cities
   - Assign optimal riders based on location and availability
   - Monitor delivery performance and release payments
   - Track delivery analytics and rider performance

2. **Rider Management:**
   - Review rider applications and verify documents
   - Process security deposits and update rider status
   - Monitor rider performance metrics and delivery ratings
   - Handle rider suspensions and reactivations

3. **Auction Administration:**
   - Create auctions with appropriate reserve prices
   - Monitor bidding activity and participant behavior
   - Finalize auctions and process winner payments
   - Handle auction cancellations when necessary

4. **Communication & Support:**
   - Send targeted notifications across all channels
   - Process support tickets with priority handling
   - Monitor notification delivery rates and engagement
   - Generate support analytics and performance reports

### **Content Management Complete Workflow**
1. **Category & Product Control:**
   - Create and organize product categories
   - Monitor product approval workflows
   - Track price changes and market trends
   - Maintain product quality standards

2. **Audit & Compliance:**
   - Review all admin action audit trails
   - Verify proper admin password authentication
   - Monitor system security and access logs
   - Generate compliance reports for stakeholders

### **Emergency Operations Workflow**
1. **Crisis Management:**
   - Process urgent withdrawal requests
   - Handle delivery emergency reassignments
   - Send critical system notifications
   - Execute emergency profit pool adjustments

2. **Data Recovery & Correction:**
   - Correct commission calculation errors
   - Redistribute profit pools when necessary
   - Handle user account recovery requests
   - Process data correction requests with proper validation

### 🏠 15. Application Health & Status

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

### ✅ Admin Features (COMPREHENSIVE)
**User Management:**
- [ ] Get all users with advanced filtering (role, city, verification, date range)
- [ ] Get user by ID with complete profile details
- [ ] Get Growth Users by city with sorting and filtering
- [ ] Get detailed GA/GE user statistics and analytics
- [ ] Create admin users for testing purposes
- [ ] Update user profiles and roles
- [ ] Delete users (test with various user types)

**Wallet Management:**
- [ ] View all wallets with filtering (balance, currency, withdrawal capability)
- [ ] Get wallet by ID with transaction history
- [ ] Get user's wallet by user ID
- [ ] Fund user wallet (with admin password verification)
- [ ] Wipe user wallet (with admin password verification)
- [ ] Test funding with different currencies (NGN, USD, NIBIA)
- [ ] Test admin password validation for sensitive operations

**Analytics & Reporting:**
- [ ] Get orders analytics with date range and city filtering
- [ ] Get subscriptions analytics with plan and status filtering
- [ ] Get commission analytics by role and commission type
- [ ] Test various date ranges and grouping options
- [ ] Generate city-wise performance reports
- [ ] Test analytics with different filter combinations

**Category Management:**
- [ ] Get all categories with statistics
- [ ] Get category by ID with associated products
- [ ] Create new categories with various parameters
- [ ] Update existing categories (name, description, status)
- [ ] Delete categories (test with/without products)
- [ ] Test category sorting and activation status

**Product Management:**
- [ ] Get product price history for any product
- [ ] Record price history changes with admin notes
- [ ] Test price history with different currencies
- [ ] Verify price change audit trails

**Withdrawal Management (Enhanced GA/GE System):**
- [ ] View pending withdrawals with priority filtering
- [ ] Filter withdrawals by city, amount, date range
- [ ] Approve individual withdrawal requests (with admin password)
- [ ] Reject individual withdrawal requests (with admin notes)
- [ ] Bulk process multiple withdrawals simultaneously
- [ ] Test admin password validation for all withdrawal operations
- [ ] Test withdrawal priority queue (GE > GA > Creation date)
- [ ] Verify withdrawal limits and validation

**Commission Override System (NEW):**
- [ ] Override referral commissions with bonus adjustments
- [ ] Override referral commissions with penalty adjustments
- [ ] Test percentage-based commission overrides
- [ ] Test fixed-amount commission overrides
- [ ] Get commission override history with filtering
- [ ] Get specific referral commission history
- [ ] Test admin password validation for overrides
- [ ] Verify override audit trails and admin notes

**Profit Pool Management (Enhanced):**
- [ ] Get all profit pools with city and status filtering
- [ ] Get specific profit pool details with distribution breakdown
- [ ] Adjust profit pool amounts (increase/decrease)
- [ ] Generate monthly profit pool reports by city
- [ ] Force redistribute profit pools (with admin password)
- [ ] Test month/year filtering for profit pool reports
- [ ] Verify admin action audit trails for all pool operations
- [ ] Test profit pool calculations and beneficiary identification

**Delivery Management (Admin):**
- [ ] Create delivery assignments for any order/rider combination
- [ ] Get all deliveries with admin-level visibility (all cities)
- [ ] Assign/reassign riders to deliveries
- [ ] Release delivery payments to riders (with admin password)
- [ ] Update delivery status and tracking information
- [ ] View delivery performance analytics across all riders
- [ ] Test delivery fee calculations and adjustments

**Rider Management (Admin):**
- [ ] Get all riders with filtering (city, verification, deposit status)
- [ ] Verify rider documents (license, insurance, identity, vehicle)
- [ ] Update rider security deposit status and amounts
- [ ] Suspend/activate rider accounts with admin notes
- [ ] View rider performance metrics and delivery history
- [ ] Test rider verification workflows
- [ ] Manage rider status changes with proper admin authentication

**Auction Management (Admin):**
- [ ] Create auctions with various parameters (starting bid, reserve, duration)
- [ ] Update auction details (price, description, end time)
- [ ] Cancel auctions with admin password and reason
- [ ] Finalize auctions and declare winners
- [ ] View all auctions regardless of creator
- [ ] Test auction bidding workflows and winner selection
- [ ] Verify auction payment processing

**Notifications Management (Admin):**
- [ ] Send email notifications to users with various types
- [ ] Send push notifications with different priority levels
- [ ] Send WhatsApp messages for order updates
- [ ] Notify users of order status changes
- [ ] Send late payment reminders for subscriptions
- [ ] Notify riders of delivery assignments
- [ ] Test notification delivery and tracking
- [ ] Verify notification templates and personalization

**Support System (Admin):**
- [ ] Get all support tickets with filtering and priority
- [ ] Update ticket status and priority levels
- [ ] Close tickets with resolution messages
- [ ] Add internal admin notes to tickets
- [ ] View support analytics and performance metrics
- [ ] Test ticket assignment and escalation workflows

### ✅ Profit Pool System (NEW - August 2025)
- [ ] View profit pool statistics (overall)
- [ ] View profit pool statistics (by city)
- [ ] View profit pool statistics (by year)
- [ ] List all profit pools (admin)
- [ ] Filter profit pools by city
- [ ] Filter profit pools by month
- [ ] Filter profit pools by status
- [ ] Create profit pool manually (admin)
- [ ] Create profit pool with force override (admin)
- [ ] Create profit pool with invalid data (should fail)
- [ ] Distribute profit pool (admin)
- [ ] Distribute profit pool with invalid ID (should fail)
- [ ] Get specific profit pool details
- [ ] View user's profit pool history (GE users only)
- [ ] Verify automated pool creation (1st of month)
- [ ] Verify automated distribution (2nd of month)
- [ ] Test revenue calculation from orders
- [ ] Test revenue calculation from subscriptions
- [ ] Test revenue calculation from deliveries
- [ ] Verify 1% pool calculation accuracy
- [ ] Test Growth Elite user identification
- [ ] Test equal distribution among GEs
- [ ] Verify Nibia credit to user wallets
- [ ] Test distribution audit trail
- [ ] Test failed distribution handling
- [ ] Verify no distribution when no GEs exist
- [ ] Test city-specific distribution logic
- [ ] Verify monthly processing schedule

### ✅ Notifications
- [ ] Send email notifications
- [ ] Send push notifications
- [ ] Send WhatsApp messages
- [ ] Order status notifications
- [ ] Late payment notifications
- [ ] Auction event notifications
- [ ] Rider assignment notifications

### ✅ Scheduled Jobs Management (NEW - August 2025)
- [ ] View scheduled jobs status (admin)
- [ ] Manual GA/GE qualification check (admin)
- [ ] Manual profit pool distribution (admin)
- [ ] Manual daily GA/GE notifications (admin)
- [ ] View city capacity limits (admin)
- [ ] Verify nightly GA/GE qualification job schedule
- [ ] Verify monthly profit pool distribution job schedule
- [ ] Verify daily notifications job schedule
- [ ] Test qualification logic with various user scenarios
- [ ] Test city capacity enforcement
- [ ] Test user role updates and permissions
- [ ] Test Nibia withdrawal permission updates
- [ ] Verify notification delivery to users
- [ ] Test profit pool calculation accuracy
- [ ] Test equal distribution among Growth Elites
- [ ] Verify admin audit trail for manual triggers
- [ ] Test job execution logging and error handling
- [ ] Verify timezone handling (Africa/Lagos)
- [ ] Test concurrent job execution prevention

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

## 🎉 RECENT MAJOR UPDATES - JULY 2025

### 🛒 Revolutionary Cart System Overhaul
**Complete migration from in-memory to persistent database storage!**

**✨ What's New:**
1. **Persistent Storage:** Carts saved in MongoDB, never lost on server restart
2. **Smart Expiration:** 30-day automatic expiration with extension on activity
3. **Price Locking:** Prices frozen when items added, protecting from price changes
4. **Real-time Validation:** Stock checks on every cart operation
5. **Automated Cleanup:** Daily cleanup of expired carts at 2 AM
6. **Rich Responses:** Full product details in all cart operations
7. **Error Resilience:** Graceful handling of deleted products and stock changes

**🔧 Technical Improvements:**
- New `CartService` with comprehensive CRUD operations
- New `Cart` entity with TTL index for automatic expiration
- New `CartCleanupService` with scheduled tasks
- Enhanced validation and error handling
- Optimized database queries with proper population

### ⚡ Enhanced Stock Management
**Redesigned product stock update system!**

**✨ What's New:**
1. **Flexible Operations:** Add or subtract stock with clear operations
2. **Enhanced Validation:** Prevents negative stock levels
3. **Detailed Responses:** Shows before/after stock levels and operation details
4. **Real-time Updates:** Immediate reflection in database and cart validations

### 🔄 Improved Order Management
**Streamlined integration between cart and orders!**

**✨ What's New:**
1. **Cart-to-Order Integration:** Seamless checkout process
2. **Enhanced DTOs:** Proper validation for all cart operations
3. **Smart Stock Checking:** Validates stock availability during checkout
4. **Automatic Cart Clearing:** Cart emptied after successful checkout

### 📊 System Architecture Improvements
**Backend infrastructure enhancements!**

**✨ What's New:**
1. **Scheduled Tasks:** NestJS ScheduleModule integration for automated cleanup
2. **Service Separation:** Clear separation between CartService and OrdersService
3. **Database Optimization:** TTL indexes for automatic document expiration
4. **Comprehensive Logging:** Detailed logs for cart operations and cleanup

### 🧪 Enhanced Testing Capabilities
**New testing scenarios and comprehensive examples!**

**✨ What's New:**
1. **Complete Cart Workflows:** Step-by-step testing scenarios
2. **Stock Validation Testing:** Edge cases and error conditions
3. **Price Locking Verification:** Testing locked prices during checkout
4. **Persistence Testing:** Validating cart survival across sessions
5. **Error Handling Examples:** Comprehensive error scenario testing

---

**🚀 Happy Testing!**

This guide covers all **190+ endpoints** in the Forage Stores Backend API. Remember to test both success and failure scenarios to ensure robust application behavior. Each endpoint has been designed with proper authentication, authorization, validation, and error handling.

For the most up-to-date API documentation and real-time testing, always refer to the Swagger UI at `http://localhost:3000/api` when the application is running.
