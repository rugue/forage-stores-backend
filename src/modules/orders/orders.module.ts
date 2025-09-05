import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { OrdersReferralHookService } from './orders-referral-hook.service';
import { CartService } from './cart.service';
import { CartCleanupService } from './cart-cleanup.service';
import { OrderStateMachine } from './services/order-state-machine.service';
import { OrderRealTimeService } from './gateways/orders.gateway';
import { BulkOperationsService } from './services/bulk-operations.service';
import { RefundCancellationService } from './services/refund-cancellation.service';
import { SubscriptionOrderService } from './services/subscription-order.service';
import { RefundCancellationController } from './controllers/refund-cancellation.controller';
import { Order, OrderSchema } from '../orders/entities/order.entity';
import { Cart, CartSchema } from './entities/cart.entity';
import { Product, ProductSchema } from '../products/entities/product.entity';
import { User, UserSchema } from '../users/entities/user.entity';
import { Wallet, WalletSchema } from '../wallets/entities/wallet.entity';
import { ReferralsModule } from '../referrals/referrals.module';
import { CreditScoringModule } from '../credit-scoring/credit-scoring.module';
import { DeliveryModule } from '../delivery/delivery.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Order.name, schema: OrderSchema },
      { name: Cart.name, schema: CartSchema },
      { name: Product.name, schema: ProductSchema },
      { name: User.name, schema: UserSchema },
      { name: Wallet.name, schema: WalletSchema },
    ]),
    ScheduleModule.forRoot(),
    forwardRef(() => ReferralsModule),
    forwardRef(() => CreditScoringModule),
    forwardRef(() => DeliveryModule),
  ],
  controllers: [OrdersController, RefundCancellationController],
  providers: [OrdersService, OrdersReferralHookService, CartService, CartCleanupService, OrderStateMachine, OrderRealTimeService, BulkOperationsService, RefundCancellationService, SubscriptionOrderService],
  exports: [OrdersService, CartService, OrderStateMachine, OrderRealTimeService, BulkOperationsService, RefundCancellationService, SubscriptionOrderService],
})
export class OrdersModule {}
