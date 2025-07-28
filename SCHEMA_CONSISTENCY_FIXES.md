# Schema Consistency Fixes Applied to API_TESTING_GUIDE.md

## Summary
Updated all schemas in the API_TESTING_GUIDE.md file to match the actual DTOs and entities in the codebase. The guide now provides accurate, up-to-date examples that will work correctly with the API.

## ✅ Fixed Schemas

### 1. User Registration (`POST /auth/register`)
**Fixed Issues:**
- Added missing optional fields: `city`, `referralCode`
- Updated field explanations to show required vs optional fields

**Before:**
```json
{
  "name": "John Store Owner",
  "email": "john.storeowner@example.com",
  "phone": "+2348123456789",
  "password": "MySecure123!",
  "accountType": "business",
  "role": "user"
}
```

**After:**
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

### 2. Store Creation (`POST /stores`)
**Fixed Issues:**
- Clarified which fields are required vs optional
- Added proper field explanations

**Changes:**
- Added clear indicators for required fields (name, address)
- Marked optional fields (description, phone, email)

### 3. Product Creation (`POST /products`)
**Fixed Issues:**
- Added comprehensive field explanations
- Listed all valid category options
- Clarified all required vs optional fields

**Improvements:**
- Added valid enum values for `category` and `deliveryType`
- Explained field requirements clearly
- Added image field documentation

### 4. Shopping Cart & Orders (Major Fix)
**Fixed Issues:**
- Completely restructured shopping workflow to match actual API
- Fixed cart management endpoints
- Updated checkout schema to match actual DTO

**Before (Incorrect):**
```json
{
  "items": [
    {
      "productId": "PRODUCT_ID_FROM_STEP_1",
      "quantity": 2,
      "price": 800
    }
  ],
  "deliveryAddress": "456 Customer Street, Lagos, Nigeria",
  "customerPhone": "+2348123456789",
  "customerEmail": "customer@example.com",
  "paymentMethod": "card",
  "specialInstructions": "Please call when you arrive"
}
```

**After (Correct Workflow):**
1. Add to cart: `POST /orders/cart/add`
2. View cart: `GET /orders/cart`
3. Checkout: `POST /orders/checkout` with proper schema:
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

### 5. Cart Management Endpoints
**Fixed Issues:**
- Updated remove from cart endpoint to use URL parameter instead of body
- Fixed endpoint patterns to match actual controller routes

**Before:**
- Remove: `DELETE /orders/cart/remove` with body `{"productId": "..."}`

**After:**
- Remove: `DELETE /orders/cart/{productId}` (no body needed)

### 6. Wallet Transfer (`POST /wallets/transfer`)
**Fixed Issues:**
- Changed `recipientId` to `toUserId`
- Changed `type` to `currency`
- Updated currency values to match enum
- Added missing reference field

**Before:**
```json
{
  "recipientId": "FRIEND_USER_ID",
  "amount": 500,
  "type": "FOOD_MONEY",
  "description": "Splitting dinner order"
}
```

**After:**
```json
{
  "toUserId": "FRIEND_USER_ID",
  "amount": 500,
  "currency": "food_money",
  "description": "Splitting dinner order",
  "reference": "TXN123456"
}
```

### 7. Wallet Creation (`POST /wallets/create`)
**Fixed Issues:**
- Replaced single `initialBalance` with proper wallet structure
- Added all wallet types (foodMoney, foodPoints, foodSafe)

**Before:**
```json
{
  "initialBalance": 1000
}
```

**After:**
```json
{
  "userId": "YOUR_USER_ID",
  "foodMoney": 1000,
  "foodPoints": 50,
  "foodSafe": 0
}
```

### 8. Support Ticket Creation (`POST /support/tickets`)
**Fixed Issues:**
- Changed `title` to `subject`
- Changed `description` to `message`
- Added missing optional fields

**Before:**
```json
{
  "title": "Payment Issue",
  "description": "Unable to process payment for order #12345",
  "category": "PAYMENT",
  "priority": "HIGH"
}
```

**After:**
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

## ✅ Validation
- All schemas now match the actual DTOs in the codebase
- Build passes successfully after changes
- Field names, types, and requirements are accurate
- Enum values match the actual enums in the code
- Required vs optional fields are properly documented

## 🎯 Impact
- Developers can now copy-paste examples directly from the guide
- No more 400 validation errors from using wrong field names
- Clear understanding of what fields are required vs optional
- Proper understanding of the cart-based shopping workflow
- Accurate wallet currency and transfer operations

## 📝 Additional Improvements
- Added comprehensive field explanations for complex schemas
- Clarified authentication requirements (🔒 indicators)
- Updated enum value documentation with all valid options
- Improved beginner-friendly explanations
- Added proper workflow explanations for multi-step processes

The API_TESTING_GUIDE.md file is now fully consistent with the actual codebase and provides accurate, working examples for all endpoints.
