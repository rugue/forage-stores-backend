import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { AuctionsModule } from '../auctions/auctions.module';
import { ProductsModule } from '../products/products.module';
import { ReferralsModule } from '../referrals/referrals.module';

@Module({
  imports: [
    NotificationsModule,
    SubscriptionsModule,
    AuctionsModule,
    ProductsModule,
    ReferralsModule,
  ],
  providers: [TasksService],
  exports: [TasksService],
})
export class TasksModule {}
