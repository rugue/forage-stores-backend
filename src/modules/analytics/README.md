# Analytics Module

The Analytics module provides comprehensive user-facing expense tracking and spending analytics features for the Forage Stores platform.

## Overview

This module implements the missing features identified in the feature audit report for **Expense Tracking & Analytics**, specifically focusing on user-facing analytics capabilities.

### Key Features

✅ **User-facing expense tracking dashboard**
- Comprehensive spending overview with key metrics
- Monthly/yearly spending comparisons
- Growth analysis and trends

✅ **Personal spending breakdown with charts**
- Category-wise spending analysis
- Top spending categories identification
- Percentage-based breakdowns

✅ **Histogram and pie chart visualizations**
- Spending distribution histograms
- Category breakdown pie charts
- Payment method distribution
- Monthly spending bar charts
- Spending trend line charts

✅ **Monthly/yearly spending reports**
- Summary reports with key metrics
- Detailed reports grouped by category, payment method, or time period
- Period comparison reports
- Export capabilities (JSON, CSV, PDF - PDF implementation pending)

## Architecture

### Files Structure

```
src/modules/analytics/
├── analytics.module.ts              # Main module configuration
├── expense-tracking.controller.ts   # RESTful API endpoints
├── user-analytics.service.ts        # Core analytics business logic
├── dto/
│   ├── spending-analytics.dto.ts    # Request/response DTOs
│   └── index.ts                     # DTO exports
├── interfaces/
│   └── chart-data.interface.ts      # Chart and dashboard interfaces
├── constants/
│   ├── analytics.constants.ts       # Configuration and constants
│   └── index.ts                     # Constants exports
└── test/
    └── user-analytics.service.spec.ts # Unit tests
```

### Core Components

#### 1. ExpenseTrackingController
RESTful API controller providing user-facing analytics endpoints:

- `GET /analytics/dashboard` - Complete expense tracking dashboard
- `GET /analytics/spending-breakdown` - Category spending analysis
- `GET /analytics/charts/:chartType` - Specific chart visualizations
- `POST /analytics/reports` - Generate spending reports
- `POST /analytics/comparison` - Compare periods
- `GET /analytics/insights` - Quick insights and recommendations
- `GET /analytics/statistics` - Comprehensive statistics
- `GET /analytics/categories` - Category analysis
- `GET /analytics/health` - Health check

#### 2. UserAnalyticsService
Core service handling analytics calculations and data processing:

- **Dashboard Generation**: Comprehensive expense tracking dashboards
- **Chart Generation**: Pie, bar, line, histogram, and area charts
- **Spending Analysis**: Category breakdowns and trend analysis
- **Report Generation**: Summary, detailed, and comparison reports
- **Data Aggregation**: Order data processing and metrics calculation

#### 3. Chart Data Interfaces
TypeScript interfaces for strongly-typed chart data:

- `ExpenseTrackingDashboard` - Complete dashboard structure
- `PieChartData`, `BarChartData`, `LineChartData`, `HistogramData` - Chart-specific data
- `CategorySpendingData`, `PaymentMethodData` - Analytics data structures
- `SpendingComparisonData` - Period comparison data

### Data Sources

The module integrates with existing entities:

- **Order Entity** (`../orders/entities/order.entity.ts`)
- **User Entity** (`../users/entities/user.entity.ts`)

### Key Analytics Capabilities

#### Dashboard Metrics
- Total spending across all time/filtered periods
- Order count and average order value
- Most expensive single order
- Current vs previous month spending
- Spending growth percentage

#### Chart Types
1. **Pie Charts** - Category spending breakdown
2. **Bar Charts** - Monthly spending patterns
3. **Line Charts** - Spending trends over time
4. **Histograms** - Spending distribution analysis
5. **Area Charts** - Cumulative spending trends

#### Filter Options
- Date range filtering (start/end dates)
- Category filtering (specific categories)
- Amount range filtering (min/max amounts)
- Payment method filtering
- Period grouping (daily, weekly, monthly, yearly)

## API Documentation

### Authentication
All endpoints require JWT authentication via the `@UseGuards(JwtAuthGuard)` decorator.

### Key Endpoints

#### Get Expense Dashboard
```typescript
GET /analytics/dashboard
Query Parameters:
- startDate?: string (ISO date)
- endDate?: string (ISO date)  
- categoryIds?: string (comma-separated IDs)
- period?: 'daily' | 'weekly' | 'monthly' | 'yearly'
- includeSpendingTrends?: boolean
- includeCategoryBreakdown?: boolean
- includeInsights?: boolean

Response: ExpenseTrackingDashboard
```

#### Get Chart Visualization
```typescript
GET /analytics/charts/:chartType
Path Parameters:
- chartType: 'pie' | 'bar' | 'line' | 'histogram' | 'area'
Query Parameters:
- title?: string
- includeConfig?: boolean
- (filter parameters)

Response: { chartData: ChartData[], configuration?: ChartConfiguration }
```

#### Generate Report
```typescript
POST /analytics/reports
Body: SpendingReportDto {
  reportType: 'summary' | 'detailed' | 'comparison'
  format?: 'json' | 'csv' | 'pdf'
  groupBy?: 'category' | 'payment_method' | 'month' | 'product'
  includeCharts?: boolean
  // ... filter parameters
}

Response: Generated report data
```

## Usage Examples

### Getting Dashboard Data
```typescript
// Get complete dashboard for last 3 months
GET /analytics/dashboard?startDate=2024-04-01&endDate=2024-06-30&period=monthly

// Get dashboard filtered by grocery categories
GET /analytics/dashboard?categoryIds=507f1f77bcf86cd799439011,507f1f77bcf86cd799439012
```

### Generating Charts
```typescript
// Get pie chart of category spending
GET /analytics/charts/pie?title=Category%20Spending&includeConfig=true

// Get monthly spending histogram
GET /analytics/charts/histogram?period=monthly
```

### Creating Reports
```typescript
POST /analytics/reports
{
  "reportType": "detailed",
  "groupBy": "category", 
  "startDate": "2024-01-01",
  "endDate": "2024-06-30",
  "includeCharts": true,
  "format": "json"
}
```

## Configuration

The module includes comprehensive configuration via `ANALYTICS_CONSTANTS`:

- **Chart Colors**: Predefined color palette for visualizations
- **Chart Limits**: Maximum items for different chart types
- **Cache Settings**: TTL values for performance optimization
- **Default Values**: Pagination, periods, and thresholds
- **Error Messages**: Standardized error responses

## Integration

### Module Registration
The AnalyticsModule is registered in `app.module.ts`:

```typescript
import { AnalyticsModule } from './modules/analytics/analytics.module';

@Module({
  imports: [
    // ... other modules
    AnalyticsModule,
  ],
})
export class AppModule {}
```

### Swagger Documentation
Analytics endpoints are documented under the `analytics` tag in Swagger UI:

```typescript
// main.ts
.addTag('analytics', 'User expense tracking and spending analytics endpoints')
```

## Testing

Unit tests are provided in `test/user-analytics.service.spec.ts` covering:

- Dashboard generation
- Chart visualization creation
- Spending breakdown analysis
- Report generation
- Error handling scenarios

Run tests with:
```bash
npm test -- --testPathPattern=analytics
```

## Performance Considerations

1. **Data Aggregation**: Large datasets are processed efficiently using MongoDB aggregation
2. **Caching**: Configurable TTL for frequently accessed analytics
3. **Pagination**: Limits on chart data points to prevent performance issues
4. **Filtering**: Database-level filtering to reduce memory usage

## Security

- **Authentication**: JWT-based authentication required for all endpoints
- **Authorization**: Users can only access their own spending analytics
- **Data Validation**: Comprehensive DTO validation for all inputs
- **Error Handling**: Secure error responses without data leakage

## Future Enhancements

Potential improvements identified:

1. **PDF Export**: Complete implementation of PDF report generation
2. **Real-time Analytics**: WebSocket-based live spending updates
3. **Advanced Insights**: ML-based spending pattern recommendations
4. **Budgeting Features**: Integration with budget tracking
5. **Caching Layer**: Redis-based caching for improved performance
6. **Data Export**: CSV and Excel export functionality

## Dependencies

- `@nestjs/mongoose` - Database integration
- `class-validator` - DTO validation
- `class-transformer` - Data transformation
- Existing Order and User entities

The Analytics module successfully implements all the missing user-facing expense tracking features identified in the audit report, providing a comprehensive solution for users to track, analyze, and understand their spending patterns on the Forage platform.
