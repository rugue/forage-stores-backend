import { 
  Controller, 
  Get, 
  Post, 
  Query, 
  Body, 
  UseGuards, 
  Logger,
  HttpCode,
  HttpStatus,
  Param 
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth,
  ApiQuery,
  ApiParam 
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserAnalyticsService } from './user-analytics.service';
import {
  UserSpendingFilterDto,
  ChartRequestDto,
  DashboardConfigDto,
  SpendingReportDto,
  CategoryBreakdownDto,
  SpendingComparisonDto
} from './dto';
import { ANALYTICS_CONSTANTS } from './constants';

@ApiTags('analytics')
@Controller('analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class ExpenseTrackingController {
  private readonly logger = new Logger(ExpenseTrackingController.name);

  constructor(
    private readonly userAnalyticsService: UserAnalyticsService
  ) {}

  /**
   * Get comprehensive expense tracking dashboard
   */
  @Get('dashboard')
  @ApiOperation({ 
    summary: 'Get user expense tracking dashboard',
    description: 'Retrieve comprehensive dashboard with spending overview, charts, and insights'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns expense tracking dashboard with analytics and charts'
  })
  @ApiResponse({ 
    status: 404, 
    description: 'No orders found for user'
  })
  @ApiQuery({ 
    name: 'startDate', 
    required: false, 
    description: 'Filter start date (ISO format)', 
    example: '2024-01-01' 
  })
  @ApiQuery({ 
    name: 'endDate', 
    required: false, 
    description: 'Filter end date (ISO format)', 
    example: '2024-12-31' 
  })
  @ApiQuery({ 
    name: 'categoryIds', 
    required: false, 
    description: 'Filter by category IDs (comma-separated)', 
    example: '507f1f77bcf86cd799439011,507f1f77bcf86cd799439012' 
  })
  @ApiQuery({ 
    name: 'period', 
    required: false, 
    description: 'Analytics grouping period',
    enum: ['daily', 'weekly', 'monthly', 'yearly'],
    example: 'monthly' 
  })
  @ApiQuery({ 
    name: 'includeSpendingTrends', 
    required: false, 
    description: 'Include spending trends chart', 
    example: true 
  })
  @ApiQuery({ 
    name: 'includeCategoryBreakdown', 
    required: false, 
    description: 'Include category breakdown chart', 
    example: true 
  })
  @ApiQuery({ 
    name: 'includeInsights', 
    required: false, 
    description: 'Include insights and comparisons', 
    example: true 
  })
  async getExpenseTrackingDashboard(
    @CurrentUser() user: any,
    @Query() filterDto: UserSpendingFilterDto,
    @Query() configDto: DashboardConfigDto
  ) {
    this.logger.log(`Getting expense dashboard for user: ${user.id}`);
    
    // Parse comma-separated categoryIds if provided
    if (filterDto.categoryIds && typeof filterDto.categoryIds === 'string') {
      filterDto.categoryIds = (filterDto.categoryIds as string).split(',').filter(id => id.trim());
    }

    return await this.userAnalyticsService.getExpenseTrackingDashboard(
      user.id,
      filterDto,
      configDto
    );
  }

  /**
   * Get personal spending breakdown with charts
   */
  @Get('spending-breakdown')
  @ApiOperation({ 
    summary: 'Get personal spending breakdown',
    description: 'Retrieve detailed spending breakdown by categories with pie and bar charts'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns spending breakdown with category analysis and charts'
  })
  @ApiQuery({ 
    name: 'includeSubcategories', 
    required: false, 
    description: 'Include subcategories in breakdown', 
    example: false 
  })
  @ApiQuery({ 
    name: 'minPercentage', 
    required: false, 
    description: 'Minimum percentage to include category', 
    example: 1 
  })
  async getPersonalSpendingBreakdown(
    @CurrentUser() user: any,
    @Query() breakdownDto: CategoryBreakdownDto
  ) {
    this.logger.log(`Getting spending breakdown for user: ${user.id}`);
    
    // Parse comma-separated categoryIds if provided
    if (breakdownDto.categoryIds && typeof breakdownDto.categoryIds === 'string') {
      breakdownDto.categoryIds = (breakdownDto.categoryIds as string).split(',').filter(id => id.trim());
    }

    return await this.userAnalyticsService.getPersonalSpendingBreakdown(
      user.id,
      breakdownDto
    );
  }

  /**
   * Get histogram and pie chart visualizations
   */
  @Get('charts/:chartType')
  @ApiOperation({ 
    summary: 'Get specific chart visualization',
    description: 'Generate histogram, pie chart, bar chart, or line chart visualizations'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns chart data and optional configuration'
  })
  @ApiParam({ 
    name: 'chartType', 
    enum: ['pie', 'bar', 'line', 'histogram', 'area'],
    description: 'Type of chart to generate' 
  })
  @ApiQuery({ 
    name: 'title', 
    required: false, 
    description: 'Chart title', 
    example: 'Monthly Spending Breakdown' 
  })
  @ApiQuery({ 
    name: 'includeConfig', 
    required: false, 
    description: 'Include chart configuration', 
    example: false 
  })
  async getSpendingVisualization(
    @CurrentUser() user: any,
    @Param('chartType') chartType: 'pie' | 'bar' | 'line' | 'histogram' | 'area',
    @Query() filterDto: UserSpendingFilterDto,
    @Query('title') title?: string,
    @Query('includeConfig') includeConfig?: boolean
  ) {
    this.logger.log(`Generating ${chartType} chart for user: ${user.id}`);
    
    // Parse comma-separated categoryIds if provided
    if (filterDto.categoryIds && typeof filterDto.categoryIds === 'string') {
      filterDto.categoryIds = (filterDto.categoryIds as string).split(',').filter(id => id.trim());
    }

    const chartDto: ChartRequestDto = {
      chartType,
      title,
      includeConfig: Boolean(includeConfig)
    };

    return await this.userAnalyticsService.getSpendingVisualizations(
      user.id,
      filterDto,
      chartDto
    );
  }

  /**
   * Generate monthly/yearly spending reports
   */
  @Post('reports')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Generate spending report',
    description: 'Generate comprehensive spending reports (summary, detailed, or comparison)'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns generated spending report'
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Invalid report configuration'
  })
  async generateSpendingReport(
    @CurrentUser() user: any,
    @Body() reportDto: SpendingReportDto
  ) {
    this.logger.log(`Generating ${reportDto.reportType} report for user: ${user.id}`);

    return await this.userAnalyticsService.generateSpendingReport(
      user.id,
      reportDto
    );
  }

  /**
   * Get spending comparison between periods
   */
  @Post('comparison')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Compare spending between periods',
    description: 'Compare spending patterns between current and previous periods'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns spending comparison analysis'
  })
  async getSpendingComparison(
    @CurrentUser() user: any,
    @Body() comparisonDto: SpendingComparisonDto
  ) {
    this.logger.log(`Comparing spending periods for user: ${user.id}`);

    return await this.userAnalyticsService.getSpendingComparison(
      user.id,
      comparisonDto
    );
  }

  /**
   * Get quick spending insights
   */
  @Get('insights')
  @ApiOperation({ 
    summary: 'Get quick spending insights',
    description: 'Get key spending insights and recommendations'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns spending insights and recommendations'
  })
  @ApiQuery({ 
    name: 'period', 
    required: false, 
    description: 'Analysis period',
    enum: ['weekly', 'monthly', 'quarterly', 'yearly'],
    example: 'monthly' 
  })
  async getSpendingInsights(
    @CurrentUser() user: any,
    @Query('period') period: string = 'monthly'
  ) {
    this.logger.log(`Getting spending insights for user: ${user.id}`);
    
    // Calculate date range based on period
    const now = new Date();
    let startDate: Date;
    
    switch (period) {
      case 'weekly':
        startDate = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
        break;
      case 'quarterly':
        startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
        break;
      case 'yearly':
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        break;
      default: // monthly
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    }

    const dashboard = await this.userAnalyticsService.getExpenseTrackingDashboard(
      user.id,
      { startDate, endDate: now },
      { includeInsights: true, includeCategoryBreakdown: false, includeSpendingTrends: false }
    );

    return {
      period,
      insights: dashboard.insights,
      overview: dashboard.overview
    };
  }

  /**
   * Get spending statistics
   */
  @Get('statistics')
  @ApiOperation({ 
    summary: 'Get spending statistics',
    description: 'Get comprehensive spending statistics and metrics'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns spending statistics'
  })
  @ApiQuery({ 
    name: 'includeComparisons', 
    required: false, 
    description: 'Include period comparisons', 
    example: true 
  })
  async getSpendingStatistics(
    @CurrentUser() user: any,
    @Query() filterDto: UserSpendingFilterDto,
    @Query('includeComparisons') includeComparisons?: boolean
  ) {
    this.logger.log(`Getting spending statistics for user: ${user.id}`);

    // Parse comma-separated categoryIds if provided
    if (filterDto.categoryIds && typeof filterDto.categoryIds === 'string') {
      filterDto.categoryIds = (filterDto.categoryIds as string).split(',').filter(id => id.trim());
    }

    const dashboard = await this.userAnalyticsService.getExpenseTrackingDashboard(
      user.id,
      filterDto,
      { 
        includeSpendingTrends: false,
        includeCategoryBreakdown: false,
        includeInsights: Boolean(includeComparisons)
      }
    );

    return {
      statistics: dashboard.overview,
      insights: includeComparisons ? dashboard.insights : undefined
    };
  }

  /**
   * Get category-wise spending analysis
   */
  @Get('categories')
  @ApiOperation({ 
    summary: 'Get category-wise spending analysis',
    description: 'Analyze spending patterns across different product categories'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns category spending analysis'
  })
  @ApiQuery({ 
    name: 'limit', 
    required: false, 
    description: 'Number of top categories to return', 
    example: 10 
  })
  @ApiQuery({ 
    name: 'minPercentage', 
    required: false, 
    description: 'Minimum spending percentage to include', 
    example: 1 
  })
  async getCategorySpendingAnalysis(
    @CurrentUser() user: any,
    @Query() filterDto: UserSpendingFilterDto,
    @Query('limit') limit: number = 10,
    @Query('minPercentage') minPercentage: number = 0
  ) {
    this.logger.log(`Getting category analysis for user: ${user.id}`);

    // Parse comma-separated categoryIds if provided
    if (filterDto.categoryIds && typeof filterDto.categoryIds === 'string') {
      filterDto.categoryIds = (filterDto.categoryIds as string).split(',').filter(id => id.trim());
    }

    const breakdownDto: CategoryBreakdownDto = {
      ...filterDto,
      minPercentage
    };

    const breakdown = await this.userAnalyticsService.getPersonalSpendingBreakdown(
      user.id,
      breakdownDto
    );

    return {
      totalCategories: breakdown.categoryBreakdown.length,
      topCategories: breakdown.categoryBreakdown.slice(0, limit),
      totalSpending: breakdown.totalSpending,
      charts: {
        pieChart: breakdown.charts.pieChart.slice(0, limit)
      }
    };
  }

  /**
   * Health check endpoint for analytics module
   */
  @Get('health')
  @ApiOperation({ 
    summary: 'Analytics module health check',
    description: 'Check if analytics module is functioning properly'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns health status'
  })
  async getHealthCheck() {
    return {
      status: 'healthy',
      module: 'analytics',
      timestamp: new Date(),
      version: '1.0.0',
      message: ANALYTICS_CONSTANTS.MESSAGES.ANALYTICS_COMPUTED
    };
  }
}
