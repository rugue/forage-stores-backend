import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { ScheduledJobsService } from './scheduled-jobs.service';
import { ScheduledJobsController } from './scheduled-jobs.controller';
import { User, UserSchema } from '../users/entities/user.entity';
import { Referral, ReferralSchema } from '../referrals/entities/referral.entity';
import { Order, OrderSchema } from '../orders/entities/order.entity';
import { Subscription, SubscriptionSchema } from '../subscriptions/entities/subscription.entity';
import { Wallet, WalletSchema } from '../wallets/entities/wallet.entity';
import { WithdrawalRequest, WithdrawalRequestSchema } from '../wallets/entities/withdrawal-request.entity';
import { ProfitPoolModule } from '../profit-pool/profit-pool.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Referral.name, schema: ReferralSchema },
      { name: Order.name, schema: OrderSchema },
      { name: Subscription.name, schema: SubscriptionSchema },
      { name: Wallet.name, schema: WalletSchema },
      { name: WithdrawalRequest.name, schema: WithdrawalRequestSchema },
    ]),
    ProfitPoolModule,
    NotificationsModule,
  ],
  controllers: [ScheduledJobsController],
  providers: [ScheduledJobsService],
  exports: [ScheduledJobsService],
})
export class ScheduledJobsModule {}
