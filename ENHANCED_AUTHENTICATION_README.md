# Enhanced Authentication System

This document describes the enhanced authentication system implemented for Forage Stores, including password reset, email verification, and account status management.

## Features Implemented

### 1. Account Status Tracking ✅
- **AccountStatus enum**: `PENDING`, `ACTIVE`, `SUSPENDED`, `DEACTIVATED`, `BANNED`
- **User entity updated** with account status fields
- **AccountStatusGuard** to restrict access based on account status

### 2. Email Verification System ✅
- **Email verification tokens** with expiry (24 hours)
- **Email verification endpoints**: `/auth/verify-email`, `/auth/resend-verification`
- **HTML email templates** for verification
- **Account activation** upon email verification

### 3. Password Reset System ✅
- **Password reset tokens** with expiry (1 hour)
- **Password reset endpoints**: `/auth/forgot-password`, `/auth/reset-password`
- **HTML email templates** for password reset
- **Secure token generation** using crypto.randomBytes()

### 4. Enhanced Authentication Flow ✅
- **Registration** now sends verification email
- **Login** checks account status and provides warnings
- **JWT tokens** include account status information
- **Rate limiting** on all auth endpoints

## API Endpoints

### Email Verification
```typescript
POST /auth/verify-email
Body: { token: string }
Rate limit: 10/minute

POST /auth/resend-verification
Body: { email: string }
Rate limit: 3/5 minutes
```

### Password Reset
```typescript
POST /auth/forgot-password
Body: { email: string }
Rate limit: 3/5 minutes

POST /auth/reset-password
Body: { token: string, newPassword: string }
Rate limit: 5/5 minutes
```

### Enhanced Registration Response
```typescript
{
  user: User,
  accessToken: string,
  message: "Registration successful. Please check your email to verify your account."
}
```

### Enhanced Login Response
```typescript
{
  user: User,
  accessToken: string,
  warning?: "Account is pending email verification. Some features may be limited."
}
```

## Database Schema Updates

### User Entity Changes
```typescript
// New fields added to User schema
emailVerified: boolean (default: false)
emailVerificationToken?: string
emailVerificationExpiry?: Date
passwordResetToken?: string
passwordResetExpiry?: Date
accountStatus: AccountStatus (default: PENDING)
```

## Email Configuration

### Environment Variables
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@forage.com
FRONTEND_URL=http://localhost:3000
```

### Email Templates
- **Email Verification**: Welcome email with verification link
- **Password Reset**: Security-focused reset email
- **Account Activated**: Welcome email after verification

## Security Features

### Token Security
- **Crypto-secure tokens**: Using `crypto.randomBytes(32)`
- **Token expiry**: 24 hours for email verification, 1 hour for password reset
- **Single-use tokens**: Tokens are cleared after use

### Account Protection
- **Account status checks** during login
- **Guard protection** for sensitive operations
- **Rate limiting** to prevent abuse
- **Email obfuscation** for security (doesn't reveal if email exists)

### Account Status Behaviors
- **PENDING**: Can login but with limited features
- **ACTIVE**: Full access to all features
- **SUSPENDED**: Cannot login, contact support message
- **DEACTIVATED**: Cannot login, reactivation required
- **BANNED**: Cannot login, permanent restriction

## Guards and Middleware

### New Guards
```typescript
@UseGuards(AccountStatusGuard)
// Restricts access based on account status

@UseGuards(JwtAuthGuard, AccountStatusGuard)
// Combined authentication and status checking
```

### Rate Limiting
```typescript
// Registration: 3 attempts per minute
@Throttle({ default: { limit: 3, ttl: 60000 } })

// Login: 5 attempts per minute
@Throttle({ default: { limit: 5, ttl: 60000 } })

// Password reset: 3 attempts per 5 minutes
@Throttle({ default: { limit: 3, ttl: 300000 } })
```

## Usage Examples

### Frontend Integration
```typescript
// Registration with email verification
const response = await fetch('/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(userData)
});
// User receives verification email

// Email verification
const verifyResponse = await fetch('/auth/verify-email', {
  method: 'POST',
  body: JSON.stringify({ token: tokenFromEmail })
});

// Password reset flow
await fetch('/auth/forgot-password', {
  method: 'POST',
  body: JSON.stringify({ email: userEmail })
});
// User receives reset email

await fetch('/auth/reset-password', {
  method: 'POST',
  body: JSON.stringify({ 
    token: tokenFromEmail, 
    newPassword: newPassword 
  })
});
```

## Error Handling

### Common Error Responses
```typescript
// Invalid/expired token
400: "Invalid or expired verification token"

// Account status issues
401: "Account is suspended. Please contact support."
403: "Account is pending email verification. Please verify your email."

// Rate limiting
429: "Too Many Requests"
```

## Migration Notes

### Database Migration Required
- Add new fields to existing users
- Set default account status to PENDING for existing users
- Consider mass email verification for existing active users

### Existing Users
- Existing users should be migrated to ACTIVE status
- Or implement a grace period with warnings
- Provide admin tools for bulk status management

## Testing

### Test Cases Covered
- Email verification flow (valid/invalid/expired tokens)
- Password reset flow (valid/invalid/expired tokens)
- Account status restrictions
- Rate limiting enforcement
- Email sending (mock in tests)
- Token security and uniqueness

## Admin Management

### Account Status Management
```typescript
// Admin can change account status
await authService.suspendAccount(userId);
await authService.activateAccount(userId);
await authService.deactivateAccount(userId);
```

### User Management Queries
```typescript
// Find users by status
await usersService.findByAccountStatus('pending');
await usersService.findActiveUsers();
await usersService.findPendingUsers();
```

This enhanced authentication system provides enterprise-grade security and user experience while maintaining backward compatibility with existing functionality.
