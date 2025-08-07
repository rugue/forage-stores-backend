import { Types } from 'mongoose';
import {
  CreditRiskLevel,
  CreditAssessmentType,
  RepaymentBehavior,
  PaymentBehaviorMetrics,
  CreditRiskFactors,
  CreditScoreBreakdown,
  QuarterlyAssessmentResult,
} from '../entities/credit-check.entity';

export interface ICreditScoringService {
  // Core scoring methods
  calculateCreditScore(userId: Types.ObjectId): Promise<number>;
  assessCreditRisk(userId: Types.ObjectId): Promise<CreditRiskLevel>;
  generateCreditReport(userId: Types.ObjectId): Promise<ICreditReport>;
  
  // Quarterly assessment methods
  performQuarterlyAssessment(userId: Types.ObjectId): Promise<QuarterlyAssessmentResult>;
  scheduleQuarterlyAssessments(): Promise<void>;
  processScheduledAssessments(): Promise<IQuarterlyAssessmentSummary>;
  
  // Payment behavior analysis
  updatePaymentBehavior(userId: Types.ObjectId, paymentData: IPaymentData): Promise<PaymentBehaviorMetrics>;
  analyzeRepaymentBehavior(userId: Types.ObjectId): Promise<RepaymentBehavior>;
  
  // Credit limit and risk management
  calculateRecommendedCreditLimit(userId: Types.ObjectId): Promise<number>;
  updateCreditLimit(userId: Types.ObjectId, newLimit: number, reason: string): Promise<void>;
  
  // Improvement tracking and recommendations
  trackScoreImprovement(userId: Types.ObjectId): Promise<ICreditScoreImprovement>;
  generateImprovementRecommendations(userId: Types.ObjectId): Promise<string[]>;
  
  // Admin and management methods
  manualCreditOverride(userId: Types.ObjectId, overrideData: ICreditOverride, adminId: Types.ObjectId): Promise<void>;
  getCreditAnalytics(): Promise<ICreditAnalytics>;
}

export interface ICreditReport {
  userId: Types.ObjectId;
  currentScore: number;
  previousScore?: number;
  scoreChange?: number;
  riskLevel: CreditRiskLevel;
  scoreBreakdown: CreditScoreBreakdown;
  paymentBehavior: PaymentBehaviorMetrics;
  riskFactors: CreditRiskFactors;
  approvedCreditLimit: number;
  currentCreditUtilized: number;
  availableCredit: number;
  quarterlyHistory: QuarterlyAssessmentResult[];
  improvementRecommendations: string[];
  lastUpdated: Date;
  nextAssessmentDate?: Date;
}

export interface IPaymentData {
  orderId: Types.ObjectId;
  paymentAmount: number;
  dueDate: Date;
  actualPaymentDate?: Date;
  isOnTime: boolean;
  daysLate?: number;
  paymentMethod: string;
  wasSuccessful: boolean;
}

export interface ICreditScoreImprovement {
  userId: Types.ObjectId;
  scoreHistory: Array<{
    date: Date;
    score: number;
    trigger: string;
  }>;
  overallTrend: 'improving' | 'declining' | 'stable';
  averageMonthlyChange: number;
  bestScore: number;
  worstScore: number;
  currentStreak: {
    type: 'improving' | 'declining' | 'stable';
    duration: number; // in days
  };
}

export interface ICreditOverride {
  creditScore?: number;
  creditLimit?: number;
  riskLevel?: CreditRiskLevel;
  reason: string;
  notes?: string;
  expiryDate?: Date;
}

export interface ICreditAnalytics {
  totalUsers: number;
  scoreDistribution: {
    excellent: number;   // 750+
    good: number;        // 650-749
    fair: number;        // 550-649
    poor: number;        // 350-549
    veryPoor: number;    // 300-349
  };
  riskDistribution: {
    [key in CreditRiskLevel]: number;
  };
  averageScore: number;
  medianScore: number;
  totalCreditIssued: number;
  totalCreditUtilized: number;
  defaultRate: number;
  averageDaysToPayment: number;
  quarterlyGrowth: {
    quarter: string;
    newUsers: number;
    averageScoreChange: number;
  }[];
}

export interface IQuarterlyAssessmentSummary {
  assessmentDate: Date;
  totalAssessments: number;
  completedAssessments: number;
  failedAssessments: number;
  averageScoreChange: number;
  usersWithImprovedScores: number;
  usersWithDeclinedScores: number;
  newRiskLevelDistribution: {
    [key in CreditRiskLevel]: number;
  };
  recommendationsGenerated: number;
}

export interface ICreditScoringConfig {
  // Scoring weights (should add up to 100)
  paymentHistoryWeight: number;      // Default: 35
  creditUtilizationWeight: number;   // Default: 30
  creditHistoryWeight: number;       // Default: 15
  creditMixWeight: number;           // Default: 10
  newCreditWeight: number;           // Default: 10
  
  // Risk thresholds
  lowRiskThreshold: number;          // Default: 700
  mediumRiskThreshold: number;       // Default: 600
  highRiskThreshold: number;         // Default: 500
  
  // Credit limits
  maxCreditLimit: number;            // Default: 100000
  minCreditLimit: number;            // Default: 5000
  baseIncomeMultiplier: number;      // Default: 0.3 (30% of monthly income)
  
  // Assessment schedule
  quarterlyAssessmentEnabled: boolean; // Default: true
  assessmentHour: number;             // Default: 2 (2 AM)
  assessmentMinute: number;           // Default: 0
  
  // External integrations
  creditBureauEnabled: boolean;      // Default: false
  bvnVerificationEnabled: boolean;   // Default: true
  
  // Improvement tracking
  minimumScoreChange: number;        // Default: 10 (minimum change to track)
  improvementRewardEnabled: boolean; // Default: true
  
  // Geographic and demographic factors
  geographicRiskEnabled: boolean;    // Default: true
  ageFactorEnabled: boolean;         // Default: true
}

export interface ICreditDecision {
  approved: boolean;
  creditScore: number;
  riskLevel: CreditRiskLevel;
  approvedAmount: number;
  maxCreditLimit: number;
  interestRate?: number;
  reasons: string[];
  conditions?: string[];
  reviewDate?: Date;
}

export interface IExternalCreditData {
  bureauName: string;
  score?: number;
  reportDate: Date;
  accountSummary?: {
    totalAccounts: number;
    activeAccounts: number;
    closedAccounts: number;
    totalBalance: number;
  };
  paymentHistory?: {
    totalPayments: number;
    latePayments: number;
    defaultedAccounts: number;
  };
  inquiries?: {
    hardInquiries: number;
    softInquiries: number;
    recentInquiries: number;
  };
  publicRecords?: {
    bankruptcies: number;
    taxLiens: number;
    judgments: number;
  };
  raw?: Record<string, any>;
}
