import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { CreditScoringService } from './credit-scoring.service';
import { CreditScoringController } from './credit-scoring.controller';
import { QuarterlyAssessmentScheduler } from './quarterly-assessment.scheduler';
import { 
  CreditCheck, 
  CreditCheckSchema 
} from './entities/credit-check.entity';

// Import schemas directly
import { Order, OrderSchema } from '../orders/entities/order.entity';
import { User, UserSchema } from '../users/entities/user.entity';

// Import related modules for integration
import { OrdersModule } from '../orders/orders.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    // Schedule module for cron jobs
    ScheduleModule.forRoot(),
    
    // MongoDB schemas
    MongooseModule.forFeature([
      { name: CreditCheck.name, schema: CreditCheckSchema },
      { name: Order.name, schema: OrderSchema },
      { name: User.name, schema: UserSchema },
    ]),
    
    // Related modules - using forwardRef to prevent circular dependencies
    forwardRef(() => OrdersModule),
    forwardRef(() => UsersModule),
  ],
  
  controllers: [CreditScoringController],
  
  providers: [
    CreditScoringService,
    QuarterlyAssessmentScheduler,
  ],
  
  exports: [
    CreditScoringService,
    QuarterlyAssessmentScheduler,
  ],
})
export class CreditScoringModule {}
