import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  WalletBalanceUpdatedEvent,
  WalletTransactionEvent,
  WalletStatusChangedEvent,
  WalletCreatedEvent,
  SuspiciousActivityEvent,
} from '../events/wallet.events';
import { Wallet, WalletDocument } from '../entities/wallet.entity';
import { WALLET_CONSTANTS } from '../constants/wallet.constants';

@Injectable()
export class WalletEventListener {
  private readonly logger = new Logger(WalletEventListener.name);

  constructor(
    @InjectModel(Wallet.name) private walletModel: Model<WalletDocument>,
  ) {}

  @OnEvent('wallet.balance.updated')
  async handleBalanceUpdated(event: WalletBalanceUpdatedEvent) {
    this.logger.log(`Balance updated for user ${event.userId}: ${event.walletType} changed from ${event.oldBalance} to ${event.newBalance}`);
    
    // Check for suspicious activity
    const amountChange = Math.abs(event.newBalance - event.oldBalance);
    if (amountChange >= WALLET_CONSTANTS.AUTO_FREEZE_SUSPICIOUS_AMOUNT) {
      this.logger.warn(`Large balance change detected for user ${event.userId}: ${amountChange}`);
      
      // Emit suspicious activity event
      const suspiciousEvent = new SuspiciousActivityEvent(
        event.userId,
        'large_balance_change',
        amountChange,
        {
          walletType: event.walletType,
          oldBalance: event.oldBalance,
          newBalance: event.newBalance,
          transactionId: event.transactionId,
          reason: event.reason,
        },
        new Date(),
      );
      
      // You could emit this to a security monitoring system
      this.logger.warn('Suspicious activity detected', suspiciousEvent);
    }
  }

  @OnEvent('wallet.transaction')
  async handleTransaction(event: WalletTransactionEvent) {
    this.logger.log(`Transaction recorded for user ${event.userId}: ${event.transactionType} ${event.amount} ${event.walletType}`);
    
    // Update last transaction timestamp
    await this.walletModel.updateOne(
      { userId: event.userId },
      { lastTransactionAt: new Date() },
    );

    // Log high-value transactions
    if (event.amount >= WALLET_CONSTANTS.AUTO_FREEZE_SUSPICIOUS_AMOUNT / 2) {
      this.logger.warn(`High-value transaction: ${event.amount} by user ${event.userId}`);
    }
  }

  @OnEvent('wallet.status.changed')
  async handleStatusChanged(event: WalletStatusChangedEvent) {
    this.logger.log(`Wallet status changed for user ${event.userId}: ${event.oldStatus} -> ${event.newStatus} by ${event.changedBy}`);
    
    // Log security-related status changes
    if (event.newStatus === 'frozen' || event.newStatus === 'suspended') {
      this.logger.warn(`Security action: Wallet ${event.newStatus} for user ${event.userId}`, {
        changedBy: event.changedBy,
        reason: event.reason,
      });
    }
  }

  @OnEvent('wallet.created')
  async handleWalletCreated(event: WalletCreatedEvent) {
    this.logger.log(`New wallet created for user ${event.userId}: ID ${event.walletId}`);
    
    // Emit welcome event or trigger onboarding workflows
    this.logger.debug('Wallet creation completed', {
      userId: event.userId,
      initialBalances: event.initialBalances,
    });
  }

  @OnEvent('wallet.suspicious.activity')
  async handleSuspiciousActivity(event: SuspiciousActivityEvent) {
    this.logger.error(`Suspicious activity detected for user ${event.userId}:`, {
      activityType: event.activityType,
      amount: event.amount,
      details: event.details,
      timestamp: event.timestamp,
    });
    
    // In production, you might want to:
    // 1. Send alerts to security team
    // 2. Temporarily freeze the wallet
    // 3. Require additional verification
    // 4. Log to external security system
    
    // For now, just log and potentially freeze large transactions
    if (event.amount >= WALLET_CONSTANTS.AUTO_FREEZE_SUSPICIOUS_AMOUNT) {
      this.logger.warn(`Consider freezing wallet for user ${event.userId} due to suspicious activity`);
      
      // Auto-freeze wallet if amount is very large
      if (event.amount >= WALLET_CONSTANTS.AUTO_FREEZE_SUSPICIOUS_AMOUNT * 2) {
        await this.walletModel.updateOne(
          { userId: event.userId },
          { 
            status: 'frozen',
            lastTransactionAt: new Date(),
          },
        );
        
        this.logger.error(`Auto-frozen wallet for user ${event.userId} due to suspicious activity: ${event.amount}`);
      }
    }
  }

  @OnEvent('wallet.daily.limit.exceeded')
  async handleDailyLimitExceeded(event: { userId: string; amount: number; limit: number }) {
    this.logger.warn(`Daily limit exceeded for user ${event.userId}: ${event.amount} > ${event.limit}`);
    
    // Could trigger additional verification or temporary suspension
  }

  @OnEvent('wallet.monthly.limit.exceeded')
  async handleMonthlyLimitExceeded(event: { userId: string; amount: number; limit: number }) {
    this.logger.warn(`Monthly limit exceeded for user ${event.userId}: ${event.amount} > ${event.limit}`);
    
    // Could trigger compliance review or enhanced verification
  }
}
