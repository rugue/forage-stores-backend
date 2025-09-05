import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { CreditScoringService } from './credit-scoring.service';
import { CreditScoringController } from './credit-scoring.controller';
import { CreditQualificationService } from './services/credit-qualification.service';
import { DefaultRecoveryService } from './services/default-recovery.service';
import { CreditQualificationController } from './controllers/credit-qualification.controller';
import { QuarterlyAssessmentScheduler } from './quarterly-assessment.scheduler';
import { 
  CreditCheck, 
  CreditCheckSchema 
} from './entities/credit-check.entity';

// Import schemas directly
import { Order, OrderSchema } from '../orders/entities/order.entity';
import { User, UserSchema } from '../users/entities/user.entity';
import { Wallet, WalletSchema } from '../wallets/entities/wallet.entity';

// Import related modules for integration
import { OrdersModule } from '../orders/orders.module';
import { UsersModule } from '../users/users.module';
import { WalletsModule } from '../wallets/wallets.module';

@Module({
  imports: [
    // Schedule module for cron jobs
    ScheduleModule.forRoot(),
    
    // MongoDB schemas
    MongooseModule.forFeature([
      { name: CreditCheck.name, schema: CreditCheckSchema },
      { name: Order.name, schema: OrderSchema },
      { name: User.name, schema: UserSchema },
      { name: Wallet.name, schema: WalletSchema },
    ]),
    
    // Related modules - using forwardRef to prevent circular dependencies
    forwardRef(() => OrdersModule),
    forwardRef(() => UsersModule),
    forwardRef(() => WalletsModule),
  ],
  
  controllers: [
    CreditScoringController,
    CreditQualificationController,
  ],
  
  providers: [
    CreditScoringService,
    CreditQualificationService,
    DefaultRecoveryService,
    QuarterlyAssessmentScheduler,
  ],
  
  exports: [
    CreditScoringService,
    CreditQualificationService,
    DefaultRecoveryService,
    QuarterlyAssessmentScheduler,
  ],
})
export class CreditScoringModule {}
