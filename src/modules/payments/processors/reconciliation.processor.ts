import { Processor, Process } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Job } from 'bull';
import { ConfigService } from '@nestjs/config';
import { Payment, PaymentDocument } from '../entities/payment.entity';
import { PaymentStrategyFactory } from '../strategies/payment-strategy.factory';
import { 
  PaymentStatus, 
  PaymentGateway,
  PAYMENT_CONSTANTS 
} from '../constants/payment.constants';
import { 
  IReconciliationRecord, 
  IReconciliationDiscrepancy 
} from '../interfaces/payment.interface';

@Processor('payment-reconciliation')
@Injectable()
export class ReconciliationProcessor {
  private readonly logger = new Logger(ReconciliationProcessor.name);

  constructor(
    @InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>,
    private readonly configService: ConfigService,
    private readonly strategyFactory: PaymentStrategyFactory,
  ) {}

  @Process('daily-reconciliation')
  async handleDailyReconciliation(job: Job): Promise<void> {
    try {
      this.logger.log('Starting daily payment reconciliation');

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Get all completed payments from yesterday
      const payments = await this.paymentModel.find({
        status: PaymentStatus.COMPLETED,
        completedAt: {
          $gte: yesterday,
          $lt: today,
        },
      });

      this.logger.log(`Found ${payments.length} completed payments for reconciliation`);

      // Group payments by gateway
      const paymentsByGateway = payments.reduce((acc, payment) => {
        if (!acc[payment.gateway]) {
          acc[payment.gateway] = [];
        }
        acc[payment.gateway].push(payment);
        return acc;
      }, {} as Record<PaymentGateway, PaymentDocument[]>);

      const reconciliationResults: IReconciliationRecord[] = [];

      // Reconcile each gateway
      for (const [gateway, gatewayPayments] of Object.entries(paymentsByGateway)) {
        try {
          const result = await this.reconcileGatewayPayments(
            gateway as PaymentGateway,
            gatewayPayments,
            yesterday
          );
          reconciliationResults.push(result);
        } catch (error) {
          this.logger.error(`Error reconciling ${gateway}: ${error.message}`, error.stack);
        }
      }

      // Log reconciliation summary
      const totalAmount = reconciliationResults.reduce((sum, r) => sum + r.totalAmount, 0);
      const totalDiscrepancies = reconciliationResults.reduce((sum, r) => sum + r.discrepancies.length, 0);

      this.logger.log(`Daily reconciliation completed: ₦${totalAmount / 100} processed, ${totalDiscrepancies} discrepancies found`);

    } catch (error) {
      this.logger.error(`Error in daily reconciliation: ${error.message}`, error.stack);
    }
  }

  /**
   * Reconcile payments for a specific gateway
   */
  private async reconcileGatewayPayments(
    gateway: PaymentGateway,
    payments: PaymentDocument[],
    date: Date
  ): Promise<IReconciliationRecord> {
    const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);
    const totalFees = payments.reduce((sum, p) => sum + (p.fees?.totalFees || 0), 0);

    // TODO: Implement actual gateway reconciliation API calls
    // For now, assume all payments are reconciled correctly
    const reconciliationRecord: IReconciliationRecord = {
      date,
      gateway,
      totalTransactions: payments.length,
      totalAmount,
      totalFees,
      successfulTransactions: payments.length,
      failedTransactions: 0,
      discrepancies: [],
      status: 'COMPLETED',
    };

    this.logger.log(`Reconciled ${payments.length} ${gateway} payments totaling ₦${totalAmount / 100}`);

    return reconciliationRecord;
  }
}
