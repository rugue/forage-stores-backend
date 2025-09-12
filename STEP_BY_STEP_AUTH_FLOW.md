# 🔄 STEP-BY-STEP AUTHENTICATION FLOW IMPLEMENTATION

## ✅ **Product Design vs Backend Alignment**

Your product design flow has been **successfully implemented**:

```
✅ Splash Screen → Onboarding → Create Account → Account Type → Verify Email (4-digits) → Sign In
```

## 🚀 **New Authentication Endpoints**

### **Step 1: Create Account**
**Endpoint:** `POST /auth/create-account`
**Product Flow:** `Splash → Onboarding → Create Account`

```typescript
// Request Body
{
  "name": "John Doe",
  "email": "john@example.com", 
  "phone": "+1234567890",
  "password": "MySecure123!"
}

// Response
{
  "user": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "emailVerified": false,
    "accountStatus": "pending"
  },
  "tempToken": "temporary_jwt_token",
  "message": "Account created successfully. Please check your email for a 4-digit verification code."
}
```

**What happens:**
- ✅ Creates user account (without account type yet)
- ✅ Generates 4-digit verification code
- ✅ Sends verification email with code
- ✅ Returns temporary token for next steps

---

### **Step 2: Select Account Type** 
**Endpoint:** `POST /auth/select-account-type`
**Product Flow:** `Create Account → Account Type Selection`
**Auth:** Requires temporary token from Step 1

```typescript
// Request Headers
Authorization: Bearer <tempToken_from_step1>

// Request Body
{
  "accountType": "family" // or "business"
}

// Response
{
  "message": "Account type selected successfully",
  "user": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "accountType": "family",
    "accountStatus": "pending"
  }
}
```

**Available Account Types:**
- `"family"` - Family/Personal account
- `"business"` - Business account

---

### **Step 3: Verify Email with 4-Digit Code**
**Endpoint:** `POST /auth/verify-email-code`
**Product Flow:** `Account Type → Verify Email (4-digits)`

```typescript
// Request Body
{
  "email": "john@example.com",
  "code": "1234"
}

// Response
{
  "user": {
    "id": "user_id",
    "name": "John Doe", 
    "email": "john@example.com",
    "accountType": "family",
    "emailVerified": true,
    "accountStatus": "active"
  },
  "accessToken": "full_jwt_token_for_app_access",
  "message": "Email verified successfully. Account is now active."
}
```

**What happens:**
- ✅ Validates 4-digit code
- ✅ Marks email as verified
- ✅ Activates account
- ✅ Returns full access token

---

### **Step 4: Sign In (Existing Endpoint)**
**Endpoint:** `POST /auth/login` 
**Product Flow:** `Verify Email → Sign In`

```typescript
// Request Body
{
  "email": "john@example.com",
  "password": "MySecure123!"
}

// Response (if account is verified)
{
  "user": { /* user object */ },
  "accessToken": "jwt_token"
}
```

---

### **Additional Helper Endpoints**

#### **Resend Verification Code**
**Endpoint:** `POST /auth/resend-verification-code`

```typescript
// Request Body
{
  "email": "john@example.com"
}

// Response
{
  "message": "New verification code sent to your email."
}
```

---

## 📧 **4-Digit Email Verification**

### **Email Template**
```html
<h2>Verify Your Email</h2>
<p>Hi [Name],</p>
<p>Use this verification code:</p>

<h1 style="font-size: 48px; letter-spacing: 8px;">1234</h1>

<p>Code expires in 15 minutes.</p>
```

### **Code Properties**
- ✅ **4-digit numeric code** (1000-9999)
- ✅ **15-minute expiry** (security best practice)
- ✅ **Single-use** (deleted after verification)
- ✅ **Professional email template**

---

## 🎯 **Mobile App Implementation Guide**

### **1. Splash Screen**
```typescript
// Initialize app, check token, decide navigation
if (hasValidToken) {
  navigateToMainApp();
} else {
  navigateToOnboarding();
}
```

### **2. Onboarding Screens**
```typescript
// Show app introduction slides
// Navigate to account creation when done
navigateToCreateAccount();
```

### **3. Create Account Screen**
```typescript
const createAccount = async (formData) => {
  try {
    const response = await fetch('/auth/create-account', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    
    const { user, tempToken, message } = await response.json();
    
    // Store temporary token
    await SecureStore.setItemAsync('tempToken', tempToken);
    
    // Navigate to account type selection
    navigation.navigate('AccountType', { user });
    
  } catch (error) {
    // Handle validation errors
    showError(error.message);
  }
};
```

### **4. Account Type Screen**
```typescript
const selectAccountType = async (accountType) => {
  try {
    const tempToken = await SecureStore.getItemAsync('tempToken');
    
    const response = await fetch('/auth/select-account-type', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tempToken}`
      },
      body: JSON.stringify({ accountType })
    });
    
    const { user } = await response.json();
    
    // Navigate to email verification
    navigation.navigate('VerifyEmail', { user });
    
  } catch (error) {
    showError(error.message);
  }
};
```

### **5. Email Verification Screen**
```typescript
const verifyEmail = async (code) => {
  try {
    const response = await fetch('/auth/verify-email-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user.email, code })
    });
    
    const { user: verifiedUser, accessToken } = await response.json();
    
    // Store access token
    await SecureStore.setItemAsync('accessToken', accessToken);
    
    // Navigate to main app
    navigation.reset({
      index: 0,
      routes: [{ name: 'MainApp' }]
    });
    
  } catch (error) {
    showError('Invalid verification code');
  }
};

const resendCode = async () => {
  try {
    await fetch('/auth/resend-verification-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user.email })
    });
    
    showSuccess('New code sent to your email');
    
  } catch (error) {
    showError('Failed to resend code');
  }
};
```

### **6. Sign In Screen (Existing)**
```typescript
const signIn = async (credentials) => {
  try {
    const response = await fetch('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    
    const { user, accessToken } = await response.json();
    
    await SecureStore.setItemAsync('accessToken', accessToken);
    navigation.navigate('MainApp');
    
  } catch (error) {
    showError('Invalid credentials');
  }
};
```

---

## 🔧 **Backend Database Changes**

### **New User Fields Added**
```typescript
interface User {
  // Existing fields...
  
  // NEW: 4-digit verification
  emailVerificationCode?: string;           // "1234"
  emailVerificationCodeExpiry?: Date;       // 15 minutes from generation
  
  // Existing email verification (still supported)
  emailVerificationToken?: string;          // Long token (legacy)
  emailVerificationExpiry?: Date;          // 24 hours
}
```

### **Account Types**
```typescript
enum AccountType {
  FAMILY = 'family',      // Default for personal use
  BUSINESS = 'business'   // For business accounts
}
```

---

## ✅ **Flow Validation Summary**

| Product Design Step | Backend Endpoint | Status | Notes |
|-------------------|------------------|--------|-------|
| Splash Screen | - | ✅ | App initialization |
| Onboarding | - | ✅ | App introduction |
| Create Account | `POST /auth/create-account` | ✅ | Basic account creation |
| Account Type | `POST /auth/select-account-type` | ✅ | Separate step as required |
| Verify Email (4-digits) | `POST /auth/verify-email-code` | ✅ | 4-digit code validation |
| Sign In | `POST /auth/login` | ✅ | Existing login endpoint |

---

## 🎯 **Key Benefits Achieved**

### ✅ **Perfect Product-Backend Alignment**
- Account creation and type selection are separate steps
- 4-digit email verification (not long tokens)
- Clean step-by-step flow

### ✅ **Enhanced Security**
- Short-lived verification codes (15 minutes)
- Temporary tokens for multi-step process
- Proper account status management

### ✅ **Better User Experience**
- Simple 4-digit codes instead of long URLs
- Clear step-by-step progress
- Professional email templates

### ✅ **Backward Compatibility**
- Existing `/auth/register` and `/auth/login` still work
- Legacy token verification still supported
- No breaking changes for existing users

---

## 🚀 **Ready for Implementation**

Your backend now **perfectly matches** your product design flow. The mobile app can implement the exact user journey you designed:

1. ✅ **Splash Screen** → App initialization
2. ✅ **Onboarding** → Feature introduction  
3. ✅ **Create Account** → Basic info collection
4. ✅ **Account Type** → Family vs Business selection
5. ✅ **Verify Email** → 4-digit code entry
6. ✅ **Sign In** → Full app access

**All endpoints are tested, built successfully, and ready for mobile app integration!** 🎉
