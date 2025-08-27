import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Schema, Types } from 'mongoose';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { User, UserSchema } from '../users/entities/user.entity';
import { Wallet, WalletSchema } from '../wallets/entities/wallet.entity';
import { Order, OrderSchema } from '../orders/entities/order.entity';
import { Subscription, SubscriptionSchema } from '../subscriptions/entities/subscription.entity';
import { Referral, ReferralSchema } from '../referrals/entities/referral.entity';
import { Product, ProductSchema } from '../products/entities/product.entity';
import { ProfitPool, ProfitPoolSchema } from '../profit-pool/entities/profit-pool.entity';
import { WithdrawalRequest, WithdrawalRequestSchema } from '../wallets/entities/withdrawal-request.entity';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';
import { WalletsModule } from '../wallets/wallets.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Wallet.name, schema: WalletSchema },
      { name: Order.name, schema: OrderSchema },
      { name: Subscription.name, schema: SubscriptionSchema },
      { name: Referral.name, schema: ReferralSchema },
      { name: Product.name, schema: ProductSchema },
      { name: ProfitPool.name, schema: ProfitPoolSchema },
      { name: WithdrawalRequest.name, schema: WithdrawalRequestSchema },
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
      }) },
      { name: 'CommissionOverride', schema: new Schema({
        referralId: { type: Types.ObjectId, ref: 'Referral', required: true },
        userId: { type: Types.ObjectId, ref: 'User', required: true },
        originalAmount: { type: Number, required: true },
        newAmount: { type: Number, required: true },
        difference: { type: Number, required: true },
        overrideType: { type: String, enum: ['bonus', 'penalty', 'adjustment'], required: true },
        reason: { type: String, required: true },
        adminNotes: { type: String },
        adminId: { type: Types.ObjectId, ref: 'User', required: true },
        createdAt: { type: Date, default: Date.now }
      }) }
    ]),
    UsersModule,
    AuthModule,
    WalletsModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
