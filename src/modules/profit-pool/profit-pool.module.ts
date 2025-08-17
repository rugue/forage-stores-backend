import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { ProfitPoolController } from './profit-pool.controller';
import { ProfitPoolService } from './profit-pool.service';
import { RevenueCalculationService } from './services/revenue-calculation.service';
import { ProfitPool, ProfitPoolSchema } from './entities/profit-pool.entity';
import { User, UserSchema } from '../users/entities/user.entity';
import { Order, OrderSchema } from '../orders/entities/order.entity';
import { Subscription, SubscriptionSchema } from '../subscriptions/entities/subscription.entity';
import { Delivery, DeliverySchema } from '../delivery/entities/delivery.entity';
import { WalletsModule } from '../wallets/wallets.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    // Register Mongoose schemas
    MongooseModule.forFeature([
      { name: ProfitPool.name, schema: ProfitPoolSchema },
      { name: User.name, schema: UserSchema },
      { name: Order.name, schema: OrderSchema },
      { name: Subscription.name, schema: SubscriptionSchema },
      { name: Delivery.name, schema: DeliverySchema },
    ]),
    
    // Schedule module for cron jobs
    ScheduleModule.forRoot(),
    
    // Import required modules
    WalletsModule,
    AuthModule,
  ],
  controllers: [ProfitPoolController],
  providers: [
    ProfitPoolService,
    RevenueCalculationService,
  ],
  exports: [
    ProfitPoolService,
    RevenueCalculationService,
  ],
})
export class ProfitPoolModule {}
