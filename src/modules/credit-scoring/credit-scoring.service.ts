import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  CreditCheck,
  CreditCheckDocument,
  CreditRiskLevel,
  CreditAssessmentType,
  RepaymentBehavior,
  PaymentBehaviorMetrics,
  CreditRiskFactors,
  CreditScoreBreakdown,
  QuarterlyAssessmentResult,
} from './entities/credit-check.entity';
import { Order, OrderDocument } from '../orders/entities/order.entity';
import { User, UserDocument } from '../users/entities/user.entity';
import {
  ICreditScoringService,
  ICreditReport,
  IPaymentData,
  ICreditScoreImprovement,
  ICreditOverride,
  ICreditAnalytics,
  IQuarterlyAssessmentSummary,
  ICreditScoringConfig,
  ICreditDecision,
} from './interfaces/credit-scoring.interface';
import {
  UpdatePaymentBehaviorDto,
  CreditOverrideDto,
  CreditLimitUpdateDto,
  CreditAssessmentFilterDto,
} from './dto/credit-scoring.dto';

@Injectable()
export class CreditScoringService implements ICreditScoringService {
  private readonly logger = new Logger(CreditScoringService.name);

  // Default configuration
  private readonly config: ICreditScoringConfig = {
    paymentHistoryWeight: 35,
    creditUtilizationWeight: 30,
    creditHistoryWeight: 15,
    creditMixWeight: 10,
    newCreditWeight: 10,
    lowRiskThreshold: 700,
    mediumRiskThreshold: 600,
    highRiskThreshold: 500,
    maxCreditLimit: 100000,
    minCreditLimit: 5000,
    baseIncomeMultiplier: 0.3,
    quarterlyAssessmentEnabled: true,
    assessmentHour: 2,
    assessmentMinute: 0,
    creditBureauEnabled: false,
    bvnVerificationEnabled: true,
    minimumScoreChange: 10,
    improvementRewardEnabled: true,
    geographicRiskEnabled: true,
    ageFactorEnabled: true,
  };

  constructor(
    @InjectModel(CreditCheck.name)
    private readonly creditCheckModel: Model<CreditCheckDocument>,
    @InjectModel(Order.name)
    private readonly orderModel: Model<OrderDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  /**
   * Calculate comprehensive credit score for a user
   */
  async calculateCreditScore(userId: Types.ObjectId): Promise<number> {
    this.logger.log(`Calculating credit score for user: ${userId}`);

    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    let creditCheck = await this.creditCheckModel.findOne({ userId, isActive: true });

    if (!creditCheck) {
      // Create initial credit check
      const newCreditCheck = await this.createInitialCreditCheck(userId);
      creditCheck = await this.creditCheckModel.findById(newCreditCheck._id);
      if (!creditCheck) {
        throw new Error('Failed to create initial credit check');
      }
    }

    // Get user's order history for analysis
    const orders = await this.orderModel
      .find({ userId })
      .sort({ createdAt: -1 })
      .limit(50);

    // Calculate score components
    const paymentHistoryScore = await this.calculatePaymentHistoryScore(userId, orders);
    const creditUtilizationScore = this.calculateCreditUtilizationScore(creditCheck);
    const creditHistoryScore = this.calculateCreditHistoryScore(user, creditCheck);
    const creditMixScore = this.calculateCreditMixScore(orders);
    const newCreditScore = this.calculateNewCreditScore(orders);
    const platformFactorsScore = await this.calculatePlatformFactorsScore(user, orders);

    // Calculate weighted final score
    const weightedScore =
      (paymentHistoryScore * this.config.paymentHistoryWeight) / 100 +
      (creditUtilizationScore * this.config.creditUtilizationWeight) / 100 +
      (creditHistoryScore * this.config.creditHistoryWeight) / 100 +
      (creditMixScore * this.config.creditMixWeight) / 100 +
      (newCreditScore * this.config.newCreditWeight) / 100 +
      platformFactorsScore * 0.1; // 10% additional weight for platform-specific factors

    // Ensure score is within valid range (300-850)
    const finalScore = Math.max(300, Math.min(850, Math.round(weightedScore)));

    // Update credit check record
    const previousScore = creditCheck.currentScore;
    creditCheck.previousScore = previousScore;
    creditCheck.currentScore = finalScore;
    creditCheck.lastAssessmentDate = new Date();
    creditCheck.scoreBreakdown = {
      paymentHistoryScore,
      creditUtilizationScore,
      creditHistoryScore,
      creditMixScore,
      newCreditScore,
      platformFactorsScore,
    };

    // Update score history
    creditCheck.scoreHistory.push({
      date: new Date(),
      score: finalScore,
      trigger: 'automatic_calculation',
    });

    // Update risk level
    creditCheck.riskLevel = this.determineRiskLevel(finalScore);

    // Calculate recommended credit limit
    const recommendedLimit = await this.calculateRecommendedCreditLimit(userId);
    creditCheck.approvedCreditLimit = Math.min(recommendedLimit, this.config.maxCreditLimit);

    await creditCheck.save();

    this.logger.log(`Credit score calculated for user ${userId}: ${finalScore} (was ${previousScore || 'N/A'})`);

    return finalScore;
  }

  /**
   * Assess credit risk level for a user
   */
  async assessCreditRisk(userId: Types.ObjectId): Promise<CreditRiskLevel> {
    const score = await this.calculateCreditScore(userId);
    return this.determineRiskLevel(score);
  }

  /**
   * Generate comprehensive credit report
   */
  async generateCreditReport(userId: Types.ObjectId): Promise<ICreditReport> {
    const creditCheck = await this.creditCheckModel.findOne({ userId, isActive: true });
    
    if (!creditCheck) {
      throw new NotFoundException('Credit record not found for user');
    }

    // Ensure we have the latest score
    await this.calculateCreditScore(userId);
    
    // Refresh the credit check data
    const updatedCreditCheck = await this.creditCheckModel.findOne({ userId, isActive: true });

    return {
      userId,
      currentScore: updatedCreditCheck.currentScore || 0,
      previousScore: updatedCreditCheck.previousScore,
      scoreChange: updatedCreditCheck.currentScore && updatedCreditCheck.previousScore 
        ? updatedCreditCheck.currentScore - updatedCreditCheck.previousScore 
        : undefined,
      riskLevel: updatedCreditCheck.riskLevel,
      scoreBreakdown: updatedCreditCheck.scoreBreakdown || {} as CreditScoreBreakdown,
      paymentBehavior: updatedCreditCheck.paymentBehavior,
      riskFactors: updatedCreditCheck.riskFactors,
      approvedCreditLimit: updatedCreditCheck.approvedCreditLimit,
      currentCreditUtilized: updatedCreditCheck.currentCreditUtilized,
      availableCredit: updatedCreditCheck.availableCredit,
      quarterlyHistory: updatedCreditCheck.quarterlyHistory,
      improvementRecommendations: updatedCreditCheck.improvementRecommendations,
      lastUpdated: updatedCreditCheck.lastAssessmentDate,
      nextAssessmentDate: updatedCreditCheck.nextAssessmentDate,
    };
  }

  /**
   * Perform quarterly credit assessment
   */
  async performQuarterlyAssessment(userId: Types.ObjectId): Promise<QuarterlyAssessmentResult> {
    this.logger.log(`Performing quarterly assessment for user: ${userId}`);

    const newScore = await this.calculateCreditScore(userId);
    const creditCheck = await this.creditCheckModel.findOne({ userId, isActive: true });

    const currentDate = new Date();
    const quarter = `Q${Math.ceil((currentDate.getMonth() + 1) / 3)}`;
    const year = currentDate.getFullYear();

    // Find previous quarter's result for comparison
    const previousResult = creditCheck.quarterlyHistory
      .slice()
      .reverse()
      .find(result => result.year === year || result.year === year - 1);

    const scoreChange = previousResult ? newScore - previousResult.creditScore : undefined;

    const assessmentResult: QuarterlyAssessmentResult = {
      quarter,
      year,
      creditScore: newScore,
      scoreChange,
      riskLevel: this.determineRiskLevel(newScore),
      recommendedCreditLimit: await this.calculateRecommendedCreditLimit(userId),
      notes: `Quarterly assessment for ${quarter}-${year}`,
      assessmentDate: currentDate,
    };

    // Add to quarterly history
    creditCheck.quarterlyHistory.push(assessmentResult);
    creditCheck.assessmentType = CreditAssessmentType.QUARTERLY;
    
    // Generate improvement recommendations
    creditCheck.improvementRecommendations = await this.generateImprovementRecommendations(userId);

    await creditCheck.save();

    this.logger.log(`Quarterly assessment completed for user ${userId}: ${newScore} (change: ${scoreChange || 'N/A'})`);

    return assessmentResult;
  }

  /**
   * Scheduled quarterly assessments (runs on the 1st day of each quarter at 2 AM)
   */
  @Cron('0 2 1 1,4,7,10 *') // 1st day of Jan, Apr, Jul, Oct at 2:00 AM
  async processScheduledAssessments(): Promise<IQuarterlyAssessmentSummary> {
    if (!this.config.quarterlyAssessmentEnabled) {
      this.logger.log('Quarterly assessments are disabled');
      return;
    }

    this.logger.log('Starting scheduled quarterly credit assessments');

    const assessmentDate = new Date();
    let totalAssessments = 0;
    let completedAssessments = 0;
    let failedAssessments = 0;
    let totalScoreChange = 0;
    let usersWithImprovedScores = 0;
    let usersWithDeclinedScores = 0;
    const newRiskLevelDistribution = {
      [CreditRiskLevel.VERY_LOW]: 0,
      [CreditRiskLevel.LOW]: 0,
      [CreditRiskLevel.MEDIUM]: 0,
      [CreditRiskLevel.HIGH]: 0,
      [CreditRiskLevel.VERY_HIGH]: 0,
    };
    let recommendationsGenerated = 0;

    // Get all active credit check records
    const creditChecks = await this.creditCheckModel.find({ isActive: true });
    totalAssessments = creditChecks.length;

    for (const creditCheck of creditChecks) {
      try {
        const result = await this.performQuarterlyAssessment(creditCheck.userId);
        completedAssessments++;

        if (result.scoreChange !== undefined) {
          totalScoreChange += result.scoreChange;
          if (result.scoreChange > 0) usersWithImprovedScores++;
          if (result.scoreChange < 0) usersWithDeclinedScores++;
        }

        newRiskLevelDistribution[result.riskLevel]++;
        
        const updatedCreditCheck = await this.creditCheckModel.findById(creditCheck._id);
        if (updatedCreditCheck.improvementRecommendations.length > 0) {
          recommendationsGenerated++;
        }

      } catch (error) {
        this.logger.error(`Failed to assess user ${creditCheck.userId}:`, error.message);
        failedAssessments++;
      }
    }

    const averageScoreChange = completedAssessments > 0 ? totalScoreChange / completedAssessments : 0;

    const summary: IQuarterlyAssessmentSummary = {
      assessmentDate,
      totalAssessments,
      completedAssessments,
      failedAssessments,
      averageScoreChange,
      usersWithImprovedScores,
      usersWithDeclinedScores,
      newRiskLevelDistribution,
      recommendationsGenerated,
    };

    this.logger.log(`Quarterly assessments completed:`, summary);

    return summary;
  }

  /**
   * Update payment behavior based on order payment data
   */
  async updatePaymentBehavior(userId: Types.ObjectId, paymentData: IPaymentData): Promise<PaymentBehaviorMetrics> {
    const creditCheck = await this.creditCheckModel.findOne({ userId, isActive: true });
    
    if (!creditCheck) {
      throw new NotFoundException('Credit record not found');
    }

    const behavior = creditCheck.paymentBehavior;

    // Update payment metrics
    behavior.totalPayments += 1;

    if (paymentData.wasSuccessful) {
      behavior.totalAmountRepaid += paymentData.paymentAmount;

      if (paymentData.isOnTime) {
        behavior.onTimePayments += 1;
      } else if (paymentData.daysLate <= 7) {
        behavior.latePayments += 1;
        behavior.averageDaysLate = this.updateAverageDaysLate(
          behavior.averageDaysLate,
          behavior.totalPayments,
          paymentData.daysLate || 0
        );
      } else {
        behavior.veryLatePayments += 1;
        behavior.averageDaysLate = this.updateAverageDaysLate(
          behavior.averageDaysLate,
          behavior.totalPayments,
          paymentData.daysLate || 0
        );
      }
    } else {
      behavior.missedPayments += 1;
      behavior.totalAmountDefaulted += paymentData.paymentAmount;
    }

    creditCheck.paymentBehavior = behavior;
    await creditCheck.save();

    // Trigger score recalculation due to payment behavior change
    await this.calculateCreditScore(userId);

    return behavior;
  }

  /**
   * Analyze repayment behavior pattern
   */
  async analyzeRepaymentBehavior(userId: Types.ObjectId): Promise<RepaymentBehavior> {
    const creditCheck = await this.creditCheckModel.findOne({ userId, isActive: true });
    
    if (!creditCheck) {
      return RepaymentBehavior.EXCELLENT; // Default for new users
    }

    return creditCheck.paymentBehavior.behaviorClassification;
  }

  /**
   * Calculate recommended credit limit based on multiple factors
   */
  async calculateRecommendedCreditLimit(userId: Types.ObjectId): Promise<number> {
    const user = await this.userModel.findById(userId);
    const creditCheck = await this.creditCheckModel.findOne({ userId, isActive: true });

    if (!user || !creditCheck) {
      return this.config.minCreditLimit;
    }

    const score = creditCheck.currentScore || 600; // Default score
    const behavior = creditCheck.paymentBehavior;

    // Base limit calculation (assuming monthly income is available in user profile)
    // For this implementation, we'll estimate based on order history
    const orders = await this.orderModel
      .find({ userId })
      .sort({ createdAt: -1 })
      .limit(12);

    const averageMonthlySpending = orders.length > 0 
      ? orders.reduce((sum, order) => sum + order.finalTotal, 0) / Math.min(orders.length, 12)
      : 1000; // Default minimum

    let baseLimit = averageMonthlySpending * 3; // 3x average monthly spending

    // Adjust based on credit score
    if (score >= 750) baseLimit *= 2.0;        // Excellent credit
    else if (score >= 700) baseLimit *= 1.5;   // Good credit
    else if (score >= 650) baseLimit *= 1.2;   // Fair credit
    else if (score >= 600) baseLimit *= 1.0;   // Poor credit
    else baseLimit *= 0.5;                     // Very poor credit

    // Adjust based on payment behavior
    const onTimePercentage = behavior.onTimePaymentPercentage || 100;
    if (onTimePercentage >= 95) baseLimit *= 1.2;
    else if (onTimePercentage >= 85) baseLimit *= 1.0;
    else if (onTimePercentage >= 70) baseLimit *= 0.8;
    else baseLimit *= 0.5;

    // Apply min/max limits
    const finalLimit = Math.max(
      this.config.minCreditLimit,
      Math.min(this.config.maxCreditLimit, Math.round(baseLimit))
    );

    return finalLimit;
  }

  /**
   * Update credit limit for a user
   */
  async updateCreditLimit(userId: Types.ObjectId, newLimit: number, reason: string): Promise<void> {
    const creditCheck = await this.creditCheckModel.findOne({ userId, isActive: true });
    
    if (!creditCheck) {
      throw new NotFoundException('Credit record not found');
    }

    creditCheck.approvedCreditLimit = newLimit;
    creditCheck.scoreHistory.push({
      date: new Date(),
      score: creditCheck.currentScore || 0,
      trigger: `Credit limit updated: ${reason}`,
    });

    await creditCheck.save();

    this.logger.log(`Credit limit updated for user ${userId}: ${newLimit} (${reason})`);
  }

  /**
   * Track credit score improvement over time
   */
  async trackScoreImprovement(userId: Types.ObjectId): Promise<ICreditScoreImprovement> {
    const creditCheck = await this.creditCheckModel.findOne({ userId, isActive: true });
    
    if (!creditCheck) {
      throw new NotFoundException('Credit record not found');
    }

    const scoreHistory = creditCheck.scoreHistory.slice().sort((a, b) => a.date.getTime() - b.date.getTime());
    
    if (scoreHistory.length < 2) {
      return {
        userId,
        scoreHistory,
        overallTrend: 'stable',
        averageMonthlyChange: 0,
        bestScore: creditCheck.currentScore || 0,
        worstScore: creditCheck.currentScore || 0,
        currentStreak: { type: 'stable', duration: 0 },
      };
    }

    // Calculate trend
    const firstScore = scoreHistory[0].score;
    const lastScore = scoreHistory[scoreHistory.length - 1].score;
    const overallTrend = lastScore > firstScore + 10 ? 'improving' : 
                        lastScore < firstScore - 10 ? 'declining' : 'stable';

    // Calculate average monthly change
    const totalChange = lastScore - firstScore;
    const timeSpanInMonths = (scoreHistory[scoreHistory.length - 1].date.getTime() - scoreHistory[0].date.getTime()) 
                            / (1000 * 60 * 60 * 24 * 30);
    const averageMonthlyChange = timeSpanInMonths > 0 ? totalChange / timeSpanInMonths : 0;

    // Find best and worst scores
    const scores = scoreHistory.map(h => h.score);
    const bestScore = Math.max(...scores);
    const worstScore = Math.min(...scores);

    // Calculate current streak
    let currentStreak: { type: 'improving' | 'declining' | 'stable'; duration: number } = { type: 'stable', duration: 0 };
    if (scoreHistory.length >= 2) {
      const recentScores = scoreHistory.slice(-5); // Last 5 entries
      if (recentScores.length >= 2) {
        const isImproving = recentScores.every((entry, idx) => 
          idx === 0 || entry.score >= recentScores[idx - 1].score - 5); // Allow 5 point fluctuation
        const isDeclining = recentScores.every((entry, idx) => 
          idx === 0 || entry.score <= recentScores[idx - 1].score + 5);

        if (isImproving && recentScores[recentScores.length - 1].score > recentScores[0].score + 10) {
          currentStreak.type = 'improving';
        } else if (isDeclining && recentScores[recentScores.length - 1].score < recentScores[0].score - 10) {
          currentStreak.type = 'declining';
        }

        currentStreak.duration = Math.floor(
          (recentScores[recentScores.length - 1].date.getTime() - recentScores[0].date.getTime()) 
          / (1000 * 60 * 60 * 24)
        );
      }
    }

    return {
      userId,
      scoreHistory,
      overallTrend,
      averageMonthlyChange,
      bestScore,
      worstScore,
      currentStreak,
    };
  }

  /**
   * Generate personalized credit improvement recommendations
   */
  async generateImprovementRecommendations(userId: Types.ObjectId): Promise<string[]> {
    const creditCheck = await this.creditCheckModel.findOne({ userId, isActive: true });
    
    if (!creditCheck) {
      return [];
    }

    const recommendations: string[] = [];
    const score = creditCheck.currentScore || 0;
    const behavior = creditCheck.paymentBehavior;
    const utilization = (creditCheck.currentCreditUtilized / creditCheck.approvedCreditLimit) * 100;

    // Payment history recommendations
    if (behavior.onTimePaymentPercentage < 95) {
      recommendations.push('Set up automatic payments to ensure on-time payment and improve payment history (35% of credit score)');
    }
    if (behavior.missedPayments > 0) {
      recommendations.push('Contact customer support to set up a payment plan for any outstanding balances');
    }

    // Credit utilization recommendations
    if (utilization > 30) {
      recommendations.push('Keep credit utilization below 30% of available credit limit for better scores');
    }
    if (utilization > 10) {
      recommendations.push('For optimal credit scores, try to keep utilization below 10% of available credit');
    }

    // Score-specific recommendations
    if (score < 600) {
      recommendations.push('Start with small pay-later purchases and pay them on time to build credit history');
      recommendations.push('Consider using only 10% of available credit to establish good utilization patterns');
    } else if (score < 700) {
      recommendations.push('Continue making on-time payments and consider requesting a credit limit increase');
      recommendations.push('Diversify payment methods to show good credit management across different channels');
    } else if (score < 750) {
      recommendations.push('Maintain excellent payment history and low utilization to reach prime credit status');
    }

    // Platform-specific recommendations
    const orders = await this.orderModel.find({ userId }).limit(12);
    if (orders.length > 0) {
      const hasVariedOrderSizes = orders.some(o => o.finalTotal > 5000) && orders.some(o => o.finalTotal < 1000);
      if (!hasVariedOrderSizes) {
        recommendations.push('Using pay-later for both small and large purchases shows good credit mix management');
      }
    }

    // Time-based recommendations
    const daysSinceFirstOrder = (creditCheck as any).createdAt 
      ? (new Date().getTime() - (creditCheck as any).createdAt.getTime()) / (1000 * 60 * 60 * 24)
      : 0;
    
    if (daysSinceFirstOrder < 90) {
      recommendations.push('Continue building credit history - scores typically improve after 3-6 months of good payment behavior');
    }

    return recommendations.slice(0, 5); // Limit to top 5 recommendations
  }

  /**
   * Manual credit override by admin
   */
  async manualCreditOverride(userId: Types.ObjectId, overrideData: ICreditOverride, adminId: Types.ObjectId): Promise<void> {
    const creditCheck = await this.creditCheckModel.findOne({ userId, isActive: true });
    
    if (!creditCheck) {
      throw new NotFoundException('Credit record not found');
    }

    // Apply overrides
    if (overrideData.creditScore !== undefined) {
      creditCheck.previousScore = creditCheck.currentScore;
      creditCheck.currentScore = overrideData.creditScore;
    }

    if (overrideData.creditLimit !== undefined) {
      creditCheck.approvedCreditLimit = overrideData.creditLimit;
    }

    if (overrideData.riskLevel !== undefined) {
      creditCheck.riskLevel = overrideData.riskLevel;
    }

    // Record override information
    creditCheck.manualOverrideNotes = overrideData.notes || overrideData.reason;
    creditCheck.manualOverrideBy = adminId;
    creditCheck.manualOverrideDate = new Date();

    // Add to score history
    creditCheck.scoreHistory.push({
      date: new Date(),
      score: creditCheck.currentScore || 0,
      trigger: `Manual override: ${overrideData.reason}`,
    });

    await creditCheck.save();

    this.logger.log(`Manual credit override applied for user ${userId} by admin ${adminId}: ${overrideData.reason}`);
  }

  /**
   * Get comprehensive credit analytics
   */
  async getCreditAnalytics(): Promise<ICreditAnalytics> {
    const totalUsers = await this.creditCheckModel.countDocuments({ isActive: true });
    
    // Score distribution
    const scoreDistribution = {
      excellent: await this.creditCheckModel.countDocuments({ currentScore: { $gte: 750 }, isActive: true }),
      good: await this.creditCheckModel.countDocuments({ currentScore: { $gte: 650, $lt: 750 }, isActive: true }),
      fair: await this.creditCheckModel.countDocuments({ currentScore: { $gte: 550, $lt: 650 }, isActive: true }),
      poor: await this.creditCheckModel.countDocuments({ currentScore: { $gte: 350, $lt: 550 }, isActive: true }),
      veryPoor: await this.creditCheckModel.countDocuments({ currentScore: { $lt: 350 }, isActive: true }),
    };

    // Risk distribution
    const riskDistribution = {
      [CreditRiskLevel.VERY_LOW]: await this.creditCheckModel.countDocuments({ riskLevel: CreditRiskLevel.VERY_LOW, isActive: true }),
      [CreditRiskLevel.LOW]: await this.creditCheckModel.countDocuments({ riskLevel: CreditRiskLevel.LOW, isActive: true }),
      [CreditRiskLevel.MEDIUM]: await this.creditCheckModel.countDocuments({ riskLevel: CreditRiskLevel.MEDIUM, isActive: true }),
      [CreditRiskLevel.HIGH]: await this.creditCheckModel.countDocuments({ riskLevel: CreditRiskLevel.HIGH, isActive: true }),
      [CreditRiskLevel.VERY_HIGH]: await this.creditCheckModel.countDocuments({ riskLevel: CreditRiskLevel.VERY_HIGH, isActive: true }),
    };

    // Calculate averages
    const avgResult = await this.creditCheckModel.aggregate([
      { $match: { isActive: true, currentScore: { $exists: true } } },
      { $group: { _id: null, avgScore: { $avg: '$currentScore' }, medianScore: { $push: '$currentScore' } } }
    ]);

    const averageScore = avgResult.length > 0 ? Math.round(avgResult[0].avgScore) : 0;
    const scores = avgResult.length > 0 ? avgResult[0].medianScore.sort((a, b) => a - b) : [];
    const medianScore = scores.length > 0 ? scores[Math.floor(scores.length / 2)] : 0;

    // Credit utilization
    const creditStats = await this.creditCheckModel.aggregate([
      { $match: { isActive: true } },
      { 
        $group: { 
          _id: null, 
          totalCredit: { $sum: '$approvedCreditLimit' },
          totalUtilized: { $sum: '$currentCreditUtilized' }
        }
      }
    ]);

    const totalCreditIssued = creditStats.length > 0 ? creditStats[0].totalCredit : 0;
    const totalCreditUtilized = creditStats.length > 0 ? creditStats[0].totalUtilized : 0;

    // Default rate calculation
    const totalPayments = await this.creditCheckModel.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: null, totalPayments: { $sum: '$paymentBehavior.totalPayments' }, totalMissed: { $sum: '$paymentBehavior.missedPayments' } }}
    ]);

    const defaultRate = totalPayments.length > 0 && totalPayments[0].totalPayments > 0 
      ? (totalPayments[0].totalMissed / totalPayments[0].totalPayments) * 100 
      : 0;

    // Average days to payment
    const avgDays = await this.creditCheckModel.aggregate([
      { $match: { isActive: true, 'paymentBehavior.averageDaysLate': { $exists: true } } },
      { $group: { _id: null, avgDays: { $avg: '$paymentBehavior.averageDaysLate' } } }
    ]);

    const averageDaysToPayment = avgDays.length > 0 ? Math.round(avgDays[0].avgDays) : 0;

    // Quarterly growth (simplified)
    const quarterlyGrowth = await this.getQuarterlyGrowthData();

    return {
      totalUsers,
      scoreDistribution,
      riskDistribution,
      averageScore,
      medianScore,
      totalCreditIssued,
      totalCreditUtilized,
      defaultRate,
      averageDaysToPayment,
      quarterlyGrowth,
    };
  }

  // Private helper methods

  private async createInitialCreditCheck(userId: Types.ObjectId): Promise<CreditCheckDocument> {
    const initialCreditCheck = new this.creditCheckModel({
      userId,
      currentScore: 650, // Default starting score
      riskLevel: CreditRiskLevel.MEDIUM,
      assessmentType: CreditAssessmentType.INITIAL,
      paymentBehavior: new PaymentBehaviorMetrics(),
      riskFactors: new CreditRiskFactors(),
      approvedCreditLimit: this.config.minCreditLimit,
      currentCreditUtilized: 0,
      availableCredit: this.config.minCreditLimit,
      lastAssessmentDate: new Date(),
      quarterlyHistory: [],
      scoreHistory: [{
        date: new Date(),
        score: 650,
        trigger: 'initial_assessment',
      }],
      improvementRecommendations: [
        'Make your first pay-later purchase to start building credit history',
        'Set up automatic payments to ensure on-time payments',
        'Keep your first purchases small to establish good payment patterns',
      ],
      isActive: true,
    });

    return await initialCreditCheck.save() as CreditCheckDocument;
  }

  private async calculatePaymentHistoryScore(userId: Types.ObjectId, orders: OrderDocument[]): Promise<number> {
    const creditCheck = await this.creditCheckModel.findOne({ userId, isActive: true });
    
    if (!creditCheck || creditCheck.paymentBehavior.totalPayments === 0) {
      return 650; // Default score for new users
    }

    const behavior = creditCheck.paymentBehavior;
    const onTimePercentage = behavior.onTimePaymentPercentage;

    // Score calculation based on payment performance
    if (onTimePercentage >= 98) return 850;
    if (onTimePercentage >= 95) return 800;
    if (onTimePercentage >= 90) return 750;
    if (onTimePercentage >= 80) return 700;
    if (onTimePercentage >= 70) return 650;
    if (onTimePercentage >= 60) return 600;
    if (onTimePercentage >= 50) return 550;
    return 500;
  }

  private calculateCreditUtilizationScore(creditCheck: CreditCheckDocument): number {
    if (creditCheck.approvedCreditLimit === 0) {
      return 750; // Good score for no utilization
    }

    const utilizationPercentage = (creditCheck.currentCreditUtilized / creditCheck.approvedCreditLimit) * 100;

    if (utilizationPercentage === 0) return 850;
    if (utilizationPercentage <= 10) return 800;
    if (utilizationPercentage <= 20) return 750;
    if (utilizationPercentage <= 30) return 700;
    if (utilizationPercentage <= 50) return 650;
    if (utilizationPercentage <= 70) return 600;
    if (utilizationPercentage <= 90) return 550;
    return 500;
  }

  private calculateCreditHistoryScore(user: UserDocument, creditCheck: CreditCheckDocument): number {
    const accountAge = (new Date().getTime() - (user as any).createdAt.getTime()) / (1000 * 60 * 60 * 24);
    
    if (accountAge >= 365 * 2) return 800; // 2+ years
    if (accountAge >= 365) return 750;     // 1+ year
    if (accountAge >= 180) return 700;     // 6+ months
    if (accountAge >= 90) return 650;      // 3+ months
    if (accountAge >= 30) return 600;      // 1+ month
    return 550; // Less than 1 month
  }

  private calculateCreditMixScore(orders: OrderDocument[]): number {
    if (orders.length === 0) return 600;

    const paymentMethods = new Set(orders.map(o => o.paymentPlan));
    const methodCount = paymentMethods.size;

    if (methodCount >= 3) return 750;
    if (methodCount >= 2) return 700;
    return 650;
  }

  private calculateNewCreditScore(orders: OrderDocument[]): number {
    const recentOrders = orders.filter(o => {
      const daysSinceOrder = (new Date().getTime() - (o as any).createdAt.getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceOrder <= 30; // Last 30 days
    });

    if (recentOrders.length === 0) return 750;
    if (recentOrders.length <= 2) return 700;
    if (recentOrders.length <= 4) return 650;
    return 600; // Too many recent credit applications
  }

  private async calculatePlatformFactorsScore(user: UserDocument, orders: OrderDocument[]): Promise<number> {
    let score = 700; // Base platform score

    // Order consistency
    if (orders.length >= 5) score += 20;
    
    // Account verification
    if ((user as any).isVerified) score += 30;
    
    // Geographic factors (if enabled)
    if (this.config.geographicRiskEnabled && (user as any).city) {
      // This could be expanded with actual geographic risk data
      const lowRiskCities = ['Lagos', 'Abuja', 'Port Harcourt', 'Ibadan'];
      if (lowRiskCities.includes((user as any).city)) {
        score += 10;
      }
    }

    return Math.min(850, score);
  }

  private determineRiskLevel(score: number): CreditRiskLevel {
    if (score >= this.config.lowRiskThreshold) return CreditRiskLevel.LOW;
    if (score >= this.config.mediumRiskThreshold) return CreditRiskLevel.MEDIUM;
    if (score >= this.config.highRiskThreshold) return CreditRiskLevel.HIGH;
    return CreditRiskLevel.VERY_HIGH;
  }

  private updateAverageDaysLate(currentAverage: number, totalPayments: number, newDaysLate: number): number {
    const totalDays = currentAverage * (totalPayments - 1) + newDaysLate;
    return totalDays / totalPayments;
  }

  private async getQuarterlyGrowthData(): Promise<Array<{ quarter: string; newUsers: number; averageScoreChange: number; }>> {
    // Simplified quarterly growth calculation
    const currentYear = new Date().getFullYear();
    const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
    
    const growthData = [];
    
    for (const quarter of quarters) {
      const newUsers = await this.creditCheckModel.countDocuments({
        createdAt: {
          $gte: this.getQuarterStartDate(currentYear, quarter),
          $lt: this.getQuarterEndDate(currentYear, quarter),
        }
      });

      // For simplicity, using a mock average score change
      // In a real implementation, this would calculate actual score changes
      const averageScoreChange = Math.random() * 20 - 10; // Random between -10 and +10

      growthData.push({
        quarter: `${quarter}-${currentYear}`,
        newUsers,
        averageScoreChange: Math.round(averageScoreChange),
      });
    }

    return growthData;
  }

  private getQuarterStartDate(year: number, quarter: string): Date {
    const month = { Q1: 0, Q2: 3, Q3: 6, Q4: 9 }[quarter];
    return new Date(year, month, 1);
  }

  private getQuarterEndDate(year: number, quarter: string): Date {
    const month = { Q1: 3, Q2: 6, Q3: 9, Q4: 12 }[quarter];
    return new Date(year, month, 1);
  }

  /**
   * Public method to schedule quarterly assessments
   */
  async scheduleQuarterlyAssessments(): Promise<void> {
    // This method can be called to manually trigger quarterly assessments
    await this.processScheduledAssessments();
  }
}
