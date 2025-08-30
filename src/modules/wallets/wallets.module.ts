import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CacheModule } from '@nestjs/cache-manager';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { Wallet, WalletSchema } from '../wallets/entities/wallet.entity';
import { WithdrawalRequest, WithdrawalRequestSchema } from './entities/withdrawal-request.entity';
import { User, UserSchema } from '../users/entities/user.entity';
import { WalletsController } from './wallets.controller';
import { WithdrawalController } from './controllers/withdrawal.controller';
import { WalletsService } from './wallets.service';
import { WithdrawalService } from './services/withdrawal.service';
import { WalletCacheService } from './services/wallet-cache.service';
import { WalletEventListener } from './listeners/wallet-event.listener';
import { WalletAuditInterceptor } from './interceptors/wallet-audit.interceptor';
import { AdminTwoFactorGuard } from './guards/admin-2fa.guard';
import { BalanceValidationPipe, WithdrawalValidationPipe, TransferValidationPipe } from './pipes/wallet-validation.pipes';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Wallet.name, schema: WalletSchema },
      { name: WithdrawalRequest.name, schema: WithdrawalRequestSchema },
      { name: User.name, schema: UserSchema },
    ]),
    CacheModule.register({
      ttl: 300, // 5 minutes default TTL
      max: 1000, // Maximum number of items in cache
    }),
    EventEmitterModule,
  ],
  controllers: [WalletsController, WithdrawalController],
  providers: [
    WalletsService,
    WithdrawalService,
    WalletCacheService,
    WalletEventListener,
    WalletAuditInterceptor,
    AdminTwoFactorGuard,
    BalanceValidationPipe,
    WithdrawalValidationPipe,
    TransferValidationPipe,
  ],
  exports: [
    WalletsService,
    WithdrawalService,
    WalletCacheService,
    WalletAuditInterceptor,
    AdminTwoFactorGuard,
    BalanceValidationPipe,
    WithdrawalValidationPipe,
    TransferValidationPipe,
  ], // Export for use in other modules
})
export class WalletsModule {}
