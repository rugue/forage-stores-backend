import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection, ClientSession } from 'mongoose';

export interface TransactionContext {
  session: ClientSession;
  operations: Array<() => Promise<any>>;
  rollbackOperations: Array<() => Promise<any>>;
}

@Injectable()
export class TransactionService {
  private readonly logger = new Logger(TransactionService.name);

  constructor(
    @InjectConnection() private connection: Connection,
  ) {}

  async executeTransaction<T>(
    operation: (session: ClientSession) => Promise<T>,
    rollbackOperation?: (session: ClientSession) => Promise<void>,
  ): Promise<T> {
    const session = await this.connection.startSession();
    
    try {
      session.startTransaction();
      
      const result = await operation(session);
      
      await session.commitTransaction();
      this.logger.log('Transaction committed successfully');
      
      return result;
    } catch (error) {
      this.logger.error(`Transaction failed: ${error.message}`);
      
      try {
        await session.abortTransaction();
        this.logger.log('Transaction rolled back');
        
        if (rollbackOperation) {
          await rollbackOperation(session);
          this.logger.log('Rollback operation executed');
        }
      } catch (rollbackError) {
        this.logger.error(`Rollback failed: ${rollbackError.message}`);
      }
      
      throw error;
    } finally {
      await session.endSession();
    }
  }

  async executeCommissionTransaction(
    orderId: string,
    commissionOperations: {
      createCommissions: (session: ClientSession) => Promise<any[]>;
      updateWallets: (session: ClientSession) => Promise<any[]>;
      logTransactions: (session: ClientSession) => Promise<any[]>;
    },
  ): Promise<{
    commissions: any[];
    walletUpdates: any[];
    transactionLogs: any[];
  }> {
    return this.executeTransaction(
      async (session) => {
        this.logger.log(`Starting commission transaction for order: ${orderId}`);
        
        // Execute all operations within the transaction
        const [commissions, walletUpdates, transactionLogs] = await Promise.all([
          commissionOperations.createCommissions(session),
          commissionOperations.updateWallets(session),
          commissionOperations.logTransactions(session),
        ]);

        this.logger.log(`Commission transaction completed for order: ${orderId}`);
        
        return {
          commissions,
          walletUpdates,
          transactionLogs,
        };
      },
      async (session) => {
        // Rollback operations
        this.logger.log(`Rolling back commission transaction for order: ${orderId}`);
        
        // Rollback logic would be implemented here
        // For example: restore previous wallet balances, delete created commissions, etc.
      },
    );
  }

  async executePaymentTransaction(
    paymentData: {
      userId: string;
      amount: number;
      orderId: string;
      referralCommissions?: any[];
    },
  ): Promise<{
    payment: any;
    commissions: any[];
    walletUpdate: any;
  }> {
    return this.executeTransaction(
      async (session) => {
        this.logger.log(`Starting payment transaction for user: ${paymentData.userId}`);
        
        // 1. Process payment
        const payment = await this.processPayment(paymentData, session);
        
        // 2. Create and process commissions
        const commissions = paymentData.referralCommissions || [];
        for (const commission of commissions) {
          await this.processCommissionInTransaction(commission, session);
        }
        
        // 3. Update wallet balances
        const walletUpdate = await this.updateWalletInTransaction(
          paymentData.userId,
          -paymentData.amount,
          session,
        );

        return {
          payment,
          commissions,
          walletUpdate,
        };
      },
      async (session) => {
        // Rollback payment and commissions
        this.logger.log(`Rolling back payment transaction for user: ${paymentData.userId}`);
      },
    );
  }

  private async processPayment(paymentData: any, session: ClientSession): Promise<any> {
    // Payment processing logic within transaction
    this.logger.log(`Processing payment: ${paymentData.amount} for order: ${paymentData.orderId}`);
    
    // This would integrate with your payment processing logic
    return {
      id: `payment_${Date.now()}`,
      amount: paymentData.amount,
      status: 'processed',
    };
  }

  private async processCommissionInTransaction(commission: any, session: ClientSession): Promise<any> {
    // Commission processing within transaction
    this.logger.log(`Processing commission: ${commission.amount} for user: ${commission.userId}`);
    
    return commission;
  }

  private async updateWalletInTransaction(
    userId: string,
    amount: number,
    session: ClientSession,
  ): Promise<any> {
    // Wallet update within transaction
    this.logger.log(`Updating wallet for user: ${userId}, amount: ${amount}`);
    
    return {
      userId,
      balanceChange: amount,
      timestamp: new Date(),
    };
  }
}
