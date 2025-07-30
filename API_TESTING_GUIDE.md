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
**Endpoint:** `DELETE /orders/cart/{productId}`

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

## 💰 Wallet & Payment Features

### What You Can Do With Your Wallet:

#### 💳 Check Your Balance (🔒 Authentication Required)
**What:** See how much money you have
**Endpoint:** `GET /wallets/my-wallet`
**Shows:** Food Money, Food Points, and Food Safe balances

#### 💸 Send Money to Another User (🔒 Authentication Required)
**What:** Transfer money to friends or pay for shared orders
**Endpoint:** `POST /wallets/transfer`
```json
{
  "toUserId": "FRIEND_USER_ID",
  "amount": 500,
  "currency": "food_money",
  "description": "Splitting dinner order",
  "reference": "TXN123456"
}
```

**Field Explanations:**
- `toUserId`: ID of the user receiving the money (required)
- `amount`: Amount to transfer (required)
- `currency`: Type of currency - options: "food_money", "food_points", "food_safe" (required)
- `description`: Description of the transfer (required)
- `reference`: Optional reference number

#### 🏦 Create Your Wallet (🔒 Authentication Required)
**What:** Set up your payment account
**Endpoint:** `POST /wallets/create`
```json
{
  "userId": "YOUR_USER_ID",
  "foodMoney": 1000,
  "foodPoints": 50,
  "foodSafe": 0
}
```

**Field Explanations:**
- `userId`: Your user ID (required)
- `foodMoney`: Initial Food Money balance (optional, default: 0)
- `foodPoints`: Initial Food Points balance (optional, default: 0)
- `foodSafe`: Initial Food Safe balance (optional, default: 0)

**Money Types Explained:**
- **Food Money:** Regular cash for buying food
- **Food Points:** Loyalty points earned from purchases
- **Food Safe:** Savings account for future use

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
