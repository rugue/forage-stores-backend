import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Wallet, WalletSchema } from '../wallets/entities/wallet.entity';
import { WithdrawalRequest, WithdrawalRequestSchema } from './entities/withdrawal-request.entity';
import { User, UserSchema } from '../users/entities/user.entity';
import { WalletsController } from './wallets.controller';
import { WithdrawalController } from './controllers/withdrawal.controller';
import { WalletsService } from './wallets.service';
import { WithdrawalService } from './services/withdrawal.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Wallet.name, schema: WalletSchema },
      { name: WithdrawalRequest.name, schema: WithdrawalRequestSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [WalletsController, WithdrawalController],
  providers: [WalletsService, WithdrawalService],
  exports: [WalletsService, WithdrawalService], // Export for use in other modules
})
export class WalletsModule {}
