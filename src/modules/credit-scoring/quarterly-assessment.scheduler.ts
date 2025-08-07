import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreditScoringService } from './credit-scoring.service';
import { CreditCheck, CreditCheckDocument } from './entities/credit-check.entity';
import { IQuarterlyAssessmentSummary } from './interfaces/credit-scoring.interface';

@Injectable()
export class QuarterlyAssessmentScheduler {
  private readonly logger = new Logger(QuarterlyAssessmentScheduler.name);

  constructor(
    private readonly creditScoringService: CreditScoringService,
    @InjectModel(CreditCheck.name)
    private readonly creditCheckModel: Model<CreditCheckDocument>,
  ) {}

  /**
   * Daily check for users due for quarterly assessment
   * Runs every day at 1:00 AM to check if any users need quarterly assessment
   */
  @Cron('0 1 * * *') // Daily at 1:00 AM
  async checkDueAssessments(): Promise<void> {
    this.logger.log('Checking for users due for quarterly assessment...');

    try {
      const now = new Date();
      
      // Find users whose next assessment date has passed
      const dueAssessments = await this.creditCheckModel.find({
        isActive: true,
        nextAssessmentDate: { $lte: now },
      }).limit(100); // Process in batches

      if (dueAssessments.length === 0) {
        this.logger.log('No users due for quarterly assessment');
        return;
      }

      this.logger.log(`Found ${dueAssessments.length} users due for quarterly assessment`);

      let completed = 0;
      let failed = 0;

      for (const creditCheck of dueAssessments) {
        try {
          await this.creditScoringService.performQuarterlyAssessment(creditCheck.userId);
          completed++;
          
          // Add small delay to prevent overwhelming the system
          await this.delay(100);
          
        } catch (error) {
          this.logger.error(
            `Failed to perform quarterly assessment for user ${creditCheck.userId}: ${error.message}`
          );
          failed++;
        }
      }

      this.logger.log(
        `Daily assessment check completed: ${completed} successful, ${failed} failed`
      );

    } catch (error) {
      this.logger.error(`Error in daily assessment check: ${error.message}`);
    }
  }

  /**
   * Quarterly batch assessment - runs on the first day of each quarter
   * This is the main quarterly assessment process
   */
  @Cron('0 2 1 1,4,7,10 *') // 1st day of Jan, Apr, Jul, Oct at 2:00 AM
  async performQuarterlyBatchAssessment(): Promise<IQuarterlyAssessmentSummary> {
    this.logger.log('Starting quarterly batch credit assessment...');

    try {
      const summary = await this.creditScoringService.processScheduledAssessments();
      
      this.logger.log('Quarterly batch assessment completed:', summary);
      
      // Optionally send notifications or reports to administrators
      await this.sendAssessmentSummaryNotification(summary);
      
      return summary;
      
    } catch (error) {
      this.logger.error(`Error in quarterly batch assessment: ${error.message}`);
      throw error;
    }
  }

  /**
   * Monthly credit score recalculation for all active users
   * Runs on the 1st day of each month at 3:00 AM
   */
  @Cron('0 3 1 * *') // 1st day of each month at 3:00 AM
  async monthlyScoreRecalculation(): Promise<void> {
    this.logger.log('Starting monthly credit score recalculation...');

    try {
      const activeUsers = await this.creditCheckModel.find({ isActive: true }).limit(1000);
      
      let processed = 0;
      let updated = 0;
      let failed = 0;

      for (const creditCheck of activeUsers) {
        try {
          const oldScore = creditCheck.currentScore;
          const newScore = await this.creditScoringService.calculateCreditScore(creditCheck.userId);
          
          processed++;
          
          if (Math.abs((newScore || 0) - (oldScore || 0)) >= 10) {
            updated++;
            this.logger.debug(
              `Significant score change for user ${creditCheck.userId}: ${oldScore} → ${newScore}`
            );
          }

          // Add delay to prevent system overload
          await this.delay(200);
          
        } catch (error) {
          this.logger.error(
            `Failed to recalculate score for user ${creditCheck.userId}: ${error.message}`
          );
          failed++;
        }
      }

      this.logger.log(
        `Monthly score recalculation completed: ${processed} processed, ${updated} updated, ${failed} failed`
      );

    } catch (error) {
      this.logger.error(`Error in monthly score recalculation: ${error.message}`);
    }
  }

  /**
   * Weekly analytics and reporting
   * Runs every Sunday at 4:00 AM
   */
  @Cron('0 4 * * 0') // Every Sunday at 4:00 AM
  async weeklyAnalyticsReport(): Promise<void> {
    this.logger.log('Generating weekly credit analytics report...');

    try {
      const analytics = await this.creditScoringService.getCreditAnalytics();
      
      // Log key metrics
      this.logger.log(`Weekly Analytics - Total Users: ${analytics.totalUsers}`);
      this.logger.log(`Average Score: ${analytics.averageScore}`);
      this.logger.log(`Default Rate: ${analytics.defaultRate}%`);
      
      // In a production system, this would send the report to administrators
      // or save it to a reporting database
      
    } catch (error) {
      this.logger.error(`Error generating weekly analytics: ${error.message}`);
    }
  }

  /**
   * Cleanup old score history entries
   * Runs monthly on the 15th at 5:00 AM
   */
  @Cron('0 5 15 * *') // 15th of each month at 5:00 AM
  async cleanupOldScoreHistory(): Promise<void> {
    this.logger.log('Cleaning up old score history entries...');

    try {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const result = await this.creditCheckModel.updateMany(
        { isActive: true },
        {
          $pull: {
            scoreHistory: {
              date: { $lt: sixMonthsAgo }
            }
          }
        }
      );

      this.logger.log(`Score history cleanup completed: ${result.modifiedCount} records updated`);

    } catch (error) {
      this.logger.error(`Error in score history cleanup: ${error.message}`);
    }
  }

  /**
   * Identify users for credit limit increase
   * Runs bi-weekly on Mondays at 6:00 AM
   */
  @Cron('0 6 * * 1') // Every Monday at 6:00 AM
  async identifyLimitIncreaseEligible(): Promise<void> {
    this.logger.log('Identifying users eligible for credit limit increase...');

    try {
      // Find users with good payment behavior and improved scores
      const eligibleUsers = await this.creditCheckModel.find({
        isActive: true,
        currentScore: { $gte: 700 }, // Good credit score
        'paymentBehavior.onTimePaymentPercentage': { $gte: 95 }, // Excellent payment history
        'paymentBehavior.totalPayments': { $gte: 5 }, // At least 5 payments
        currentCreditUtilized: { $gte: 0 }, // Has used credit
        lastAssessmentDate: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Assessed in last 30 days
      }).limit(50);

      let eligibleCount = 0;

      for (const creditCheck of eligibleUsers) {
        try {
          const utilization = creditCheck.approvedCreditLimit > 0 
            ? (creditCheck.currentCreditUtilized / creditCheck.approvedCreditLimit) * 100 
            : 0;

          // If they're using more than 50% of their limit consistently
          if (utilization >= 50) {
            const recommendedLimit = await this.creditScoringService.calculateRecommendedCreditLimit(creditCheck.userId);
            
            if (recommendedLimit > creditCheck.approvedCreditLimit) {
              eligibleCount++;
              
              // In a real system, this would either auto-increase the limit
              // or flag for manual review
              this.logger.debug(
                `User ${creditCheck.userId} eligible for limit increase: ${creditCheck.approvedCreditLimit} → ${recommendedLimit}`
              );
            }
          }

        } catch (error) {
          this.logger.error(
            `Error checking limit increase for user ${creditCheck.userId}: ${error.message}`
          );
        }
      }

      this.logger.log(`Found ${eligibleCount} users eligible for credit limit increase`);

    } catch (error) {
      this.logger.error(`Error identifying users for limit increase: ${error.message}`);
    }
  }

  /**
   * Generate credit improvement recommendations
   * Runs monthly on the 20th at 7:00 AM
   */
  @Cron('0 7 20 * *') // 20th of each month at 7:00 AM
  async updateImprovementRecommendations(): Promise<void> {
    this.logger.log('Updating improvement recommendations for all users...');

    try {
      const users = await this.creditCheckModel.find({ 
        isActive: true,
        currentScore: { $lt: 750 } // Focus on users who can improve
      }).limit(500);

      let updated = 0;

      for (const creditCheck of users) {
        try {
          const recommendations = await this.creditScoringService.generateImprovementRecommendations(creditCheck.userId);
          
          // Update recommendations if they've changed
          if (JSON.stringify(recommendations) !== JSON.stringify(creditCheck.improvementRecommendations)) {
            creditCheck.improvementRecommendations = recommendations;
            await creditCheck.save();
            updated++;
          }

          await this.delay(50);

        } catch (error) {
          this.logger.error(
            `Error updating recommendations for user ${creditCheck.userId}: ${error.message}`
          );
        }
      }

      this.logger.log(`Updated improvement recommendations for ${updated} users`);

    } catch (error) {
      this.logger.error(`Error updating improvement recommendations: ${error.message}`);
    }
  }

  /**
   * Manual trigger for quarterly assessments (can be called by admin)
   */
  async manualQuarterlyAssessment(userIds?: Types.ObjectId[]): Promise<IQuarterlyAssessmentSummary> {
    this.logger.log('Manual quarterly assessment triggered');

    if (userIds && userIds.length > 0) {
      // Assess specific users
      let completed = 0;
      let failed = 0;

      for (const userId of userIds) {
        try {
          await this.creditScoringService.performQuarterlyAssessment(userId);
          completed++;
        } catch (error) {
          this.logger.error(`Failed to assess user ${userId}: ${error.message}`);
          failed++;
        }
      }

      return {
        assessmentDate: new Date(),
        totalAssessments: userIds.length,
        completedAssessments: completed,
        failedAssessments: failed,
        averageScoreChange: 0, // Would need to calculate
        usersWithImprovedScores: 0,
        usersWithDeclinedScores: 0,
        newRiskLevelDistribution: {} as any,
        recommendationsGenerated: 0,
      };
    } else {
      // Assess all users
      return this.creditScoringService.processScheduledAssessments();
    }
  }

  /**
   * Get assessment schedule information
   */
  getAssessmentSchedule(): Record<string, string> {
    return {
      'Daily Due Check': '0 1 * * * (1:00 AM daily)',
      'Quarterly Batch': '0 2 1 1,4,7,10 * (2:00 AM on 1st of Jan, Apr, Jul, Oct)',
      'Monthly Recalculation': '0 3 1 * * (3:00 AM on 1st of each month)',
      'Weekly Analytics': '0 4 * * 0 (4:00 AM every Sunday)',
      'History Cleanup': '0 5 15 * * (5:00 AM on 15th of each month)',
      'Limit Increase Check': '0 6 * * 1 (6:00 AM every Monday)',
      'Recommendations Update': '0 7 20 * * (7:00 AM on 20th of each month)',
    };
  }

  // Private helper methods

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async sendAssessmentSummaryNotification(summary: IQuarterlyAssessmentSummary): Promise<void> {
    // In a real implementation, this would send email or system notifications
    this.logger.log('Assessment summary notification would be sent here:', {
      totalAssessed: summary.totalAssessments,
      completed: summary.completedAssessments,
      failed: summary.failedAssessments,
      averageChange: summary.averageScoreChange,
    });
  }
}
