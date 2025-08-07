/**
 * Chart Data Interfaces for Analytics Module
 * Provides type definitions for various chart visualizations
 */

export interface ChartDataPoint {
  label: string;
  value: number;
  date?: Date;
  category?: string;
  percentage?: number;
}

export interface PieChartData {
  name: string;
  value: number;
  percentage: number;
  color?: string;
}

export interface BarChartData {
  name: string;
  value: number;
  date: Date;
}

export interface LineChartData {
  date: string;
  value: number;
  cumulativeValue?: number;
}

export interface HistogramData {
  range: string;
  frequency: number;
  percentage: number;
}

export interface SpendingTrendData {
  period: string;
  totalSpent: number;
  orderCount: number;
  averageOrderValue: number;
}

export interface CategorySpendingData {
  categoryId: string;
  categoryName: string;
  totalSpent: number;
  percentage: number;
  orderCount: number;
  averageOrderValue: number;
}

export interface PaymentMethodData {
  method: string;
  totalSpent: number;
  percentage: number;
  transactionCount: number;
}

export interface MonthlySpendingPattern {
  month: string;
  totalSpent: number;
  orderCount: number;
  averageOrderValue: number;
  categories: CategorySpendingData[];
}

export interface SpendingComparisonData {
  currentPeriod: {
    total: number;
    count: number;
    average: number;
  };
  previousPeriod: {
    total: number;
    count: number;
    average: number;
  };
  growth: {
    totalGrowth: number;
    countGrowth: number;
    averageGrowth: number;
  };
}

export interface ExpenseTrackingDashboard {
  overview: {
    totalSpent: number;
    orderCount: number;
    averageOrderValue: number;
    mostExpensiveOrder: number;
    currentMonthSpending: number;
    previousMonthSpending: number;
    spendingGrowth: number;
  };
  charts: {
    spendingTrends: LineChartData[];
    categoryBreakdown: PieChartData[];
    monthlySpending: BarChartData[];
    spendingHistogram: HistogramData[];
    paymentMethods: PieChartData[];
  };
  insights: {
    topCategories: CategorySpendingData[];
    spendingPatterns: MonthlySpendingPattern[];
    comparisons: SpendingComparisonData;
  };
}

export interface ChartConfiguration {
  type: 'pie' | 'bar' | 'line' | 'histogram' | 'area';
  title: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  colors?: string[];
  showLegend?: boolean;
  showGrid?: boolean;
}

export interface DashboardFilter {
  startDate?: Date;
  endDate?: Date;
  categoryIds?: string[];
  paymentMethods?: string[];
  minAmount?: number;
  maxAmount?: number;
  period?: 'daily' | 'weekly' | 'monthly' | 'yearly';
}
