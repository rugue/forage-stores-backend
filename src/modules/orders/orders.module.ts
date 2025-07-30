import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { OrdersReferralHookService } from './orders-referral-hook.service';
import { CartService } from './cart.service';
import { CartCleanupService } from './cart-cleanup.service';
import { Order, OrderSchema } from '../orders/entities/order.entity';
import { Cart, CartSchema } from './entities/cart.entity';
import { Product, ProductSchema } from '../products/entities/product.entity';
import { User, UserSchema } from '../users/entities/user.entity';
import { Wallet, WalletSchema } from '../wallets/entities/wallet.entity';
import { ReferralsModule } from '../referrals/referrals.module';

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
  ],
  controllers: [OrdersController],
  providers: [OrdersService, OrdersReferralHookService, CartService, CartCleanupService],
  exports: [OrdersService, CartService],
})
export class OrdersModule {}
