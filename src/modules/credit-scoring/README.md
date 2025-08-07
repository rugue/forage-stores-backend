# Credit Scoring Module

The Credit Scoring Module provides comprehensive credit assessment, scoring, risk analysis, and management functionality for the Forage Stores backend. This module implements automated quarterly credit scoring, detailed repayment behavior analysis, advanced credit risk assessment, and credit score improvement tracking.

## Features

### Core Functionality
- **Automated Credit Scoring**: Calculate credit scores using multiple factors including payment history, credit utilization, transaction frequency, and account age
- **Risk Assessment**: Comprehensive risk analysis with four key factors: payment history, financial stability, credit behavior, and external factors
- **Credit Reporting**: Generate detailed credit reports for users and administrators
- **Credit Limit Management**: Calculate recommended credit limits based on user risk profiles and payment behavior
- **Improvement Recommendations**: Generate personalized recommendations to help users improve their credit scores

### Automated Processes
- **Quarterly Assessments**: Scheduled quarterly credit assessments for all active users
- **Monthly Score Recalculation**: Regular score updates to reflect recent payment behavior
- **Weekly Analytics**: Generate system-wide credit analytics and reporting
- **Automatic Cleanup**: Remove outdated score history to maintain performance

## API Endpoints

### User Endpoints
- `GET /credit-scoring/report` - Get user's comprehensive credit report
- `GET /credit-scoring/score` - Get current credit score
- `GET /credit-scoring/improvement-plan` - Get personalized improvement recommendations
- `GET /credit-scoring/score-history` - Get credit score history
- `POST /credit-scoring/request-assessment` - Request immediate credit assessment

### Admin Endpoints
- `GET /credit-scoring/admin/user-report/:userId` - Get any user's credit report
- `GET /credit-scoring/admin/analytics` - Get system-wide credit analytics
- `POST /credit-scoring/admin/manual-assessment` - Trigger manual assessment
- `POST /credit-scoring/admin/override-limit` - Override user's credit limit
- `POST /credit-scoring/admin/bulk-assessment` - Perform bulk credit assessments
- `GET /credit-scoring/admin/quarterly-config` - Get quarterly assessment configuration
- `POST /credit-scoring/admin/quarterly-config` - Update quarterly assessment configuration

## Data Models

### CreditCheck Entity
The main entity that stores all credit-related information for a user:
- User identification and basic info
- Current and historical credit scores
- Risk factors and assessment
- Payment behavior metrics
- Credit utilization data
- Score breakdown by category
- Improvement recommendations
- Override history

## Scheduled Tasks

The module includes several automated scheduled tasks:

### Daily Tasks (1:00 AM)
- Check for users due for quarterly assessment
- Process pending assessments

### Quarterly Tasks (1st of Jan/Apr/Jul/Oct, 2:00 AM)
- Perform comprehensive quarterly batch assessments
- Generate quarterly reports

### Monthly Tasks
- **1st of month (3:00 AM)**: Recalculate all user credit scores
- **15th of month (5:00 AM)**: Cleanup old score history entries
- **20th of month (7:00 AM)**: Update improvement recommendations

### Weekly Tasks (Sundays, 4:00 AM)
- Generate analytics reports
- System health checks

### Bi-weekly Tasks (Mondays, 6:00 AM)
- Identify users eligible for credit limit increases
- Review risk level changes

## Credit Scoring Algorithm

The credit score is calculated using weighted factors:

- **Payment History (35%)**: On-time payment rate, late payments, payment amounts
- **Credit Utilization (30%)**: Current utilization vs. approved limit
- **Transaction Frequency (15%)**: Regular usage patterns
- **Account Age (10%)**: Length of credit history
- **Credit Diversity (5%)**: Mix of credit types
- **Recent Inquiries (5%)**: Impact of recent credit checks

## Risk Assessment

Risk levels are categorized as:
- **Low Risk**: Score 740+, excellent payment history
- **Medium Risk**: Score 580-739, good payment behavior
- **High Risk**: Score 300-579, concerning payment patterns
- **Critical Risk**: Default risk, payment failures

## Usage Examples

### Calculate Credit Score
```typescript
const score = await creditScoringService.calculateCreditScore(userId);
console.log(`User's credit score: ${score}`);
```

### Generate Credit Report
```typescript
const report = await creditScoringService.generateCreditReport(userId);
console.log(`Credit limit: ${report.creditLimit}`);
console.log(`Risk level: ${report.riskLevel}`);
```

### Update Payment Behavior
```typescript
const paymentData = {
  orderId: new ObjectId(),
  paymentAmount: 2500,
  paymentDate: new Date(),
  dueDate: new Date(),
  paymentMethod: 'card',
  wasSuccessful: true,
  isOnTime: true,
  daysLate: 0,
};

await creditScoringService.updatePaymentBehavior(userId, paymentData);
```

### Get Improvement Recommendations
```typescript
const recommendations = await creditScoringService.generateImprovementRecommendations(userId);
recommendations.forEach(rec => {
  console.log(`${rec.title}: ${rec.description}`);
});
```

## Configuration

### Environment Variables
- `CREDIT_SCORING_ENABLED`: Enable/disable credit scoring (default: true)
- `QUARTERLY_ASSESSMENT_ENABLED`: Enable automatic quarterly assessments
- `EXTERNAL_CREDIT_BUREAU_API_KEY`: API key for external credit data
- `MIN_CREDIT_LIMIT`: Minimum credit limit (default: 100)
- `MAX_CREDIT_LIMIT`: Maximum credit limit (default: 100000)

### Constants
All scoring weights, thresholds, and configuration values are defined in:
`src/modules/credit-scoring/constants/credit-scoring.constants.ts`

## Integration

### Orders Module Integration
The credit scoring module integrates with the orders module to:
- Track payment behavior from completed orders
- Update credit utilization when orders are placed
- Calculate credit decisions for new orders

### Users Module Integration
- Link credit records to user accounts
- Provide credit information in user profiles
- Handle user lifecycle events

## Testing

Run the credit scoring tests:
```bash
npm test -- credit-scoring
```

The test suite covers:
- Credit score calculations
- Risk assessments
- Report generation
- Payment behavior updates
- Analytics generation

## Security

- All admin endpoints require proper authentication and authorization
- User data is protected and only accessible to authorized personnel
- Credit overrides are logged with admin user information
- Sensitive credit data is encrypted at rest

## Monitoring

The module provides comprehensive logging for:
- Scoring calculations and changes
- Risk level changes
- Manual overrides
- System errors and warnings
- Performance metrics

## Future Enhancements

Planned features include:
- Machine learning-based scoring improvements
- Integration with external credit bureaus
- Real-time fraud detection
- Advanced analytics and reporting
- Mobile notifications for score changes
- Credit education and tips

## Support

For questions or issues related to the credit scoring module, please contact the development team or create an issue in the project repository.
