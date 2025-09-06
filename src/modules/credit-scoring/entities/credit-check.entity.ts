import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type CreditCheckDocument = CreditCheck & Document;

export enum CreditRiskLevel {
  VERY_LOW = 'very_low',
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  VERY_HIGH = 'very_high',
}

export enum CreditAssessmentType {
  INITIAL = 'initial',
  QUARTERLY = 'quarterly',
  ORDER_BASED = 'order_based',
  MANUAL_REVIEW = 'manual_review',
}

export enum RepaymentBehavior {
  EXCELLENT = 'excellent',      // Always pays on time or early
  GOOD = 'good',               // Occasionally late (1-3 days)
  FAIR = 'fair',               // Sometimes late (3-7 days)
  POOR = 'poor',               // Often late (7+ days)
  DEFAULTED = 'defaulted',     // Missed payments completely
}

@Schema({ timestamps: true, _id: false })
export class PaymentBehaviorMetrics {
  @ApiProperty({ description: 'Total number of payments made' })
  @Prop({ type: Number, default: 0 })
  totalPayments: number;

  @ApiProperty({ description: 'Number of on-time payments' })
  @Prop({ type: Number, default: 0 })
  onTimePayments: number;

  @ApiProperty({ description: 'Number of late payments (1-7 days)' })
  @Prop({ type: Number, default: 0 })
  latePayments: number;

  @ApiProperty({ description: 'Number of very late payments (7+ days)' })
  @Prop({ type: Number, default: 0 })
  veryLatePayments: number;

  @ApiProperty({ description: 'Number of missed payments' })
  @Prop({ type: Number, default: 0 })
  missedPayments: number;

  @ApiProperty({ description: 'Average days late across all payments' })
  @Prop({ type: Number, default: 0 })
  averageDaysLate: number;

  @ApiProperty({ description: 'Total amount repaid successfully' })
  @Prop({ type: Number, default: 0 })
  totalAmountRepaid: number;

  @ApiProperty({ description: 'Total amount defaulted on' })
  @Prop({ type: Number, default: 0 })
  totalAmountDefaulted: number;

  @ApiProperty({ description: 'On-time payment percentage' })
  @Prop({ type: Number, default: 100 })
  onTimePaymentPercentage: number;

  @ApiProperty({ description: 'Repayment behavior classification', enum: RepaymentBehavior })
  @Prop({ type: String, enum: Object.values(RepaymentBehavior), default: RepaymentBehavior.EXCELLENT })
  behaviorClassification: RepaymentBehavior;
}

@Schema({ timestamps: true, _id: false })
export class CreditRiskFactors {
  @ApiProperty({ description: 'Income to debt ratio' })
  @Prop({ type: Number })
  incomeToDebtRatio?: number;

  @ApiProperty({ description: 'Credit utilization percentage' })
  @Prop({ type: Number })
  creditUtilization?: number;

  @ApiProperty({ description: 'Number of active credit accounts' })
  @Prop({ type: Number, default: 0 })
  activeCreditAccounts: number;

  @ApiProperty({ description: 'Length of credit history in months' })
  @Prop({ type: Number, default: 0 })
  creditHistoryLength: number;

  @ApiProperty({ description: 'Number of recent credit inquiries' })
  @Prop({ type: Number, default: 0 })
  recentInquiries: number;

  @ApiProperty({ description: 'Debt service ratio (monthly debt payments / monthly income)' })
  @Prop({ type: Number })
  debtServiceRatio?: number;

  @ApiProperty({ description: 'Employment stability score (0-100)' })
  @Prop({ type: Number })
  employmentStability?: number;

  @ApiProperty({ description: 'Geographic risk factor' })
  @Prop({ type: Number, default: 1 })
  geographicRisk: number;
}

@Schema({ timestamps: true, _id: false })
export class CreditScoreBreakdown {
  @ApiProperty({ description: 'Payment history score component (35%)' })
  @Prop({ type: Number })
  paymentHistoryScore: number;

  @ApiProperty({ description: 'Credit utilization score component (30%)' })
  @Prop({ type: Number })
  creditUtilizationScore: number;

  @ApiProperty({ description: 'Credit history length score component (15%)' })
  @Prop({ type: Number })
  creditHistoryScore: number;

  @ApiProperty({ description: 'Credit mix score component (10%)' })
  @Prop({ type: Number })
  creditMixScore: number;

  @ApiProperty({ description: 'New credit score component (10%)' })
  @Prop({ type: Number })
  newCreditScore: number;

  @ApiProperty({ description: 'Platform-specific factors score' })
  @Prop({ type: Number })
  platformFactorsScore: number;
}

@Schema({ timestamps: true, _id: false })
export class QuarterlyAssessmentResult {
  @ApiProperty({ description: 'Quarter (e.g., Q1-2025)' })
  @Prop({ type: String, required: true })
  quarter: string;

  @ApiProperty({ description: 'Year of assessment' })
  @Prop({ type: Number, required: true })
  year: number;

  @ApiProperty({ description: 'Credit score for this quarter' })
  @Prop({ type: Number, required: true })
  creditScore: number;

  @ApiProperty({ description: 'Score change from previous quarter' })
  @Prop({ type: Number })
  scoreChange?: number;

  @ApiProperty({ description: 'Risk level assessment', enum: CreditRiskLevel })
  @Prop({ type: String, enum: Object.values(CreditRiskLevel) })
  riskLevel: CreditRiskLevel;

  @ApiProperty({ description: 'Recommended credit limit for this quarter' })
  @Prop({ type: Number })
  recommendedCreditLimit: number;

  @ApiProperty({ description: 'Assessment notes' })
  @Prop({ type: String })
  notes?: string;

  @ApiProperty({ description: 'Assessment completion date' })
  @Prop({ type: Date, default: Date.now })
  assessmentDate: Date;
}

@Schema({ timestamps: true })
export class CreditCheck {
  @ApiProperty({ description: 'User ID this credit check belongs to' })
@Prop({ required: true, type: Types.ObjectId, ref: 'User'})
  userId: Types.ObjectId;

  @ApiProperty({ description: 'Current credit score (300-850)' })
  @Prop({ type: Number, min: 300, max: 850, index: true })
  currentScore?: number;

  @ApiProperty({ description: 'Previous credit score for comparison' })
  @Prop({ type: Number, min: 300, max: 850 })
  previousScore?: number;

  @ApiProperty({ description: 'Current credit risk level', enum: CreditRiskLevel })
  @Prop({ type: String, enum: Object.values(CreditRiskLevel), default: CreditRiskLevel.MEDIUM })
  riskLevel: CreditRiskLevel;

  @ApiProperty({ description: 'Type of credit assessment', enum: CreditAssessmentType })
  @Prop({ type: String, enum: Object.values(CreditAssessmentType), default: CreditAssessmentType.INITIAL })
  assessmentType: CreditAssessmentType;

  @ApiProperty({ description: 'Payment behavior metrics', type: PaymentBehaviorMetrics })
  @Prop({ type: PaymentBehaviorMetrics, default: () => ({}) })
  paymentBehavior: PaymentBehaviorMetrics;

  @ApiProperty({ description: 'Credit risk factors', type: CreditRiskFactors })
  @Prop({ type: CreditRiskFactors, default: () => ({}) })
  riskFactors: CreditRiskFactors;

  @ApiProperty({ description: 'Credit score breakdown', type: CreditScoreBreakdown })
  @Prop({ type: CreditScoreBreakdown })
  scoreBreakdown?: CreditScoreBreakdown;

  @ApiProperty({ description: 'Current approved credit limit' })
  @Prop({ type: Number, min: 0, default: 0 })
  approvedCreditLimit: number;

  @ApiProperty({ description: 'Currently utilized credit amount' })
  @Prop({ type: Number, min: 0, default: 0 })
  currentCreditUtilized: number;

  @ApiProperty({ description: 'Available credit amount' })
  @Prop({ type: Number, min: 0, default: 0 })
  availableCredit: number;

  @ApiProperty({ description: 'Last assessment date' })
  @Prop({ type: Date, default: Date.now, index: true })
  lastAssessmentDate: Date;

  @ApiProperty({ description: 'Next scheduled assessment date' })
  @Prop({ type: Date, index: true })
  nextAssessmentDate?: Date;

  @ApiProperty({ description: 'Quarterly assessment history', type: [QuarterlyAssessmentResult] })
  @Prop({ type: [QuarterlyAssessmentResult], default: [] })
  quarterlyHistory: QuarterlyAssessmentResult[];

  @ApiProperty({ description: 'Score improvement tracking over time' })
  @Prop({ type: [{ date: Date, score: Number, trigger: String }], default: [] })
  scoreHistory: { date: Date; score: number; trigger: string }[];

  @ApiProperty({ description: 'Credit improvement recommendations' })
  @Prop({ type: [String], default: [] })
  improvementRecommendations: string[];

  @ApiProperty({ description: 'BVN (Bank Verification Number) for identity verification' })
  @Prop({ type: String, index: true, sparse: true })
  bvn?: string;

  @ApiProperty({ description: 'External credit bureau data integration' })
  @Prop({ type: Object })
  externalCreditData?: Record<string, any>;

  @ApiProperty({ description: 'Manual override notes from admin' })
  @Prop({ type: String })
  manualOverrideNotes?: string;

  @ApiProperty({ description: 'Manual override by admin ID' })
  @Prop({ type: Types.ObjectId, ref: 'User' })
  manualOverrideBy?: Types.ObjectId;

  @ApiProperty({ description: 'Manual override date' })
  @Prop({ type: Date })
  manualOverrideDate?: Date;

  @ApiProperty({ description: 'Whether this record is active' })
  @Prop({ type: Boolean, default: true })
  isActive: boolean;
}

export const PaymentBehaviorMetricsSchema = SchemaFactory.createForClass(PaymentBehaviorMetrics);
export const CreditRiskFactorsSchema = SchemaFactory.createForClass(CreditRiskFactors);
export const CreditScoreBreakdownSchema = SchemaFactory.createForClass(CreditScoreBreakdown);
export const QuarterlyAssessmentResultSchema = SchemaFactory.createForClass(QuarterlyAssessmentResult);
export const CreditCheckSchema = SchemaFactory.createForClass(CreditCheck);

// Pre-save middleware to calculate derived fields
CreditCheckSchema.pre('save', function (next) {
  // Calculate available credit
  this.availableCredit = Math.max(0, this.approvedCreditLimit - this.currentCreditUtilized);
  
  // Set next assessment date (quarterly - 3 months from last assessment)
  if (!this.nextAssessmentDate && this.lastAssessmentDate) {
    const nextDate = new Date(this.lastAssessmentDate);
    nextDate.setMonth(nextDate.getMonth() + 3);
    this.nextAssessmentDate = nextDate;
  }
  
  // Update risk factors if we have payment behavior data
  if (this.paymentBehavior && this.paymentBehavior.totalPayments > 0) {
    this.paymentBehavior.onTimePaymentPercentage = 
      (this.paymentBehavior.onTimePayments / this.paymentBehavior.totalPayments) * 100;
    
    // Determine behavior classification
    const onTimePercentage = this.paymentBehavior.onTimePaymentPercentage;
    if (onTimePercentage >= 95) {
      this.paymentBehavior.behaviorClassification = RepaymentBehavior.EXCELLENT;
    } else if (onTimePercentage >= 85) {
      this.paymentBehavior.behaviorClassification = RepaymentBehavior.GOOD;
    } else if (onTimePercentage >= 70) {
      this.paymentBehavior.behaviorClassification = RepaymentBehavior.FAIR;
    } else if (onTimePercentage >= 50) {
      this.paymentBehavior.behaviorClassification = RepaymentBehavior.POOR;
    } else {
      this.paymentBehavior.behaviorClassification = RepaymentBehavior.DEFAULTED;
    }
  }
  
  next();
});

// Add indexes for efficient querying
CreditCheckSchema.index({ userId: 1, isActive: 1 });
CreditCheckSchema.index({ nextAssessmentDate: 1, isActive: 1 });
CreditCheckSchema.index({ riskLevel: 1 });
CreditCheckSchema.index({ currentScore: 1 });
CreditCheckSchema.index({ 'quarterlyHistory.year': 1, 'quarterlyHistory.quarter': 1 });
CreditCheckSchema.index({ lastAssessmentDate: -1 });
