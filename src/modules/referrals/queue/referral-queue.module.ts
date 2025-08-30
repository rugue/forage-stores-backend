import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { CommissionProcessor } from './processors/commission.processor';
import { ReferralQueueService } from './services/referral-queue.service';

export const COMMISSION_QUEUE = 'commission-processing';
export const REFERRAL_QUEUE = 'referral-processing';

@Module({
  imports: [
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6379,
        password: process.env.REDIS_PASSWORD,
      },
    }),
    BullModule.registerQueue(
      {
        name: COMMISSION_QUEUE,
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
          removeOnComplete: 100,
          removeOnFail: 50,
        },
      },
      {
        name: REFERRAL_QUEUE,
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
          removeOnComplete: 100,
          removeOnFail: 50,
        },
      },
    ),
  ],
  providers: [CommissionProcessor, ReferralQueueService],
  exports: [ReferralQueueService],
})
export class ReferralQueueModule {}
