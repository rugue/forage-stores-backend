import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { Types } from 'mongoose';
import { CreditScoringService } from './credit-scoring.service';
import { JwtAuthGuard, RolesGuard } from '../auth/guards';
import { Roles, CurrentUser } from '../auth/decorators';
import { UserRole } from '../users/entities/user.entity';
import { ParseObjectIdPipe } from '../../common/pipes/parse-object-id.pipe';
import {
  UpdatePaymentBehaviorDto,
  CreditOverrideDto,
  CreditLimitUpdateDto,
  CreditAssessmentFilterDto,
  BulkCreditAssessmentDto,
  QuarterlyAssessmentConfigDto,
  CreditDecisionDto,
  ExternalCreditDataDto,
  CreditScoreHistoryDto,
  CreditAnalyticsFilterDto,
  CreditImprovementPlanDto,
  CreditReportResponseDto,
  CreditScoreCalculationResponseDto,
} from './dto/credit-scoring.dto';
import { CreditRiskLevel, CreditAssessmentType } from './entities/credit-check.entity';

@ApiTags('credit-scoring')
@Controller('credit-scoring')
export class CreditScoringController {
  constructor(private readonly creditScoringService: CreditScoringService) {}

  // User endpoints (authenticated users can access their own credit information)

  @Get('my-report')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get current user credit report' })
  @ApiResponse({
    status: 200,
    description: 'Credit report retrieved successfully',
    type: CreditReportResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Credit record not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMyReport(@CurrentUser() user: any) {
    const userId = new Types.ObjectId(user.id);
    return this.creditScoringService.generateCreditReport(userId);
  }

  @Get('my-score')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get current user credit score' })
  @ApiResponse({
    status: 200,
    description: 'Credit score retrieved successfully',
    type: CreditScoreCalculationResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMyScore(@CurrentUser() user: any) {
    const userId = new Types.ObjectId(user.id);
    const score = await this.creditScoringService.calculateCreditScore(userId);
    const report = await this.creditScoringService.generateCreditReport(userId);
    
    return {
      userId: user.id,
      creditScore: score,
      previousScore: report.previousScore,
      scoreChange: report.scoreChange,
      breakdown: report.scoreBreakdown,
      influencingFactors: report.improvementRecommendations.slice(0, 3),
      calculatedAt: new Date(),
    };
  }

  @Get('my-improvement-tracking')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get credit score improvement tracking for current user' })
  @ApiResponse({
    status: 200,
    description: 'Score improvement data retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMyImprovementTracking(@CurrentUser() user: any) {
    const userId = new Types.ObjectId(user.id);
    return this.creditScoringService.trackScoreImprovement(userId);
  }

  @Get('my-recommendations')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get personalized credit improvement recommendations' })
  @ApiResponse({
    status: 200,
    description: 'Recommendations retrieved successfully',
    type: [String],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMyRecommendations(@CurrentUser() user: any) {
    const userId = new Types.ObjectId(user.id);
    return this.creditScoringService.generateImprovementRecommendations(userId);
  }

  @Post('my-payment-behavior')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update payment behavior (typically called by order system)' })
  @ApiResponse({
    status: 201,
    description: 'Payment behavior updated successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid payment data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @HttpCode(HttpStatus.OK)
  async updateMyPaymentBehavior(
    @CurrentUser() user: any,
    @Body() updatePaymentDto: UpdatePaymentBehaviorDto,
  ) {
    const userId = new Types.ObjectId(user.id);
    const paymentData = {
      orderId: new Types.ObjectId(updatePaymentDto.orderId),
      paymentAmount: updatePaymentDto.paymentAmount,
      dueDate: new Date(updatePaymentDto.dueDate),
      actualPaymentDate: updatePaymentDto.actualPaymentDate 
        ? new Date(updatePaymentDto.actualPaymentDate) 
        : undefined,
      isOnTime: updatePaymentDto.isOnTime,
      daysLate: updatePaymentDto.daysLate,
      paymentMethod: updatePaymentDto.paymentMethod,
      wasSuccessful: updatePaymentDto.wasSuccessful,
    };

    return this.creditScoringService.updatePaymentBehavior(userId, paymentData);
  }

  // Admin endpoints

  @Get('admin/reports')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get credit reports for all users (Admin only)' })
  @ApiQuery({ name: 'riskLevel', required: false, enum: CreditRiskLevel })
  @ApiQuery({ name: 'assessmentType', required: false, enum: CreditAssessmentType })
  @ApiQuery({ name: 'minScore', required: false, type: Number })
  @ApiQuery({ name: 'maxScore', required: false, type: Number })
  @ApiQuery({ name: 'dueForAssessment', required: false, type: Boolean })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
  @ApiResponse({
    status: 200,
    description: 'Credit reports retrieved successfully',
    type: [CreditReportResponseDto],
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  async getAllReports(@Query() filterDto: CreditAssessmentFilterDto) {
    // Implementation would fetch all reports with filtering
    // For now, return placeholder
    return {
      message: 'Credit reports filtering functionality',
      filters: filterDto,
      note: 'This would return filtered credit reports for all users',
    };
  }

  @Get('admin/users/:userId/report')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get credit report for specific user (Admin only)' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'User credit report retrieved successfully',
    type: CreditReportResponseDto,
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  async getUserReport(@Param('userId', ParseObjectIdPipe) userId: Types.ObjectId) {
    return this.creditScoringService.generateCreditReport(userId);
  }

  @Post('admin/users/:userId/calculate-score')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Manually trigger credit score calculation for user (Admin only)' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({
    status: 201,
    description: 'Credit score calculated successfully',
    type: CreditScoreCalculationResponseDto,
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  async calculateUserScore(@Param('userId', ParseObjectIdPipe) userId: Types.ObjectId) {
    const score = await this.creditScoringService.calculateCreditScore(userId);
    const report = await this.creditScoringService.generateCreditReport(userId);
    
    return {
      userId: userId.toString(),
      creditScore: score,
      previousScore: report.previousScore,
      scoreChange: report.scoreChange,
      breakdown: report.scoreBreakdown,
      influencingFactors: report.improvementRecommendations.slice(0, 3),
      calculatedAt: new Date(),
    };
  }

  @Post('admin/users/:userId/quarterly-assessment')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Manually trigger quarterly assessment for user (Admin only)' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({
    status: 201,
    description: 'Quarterly assessment completed successfully',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  async performQuarterlyAssessment(@Param('userId', ParseObjectIdPipe) userId: Types.ObjectId) {
    return this.creditScoringService.performQuarterlyAssessment(userId);
  }

  @Post('admin/bulk-assessment')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Perform bulk credit assessments (Admin only)' })
  @ApiResponse({
    status: 201,
    description: 'Bulk assessments started successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid user IDs provided' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  async performBulkAssessment(@Body() bulkAssessmentDto: BulkCreditAssessmentDto) {
    const results = [];
    
    for (const userIdString of bulkAssessmentDto.userIds) {
      try {
        const userId = new Types.ObjectId(userIdString);
        
        if (bulkAssessmentDto.assessmentType === CreditAssessmentType.QUARTERLY) {
          const result = await this.creditScoringService.performQuarterlyAssessment(userId);
          results.push({ userId: userIdString, status: 'completed', result });
        } else {
          const score = await this.creditScoringService.calculateCreditScore(userId);
          results.push({ userId: userIdString, status: 'completed', score });
        }
      } catch (error) {
        results.push({ 
          userId: userIdString, 
          status: 'failed', 
          error: error.message 
        });
      }
    }

    return {
      message: 'Bulk assessment completed',
      totalProcessed: bulkAssessmentDto.userIds.length,
      results,
    };
  }

  @Post('admin/scheduled-assessments')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Manually trigger scheduled quarterly assessments (Admin only)' })
  @ApiResponse({
    status: 201,
    description: 'Scheduled assessments processed successfully',
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  async processScheduledAssessments() {
    return this.creditScoringService.processScheduledAssessments();
  }

  @Patch('admin/users/:userId/credit-override')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Manual credit override for user (Admin only)' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'Credit override applied successfully',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  async applyCreditOverride(
    @Param('userId', ParseObjectIdPipe) userId: Types.ObjectId,
    @Body() overrideDto: CreditOverrideDto,
    @CurrentUser() admin: any,
  ) {
    const adminId = new Types.ObjectId(admin.id);
    const overrideData = {
      creditScore: overrideDto.creditScore,
      creditLimit: overrideDto.creditLimit,
      riskLevel: overrideDto.riskLevel,
      reason: overrideDto.reason,
      notes: overrideDto.notes,
      expiryDate: overrideDto.expiryDate ? new Date(overrideDto.expiryDate) : undefined,
    };

    await this.creditScoringService.manualCreditOverride(userId, overrideData, adminId);

    return {
      message: 'Credit override applied successfully',
      userId: userId.toString(),
      appliedBy: admin.id,
      appliedAt: new Date(),
    };
  }

  @Patch('admin/users/:userId/credit-limit')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update user credit limit (Admin only)' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'Credit limit updated successfully',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  async updateCreditLimit(
    @Param('userId', ParseObjectIdPipe) userId: Types.ObjectId,
    @Body() updateLimitDto: CreditLimitUpdateDto,
  ) {
    await this.creditScoringService.updateCreditLimit(
      userId,
      updateLimitDto.newLimit,
      updateLimitDto.reason,
    );

    return {
      message: 'Credit limit updated successfully',
      userId: userId.toString(),
      newLimit: updateLimitDto.newLimit,
      reason: updateLimitDto.reason,
      updatedAt: new Date(),
    };
  }

  @Get('admin/analytics')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get comprehensive credit analytics (Admin only)' })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiQuery({ name: 'groupBy', required: false, enum: ['riskLevel', 'scoreRange', 'month', 'quarter'] })
  @ApiQuery({ name: 'includeDetails', required: false, type: Boolean })
  @ApiResponse({
    status: 200,
    description: 'Credit analytics retrieved successfully',
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  async getCreditAnalytics(@Query() filterDto: CreditAnalyticsFilterDto) {
    const analytics = await this.creditScoringService.getCreditAnalytics();
    
    return {
      ...analytics,
      generatedAt: new Date(),
      filters: filterDto,
    };
  }

  @Get('admin/users/:userId/score-history')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get user credit score history (Admin only)' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiQuery({ name: 'granularity', required: false, enum: ['daily', 'weekly', 'monthly', 'quarterly'] })
  @ApiResponse({
    status: 200,
    description: 'Score history retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  async getUserScoreHistory(
    @Param('userId', ParseObjectIdPipe) userId: Types.ObjectId,
    @Query() historyDto: CreditScoreHistoryDto,
  ) {
    const improvement = await this.creditScoringService.trackScoreImprovement(userId);
    
    // Filter score history based on date range if provided
    let scoreHistory = improvement.scoreHistory;
    
    if (historyDto.startDate) {
      const startDate = new Date(historyDto.startDate);
      scoreHistory = scoreHistory.filter(entry => entry.date >= startDate);
    }
    
    if (historyDto.endDate) {
      const endDate = new Date(historyDto.endDate);
      scoreHistory = scoreHistory.filter(entry => entry.date <= endDate);
    }

    return {
      userId: userId.toString(),
      scoreHistory,
      overallTrend: improvement.overallTrend,
      averageMonthlyChange: improvement.averageMonthlyChange,
      bestScore: improvement.bestScore,
      worstScore: improvement.worstScore,
      currentStreak: improvement.currentStreak,
      granularity: historyDto.granularity || 'monthly',
    };
  }

  @Post('admin/improvement-plan/:userId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create credit improvement plan for user (Admin only)' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({
    status: 201,
    description: 'Improvement plan created successfully',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  async createImprovementPlan(
    @Param('userId', ParseObjectIdPipe) userId: Types.ObjectId,
    @Body() planDto: CreditImprovementPlanDto,
  ) {
    const recommendations = await this.creditScoringService.generateImprovementRecommendations(userId);
    const currentReport = await this.creditScoringService.generateCreditReport(userId);
    
    return {
      message: 'Credit improvement plan created',
      userId: userId.toString(),
      currentScore: currentReport.currentScore,
      targetScore: planDto.targetScore || (currentReport.currentScore + 50),
      targetDate: planDto.targetDate || new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000), // 6 months from now
      recommendations,
      focusAreas: planDto.focusAreas || ['Payment History', 'Credit Utilization'],
      createdAt: new Date(),
    };
  }

  // System endpoints

  @Get('health')
  @ApiOperation({ summary: 'Health check for credit scoring service' })
  @ApiResponse({
    status: 200,
    description: 'Service health status',
  })
  async healthCheck() {
    return {
      service: 'credit-scoring',
      status: 'healthy',
      timestamp: new Date(),
      version: '1.0.0',
    };
  }

  @Get('config')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get credit scoring configuration (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Configuration retrieved successfully',
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  async getConfig() {
    return {
      message: 'Credit scoring configuration',
      note: 'This would return the current credit scoring configuration settings',
      config: {
        scoringEnabled: true,
        quarterlyAssessmentsEnabled: true,
        assessmentSchedule: '0 2 1 1,4,7,10 *', // Cron expression
        minCreditLimit: 5000,
        maxCreditLimit: 100000,
        riskThresholds: {
          low: 700,
          medium: 600,
          high: 500,
        },
      },
    };
  }
}
