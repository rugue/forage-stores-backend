import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Schema, Types } from 'mongoose';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { User, UserSchema } from '../../entities/user.entity';
import { Wallet, WalletSchema } from '../../entities/wallet.entity';
import { Order, OrderSchema } from '../../entities/order.entity';
import { Subscription, SubscriptionSchema } from '../../entities/subscription.entity';
import { Referral, ReferralSchema } from '../../entities/referral.entity';
import { Product, ProductSchema } from '../../entities/product.entity';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Wallet.name, schema: WalletSchema },
      { name: Order.name, schema: OrderSchema },
      { name: Subscription.name, schema: SubscriptionSchema },
      { name: Referral.name, schema: ReferralSchema },
      { name: Product.name, schema: ProductSchema },
      { name: 'Category', schema: new Schema({
        name: { type: String, required: true },
        description: { type: String },
        parentCategoryId: { type: Types.ObjectId, ref: 'Category' },
        isActive: { type: Boolean, default: true },
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now }
      }) },
      { name: 'PriceHistory', schema: new Schema({
        productId: { type: Types.ObjectId, ref: 'Product', required: true },
        oldPrice: { type: Number, required: true },
        newPrice: { type: Number, required: true },
        effectiveDate: { type: Date, required: true },
        reason: { type: String },
        adminId: { type: Types.ObjectId, ref: 'User', required: true },
        createdAt: { type: Date, default: Date.now }
      }) }
    ]),
    UsersModule,
    AuthModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
