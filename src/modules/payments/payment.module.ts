import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bull';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';

// Entities
import { Payment, PaymentSchema } from './entities/payment.entity';
import { Refund, RefundSchema } from './entities/refund.entity';
import { PaymentPlanEntity, PaymentPlanSchema } from './entities/payment-plan.entity';

// Services
import { PaymentService } from './services/payment.service';

// Controllers
import { PaymentController, AdminPaymentController } from './controllers/payment.controller';

// Strategies and Factories
import { PaymentStrategyFactory } from './strategies/payment-strategy.factory';
import { PaystackStrategy } from './strategies/paystack.strategy';

// Guards
import { PaymentGuard } from './guards/payment.guard';

// Processors
import { PaymentProcessor } from './processors/payment.processor';
import { WebhookProcessor } from './processors/webhook.processor';
import { ReconciliationProcessor } from './processors/reconciliation.processor';

@Module({
  imports: [
    // Mongoose models
    MongooseModule.forFeature([
      { name: Payment.name, schema: PaymentSchema },
      { name: Refund.name, schema: RefundSchema },
      { name: PaymentPlanEntity.name, schema: PaymentPlanSchema },
    ]),
    
    // Bull queues for background processing
    BullModule.registerQueue({
      name: 'payment-processing',
    }),
    BullModule.registerQueue({
      name: 'payment-reconciliation',
    }),
    BullModule.registerQueue({
      name: 'payment-retry',
    }),
    
    // Config and Events
    ConfigModule,
    EventEmitterModule,
  ],
  
  controllers: [
    PaymentController,
    AdminPaymentController,
  ],
  
  providers: [
    PaymentService,
    PaymentStrategyFactory,
    PaystackStrategy,
    PaymentProcessor,
    WebhookProcessor,
    ReconciliationProcessor,
    PaymentGuard,
  ],
  
  exports: [
    PaymentService,
    PaymentStrategyFactory,
  ],
})
export class PaymentModule {}
