import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Order, OrderDocument } from '../orders/entities/order.entity';
import { User, UserDocument } from '../users/entities/user.entity';
import { 
  UserSpendingFilterDto, 
  ChartRequestDto, 
  DashboardConfigDto,
  SpendingReportDto,
  CategoryBreakdownDto,
  SpendingComparisonDto
} from './dto';
import {
  ExpenseTrackingDashboard,
  PieChartData,
  BarChartData,
  LineChartData,
  HistogramData,
  SpendingTrendData,
  CategorySpendingData,
  PaymentMethodData,
  MonthlySpendingPattern,
  SpendingComparisonData,
  ChartConfiguration
} from './interfaces/chart-data.interface';
import { 
  ANALYTICS_CONSTANTS, 
  PAYMENT_METHOD_LABELS,
  ORDER_STATUS_LABELS,
  PAYMENT_PLAN_LABELS
} from './constants';

@Injectable()
export class UserAnalyticsService {
  private readonly logger = new Logger(UserAnalyticsService.name);

  constructor(
    @InjectModel(Order.name) private readonly orderModel: Model<OrderDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  /**
   * Get comprehensive expense tracking dashboard for a user
   */
  async getExpenseTrackingDashboard(
    userId: string, 
    filterDto: UserSpendingFilterDto = {},
    configDto: DashboardConfigDto = {}
  ): Promise<ExpenseTrackingDashboard> {
    this.logger.log(`Generating expense dashboard for user: ${userId}`);

    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID');
    }

    // Get user orders based on filter
    const orders = await this.getUserOrders(userId, filterDto);

    if (orders.length === 0) {
      throw new NotFoundException(ANALYTICS_CONSTANTS.ERRORS.NO_ORDERS_FOUND);
    }

    // Calculate overview metrics
    const overview = await this.calculateOverviewMetrics(orders, userId, filterDto);
    
    // Generate chart data
    const charts: any = {};
    
    if (configDto.includeSpendingTrends !== false) {
      charts.spendingTrends = this.generateSpendingTrendsChart(orders, filterDto.period || 'monthly');
    }
    
    if (configDto.includeCategoryBreakdown !== false) {
      charts.categoryBreakdown = this.generateCategoryBreakdownChart(orders);
    }
    
    if (configDto.includeMonthlySpending !== false) {
      charts.monthlySpending = this.generateMonthlySpendingChart(orders);
    }
    
    if (configDto.includeSpendingHistogram !== false) {
      charts.spendingHistogram = this.generateSpendingHistogram(orders);
    }
    
    if (configDto.includePaymentMethods !== false) {
      charts.paymentMethods = this.generatePaymentMethodsChart(orders);
    }

    // Generate insights
    let insights: any = {};
    if (configDto.includeInsights !== false) {
      insights = await this.generateInsights(orders, userId, filterDto, configDto.topCategoriesLimit || 10);
    }

    return {
      overview,
      charts,
      insights
    };
  }

  /**
   * Get personal spending breakdown with charts
   */
  async getPersonalSpendingBreakdown(
    userId: string,
    breakdownDto: CategoryBreakdownDto
  ): Promise<{
    totalSpending: number;
    categoryBreakdown: CategorySpendingData[];
    charts: {
      pieChart: PieChartData[];
      barChart: BarChartData[];
    };
  }> {
    const orders = await this.getUserOrders(userId, breakdownDto);
    
    const totalSpending = orders.reduce((sum, order) => sum + order.finalTotal, 0);
    
    // Group by categories
    const categoryMap = new Map<string, CategorySpendingData>();
    
    for (const order of orders) {
      for (const item of order.items) {
        if (!item.productId) continue;
        
        const product = item.productId as any;
        const categoryId = product?.categoryId?.toString() || 'uncategorized';
        const categoryName = product?.categoryName || 'Uncategorized';
        
        if (!categoryMap.has(categoryId)) {
          categoryMap.set(categoryId, {
            categoryId,
            categoryName,
            totalSpent: 0,
            percentage: 0,
            orderCount: 0,
            averageOrderValue: 0
          });
        }
        
        const categoryData = categoryMap.get(categoryId)!;
        categoryData.totalSpent += item.totalPrice;
        
        // Count unique orders for this category
        const orderIds = new Set<string>();
        orders.forEach(o => {
          if (o.items.some(i => {
            const prod = i.productId as any;
            return prod?.categoryId?.toString() === categoryId;
          })) {
            orderIds.add(o._id.toString());
          }
        });
        categoryData.orderCount = orderIds.size;
      }
    }
    
    // Calculate percentages and averages
    const categoryBreakdown = Array.from(categoryMap.values())
      .map(category => ({
        ...category,
        percentage: totalSpending > 0 ? (category.totalSpent / totalSpending) * 100 : 0,
        averageOrderValue: category.orderCount > 0 ? category.totalSpent / category.orderCount : 0
      }))
      .filter(category => {
        return !breakdownDto.minPercentage || category.percentage >= breakdownDto.minPercentage;
      })
      .sort((a, b) => b.totalSpent - a.totalSpent);

    // Generate charts
    const pieChart = categoryBreakdown.slice(0, ANALYTICS_CONSTANTS.CHART_LIMITS.MAX_PIE_SLICES)
      .map((category, index) => ({
        name: category.categoryName,
        value: category.totalSpent,
        percentage: category.percentage,
        color: ANALYTICS_CONSTANTS.CHART_COLORS[index % ANALYTICS_CONSTANTS.CHART_COLORS.length]
      }));

    const barChart = categoryBreakdown.slice(0, ANALYTICS_CONSTANTS.CHART_LIMITS.MAX_BAR_ITEMS)
      .map(category => ({
        name: category.categoryName,
        value: category.totalSpent,
        date: new Date() // Using current date for bar chart
      }));

    return {
      totalSpending,
      categoryBreakdown,
      charts: {
        pieChart,
        barChart
      }
    };
  }

  /**
   * Generate histogram and pie chart visualizations
   */
  async getSpendingVisualizations(
    userId: string,
    filterDto: UserSpendingFilterDto,
    chartDto: ChartRequestDto
  ): Promise<{
    chartData: PieChartData[] | BarChartData[] | LineChartData[] | HistogramData[];
    configuration?: ChartConfiguration;
  }> {
    const orders = await this.getUserOrders(userId, filterDto);
    
    let chartData: any[] = [];
    let configuration: ChartConfiguration | undefined;
    
    switch (chartDto.chartType) {
      case 'pie':
        chartData = this.generateCategoryBreakdownChart(orders);
        break;
      case 'bar':
        chartData = this.generateMonthlySpendingChart(orders);
        break;
      case 'line':
        chartData = this.generateSpendingTrendsChart(orders, filterDto.period || 'monthly');
        break;
      case 'histogram':
        chartData = this.generateSpendingHistogram(orders);
        break;
      case 'area':
        // Similar to line but with different configuration
        chartData = this.generateSpendingTrendsChart(orders, filterDto.period || 'monthly');
        break;
    }
    
    if (chartDto.includeConfig) {
      configuration = this.getChartConfiguration(chartDto.chartType, chartDto.title);
    }
    
    return { chartData, configuration };
  }

  /**
   * Generate monthly/yearly spending reports
   */
  async generateSpendingReport(
    userId: string,
    reportDto: SpendingReportDto
  ): Promise<any> {
    const orders = await this.getUserOrders(userId, reportDto);
    
    switch (reportDto.reportType) {
      case 'summary':
        return this.generateSummaryReport(orders, reportDto);
      case 'detailed':
        return this.generateDetailedReport(orders, reportDto);
      case 'comparison':
        return this.generateComparisonReport(userId, reportDto);
      default:
        throw new BadRequestException('Invalid report type');
    }
  }

  /**
   * Get spending comparison between periods
   */
  async getSpendingComparison(
    userId: string,
    comparisonDto: SpendingComparisonDto
  ): Promise<SpendingComparisonData> {
    // Get current period orders
    const currentOrders = await this.getUserOrders(userId, {
      startDate: comparisonDto.currentPeriodStart,
      endDate: comparisonDto.currentPeriodEnd,
      categoryIds: comparisonDto.categoryIds
    });

    // Get previous period orders
    const previousOrders = await this.getUserOrders(userId, {
      startDate: comparisonDto.previousPeriodStart,
      endDate: comparisonDto.previousPeriodEnd,
      categoryIds: comparisonDto.categoryIds
    });

    const currentPeriod = {
      total: currentOrders.reduce((sum, order) => sum + order.finalTotal, 0),
      count: currentOrders.length,
      average: 0
    };
    currentPeriod.average = currentPeriod.count > 0 ? currentPeriod.total / currentPeriod.count : 0;

    const previousPeriod = {
      total: previousOrders.reduce((sum, order) => sum + order.finalTotal, 0),
      count: previousOrders.length,
      average: 0
    };
    previousPeriod.average = previousPeriod.count > 0 ? previousPeriod.total / previousPeriod.count : 0;

    const growth = {
      totalGrowth: previousPeriod.total > 0 ? 
        ((currentPeriod.total - previousPeriod.total) / previousPeriod.total) * 100 : 0,
      countGrowth: previousPeriod.count > 0 ? 
        ((currentPeriod.count - previousPeriod.count) / previousPeriod.count) * 100 : 0,
      averageGrowth: previousPeriod.average > 0 ? 
        ((currentPeriod.average - previousPeriod.average) / previousPeriod.average) * 100 : 0
    };

    return {
      currentPeriod,
      previousPeriod,
      growth
    };
  }

  // PRIVATE HELPER METHODS

  private async getUserOrders(
    userId: string, 
    filterDto: UserSpendingFilterDto
  ): Promise<OrderDocument[]> {
    const query: any = { userId: new Types.ObjectId(userId) };
    
    // Date range filter
    if (filterDto.startDate || filterDto.endDate) {
      query.createdAt = {};
      if (filterDto.startDate) {
        query.createdAt.$gte = new Date(filterDto.startDate);
      }
      if (filterDto.endDate) {
        query.createdAt.$lte = new Date(filterDto.endDate);
      }
    }
    
    // Amount range filter
    if (filterDto.minAmount !== undefined || filterDto.maxAmount !== undefined) {
      query.finalTotal = {};
      if (filterDto.minAmount !== undefined) {
        query.finalTotal.$gte = filterDto.minAmount;
      }
      if (filterDto.maxAmount !== undefined) {
        query.finalTotal.$lte = filterDto.maxAmount;
      }
    }

    // Payment methods filter
    if (filterDto.paymentMethods && filterDto.paymentMethods.length > 0) {
      query['paymentHistory.paymentMethod'] = { $in: filterDto.paymentMethods };
    }

    let orders = await this.orderModel.find(query)
      .populate('userId', 'name email')
      .populate('items.productId')
      .sort({ createdAt: -1 })
      .exec();

    // Filter by categories if specified
    if (filterDto.categoryIds && filterDto.categoryIds.length > 0) {
      const categoryObjectIds = filterDto.categoryIds.map(id => new Types.ObjectId(id));
      orders = orders.filter(order => {
        return order.items.some(item => {
          const product = item.productId as any;
          return product?.categoryId && categoryObjectIds.some(catId => 
            catId.equals(product.categoryId)
          );
        });
      });
    }

    return orders;
  }

  private async calculateOverviewMetrics(
    orders: OrderDocument[],
    userId: string,
    filterDto: UserSpendingFilterDto
  ) {
    const totalSpent = orders.reduce((sum, order) => sum + order.finalTotal, 0);
    const orderCount = orders.length;
    const averageOrderValue = orderCount > 0 ? totalSpent / orderCount : 0;
    const mostExpensiveOrder = orders.length > 0 ? Math.max(...orders.map(o => o.finalTotal)) : 0;

    // Current month spending
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonthOrders = orders.filter(order => 
      new Date(order['createdAt']) >= currentMonthStart
    );
    const currentMonthSpending = currentMonthOrders.reduce((sum, order) => sum + order.finalTotal, 0);

    // Previous month spending
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    const previousMonthOrders = orders.filter(order => {
      const orderDate = new Date(order['createdAt']);
      return orderDate >= previousMonthStart && orderDate <= previousMonthEnd;
    });
    const previousMonthSpending = previousMonthOrders.reduce((sum, order) => sum + order.finalTotal, 0);

    const spendingGrowth = previousMonthSpending > 0 ? 
      ((currentMonthSpending - previousMonthSpending) / previousMonthSpending) * 100 : 0;

    return {
      totalSpent,
      orderCount,
      averageOrderValue,
      mostExpensiveOrder,
      currentMonthSpending,
      previousMonthSpending,
      spendingGrowth
    };
  }

  private generateSpendingTrendsChart(orders: OrderDocument[], period: string): LineChartData[] {
    const groupedData = new Map<string, number>();
    
    orders.forEach(order => {
      const date = new Date(order['createdAt']);
      let key: string;
      
      switch (period) {
        case 'daily':
          key = date.toISOString().split('T')[0];
          break;
        case 'weekly':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = weekStart.toISOString().split('T')[0];
          break;
        case 'yearly':
          key = date.getFullYear().toString();
          break;
        default: // monthly
          key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      }
      
      groupedData.set(key, (groupedData.get(key) || 0) + order.finalTotal);
    });

    return Array.from(groupedData.entries())
      .map(([date, value]) => ({ date, value }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-ANALYTICS_CONSTANTS.CHART_LIMITS.MAX_LINE_POINTS);
  }

  private generateCategoryBreakdownChart(orders: OrderDocument[]): PieChartData[] {
    const categoryMap = new Map<string, { name: string; value: number }>();
    let totalSpent = 0;
    
    orders.forEach(order => {
      totalSpent += order.finalTotal;
      order.items.forEach(item => {
        const product = item.productId as any;
        const categoryName = product?.categoryName || 'Uncategorized';
        
        const existing = categoryMap.get(categoryName) || { name: categoryName, value: 0 };
        existing.value += item.totalPrice;
        categoryMap.set(categoryName, existing);
      });
    });

    return Array.from(categoryMap.values())
      .map((category, index) => ({
        ...category,
        percentage: totalSpent > 0 ? (category.value / totalSpent) * 100 : 0,
        color: ANALYTICS_CONSTANTS.CHART_COLORS[index % ANALYTICS_CONSTANTS.CHART_COLORS.length]
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, ANALYTICS_CONSTANTS.CHART_LIMITS.MAX_PIE_SLICES);
  }

  private generateMonthlySpendingChart(orders: OrderDocument[]): BarChartData[] {
    const monthlyData = new Map<string, number>();
    
    orders.forEach(order => {
      const date = new Date(order['createdAt']);
      const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      
      monthlyData.set(monthKey, (monthlyData.get(monthKey) || 0) + order.finalTotal);
    });

    return Array.from(monthlyData.entries())
      .map(([month, value]) => ({
        name: month,
        value,
        date: new Date(`${month}-01`)
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(-12); // Last 12 months
  }

  private generateSpendingHistogram(orders: OrderDocument[]): HistogramData[] {
    if (orders.length === 0) return [];
    
    const amounts = orders.map(order => order.finalTotal);
    const min = Math.min(...amounts);
    const max = Math.max(...amounts);
    const binCount = Math.min(ANALYTICS_CONSTANTS.CHART_CONFIG.HISTOGRAM.binCount, amounts.length);
    const binSize = (max - min) / binCount;
    
    const histogram = new Map<string, number>();
    
    amounts.forEach(amount => {
      const binIndex = Math.min(Math.floor((amount - min) / binSize), binCount - 1);
      const binStart = min + (binIndex * binSize);
      const binEnd = binStart + binSize;
      const range = `₦${binStart.toFixed(0)} - ₦${binEnd.toFixed(0)}`;
      
      histogram.set(range, (histogram.get(range) || 0) + 1);
    });

    const totalOrders = orders.length;
    return Array.from(histogram.entries()).map(([range, frequency]) => ({
      range,
      frequency,
      percentage: (frequency / totalOrders) * 100
    }));
  }

  private generatePaymentMethodsChart(orders: OrderDocument[]): PieChartData[] {
    const paymentMethodMap = new Map<string, number>();
    let totalTransactions = 0;
    
    orders.forEach(order => {
      order.paymentHistory.forEach(payment => {
        const method = PAYMENT_METHOD_LABELS[payment.paymentMethod] || payment.paymentMethod;
        paymentMethodMap.set(method, (paymentMethodMap.get(method) || 0) + payment.amount);
        totalTransactions += payment.amount;
      });
    });

    return Array.from(paymentMethodMap.entries())
      .map(([name, value], index) => ({
        name,
        value,
        percentage: totalTransactions > 0 ? (value / totalTransactions) * 100 : 0,
        color: ANALYTICS_CONSTANTS.CHART_COLORS[index % ANALYTICS_CONSTANTS.CHART_COLORS.length]
      }))
      .sort((a, b) => b.value - a.value);
  }

  private async generateInsights(
    orders: OrderDocument[],
    userId: string,
    filterDto: UserSpendingFilterDto,
    topLimit: number
  ) {
    // Generate top categories
    const categoryBreakdown = await this.getPersonalSpendingBreakdown(userId, filterDto);
    const topCategories = categoryBreakdown.categoryBreakdown.slice(0, topLimit);

    // Generate spending patterns (monthly)
    const spendingPatterns: MonthlySpendingPattern[] = [];
    const monthlyData = new Map<string, { total: number; count: number; categories: Map<string, any> }>();
    
    orders.forEach(order => {
      const date = new Date(order['createdAt']);
      const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      
      if (!monthlyData.has(monthKey)) {
        monthlyData.set(monthKey, { total: 0, count: 0, categories: new Map() });
      }
      
      const monthData = monthlyData.get(monthKey)!;
      monthData.total += order.finalTotal;
      monthData.count += 1;
      
      // Track categories for this month
      order.items.forEach(item => {
        const product = item.productId as any;
        const categoryName = product?.categoryName || 'Uncategorized';
        const categoryId = product?.categoryId?.toString() || 'uncategorized';
        
        if (!monthData.categories.has(categoryId)) {
          monthData.categories.set(categoryId, {
            categoryId,
            categoryName,
            totalSpent: 0,
            percentage: 0,
            orderCount: 0,
            averageOrderValue: 0
          });
        }
        
        monthData.categories.get(categoryId).totalSpent += item.totalPrice;
      });
    });

    // Convert to spending patterns
    monthlyData.forEach((data, month) => {
      const categories = Array.from(data.categories.values()).map(cat => ({
        ...cat,
        percentage: data.total > 0 ? (cat.totalSpent / data.total) * 100 : 0,
        averageOrderValue: cat.totalSpent > 0 ? cat.totalSpent / data.count : 0
      }));

      spendingPatterns.push({
        month,
        totalSpent: data.total,
        orderCount: data.count,
        averageOrderValue: data.count > 0 ? data.total / data.count : 0,
        categories
      });
    });

    // Generate comparison with previous period
    const now = new Date();
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    const comparisons = await this.getSpendingComparison(userId, {
      currentPeriodStart: currentMonth,
      currentPeriodEnd: now,
      previousPeriodStart: previousMonth,
      previousPeriodEnd: previousMonthEnd
    });

    return {
      topCategories,
      spendingPatterns: spendingPatterns.sort((a, b) => b.month.localeCompare(a.month)).slice(0, 12),
      comparisons
    };
  }

  private generateSummaryReport(orders: OrderDocument[], reportDto: SpendingReportDto) {
    const totalSpent = orders.reduce((sum, order) => sum + order.finalTotal, 0);
    const orderCount = orders.length;
    const averageOrderValue = orderCount > 0 ? totalSpent / orderCount : 0;
    
    const report = {
      period: {
        startDate: reportDto.startDate,
        endDate: reportDto.endDate
      },
      summary: {
        totalSpent,
        orderCount,
        averageOrderValue,
        currency: 'NGN'
      },
      generatedAt: new Date()
    };

    if (reportDto.includeCharts) {
      const charts = {
        spendingTrends: this.generateSpendingTrendsChart(orders, reportDto.period || 'monthly'),
        categoryBreakdown: this.generateCategoryBreakdownChart(orders)
      };
      return { ...report, charts };
    }

    return report;
  }

  private generateDetailedReport(orders: OrderDocument[], reportDto: SpendingReportDto) {
    // Group by the specified field
    const groupedData = new Map();
    
    orders.forEach(order => {
      let groupKey: string;
      
      switch (reportDto.groupBy) {
        case 'category':
          // Group by dominant category in order
          const categoryCount = new Map<string, number>();
          order.items.forEach(item => {
            const product = item.productId as any;
            const categoryName = product?.categoryName || 'Uncategorized';
            categoryCount.set(categoryName, (categoryCount.get(categoryName) || 0) + item.totalPrice);
          });
          groupKey = Array.from(categoryCount.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Uncategorized';
          break;
        case 'payment_method':
          groupKey = order.paymentHistory.length > 0 ? 
            PAYMENT_METHOD_LABELS[order.paymentHistory[0].paymentMethod] || order.paymentHistory[0].paymentMethod :
            'Unknown';
          break;
        case 'month':
          const date = new Date(order['createdAt']);
          groupKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
          break;
        default:
          groupKey = 'All';
      }
      
      if (!groupedData.has(groupKey)) {
        groupedData.set(groupKey, []);
      }
      groupedData.get(groupKey).push({
        orderNumber: order.orderNumber,
        date: order['createdAt'],
        amount: order.finalTotal,
        status: order.status,
        itemCount: order.items.length
      });
    });

    return {
      period: {
        startDate: reportDto.startDate,
        endDate: reportDto.endDate
      },
      groupBy: reportDto.groupBy,
      groups: Object.fromEntries(groupedData),
      generatedAt: new Date()
    };
  }

  private async generateComparisonReport(userId: string, reportDto: SpendingReportDto) {
    // This would compare current period with previous period
    // Implementation would depend on the specific comparison logic needed
    return {
      message: 'Comparison report generation not yet implemented',
      reportType: reportDto.reportType
    };
  }

  private getChartConfiguration(type: string, title?: string): ChartConfiguration {
    const baseConfig = {
      title: title || `${type.charAt(0).toUpperCase() + type.slice(1)} Chart`,
      colors: ANALYTICS_CONSTANTS.CHART_COLORS
    };

    switch (type) {
      case 'pie':
        return {
          type: 'pie',
          ...baseConfig,
          showLegend: ANALYTICS_CONSTANTS.CHART_CONFIG.PIE_CHART.showLegend
        };
      case 'bar':
        return {
          type: 'bar',
          ...baseConfig,
          showGrid: ANALYTICS_CONSTANTS.CHART_CONFIG.BAR_CHART.showGrid,
          xAxisLabel: 'Period',
          yAxisLabel: 'Amount (₦)'
        };
      case 'line':
        return {
          type: 'line',
          ...baseConfig,
          showGrid: ANALYTICS_CONSTANTS.CHART_CONFIG.LINE_CHART.showGrid,
          xAxisLabel: 'Date',
          yAxisLabel: 'Amount (₦)'
        };
      case 'histogram':
        return {
          type: 'histogram',
          ...baseConfig,
          showGrid: ANALYTICS_CONSTANTS.CHART_CONFIG.HISTOGRAM.showGrid,
          xAxisLabel: 'Spending Range',
          yAxisLabel: 'Frequency'
        };
      default:
        return {
          type: type as any,
          ...baseConfig
        };
    }
  }
}
