import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ReferralsService } from './referrals.service';
import { ReferralsController } from './referrals.controller';
import { CommissionService } from './services/commission.service';
import { GrowthManagementService } from './services/growth-management.service';
import { Referral, ReferralSchema } from '../referrals/entities/referral.entity';
import { Commission, CommissionSchema } from './entities/commission.entity';
import { User, UserSchema } from '../users/entities/user.entity';
import { Wallet, WalletSchema } from '../wallets/entities/wallet.entity';
import { Order, OrderSchema } from '../orders/entities/order.entity';
import { OrdersModule } from '../orders/orders.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Referral.name, schema: ReferralSchema },
      { name: Commission.name, schema: CommissionSchema },
      { name: User.name, schema: UserSchema },
      { name: Wallet.name, schema: WalletSchema },
      { name: Order.name, schema: OrderSchema },
    ]),
    forwardRef(() => OrdersModule),
  ],
  controllers: [ReferralsController],
  providers: [
    ReferralsService,
    CommissionService,
    GrowthManagementService,
  ],
  exports: [
    ReferralsService,
    CommissionService,
    GrowthManagementService,
  ],
})
export class ReferralsModule {}
