import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ExpenseTrackingController } from './expense-tracking.controller';
import { UserAnalyticsService } from './user-analytics.service';
import { Order, OrderSchema } from '../orders/entities/order.entity';
import { User, UserSchema } from '../users/entities/user.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Order.name, schema: OrderSchema },
      { name: User.name, schema: UserSchema }
    ])
  ],
  controllers: [ExpenseTrackingController],
  providers: [UserAnalyticsService],
  exports: [UserAnalyticsService]
})
export class AnalyticsModule {}
