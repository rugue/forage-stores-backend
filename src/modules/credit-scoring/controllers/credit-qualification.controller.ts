import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Query,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { UserRole } from '../../users/entities/user.entity';
import { CreditQualificationService } from '../services/credit-qualification.service';
import { DefaultRecoveryService } from '../services/default-recovery.service';
import { CreditQualificationResult, DefaultRecoveryResult } from '../interfaces/credit-qualification.interface';

class TriggerRecoveryDto {
  orderId: string;
  recoveryMethod: 'foodsafe_deduction' | 'payment_plan' | 'manual_collection';
}

@ApiTags('Credit Qualification')
@Controller('credit-qualification')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class CreditQualificationController {
  constructor(
    private readonly qualificationService: CreditQualificationService,
    private readonly recoveryService: DefaultRecoveryService,
  ) {}

  @Get('assess')
  @ApiOperation({ summary: 'Assess user credit qualification' })
  @ApiResponse({ status: 200, description: 'Credit qualification assessment completed' })
  @Roles(UserRole.USER, UserRole.ADMIN, UserRole.GROWTH_ASSOCIATE, UserRole.GROWTH_ELITE)
  async assessQualification(
    @CurrentUser('id') userId: string,
    @Query('targetUserId') targetUserId?: string,
  ): Promise<CreditQualificationResult> {
    // Admin can check any user's qualification
    const userIdToCheck = targetUserId && userId ? targetUserId : userId;
    return await this.qualificationService.assessCreditQualification(userIdToCheck);
  }

  @Get('report')
  @ApiOperation({ summary: 'Get detailed qualification report with recommendations' })
  @ApiResponse({ status: 200, description: 'Detailed qualification report retrieved' })
  @Roles(UserRole.USER, UserRole.ADMIN, UserRole.GROWTH_ASSOCIATE, UserRole.GROWTH_ELITE)
  async getQualificationReport(
    @CurrentUser('id') userId: string,
    @Query('targetUserId') targetUserId?: string,
  ): Promise<{
    qualification: CreditQualificationResult;
    recommendations: string[];
    timeToQualification: string | null;
  }> {
    const userIdToCheck = targetUserId && userId ? targetUserId : userId;
    return await this.qualificationService.getQualificationReport(userIdToCheck);
  }

  @Get('default-status')
  @ApiOperation({ summary: 'Get default recovery status' })
  @ApiResponse({ status: 200, description: 'Default recovery status retrieved' })
  @Roles(UserRole.USER, UserRole.ADMIN, UserRole.GROWTH_ASSOCIATE, UserRole.GROWTH_ELITE)
  async getDefaultStatus(
    @CurrentUser('id') userId: string,
    @Query('targetUserId') targetUserId?: string,
  ): Promise<{
    hasActiveDefaults: boolean;
    totalDefaultAmount: number;
    activeRecoveries: any[];
    recoveryHistory: any[];
  }> {
    const userIdToCheck = targetUserId && userId ? targetUserId : userId;
    return await this.recoveryService.getDefaultRecoveryStatus(userIdToCheck);
  }

  @Get('foodsafe-recovery-eligibility/:defaultAmount')
  @ApiOperation({ summary: 'Check FoodSafe recovery eligibility' })
  @ApiResponse({ status: 200, description: 'FoodSafe recovery eligibility checked' })
  @Roles(UserRole.USER, UserRole.ADMIN, UserRole.GROWTH_ASSOCIATE, UserRole.GROWTH_ELITE)
  async checkFoodSafeEligibility(
    @CurrentUser('id') userId: string,
    @Param('defaultAmount') defaultAmount: string,
    @Query('targetUserId') targetUserId?: string,
  ): Promise<{
    eligible: boolean;
    availableForRecovery: number;
    foodSafeBalance: number;
    maxRecoverable: number;
  }> {
    const userIdToCheck = targetUserId && userId ? targetUserId : userId;
    const amount = parseFloat(defaultAmount);
    
    if (isNaN(amount) || amount <= 0) {
      throw new BadRequestException('Invalid default amount');
    }
    
    return await this.recoveryService.checkFoodSafeRecoveryEligibility(userIdToCheck, amount);
  }

  // Admin-only endpoints
  @Post('trigger-recovery')
  @ApiOperation({ summary: 'Manually trigger default recovery (Admin only)' })
  @ApiResponse({ status: 200, description: 'Default recovery triggered successfully' })
  @Roles(UserRole.ADMIN, UserRole.GROWTH_ELITE)
  async triggerRecovery(
    @Body() dto: TriggerRecoveryDto,
    @Query('userId') userId: string,
  ): Promise<DefaultRecoveryResult> {
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }
    
    return await this.recoveryService.triggerManualRecovery(
      userId,
      dto.orderId,
      dto.recoveryMethod,
    );
  }

  @Post('escalate-recovery/:userId/:orderId')
  @ApiOperation({ summary: 'Escalate default recovery process (Admin only)' })
  @ApiResponse({ status: 200, description: 'Default recovery escalated successfully' })
  @Roles(UserRole.ADMIN, UserRole.GROWTH_ELITE)
  async escalateRecovery(
    @Param('userId') userId: string,
    @Param('orderId') orderId: string,
  ): Promise<{ message: string }> {
    await this.recoveryService.escalateDefaultRecovery(userId, orderId);
    return { message: 'Default recovery process escalated successfully' };
  }

  @Get('recovery-analytics')
  @ApiOperation({ summary: 'Get recovery analytics (Admin only)' })
  @ApiResponse({ status: 200, description: 'Recovery analytics retrieved' })
  @Roles(UserRole.ADMIN, UserRole.GROWTH_ELITE)
  async getRecoveryAnalytics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<{
    totalDefaults: number;
    totalRecovered: number;
    recoveryRate: number;
    recoveryMethods: Record<string, number>;
    averageRecoveryTime: number;
  }> {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    
    return await this.recoveryService.getRecoveryAnalytics(start, end);
  }

  @Get('qualification-overview')
  @ApiOperation({ summary: 'Get system-wide qualification overview (Admin only)' })
  @ApiResponse({ status: 200, description: 'Qualification overview retrieved' })
  @Roles(UserRole.ADMIN, UserRole.GROWTH_ELITE)
  async getQualificationOverview(): Promise<{
    totalUsers: number;
    qualifiedUsers: number;
    qualificationRate: number;
    commonFailureReasons: Record<string, number>;
    averageCreditLimit: number;
  }> {
    // This would require aggregation logic - placeholder for now
    return {
      totalUsers: 0,
      qualifiedUsers: 0,
      qualificationRate: 0,
      commonFailureReasons: {},
      averageCreditLimit: 0,
    };
  }

  @Post('batch-assess')
  @ApiOperation({ summary: 'Batch assess credit qualification for multiple users (Admin only)' })
  @ApiResponse({ status: 200, description: 'Batch assessment completed' })
  @Roles(UserRole.ADMIN, UserRole.GROWTH_ELITE)
  async batchAssessQualification(
    @Body('userIds') userIds: string[],
  ): Promise<{
    processed: number;
    qualified: number;
    failed: number;
    results: Record<string, CreditQualificationResult>;
  }> {
    if (!Array.isArray(userIds) || userIds.length === 0) {
      throw new BadRequestException('User IDs array is required');
    }

    const results: Record<string, CreditQualificationResult> = {};
    let qualified = 0;
    let failed = 0;

    for (const userId of userIds) {
      try {
        const assessment = await this.qualificationService.assessCreditQualification(userId);
        results[userId] = assessment;
        
        if (assessment.isQualified) {
          qualified++;
        }
      } catch (error) {
        failed++;
        results[userId] = {
          isQualified: false,
          criteria: {
            hasSufficientFoodSafeBalance: false,
            meetsRecentPurchaseThreshold: false,
            meetsYearlyPurchaseThreshold: false,
            hasGoodCreditScore: false,
            hasNoActiveDefaults: false,
            accountAgeRequirement: false,
            hasPositivePaymentHistory: false,
          },
          failureReasons: ['ASSESSMENT_ERROR'],
          recommendedCreditLimit: 0,
          assessmentDate: new Date(),
          nextReviewDate: new Date(),
        };
      }
    }

    return {
      processed: userIds.length,
      qualified,
      failed,
      results,
    };
  }
}
