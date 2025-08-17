# Enhanced Referrals System with Growth Associates (GA) and Growth Elites (GE)

This document describes the enhanced referrals system that supports Growth Associates (GA) and Growth Elites (GE) with automatic qualification and promotion.

## Overview

The referral system has been enhanced to support three tiers of users:

1. **Normal Users**: Earn 0.5%–2.5% commission in Nibia on the first 3 purchases of each referral
2. **Growth Associates (GA)**: Earn 0.5%–2.5% commission in Nibia on *all purchases* of their referred users forever
3. **Growth Elites (GE)**: Same as GA, plus a share of 1% of city revenue (profit pool)

## Qualification Requirements

### Growth Associate (GA) Qualification
- **Minimum Referrals**: 100 referrals in the same city
- **Total Spend Requirement**: Referred users must have spent ₦600k total in their first year
- **City Limit**: Maximum 50 GA per city
- **Automatic Promotion**: Daily check at 2:00 AM

### Growth Elite (GE) Qualification
- **Minimum Referrals**: 1000 referrals in the same city
- **Spend Requirement**: Each referral must spend ≥ ₦600k per year for 2 consecutive years
- **City Limit**: Maximum 5 GE per city
- **Revenue Share**: 1% of city revenue distributed monthly
- **Automatic Promotion**: Daily check at 2:00 AM

## Commission Rates

- **Dynamic Commission**: Rates vary between 0.5% and 2.5% based on order amount
- **Higher Order Amounts**: Get higher commission rates (up to 2.5%)
- **Base Order Amount**: ₦50k is the baseline for rate calculation

## New Features

### Commission Entity
- Separate commission tracking for better analytics
- Support for different commission types (normal referral, GA referral, GE referral, GE city revenue)
- Detailed metadata and status tracking

### Growth Management
- Automated qualification checking and promotion
- City revenue distribution for Growth Elites
- Comprehensive growth statistics and analytics

### Scheduled Tasks
- **Daily at 2:00 AM**: Check and promote eligible users to GA/GE
- **Monthly on 1st at 3:00 AM**: Distribute city revenue to Growth Elites
- **Hourly**: Process pending commissions

## API Endpoints

### Commission Endpoints
- `GET /referrals/commissions` - Get user's commissions
- `GET /referrals/commissions/stats` - Get commission statistics

### Growth Management Endpoints
- `GET /referrals/growth/qualification` - Check growth qualification
- `GET /referrals/growth/stats` - Get overall growth statistics (admin)
- `POST /referrals/growth/promote-ga` - Manually promote to GA (admin)
- `POST /referrals/growth/promote-ge` - Manually promote to GE (admin)
- `POST /referrals/growth/check-all-qualifications` - Check all users (admin)

### Admin Endpoints
- `GET /referrals/admin/commissions/:userId` - Get user's commissions (admin)
- `POST /referrals/admin/process-pending-commissions` - Process pending commissions (admin)

## Database Changes

### User Entity
- Added `referrerId` field to link users to their referrers
- Updated `UserRole` enum to include `GROWTH_ASSOCIATE` and `GROWTH_ELITE`

### New Collections
- **commissions**: Detailed commission tracking with metadata
- Indexes for optimal query performance

### Migration
Run the migration script to add `referrerId` field and create indexes:
```bash
node migrations/add-referrer-id-to-users.js
```

## Implementation Details

### Commission Calculation
```typescript
// Dynamic rate based on order amount
const minRate = 0.5; // 0.5%
const maxRate = 2.5; // 2.5%
const baseAmount = 50000; // ₦50k
const scaleFactor = Math.min(orderAmount / baseAmount, 5);
const rate = minRate + ((maxRate - minRate) * (scaleFactor - 1) / 4);
```

### Growth Qualification Logic
- **GA**: 100+ referrals + ₦600k total spend in first year + city limit
- **GE**: 1000+ referrals + ₦600k/year per referral for 2+ consecutive years + city limit

### City Revenue Distribution
- Calculate total city revenue for completed orders
- Take 1% share and distribute equally among all GE in that city
- Run monthly for each city with Growth Elites

## Usage Examples

### Create a Referral
```typescript
const referral = await referralsService.create({
  referralCode: 'REF123456',
  referredUserId: 'user123',
});
```

### Process Commission for Order
```typescript
const commissions = await commissionService.processCommissionsForOrder(orderId);
```

### Check Growth Qualification
```typescript
const qualification = await growthManagementService.checkGrowthQualification(userId);
```

### Promote to Growth Associate
```typescript
const user = await growthManagementService.promoteToGrowthAssociate(userId);
```

## Monitoring and Analytics

### Commission Statistics
- Total earned, pending, and processed commissions
- Commission breakdown by type
- Monthly commission trends

### Growth Statistics
- Total GA and GE counts by city
- Qualification metrics for users
- Revenue distribution reports

## Error Handling

- Comprehensive error logging for all operations
- Graceful handling of missing data
- Transaction rollback for failed operations
- Detailed error reporting in scheduled tasks

## Performance Considerations

- Optimized database queries with proper indexing
- Batch processing for large datasets
- Efficient aggregation pipelines for analytics
- Background processing for scheduled tasks

## Security

- Role-based access control for admin endpoints
- JWT authentication for all protected routes
- Input validation and sanitization
- Audit logging for all promotional activities
