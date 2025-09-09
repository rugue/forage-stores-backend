# Gmail SMTP Setup Guide (FREE)

## Overview
Gmail SMTP is completely free and allows you to send up to 500 emails per day, which is perfect for most applications.

## Step-by-Step Setup

### 1. Gmail Account Setup
- Use your existing Gmail account or create a new one
- **Recommended**: Create a dedicated Gmail account for your app (e.g., `forage.noreply@gmail.com`)

### 2. Enable 2-Factor Authentication
1. Go to your Google Account settings: https://myaccount.google.com/
2. Click on "Security" in the left sidebar
3. Under "Signing in to Google", click "2-Step Verification"
4. Follow the setup process to enable 2FAs

### 3. Generate App Password
1. Go to Google Account settings: https://myaccount.google.com/
2. Click on "Security" in the left sidebar
3. Under "Signing in to Google", click "App passwords"
4. Select "Mail" and "Other (Custom name)"
5. Enter "Forage Backend" as the custom name
6. Click "Generate"
7. **Copy the 16-character password** (e.g., `abcd efgh ijkl mnop`)

### 4. Update Environment Variables

#### For Development (.env file):
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-gmail@gmail.com
SMTP_PASS=abcd efgh ijkl mnop
SMTP_FROM=your-gmail@gmail.com
```

#### For Production (Render Environment Variables):
Add these in your Render dashboard under Environment Variables:
- `SMTP_HOST` = `smtp.gmail.com`
- `SMTP_PORT` = `587`
- `SMTP_USER` = `your-gmail@gmail.com`
- `SMTP_PASS` = `abcd efgh ijkl mnop` (the app password)
- `SMTP_FROM` = `your-gmail@gmail.com`

### 5. Test the Setup
Run your application and try to register a new user. Check the logs for email sending status.

## Important Notes

### Security
- ✅ **Never commit your app password to Git**
- ✅ Use environment variables for all credentials
- ✅ The app password is different from your Gmail password
- ✅ App passwords are safer than using your main password

### Limitations
- 500 emails per day (free tier)
- Rate limited to prevent spam
- Suitable for transactional emails (verification, password reset)

### Alternative Free Options
If you need more emails:
1. **SendGrid**: 100 emails/day (free tier)
2. **Mailgun**: 100 emails/day for 3 months (free trial)
3. **Zoho Mail**: 100 emails/day (free tier)

## Troubleshooting

### Common Issues
1. **"Invalid credentials"**: Double-check your app password
2. **"Less secure app access"**: Use app password instead of regular password
3. **Rate limiting**: Gmail may temporarily block if sending too many emails

### Testing Commands
```bash
# Test email sending (if you have a test endpoint)
curl -X POST http://localhost:3000/auth/test-email \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

## Production Deployment

### Render Configuration
1. Go to your Render dashboard
2. Select your service
3. Go to "Environment" tab
4. Add the SMTP environment variables listed above
5. Deploy your service

### Environment Variables Checklist
- [ ] SMTP_HOST
- [ ] SMTP_PORT
- [ ] SMTP_USER
- [ ] SMTP_PASS
- [ ] SMTP_FROM

Your email service is already implemented in `src/modules/auth/services/auth-email.service.ts` and will work automatically once you set up these variables!
