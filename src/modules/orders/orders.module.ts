import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { OrdersReferralHookService } from './orders-referral-hook.service';
import { Order, OrderSchema } from '../../entities/order.entity';
import { Product, ProductSchema } from '../../entities/product.entity';
import { User, UserSchema } from '../../entities/user.entity';
import { Wallet, WalletSchema } from '../../entities/wallet.entity';
import { ReferralsModule } from '../referrals/referrals.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Order.name, schema: OrderSchema },
      { name: Product.name, schema: ProductSchema },
      { name: User.name, schema: UserSchema },
      { name: Wallet.name, schema: WalletSchema },
    ]),
    forwardRef(() => ReferralsModule),
  ],
  controllers: [OrdersController],
  providers: [OrdersService, OrdersReferralHookService],
  exports: [OrdersService],
})
export class OrdersModule {}
