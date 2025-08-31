import { IsString, IsNumber, IsOptional, IsEnum, IsArray, IsDateString, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { QualificationFailureReason } from '../constants/credit-qualification.constants';

export class CreditQualificationAssessmentDto {
  @ApiProperty({ description: 'Target user ID for assessment (Admin only)', required: false })
  @IsOptional()
  @IsString()
  targetUserId?: string;
}

export class TriggerRecoveryDto {
  @ApiProperty({ description: 'Order ID to recover payment for' })
  @IsString()
  orderId: string;

  @ApiProperty({ 
    description: 'Recovery method to use',
    enum: ['foodsafe_deduction', 'payment_plan', 'manual_collection']
  })
  @IsEnum(['foodsafe_deduction', 'payment_plan', 'manual_collection'])
  recoveryMethod: 'foodsafe_deduction' | 'payment_plan' | 'manual_collection';

  @ApiProperty({ description: 'Maximum amount to deduct from FoodSafe', required: false })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  maxFoodSafeDeduction?: number;
}

export class BatchAssessmentDto {
  @ApiProperty({ description: 'Array of user IDs to assess' })
  @IsArray()
  @IsString({ each: true })
  userIds: string[];
}

export class RecoveryAnalyticsQueryDto {
  @ApiProperty({ description: 'Start date for analytics', required: false })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ description: 'End date for analytics', required: false })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class CreditQualificationResponseDto {
  @ApiProperty({ description: 'Whether user qualifies for credit' })
  isQualified: boolean;

  @ApiProperty({ description: 'Detailed qualification criteria breakdown' })
  criteria: {
    hasSufficientFoodSafeBalance: boolean;
    meetsRecentPurchaseThreshold: boolean;
    meetsYearlyPurchaseThreshold: boolean;
    hasGoodCreditScore: boolean;
    hasNoActiveDefaults: boolean;
    accountAgeRequirement: boolean;
    hasPositivePaymentHistory: boolean;
  };

  @ApiProperty({ description: 'Reasons for qualification failure', isArray: true })
  failureReasons: QualificationFailureReason[];

  @ApiProperty({ description: 'Recommended credit limit based on qualification' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  recommendedCreditLimit: number;

  @ApiProperty({ description: 'Date of assessment' })
  @IsDateString()
  assessmentDate: Date;

  @ApiProperty({ description: 'Next review date' })
  @IsDateString()
  nextReviewDate: Date;
}

export class DefaultRecoveryResponseDto {
  @ApiProperty({ description: 'Whether recovery was successful' })
  success: boolean;

  @ApiProperty({ description: 'Amount recovered' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  recoveredAmount: number;

  @ApiProperty({ description: 'Recovery method used' })
  recoveryMethod: string;

  @ApiProperty({ description: 'Remaining default amount' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  remainingDefault: number;

  @ApiProperty({ description: 'Updated FoodSafe balance' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  updatedFoodSafeBalance: number;

  @ApiProperty({ description: 'Recovery transaction ID' })
  recoveryTransactionId: string;

  @ApiProperty({ description: 'Recovery message or error details', required: false })
  @IsOptional()
  message?: string;
}

export class QualificationReportResponseDto extends CreditQualificationResponseDto {
  @ApiProperty({ description: 'Personalized improvement recommendations', isArray: true })
  recommendations: string[];

  @ApiProperty({ description: 'Estimated time to qualification', required: false })
  @IsOptional()
  timeToQualification?: string;

  @ApiProperty({ description: 'Detailed spending analysis' })
  spendingAnalysis: {
    recentSpending: number;
    yearlySpending: number[];
    averageMonthlySpending: number;
    spendingTrend: 'increasing' | 'decreasing' | 'stable';
  };

  @ApiProperty({ description: 'FoodSafe balance analysis' })
  foodSafeAnalysis: {
    currentBalance: number;
    requiredBalance: number;
    percentageOfWallet: number;
    shortfall: number;
  };
}

export class DefaultStatusResponseDto {
  @ApiProperty({ description: 'Whether user has active defaults' })
  hasActiveDefaults: boolean;

  @ApiProperty({ description: 'Total amount in default' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  totalDefaultAmount: number;

  @ApiProperty({ description: 'Active recovery processes', isArray: true })
  activeRecoveries: any[];

  @ApiProperty({ description: 'Recovery history', isArray: true })
  recoveryHistory: any[];
}

export class FoodSafeEligibilityResponseDto {
  @ApiProperty({ description: 'Whether eligible for FoodSafe recovery' })
  eligible: boolean;

  @ApiProperty({ description: 'Amount available for recovery' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  availableForRecovery: number;

  @ApiProperty({ description: 'Current FoodSafe balance' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  foodSafeBalance: number;

  @ApiProperty({ description: 'Maximum recoverable amount' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  maxRecoverable: number;
}

export class RecoveryAnalyticsResponseDto {
  @ApiProperty({ description: 'Total number of defaults' })
  @IsNumber()
  @Min(0)
  totalDefaults: number;

  @ApiProperty({ description: 'Total amount recovered' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  totalRecovered: number;

  @ApiProperty({ description: 'Recovery rate percentage' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  recoveryRate: number;

  @ApiProperty({ description: 'Recovery methods breakdown' })
  recoveryMethods: Record<string, number>;

  @ApiProperty({ description: 'Average recovery time in days' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  averageRecoveryTime: number;
}

export class BatchAssessmentResponseDto {
  @ApiProperty({ description: 'Number of users processed' })
  @IsNumber()
  @Min(0)
  processed: number;

  @ApiProperty({ description: 'Number of users qualified' })
  @IsNumber()
  @Min(0)
  qualified: number;

  @ApiProperty({ description: 'Number of assessments failed' })
  @IsNumber()
  @Min(0)
  failed: number;

  @ApiProperty({ description: 'Individual assessment results' })
  results: Record<string, CreditQualificationResponseDto>;
}

export class QualificationOverviewResponseDto {
  @ApiProperty({ description: 'Total number of users in system' })
  @IsNumber()
  @Min(0)
  totalUsers: number;

  @ApiProperty({ description: 'Number of qualified users' })
  @IsNumber()
  @Min(0)
  qualifiedUsers: number;

  @ApiProperty({ description: 'Overall qualification rate' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  qualificationRate: number;

  @ApiProperty({ description: 'Common failure reasons breakdown' })
  commonFailureReasons: Record<string, number>;

  @ApiProperty({ description: 'Average credit limit for qualified users' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  averageCreditLimit: number;
}
