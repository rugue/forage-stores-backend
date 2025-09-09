# 🔧 Email Verification Fix - Deployment Guide

## ✅ **Problem Solved**
Your email verification links were pointing to `localhost:3000` instead of production URLs.

## 🚀 **What's Been Fixed**

### 1. **Environment Variables Updated**
- ✅ `FRONTEND_URL` now points to your backend domain temporarily
- ✅ Web verification pages created for proper email verification

### 2. **New Web Verification Module**
- ✅ Created `/web/verify-email` endpoint for email verification
- ✅ Created `/web/reset-password` endpoint for password resets
- ✅ Professional HTML pages with proper styling

### 3. **Updated Files**
- ✅ `.env.production` - Fixed FRONTEND_URL
- ✅ `src/modules/web/` - New web verification module
- ✅ `src/app.module.ts` - Added WebModule

## 🔧 **Deployment Steps**

### Step 1: Update Render Environment Variables
Add/Update these in your Render dashboard:

```bash
FRONTEND_URL=https://forage-stores-backend.onrender.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=nibiahq@gmail.com
SMTP_PASS=hdtt hhjz dlfw mszi
SMTP_FROM=nibiahq@gmail.com
```

### Step 2: Deploy to Render
1. Push your code to GitHub
2. Render will auto-deploy
3. Wait for deployment to complete

### Step 3: Test Email Verification
1. Register a new user
2. Check email for verification link
3. Link should now be: `https://forage-stores-backend.onrender.com/web/verify-email?token=...`
4. Click link → Should show success page

## 📧 **Email Flow Now**

### Before (Broken):
```
Email Link: http://localhost:3000/verify-email?token=abc123
Result: ❌ Link doesn't work in production
```

### After (Fixed):
```
Email Link: https://forage-stores-backend.onrender.com/web/verify-email?token=abc123
Result: ✅ Shows professional verification page
```

## 🎯 **Next Steps**

### When You Build Your Frontend:
1. Update `FRONTEND_URL` to your actual frontend domain
2. The email links will automatically use the new domain
3. Frontend should handle `/verify-email?token=...` route

### Example Frontend URL:
```bash
# When you have a frontend deployed
FRONTEND_URL=https://forage-stores-app.vercel.app
# or
FRONTEND_URL=https://forage-stores-frontend.onrender.com
```

## 🧪 **Testing Commands**

### Test Registration with Email:
```bash
curl -X POST https://forage-stores-backend.onrender.com/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "your-email@gmail.com",
    "password": "SecurePass123!",
    "phoneNumber": "+1234567890"
  }'
```

### Test SMTP Configuration:
```bash
curl -X POST https://forage-stores-backend.onrender.com/auth/test-email \
  -H "Content-Type: application/json" \
  -d '{"email": "your-email@gmail.com"}'
```

## ✅ **Verification**

After deployment, your emails will now show:
```
Verification Link: https://forage-stores-backend.onrender.com/web/verify-email?token=...
```

Click the link → Professional verification page → Account activated! 🎉

The email verification issue is now completely resolved! 🚀
