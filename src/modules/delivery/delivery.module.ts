import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DeliveryService } from './delivery.service';
import { RidersService } from './riders.service';
import { RiderAssignmentService } from './services/rider-assignment.service';
import { DeliveryOrchestrationService } from './services/delivery-orchestration.service';
import { DeliveryController } from './delivery.controller';
import { RidersController } from './riders.controller';
import { DeliveryManagementController } from './delivery-management.controller';
import { Delivery, DeliverySchema } from '../delivery/entities/delivery.entity';
import { Rider, RiderSchema } from '../delivery/entities/rider.entity';
import { Order, OrderSchema } from '../orders/entities/order.entity';
import { User, UserSchema } from '../users/entities/user.entity';
import { Wallet, WalletSchema } from '../wallets/entities/wallet.entity';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';
import { WalletsModule } from '../wallets/wallets.module';
import { OrdersModule } from '../orders/orders.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Delivery.name, schema: DeliverySchema },
      { name: Rider.name, schema: RiderSchema },
      { name: Order.name, schema: OrderSchema },
      { name: User.name, schema: UserSchema },
      { name: Wallet.name, schema: WalletSchema },
    ]),
    forwardRef(() => UsersModule),
    forwardRef(() => AuthModule),
    forwardRef(() => WalletsModule),
    forwardRef(() => OrdersModule),
  ],
  controllers: [DeliveryController, RidersController, DeliveryManagementController],
  providers: [
    DeliveryService, 
    RidersService, 
    RiderAssignmentService,
    DeliveryOrchestrationService
  ],
  exports: [
    DeliveryService, 
    RidersService, 
    RiderAssignmentService,
    DeliveryOrchestrationService
  ],
})
export class DeliveryModule {}
