import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { COMMISSION_QUEUE, REFERRAL_QUEUE } from '../referral-queue.module';
import { CommissionJobData, CommissionRollbackJobData } from '../processors/commission.processor';

@Injectable()
export class ReferralQueueService {
  private readonly logger = new Logger(ReferralQueueService.name);

  constructor(
    @InjectQueue(COMMISSION_QUEUE) private commissionQueue: Queue,
    @InjectQueue(REFERRAL_QUEUE) private referralQueue: Queue,
  ) {}

  async addCommissionJob(
    data: CommissionJobData,
    options?: {
      delay?: number;
      priority?: number;
      attempts?: number;
    },
  ): Promise<void> {
    this.logger.log(`Adding commission job for order: ${data.orderId}`);
    
    await this.commissionQueue.add('process-commission', data, {
      delay: options?.delay || 0,
      priority: options?.priority || 0,
      attempts: options?.attempts || 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    });
  }

  async addCommissionRollbackJob(
    data: CommissionRollbackJobData,
    options?: {
      delay?: number;
      priority?: number;
    },
  ): Promise<void> {
    this.logger.log(`Adding commission rollback job for order: ${data.orderId}`);
    
    await this.commissionQueue.add('rollback-commission', data, {
      delay: options?.delay || 0,
      priority: options?.priority || 10, // High priority for rollbacks
      attempts: 5,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
    });
  }

  async addBatchCommissionJob(
    orderIds: string[],
    options?: {
      delay?: number;
      chunkSize?: number;
    },
  ): Promise<void> {
    this.logger.log(`Adding batch commission job for ${orderIds.length} orders`);
    
    const chunkSize = options?.chunkSize || 10;
    const chunks = this.chunkArray(orderIds, chunkSize);

    for (let i = 0; i < chunks.length; i++) {
      await this.commissionQueue.add(
        'batch-process-commissions',
        { orderIds: chunks[i] },
        {
          delay: (options?.delay || 0) + (i * 1000), // Stagger batch processing
          attempts: 3,
        },
      );
    }
  }

  async scheduleRecurringCommissionCheck(): Promise<void> {
    this.logger.log('Scheduling recurring commission check');
    
    // Add a recurring job to check for unprocessed commissions
    await this.commissionQueue.add(
      'check-pending-commissions',
      {},
      {
        repeat: { cron: '0 */6 * * *' }, // Every 6 hours
        attempts: 3,
      },
    );
  }

  async getQueueStats(): Promise<{
    commissionQueue: {
      waiting: number;
      active: number;
      completed: number;
      failed: number;
    };
    referralQueue: {
      waiting: number;
      active: number;
      completed: number;
      failed: number;
    };
  }> {
    const [
      commissionWaiting,
      commissionActive,
      commissionCompleted,
      commissionFailed,
      referralWaiting,
      referralActive,
      referralCompleted,
      referralFailed,
    ] = await Promise.all([
      this.commissionQueue.getWaiting(),
      this.commissionQueue.getActive(),
      this.commissionQueue.getCompleted(),
      this.commissionQueue.getFailed(),
      this.referralQueue.getWaiting(),
      this.referralQueue.getActive(),
      this.referralQueue.getCompleted(),
      this.referralQueue.getFailed(),
    ]);

    return {
      commissionQueue: {
        waiting: commissionWaiting.length,
        active: commissionActive.length,
        completed: commissionCompleted.length,
        failed: commissionFailed.length,
      },
      referralQueue: {
        waiting: referralWaiting.length,
        active: referralActive.length,
        completed: referralCompleted.length,
        failed: referralFailed.length,
      },
    };
  }

  async pauseQueues(): Promise<void> {
    this.logger.log('Pausing all referral queues');
    await Promise.all([
      this.commissionQueue.pause(),
      this.referralQueue.pause(),
    ]);
  }

  async resumeQueues(): Promise<void> {
    this.logger.log('Resuming all referral queues');
    await Promise.all([
      this.commissionQueue.resume(),
      this.referralQueue.resume(),
    ]);
  }

  async clearQueues(): Promise<void> {
    this.logger.log('Clearing all referral queues');
    await Promise.all([
      this.commissionQueue.empty(),
      this.referralQueue.empty(),
    ]);
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}
