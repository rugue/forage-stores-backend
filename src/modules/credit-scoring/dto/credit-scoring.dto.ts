import {
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsArray,
  IsDateString,
  IsMongoId,
  IsNotEmpty,
  Min,
  Max,
  ValidateNested,
  ArrayNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  CreditRiskLevel,
  CreditAssessmentType,
  RepaymentBehavior,
} from '../entities/credit-check.entity';

export class UpdatePaymentBehaviorDto {
  @ApiProperty({ description: 'Order ID for the payment' })
  @IsMongoId()
  @IsNotEmpty()
  orderId: string;

  @ApiProperty({ description: 'Payment amount' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  paymentAmount: number;

  @ApiProperty({ description: 'Due date for the payment' })
  @IsDateString()
  dueDate: string;

  @ApiPropertyOptional({ description: 'Actual payment date (if paid)' })
  @IsOptional()
  @IsDateString()
  actualPaymentDate?: string;

  @ApiProperty({ description: 'Whether payment was made on time' })
  @IsBoolean()
  isOnTime: boolean;

  @ApiPropertyOptional({ description: 'Days late (if applicable)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  daysLate?: number;

  @ApiProperty({ description: 'Payment method used' })
  @IsString()
  @IsNotEmpty()
  paymentMethod: string;

  @ApiProperty({ description: 'Whether payment was successful' })
  @IsBoolean()
  wasSuccessful: boolean;
}

export class CreditOverrideDto {
  @ApiPropertyOptional({ description: 'Override credit score', minimum: 300, maximum: 850 })
  @IsOptional()
  @IsNumber()
  @Min(300)
  @Max(850)
  creditScore?: number;

  @ApiPropertyOptional({ description: 'Override credit limit' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  creditLimit?: number;

  @ApiPropertyOptional({ description: 'Override risk level', enum: CreditRiskLevel })
  @IsOptional()
  @IsEnum(CreditRiskLevel)
  riskLevel?: CreditRiskLevel;

  @ApiProperty({ description: 'Reason for override' })
  @IsString()
  @IsNotEmpty()
  reason: string;

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Override expiry date' })
  @IsOptional()
  @IsDateString()
  expiryDate?: string;
}

export class CreditLimitUpdateDto {
  @ApiProperty({ description: 'New credit limit amount' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  newLimit: number;

  @ApiProperty({ description: 'Reason for credit limit change' })
  @IsString()
  @IsNotEmpty()
  reason: string;

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreditAssessmentFilterDto {
  @ApiPropertyOptional({ description: 'Risk level filter', enum: CreditRiskLevel })
  @IsOptional()
  @IsEnum(CreditRiskLevel)
  riskLevel?: CreditRiskLevel;

  @ApiPropertyOptional({ description: 'Assessment type filter', enum: CreditAssessmentType })
  @IsOptional()
  @IsEnum(CreditAssessmentType)
  assessmentType?: CreditAssessmentType;

  @ApiPropertyOptional({ description: 'Minimum credit score' })
  @IsOptional()
  @IsNumber()
  @Min(300)
  @Max(850)
  minScore?: number;

  @ApiPropertyOptional({ description: 'Maximum credit score' })
  @IsOptional()
  @IsNumber()
  @Min(300)
  @Max(850)
  maxScore?: number;

  @ApiPropertyOptional({ description: 'Filter by users due for assessment' })
  @IsOptional()
  @IsBoolean()
  dueForAssessment?: boolean;

  @ApiPropertyOptional({ description: 'Start date for assessment range' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date for assessment range' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Page number for pagination', default: 1, minimum: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Number of items per page', default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 20;
}

export class BulkCreditAssessmentDto {
  @ApiProperty({ description: 'User IDs to assess', type: [String] })
  @IsArray()
  @ArrayNotEmpty()
  @IsMongoId({ each: true })
  userIds: string[];

  @ApiPropertyOptional({ description: 'Assessment type', enum: CreditAssessmentType })
  @IsOptional()
  @IsEnum(CreditAssessmentType)
  assessmentType?: CreditAssessmentType;

  @ApiPropertyOptional({ description: 'Force reassessment even if recently assessed' })
  @IsOptional()
  @IsBoolean()
  forceReassessment?: boolean;
}

export class QuarterlyAssessmentConfigDto {
  @ApiProperty({ description: 'Enable quarterly assessments' })
  @IsBoolean()
  enabled: boolean;

  @ApiPropertyOptional({ description: 'Hour to run assessments (0-23)', minimum: 0, maximum: 23 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(23)
  assessmentHour?: number;

  @ApiPropertyOptional({ description: 'Minute to run assessments (0-59)', minimum: 0, maximum: 59 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(59)
  assessmentMinute?: number;

  @ApiPropertyOptional({ description: 'Send notifications after assessment' })
  @IsOptional()
  @IsBoolean()
  sendNotifications?: boolean;
}

export class CreditDecisionDto {
  @ApiProperty({ description: 'Order ID requiring credit decision' })
  @IsMongoId()
  @IsNotEmpty()
  orderId: string;

  @ApiProperty({ description: 'Requested credit amount' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  requestedAmount: number;

  @ApiPropertyOptional({ description: 'Additional context for decision' })
  @IsOptional()
  @IsString()
  additionalContext?: string;
}

export class ExternalCreditDataDto {
  @ApiProperty({ description: 'Credit bureau name' })
  @IsString()
  @IsNotEmpty()
  bureauName: string;

  @ApiPropertyOptional({ description: 'External credit score' })
  @IsOptional()
  @IsNumber()
  @Min(300)
  @Max(850)
  score?: number;

  @ApiProperty({ description: 'Report date' })
  @IsDateString()
  reportDate: string;

  @ApiPropertyOptional({ description: 'Raw external data' })
  @IsOptional()
  raw?: Record<string, any>;
}

export class CreditScoreHistoryDto {
  @ApiPropertyOptional({ description: 'Start date for history', default: 'One year ago' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date for history', default: 'Today' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Granularity of data points', enum: ['daily', 'weekly', 'monthly', 'quarterly'] })
  @IsOptional()
  @IsEnum(['daily', 'weekly', 'monthly', 'quarterly'])
  granularity?: 'daily' | 'weekly' | 'monthly' | 'quarterly';
}

export class CreditAnalyticsFilterDto {
  @ApiPropertyOptional({ description: 'Start date for analytics' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date for analytics' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Group by field', enum: ['riskLevel', 'scoreRange', 'month', 'quarter'] })
  @IsOptional()
  @IsEnum(['riskLevel', 'scoreRange', 'month', 'quarter'])
  groupBy?: 'riskLevel' | 'scoreRange' | 'month' | 'quarter';

  @ApiPropertyOptional({ description: 'Include detailed breakdowns' })
  @IsOptional()
  @IsBoolean()
  includeDetails?: boolean;
}

export class CreditImprovementPlanDto {
  @ApiProperty({ description: 'User ID to create plan for' })
  @IsMongoId()
  @IsNotEmpty()
  userId: string;

  @ApiPropertyOptional({ description: 'Target credit score' })
  @IsOptional()
  @IsNumber()
  @Min(300)
  @Max(850)
  targetScore?: number;

  @ApiPropertyOptional({ description: 'Target achievement date' })
  @IsOptional()
  @IsDateString()
  targetDate?: string;

  @ApiPropertyOptional({ description: 'Focus areas for improvement' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  focusAreas?: string[];
}

// Response DTOs
export class CreditReportResponseDto {
  @ApiProperty({ description: 'User ID' })
  userId: string;

  @ApiProperty({ description: 'Current credit score' })
  currentScore: number;

  @ApiPropertyOptional({ description: 'Previous credit score' })
  previousScore?: number;

  @ApiPropertyOptional({ description: 'Score change from previous' })
  scoreChange?: number;

  @ApiProperty({ description: 'Risk level', enum: CreditRiskLevel })
  riskLevel: CreditRiskLevel;

  @ApiProperty({ description: 'Approved credit limit' })
  approvedCreditLimit: number;

  @ApiProperty({ description: 'Currently utilized credit' })
  currentCreditUtilized: number;

  @ApiProperty({ description: 'Available credit' })
  availableCredit: number;

  @ApiProperty({ description: 'Payment behavior classification', enum: RepaymentBehavior })
  paymentBehavior: RepaymentBehavior;

  @ApiProperty({ description: 'Improvement recommendations', type: [String] })
  improvementRecommendations: string[];

  @ApiProperty({ description: 'Last assessment date' })
  lastAssessmentDate: Date;

  @ApiPropertyOptional({ description: 'Next assessment date' })
  nextAssessmentDate?: Date;
}

export class CreditScoreCalculationResponseDto {
  @ApiProperty({ description: 'User ID' })
  userId: string;

  @ApiProperty({ description: 'Calculated credit score' })
  creditScore: number;

  @ApiProperty({ description: 'Previous score' })
  previousScore?: number;

  @ApiProperty({ description: 'Score change' })
  scoreChange?: number;

  @ApiProperty({ description: 'Calculation breakdown' })
  breakdown: {
    paymentHistoryScore: number;
    creditUtilizationScore: number;
    creditHistoryScore: number;
    creditMixScore: number;
    newCreditScore: number;
    platformFactorsScore: number;
  };

  @ApiProperty({ description: 'Factors that influenced the score' })
  influencingFactors: string[];

  @ApiProperty({ description: 'Calculation timestamp' })
  calculatedAt: Date;
}
