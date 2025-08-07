import { IsString, IsOptional, IsNumber, Min, IsEnum, IsArray, IsDate, IsMongoId, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Base filter for user spending analytics
 */
export class UserSpendingFilterDto {
  @ApiPropertyOptional({ 
    description: 'Start date for analytics period',
    example: '2024-01-01'
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  startDate?: Date;

  @ApiPropertyOptional({ 
    description: 'End date for analytics period',
    example: '2024-12-31'
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  endDate?: Date;

  @ApiPropertyOptional({ 
    description: 'Filter by specific categories',
    type: [String],
    example: ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012']
  })
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  categoryIds?: string[];

  @ApiPropertyOptional({ 
    description: 'Minimum order amount to include',
    example: 1000
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  minAmount?: number;

  @ApiPropertyOptional({ 
    description: 'Maximum order amount to include',
    example: 50000
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  maxAmount?: number;

  @ApiPropertyOptional({ 
    description: 'Analytics grouping period',
    enum: ['daily', 'weekly', 'monthly', 'yearly'],
    example: 'monthly'
  })
  @IsOptional()
  @IsEnum(['daily', 'weekly', 'monthly', 'yearly'])
  period?: 'daily' | 'weekly' | 'monthly' | 'yearly';

  @ApiPropertyOptional({ 
    description: 'Payment methods to include',
    type: [String],
    example: ['food_money', 'card']
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  paymentMethods?: string[];
}

/**
 * Chart type specification for analytics requests
 */
export class ChartRequestDto {
  @ApiProperty({ 
    description: 'Type of chart to generate',
    enum: ['pie', 'bar', 'line', 'histogram', 'area'],
    example: 'pie'
  })
  @IsEnum(['pie', 'bar', 'line', 'histogram', 'area'])
  chartType: 'pie' | 'bar' | 'line' | 'histogram' | 'area';

  @ApiPropertyOptional({ 
    description: 'Chart title',
    example: 'Monthly Spending Breakdown'
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ 
    description: 'Include chart configuration',
    default: false
  })
  @IsOptional()
  @IsBoolean()
  includeConfig?: boolean;
}

/**
 * Expense dashboard configuration
 */
export class DashboardConfigDto {
  @ApiPropertyOptional({ 
    description: 'Include spending trends chart',
    default: true
  })
  @IsOptional()
  @IsBoolean()
  includeSpendingTrends?: boolean;

  @ApiPropertyOptional({ 
    description: 'Include category breakdown chart',
    default: true
  })
  @IsOptional()
  @IsBoolean()
  includeCategoryBreakdown?: boolean;

  @ApiPropertyOptional({ 
    description: 'Include monthly spending chart',
    default: true
  })
  @IsOptional()
  @IsBoolean()
  includeMonthlySpending?: boolean;

  @ApiPropertyOptional({ 
    description: 'Include spending histogram',
    default: true
  })
  @IsOptional()
  @IsBoolean()
  includeSpendingHistogram?: boolean;

  @ApiPropertyOptional({ 
    description: 'Include payment methods chart',
    default: true
  })
  @IsOptional()
  @IsBoolean()
  includePaymentMethods?: boolean;

  @ApiPropertyOptional({ 
    description: 'Number of top categories to show',
    default: 10
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  topCategoriesLimit?: number;

  @ApiPropertyOptional({ 
    description: 'Include insights and comparisons',
    default: true
  })
  @IsOptional()
  @IsBoolean()
  includeInsights?: boolean;
}

/**
 * Spending report configuration
 */
export class SpendingReportDto extends UserSpendingFilterDto {
  @ApiProperty({ 
    description: 'Report type',
    enum: ['summary', 'detailed', 'comparison'],
    example: 'summary'
  })
  @IsEnum(['summary', 'detailed', 'comparison'])
  reportType: 'summary' | 'detailed' | 'comparison';

  @ApiPropertyOptional({ 
    description: 'Include chart data in report',
    default: false
  })
  @IsOptional()
  @IsBoolean()
  includeCharts?: boolean;

  @ApiPropertyOptional({ 
    description: 'Export format',
    enum: ['json', 'csv', 'pdf'],
    default: 'json'
  })
  @IsOptional()
  @IsEnum(['json', 'csv', 'pdf'])
  format?: 'json' | 'csv' | 'pdf';

  @ApiPropertyOptional({ 
    description: 'Group by field for detailed reports',
    enum: ['category', 'payment_method', 'month', 'product'],
    example: 'category'
  })
  @IsOptional()
  @IsEnum(['category', 'payment_method', 'month', 'product'])
  groupBy?: 'category' | 'payment_method' | 'month' | 'product';
}

/**
 * Category breakdown request
 */
export class CategoryBreakdownDto extends UserSpendingFilterDto {
  @ApiPropertyOptional({ 
    description: 'Include subcategories',
    default: false
  })
  @IsOptional()
  @IsBoolean()
  includeSubcategories?: boolean;

  @ApiPropertyOptional({ 
    description: 'Minimum percentage to include category',
    example: 1
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  minPercentage?: number;
}

/**
 * Spending comparison request
 */
export class SpendingComparisonDto {
  @ApiProperty({ 
    description: 'Current period start date',
    example: '2024-06-01'
  })
  @IsDate()
  @Type(() => Date)
  currentPeriodStart: Date;

  @ApiProperty({ 
    description: 'Current period end date',
    example: '2024-06-30'
  })
  @IsDate()
  @Type(() => Date)
  currentPeriodEnd: Date;

  @ApiProperty({ 
    description: 'Previous period start date',
    example: '2024-05-01'
  })
  @IsDate()
  @Type(() => Date)
  previousPeriodStart: Date;

  @ApiProperty({ 
    description: 'Previous period end date',
    example: '2024-05-31'
  })
  @IsDate()
  @Type(() => Date)
  previousPeriodEnd: Date;

  @ApiPropertyOptional({ 
    description: 'Categories to compare',
    type: [String]
  })
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  categoryIds?: string[];
}
