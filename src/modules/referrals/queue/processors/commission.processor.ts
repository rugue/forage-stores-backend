import { Processor, Process, OnQueueActive, OnQueueCompleted, OnQueueFailed } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { CommissionService } from '../../services/commission.service';
import { TransactionService } from '../../services/transaction.service';
import { COMMISSION_QUEUE } from '../referral-queue.module';

export interface CommissionJobData {
  orderId: string;
  userId: string;
  referrerId: string;
  orderAmount: number;
  commissionType: string;
  priority?: number;
}

export interface CommissionRollbackJobData {
  orderId: string;
  commissionIds: string[];
  reason: string;
}

@Processor(COMMISSION_QUEUE)
export class CommissionProcessor {
  private readonly logger = new Logger(CommissionProcessor.name);

  constructor(
    private commissionService: CommissionService,
    private transactionService: TransactionService,
  ) {}

  @Process('process-commission')
  async processCommission(job: Job<CommissionJobData>) {
    this.logger.log(`Processing commission job: ${job.id}`);
    
    const { orderId, userId, referrerId, orderAmount, commissionType } = job.data;

    try {
      // Use transaction service for atomic operations
      const result = await this.transactionService.executeCommissionTransaction(orderId, {
        createCommissions: async (session) => {
          const commissions = await this.commissionService.processCommissionsForOrder(orderId);
          return commissions;
        },
        updateWallets: async (session) => {
          // Update wallet balances within transaction
          return [];
        },
        logTransactions: async (session) => {
          // Log transaction history
          return [];
        },
      });

      this.logger.log(`Commission processed successfully for order: ${orderId}`);
      return result;
    } catch (error) {
      this.logger.error(`Commission processing failed for order ${orderId}: ${error.message}`);
      throw error;
    }
  }

  @Process('rollback-commission')
  async rollbackCommission(job: Job<CommissionRollbackJobData>) {
    this.logger.log(`Processing commission rollback job: ${job.id}`);
    
    const { orderId, commissionIds, reason } = job.data;

    try {
      await this.transactionService.executeTransaction(
        async (session) => {
          this.logger.log(`Rolling back commissions for order: ${orderId}, reason: ${reason}`);
          
          // Rollback commissions
          for (const commissionId of commissionIds) {
            await this.commissionService.rollbackCommission(commissionId, 'Job processing failed');
          }
          
          return { rolledBack: commissionIds.length };
        },
      );

      this.logger.log(`Commission rollback completed for order: ${orderId}`);
    } catch (error) {
      this.logger.error(`Commission rollback failed for order ${orderId}: ${error.message}`);
      throw error;
    }
  }

  @Process('batch-process-commissions')
  async batchProcessCommissions(job: Job<{ orderIds: string[] }>) {
    this.logger.log(`Processing batch commission job: ${job.id}`);
    
    const { orderIds } = job.data;
    const results = [];

    for (const orderId of orderIds) {
      try {
        const commissions = await this.commissionService.processCommissionsForOrder(orderId);
        results.push({ orderId, success: true, commissions: commissions.length });
      } catch (error) {
        this.logger.error(`Failed to process commissions for order ${orderId}: ${error.message}`);
        results.push({ orderId, success: false, error: error.message });
      }
    }

    this.logger.log(`Batch commission processing completed: ${results.length} orders`);
    return results;
  }

  @OnQueueActive()
  onActive(job: Job) {
    this.logger.log(`Processing job ${job.id} of type ${job.name} with data:`, job.data);
  }

  @OnQueueCompleted()
  onCompleted(job: Job, result: any) {
    this.logger.log(`Completed job ${job.id} of type ${job.name}. Result:`, result);
  }

  @OnQueueFailed()
  onFailed(job: Job, error: Error) {
    this.logger.error(`Failed job ${job.id} of type ${job.name}. Error: ${error.message}`);
  }
}
