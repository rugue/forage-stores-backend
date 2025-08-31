import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bull';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';
import { Subscription, SubscriptionSchema } from './entities/subscription.entity';
import { Wallet, WalletSchema } from '../wallets/entities/wallet.entity';
import { Order, OrderSchema } from '../orders/entities/order.entity';
import { User, UserSchema } from '../users/entities/user.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { SubscriptionProcessor } from './processors/subscription.processor';
import { SubscriptionRetryProcessor } from './processors/subscription-retry.processor';
import { SubscriptionNotificationProcessor } from './processors/subscription-notifications.processor';
import { ConvenienceFeeProvider } from './services/convenience-fee.provider';
import { SubscriptionStateMachine } from './services/subscription-state-machine.service';
import { ConflictResolutionService } from './services/conflict-resolution.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Subscription.name, schema: SubscriptionSchema },
      { name: Wallet.name, schema: WalletSchema },
      { name: Order.name, schema: OrderSchema },
      { name: User.name, schema: UserSchema },
    ]),
    ScheduleModule.forRoot(),
    NotificationsModule,
    
    // Bull queues for subscription background processing
    BullModule.registerQueue({
      name: 'subscription-processing',
    }),
    BullModule.registerQueue({
      name: 'subscription-retry',
    }),
    BullModule.registerQueue({
      name: 'subscription-notifications',
    }),
  ],
  controllers: [SubscriptionsController],
  providers: [
    SubscriptionsService,
    SubscriptionProcessor,
    SubscriptionRetryProcessor,
    SubscriptionNotificationProcessor,
    ConvenienceFeeProvider,
    SubscriptionStateMachine,
    ConflictResolutionService,
  ],
  exports: [SubscriptionsService],
})
export class SubscriptionsModule {}
