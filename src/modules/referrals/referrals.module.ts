import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ReferralsService } from './referrals.service';
import { ReferralsController } from './referrals.controller';
import { CommissionService } from './services/commission.service';
import { GrowthManagementService } from './services/growth-management.service';
import { TransactionService } from './services/transaction.service';
import { CommissionStrategyFactory } from './strategies/commission.strategies';
import { ReferralQueueModule } from './queue/referral-queue.module';
import { Referral, ReferralSchema } from '../referrals/entities/referral.entity';
import { Commission, CommissionSchema } from './entities/commission.entity';
import { User, UserSchema } from '../users/entities/user.entity';
import { Order, OrderSchema } from '../orders/entities/order.entity';
import { OrdersModule } from '../orders/orders.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Referral.name, schema: ReferralSchema },
      { name: Commission.name, schema: CommissionSchema },
      { name: User.name, schema: UserSchema },
      { name: Order.name, schema: OrderSchema },
    ]),
    forwardRef(() => OrdersModule),
    ReferralQueueModule,
  ],
  controllers: [ReferralsController],
  providers: [
    ReferralsService,
    CommissionService,
    GrowthManagementService,
    TransactionService,
    CommissionStrategyFactory,
  ],
  exports: [
    ReferralsService,
    CommissionService,
    GrowthManagementService,
    TransactionService,
    CommissionStrategyFactory,
  ],
})
export class ReferralsModule {}
