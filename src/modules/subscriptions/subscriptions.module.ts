import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionsController } from './subscriptions.controller';
import { Subscription, SubscriptionSchema } from '../../entities/subscription.entity';
import { Order, OrderSchema } from '../../entities/order.entity';
import { Wallet, WalletSchema } from '../../entities/wallet.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Subscription.name, schema: SubscriptionSchema },
      { name: Order.name, schema: OrderSchema },
      { name: Wallet.name, schema: WalletSchema },
    ]),
  ],
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService],
  exports: [SubscriptionsService],
})
export class SubscriptionsModule {}
