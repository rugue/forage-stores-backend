import { BullModule } from '@nestjs/bull';
import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CommissionProcessor } from './processors/commission.processor';
import { ReferralQueueService } from './services/referral-queue.service';
import { CommissionService } from '../services/commission.service';
import { TransactionService } from '../services/transaction.service';
import { 
  CommissionStrategyFactory, 
  RegularUserCommissionStrategy,
  GrowthAssociateCommissionStrategy,
  GrowthEliteCommissionStrategy
} from '../strategies/commission.strategies';
import { Referral, ReferralSchema } from '../entities/referral.entity';
import { Commission, CommissionSchema } from '../entities/commission.entity';
import { User, UserSchema } from '../../users/entities/user.entity';
import { Order, OrderSchema } from '../../orders/entities/order.entity';

export const COMMISSION_QUEUE = 'commission-processing';
export const REFERRAL_QUEUE = 'referral-processing';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Referral.name, schema: ReferralSchema },
      { name: Commission.name, schema: CommissionSchema },
      { name: User.name, schema: UserSchema },
      { name: Order.name, schema: OrderSchema },
    ]),
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
  providers: [
    // CommissionProcessor, 
    ReferralQueueService, 
    CommissionService, 
    TransactionService, 
    CommissionStrategyFactory,
    RegularUserCommissionStrategy,
    GrowthAssociateCommissionStrategy,
    GrowthEliteCommissionStrategy
  ],
  exports: [ReferralQueueService],
})
export class ReferralQueueModule {}
