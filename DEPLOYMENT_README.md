# 🚀 Forage Stores Backend - Deployment Guide

## 📋 Quick Start Deployment

### Prerequisites
- GitHub repository with your code
- Render account (free tier available)
- MongoDB Atlas account (or use Render's MongoDB)

### 1-Click Render Deployment
[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)

Use the `render.yaml` configuration in this repository for automatic setup.

---

## 🔧 Manual Deployment Setup

### **Step 1: Repository Configuration**
```bash
# Clone and push to your GitHub repository
git clone <your-repo>
cd forage-stores-backend
git add .
git commit -m "feat: Add deployment infrastructure"
git push origin master
```

### **Step 2: Render Service Setup**
1. **Connect Repository**: Link your GitHub repo to Render
2. **Create Service**: Use "Deploy from repo" option
3. **Environment**: Set to `production`
4. **Build Command**: `npm ci && npm run build`
5. **Start Command**: `npm run start:prod`

### **Step 3: Environment Variables**
```bash
# Essential Variables (Set in Render Dashboard)
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/forage-stores
JWT_SECRET=your-super-secret-jwt-key
ADMIN_PASSWORD=YourSecureAdminPassword123!
PAYSTACK_SECRET_KEY=sk_live_your_paystack_key
SMTP_USER=your-email@domain.com
SMTP_PASS=your-email-app-password
FRONTEND_URL=https://your-frontend.com
```

### **Step 4: Database Setup**
```bash
# Option 1: MongoDB Atlas (Recommended)
1. Create cluster on MongoDB Atlas
2. Whitelist Render IP ranges: 0.0.0.0/0
3. Create database user
4. Get connection string

# Option 2: Render MongoDB (Beta)
Use render.yaml database configuration
```

### **Step 5: GitHub Actions (Optional)**
Add these secrets to your GitHub repository:
- `RENDER_API_KEY` - From Render dashboard
- `RENDER_PRODUCTION_SERVICE_ID` - Service ID from Render
- `PRODUCTION_URL` - Your deployed app URL

---

## 🐳 Docker Deployment

### Local Development
```bash
# Start development environment
docker-compose up --build

# With tools (MongoDB Express, Redis Commander)
docker-compose --profile tools up
```

### Production Deployment
```bash
# Build production image
docker build -t forage-backend .

# Run production stack
docker-compose -f docker-compose.prod.yml up --build
```

---

## 🔍 Health Monitoring

### Health Check Endpoints
```bash
# Basic health check
curl https://your-app.onrender.com/health

# Kubernetes readiness probe
curl https://your-app.onrender.com/health/ready

# Kubernetes liveness probe  
curl https://your-app.onrender.com/health/live
```

### Response Format
```json
{
  "status": "ok",
  "timestamp": "2025-09-06T00:00:00.000Z",
  "uptime": 3600,
  "environment": "production",
  "database": {
    "status": "connected",
    "name": "forage-stores"
  },
  "memory": {
    "used": "50MB",
    "total": "512MB",
    "percentage": "9.77%"
  },
  "services": {
    "database": "healthy",
    "api": "healthy"
  }
}
```

---

## 🔐 Security Configuration

### Environment Security
```bash
# Generate secure JWT secret
openssl rand -base64 64

# Strong admin password
# Use mix of uppercase, lowercase, numbers, and symbols
# Minimum 12 characters
```

### Production Headers
Automatically configured via Helmet:
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Referrer-Policy: strict-origin-when-cross-origin
- Content Security Policy

### Rate Limiting
- 100 requests per minute per IP
- Configurable via environment variables

---

## 📊 Monitoring Integration

### Error Tracking (Sentry)
```bash
# Add to environment variables
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
```

### Performance Monitoring (New Relic)
```bash
# Add to environment variables
NEW_RELIC_LICENSE_KEY=your-license-key
```

### Custom Metrics
Health endpoint provides:
- Memory usage
- Database connectivity
- Service status
- Uptime tracking

---

## 🔄 Database Migrations

### Automatic Migrations
```bash
# Runs automatically on deployment
npm run migrate:prod
```

### Manual Migration
```bash
# Local development
npm run migrate

# Production (if needed)
NODE_ENV=production npm run migrate:prod
```

### Available Migrations
1. **Profit Pool Setup**: Creates profit pool collection
2. **Nibia Withdrawal**: Adds withdrawal flags to wallets
3. **Referral System**: Adds referrer ID to users

---

## 🚀 Deployment Environments

### Staging Environment
- **Branch**: `develop`
- **URL**: `https://forage-backend-staging.onrender.com`
- **Database**: Separate staging database
- **Features**: Debug logging, test payment keys

### Production Environment
- **Branch**: `master`
- **URL**: `https://forage-backend-prod.onrender.com`
- **Database**: Production MongoDB
- **Features**: Optimized logging, live payment keys

---

## 🛠 Troubleshooting

### Common Issues

#### Build Failures
```bash
# Check Node.js version
node --version  # Should be 18.x

# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### Database Connection Issues
```bash
# Verify MongoDB URI format
mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority

# Check IP whitelist
# Add 0.0.0.0/0 for Render deployment
```

#### Environment Variable Issues
```bash
# Check required variables are set
NODE_ENV=production
MONGODB_URI=set
JWT_SECRET=set
```

### Debugging
```bash
# Enable debug logging
LOG_LEVEL=debug

# Health check
curl https://your-app.onrender.com/health

# Check application logs in Render dashboard
```

---

## 📈 Performance Optimization

### Render Service Plans
- **Starter**: $7/month - Good for development/staging
- **Standard**: $25/month - Recommended for production
- **Pro**: $85/month - High-traffic applications

### Database Optimization
- Proper indexing (configured in init scripts)
- Connection pooling
- Query optimization

### Caching
- Redis integration ready
- Memory caching configured
- API response caching

---

## 🔄 CI/CD Workflow

### Automated Testing
1. **Code Push** → Triggers GitHub Actions
2. **Linting** → ESLint and Prettier checks
3. **Testing** → Unit, integration, and E2E tests
4. **Security** → Vulnerability scanning
5. **Build** → TypeScript compilation
6. **Deploy** → Automatic deployment to Render

### Branch Strategy
- `develop` → Staging deployment
- `master` → Production deployment
- Feature branches → No automatic deployment

---

## 📝 Maintenance

### Regular Tasks
- **Weekly**: Check application logs
- **Monthly**: Review performance metrics
- **Quarterly**: Update dependencies
- **As needed**: Scale resources based on usage

### Backup Strategy
- Database: Automated via MongoDB Atlas
- Files: Persistent volumes in Docker
- Code: Version controlled in GitHub

### Updates
```bash
# Update dependencies
npm update

# Security updates
npm audit fix

# Deploy updates
git push origin master  # Triggers automatic deployment
```

---

## 🆘 Support

### Resources
- [Render Documentation](https://render.com/docs)
- [MongoDB Atlas Docs](https://docs.atlas.mongodb.com/)
- [NestJS Deployment Guide](https://docs.nestjs.com/deployment)

### Application Logs
- **Render**: View in dashboard under "Logs" tab
- **MongoDB**: Atlas monitoring and logs
- **Application**: Structured logging with Winston

---

## ✅ Deployment Checklist

### Pre-Deployment
- [ ] Environment variables configured
- [ ] Database connection tested
- [ ] Secrets and API keys set
- [ ] Domain/subdomain configured
- [ ] SSL certificate (auto-configured by Render)

### Post-Deployment
- [ ] Health check returns 200
- [ ] Database connectivity verified
- [ ] API endpoints responding
- [ ] Authentication working
- [ ] File uploads functional
- [ ] Email notifications working

### Production Ready
- [ ] Monitoring configured
- [ ] Backup strategy implemented
- [ ] Error tracking active
- [ ] Performance monitoring enabled
- [ ] Security headers verified

---

🎉 **Your Forage Stores Backend is now production-ready with professional DevOps practices!**
