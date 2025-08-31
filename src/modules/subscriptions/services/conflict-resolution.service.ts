import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Subscription, SubscriptionDocument, SubscriptionStatus } from '../entities/subscription.entity';
import { Order, OrderDocument } from '../../orders/entities/order.entity';
import { Wallet, WalletDocument } from '../../wallets/entities/wallet.entity';
import { User, UserDocument } from '../../users/entities/user.entity';
import { NotificationsService } from '../../notifications/notifications.service';
import { SubscriptionStateMachine, StateMachineContext } from './subscription-state-machine.service';

export interface ConflictResolutionContext {
  subscriptionId: string;
  userId: string;
  userRole: string;
  conflictType: ConflictType;
  conflictData: any;
  proposedResolution: ConflictResolution;
}

export enum ConflictType {
  PAYMENT_MISMATCH = 'payment_mismatch',
  DUPLICATE_PAYMENT = 'duplicate_payment',
  INSUFFICIENT_FUNDS = 'insufficient_funds',
  SCHEDULE_CONFLICT = 'schedule_conflict',
  STATUS_MISMATCH = 'status_mismatch',
  ORDER_CONFLICT = 'order_conflict',
  WALLET_DISCREPANCY = 'wallet_discrepancy',
}

export enum ConflictResolution {
  AUTO_RETRY = 'auto_retry',
  MANUAL_REVIEW = 'manual_review',
  FORCE_RECONCILE = 'force_reconcile',
  PAUSE_SUBSCRIPTION = 'pause_subscription',
  CANCEL_SUBSCRIPTION = 'cancel_subscription',
  ADJUST_SCHEDULE = 'adjust_schedule',
  REFUND_EXCESS = 'refund_excess',
}

export interface ConflictRecord {
  id: string;
  subscriptionId: string;
  userId: string;
  conflictType: ConflictType;
  description: string;
  detectedAt: Date;
  resolvedAt?: Date;
  resolution?: ConflictResolution;
  resolutionData?: any;
  status: 'pending' | 'resolved' | 'escalated';
  priority: 'low' | 'medium' | 'high' | 'critical';
  adminNotes?: string;
  automaticResolutionAttempts: number;
}

@Injectable()
export class ConflictResolutionService {
  private readonly logger = new Logger(ConflictResolutionService.name);
  private conflicts: Map<string, ConflictRecord> = new Map();

  constructor(
    @InjectModel(Subscription.name) private subscriptionModel: Model<SubscriptionDocument>,
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(Wallet.name) private walletModel: Model<WalletDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly notificationsService: NotificationsService,
    private readonly stateMachine: SubscriptionStateMachine,
  ) {}

  /**
   * Detect and resolve conflicts automatically
   */
  async detectAndResolveConflicts(subscriptionId: string): Promise<ConflictRecord[]> {
    const conflicts: ConflictRecord[] = [];
    
    try {
      const subscription = await this.subscriptionModel.findById(subscriptionId);
      if (!subscription) return conflicts;

      // Check for payment mismatches
      const paymentConflicts = await this.detectPaymentMismatches(subscription);
      conflicts.push(...paymentConflicts);

      // Check for schedule conflicts
      const scheduleConflicts = await this.detectScheduleConflicts(subscription);
      conflicts.push(...scheduleConflicts);

      // Check for status mismatches
      const statusConflicts = await this.detectStatusMismatches(subscription);
      conflicts.push(...statusConflicts);

      // Check for wallet discrepancies
      const walletConflicts = await this.detectWalletDiscrepancies(subscription);
      conflicts.push(...walletConflicts);

      // Attempt automatic resolution
      for (const conflict of conflicts) {
        await this.attemptAutomaticResolution(conflict);
      }

      return conflicts;

    } catch (error) {
      this.logger.error(`Error detecting conflicts for subscription ${subscriptionId}:`, error.message);
      return conflicts;
    }
  }

  /**
   * Manually resolve a conflict
   */
  async resolveConflictManually(
    conflictId: string,
    resolution: ConflictResolution,
    adminUserId: string,
    notes?: string
  ): Promise<{ success: boolean; message: string }> {
    
    const conflict = this.conflicts.get(conflictId);
    if (!conflict) {
      throw new Error('Conflict not found');
    }

    try {
      conflict.resolution = resolution;
      conflict.resolvedAt = new Date();
      conflict.adminNotes = notes;
      conflict.status = 'resolved';

      await this.executeResolution(conflict);

      this.conflicts.set(conflictId, conflict);
      
      this.logger.log(`Conflict ${conflictId} resolved manually by admin ${adminUserId}`);
      
      return {
        success: true,
        message: `Conflict resolved successfully using ${resolution} strategy`
      };

    } catch (error) {
      this.logger.error(`Error resolving conflict ${conflictId}:`, error.message);
      conflict.status = 'escalated';
      this.conflicts.set(conflictId, conflict);
      
      throw error;
    }
  }

  /**
   * Get all pending conflicts
   */
  async getPendingConflicts(): Promise<ConflictRecord[]> {
    return Array.from(this.conflicts.values()).filter(c => c.status === 'pending');
  }

  /**
   * Get conflicts for a specific subscription
   */
  async getSubscriptionConflicts(subscriptionId: string): Promise<ConflictRecord[]> {
    return Array.from(this.conflicts.values()).filter(c => c.subscriptionId === subscriptionId);
  }

  private async detectPaymentMismatches(subscription: SubscriptionDocument): Promise<ConflictRecord[]> {
    const conflicts: ConflictRecord[] = [];
    
    try {
      const order = await this.orderModel.findById(subscription.orderId);
      if (!order) return conflicts;

      // Check if subscription amount paid matches order amount paid
      if (Math.abs(subscription.amountPaid - order.amountPaid) > 1) { // Allow 1 NGN difference
        conflicts.push(this.createConflictRecord(
          subscription._id.toString(),
          subscription.userId.toString(),
          ConflictType.PAYMENT_MISMATCH,
          `Subscription amount paid (${subscription.amountPaid}) doesn't match order amount paid (${order.amountPaid})`,
          'high'
        ));
      }

      // Check for duplicate payments in drops
      const paidDrops = subscription.dropSchedule.filter(drop => drop.isPaid);
      const transactionRefs = paidDrops.map(drop => drop.transactionRef).filter(ref => ref);
      const uniqueRefs = new Set(transactionRefs);
      
      if (transactionRefs.length !== uniqueRefs.size) {
        conflicts.push(this.createConflictRecord(
          subscription._id.toString(),
          subscription.userId.toString(),
          ConflictType.DUPLICATE_PAYMENT,
          'Duplicate transaction references found in drop schedule',
          'medium'
        ));
      }

    } catch (error) {
      this.logger.error('Error detecting payment mismatches:', error.message);
    }
    
    return conflicts;
  }

  private async detectScheduleConflicts(subscription: SubscriptionDocument): Promise<ConflictRecord[]> {
    const conflicts: ConflictRecord[] = [];
    
    try {
      const now = new Date();
      
      // Check for overdue drops
      const overdueDrops = subscription.dropSchedule.filter(drop => 
        !drop.isPaid && new Date(drop.scheduledDate) < now
      );
      
      if (overdueDrops.length > 0) {
        conflicts.push(this.createConflictRecord(
          subscription._id.toString(),
          subscription.userId.toString(),
          ConflictType.SCHEDULE_CONFLICT,
          `${overdueDrops.length} overdue drops found`,
          'high'
        ));
      }

      // Check for scheduling inconsistencies
      if (subscription.nextDropDate) {
        const nextUnpaidDrop = subscription.dropSchedule.find(drop => !drop.isPaid);
        if (nextUnpaidDrop && new Date(nextUnpaidDrop.scheduledDate).getTime() !== new Date(subscription.nextDropDate).getTime()) {
          conflicts.push(this.createConflictRecord(
            subscription._id.toString(),
            subscription.userId.toString(),
            ConflictType.SCHEDULE_CONFLICT,
            'Next drop date inconsistency between subscription and schedule',
            'medium'
          ));
        }
      }

    } catch (error) {
      this.logger.error('Error detecting schedule conflicts:', error.message);
    }
    
    return conflicts;
  }

  private async detectStatusMismatches(subscription: SubscriptionDocument): Promise<ConflictRecord[]> {
    const conflicts: ConflictRecord[] = [];
    
    try {
      // Check if status matches completion state
      if (subscription.dropsPaid >= subscription.totalDrops && subscription.status !== SubscriptionStatus.COMPLETED) {
        conflicts.push(this.createConflictRecord(
          subscription._id.toString(),
          subscription.userId.toString(),
          ConflictType.STATUS_MISMATCH,
          'Subscription should be marked as completed',
          'medium'
        ));
      }

      // Check if active subscription has no unpaid drops
      if (subscription.status === SubscriptionStatus.ACTIVE && 
          !subscription.dropSchedule.some(drop => !drop.isPaid)) {
        conflicts.push(this.createConflictRecord(
          subscription._id.toString(),
          subscription.userId.toString(),
          ConflictType.STATUS_MISMATCH,
          'Active subscription has no unpaid drops',
          'medium'
        ));
      }

    } catch (error) {
      this.logger.error('Error detecting status mismatches:', error.message);
    }
    
    return conflicts;
  }

  private async detectWalletDiscrepancies(subscription: SubscriptionDocument): Promise<ConflictRecord[]> {
    const conflicts: ConflictRecord[] = [];
    
    try {
      const wallet = await this.walletModel.findOne({ userId: subscription.userId });
      if (!wallet) return conflicts;

      // Check if user has sufficient funds for next drop
      const nextUnpaidDrop = subscription.dropSchedule.find(drop => !drop.isPaid);
      if (nextUnpaidDrop && subscription.status === SubscriptionStatus.ACTIVE) {
        if (wallet.foodMoney < nextUnpaidDrop.amount) {
          conflicts.push(this.createConflictRecord(
            subscription._id.toString(),
            subscription.userId.toString(),
            ConflictType.INSUFFICIENT_FUNDS,
            `Insufficient funds for next drop. Required: ${nextUnpaidDrop.amount}, Available: ${wallet.foodMoney}`,
            'high'
          ));
        }
      }

    } catch (error) {
      this.logger.error('Error detecting wallet discrepancies:', error.message);
    }
    
    return conflicts;
  }

  private async attemptAutomaticResolution(conflict: ConflictRecord): Promise<void> {
    conflict.automaticResolutionAttempts++;
    
    try {
      switch (conflict.conflictType) {
        case ConflictType.STATUS_MISMATCH:
          await this.resolveStatusMismatch(conflict);
          break;
          
        case ConflictType.INSUFFICIENT_FUNDS:
          await this.resolveInsufficientFunds(conflict);
          break;
          
        case ConflictType.SCHEDULE_CONFLICT:
          await this.resolveScheduleConflict(conflict);
          break;
          
        default:
          // Mark for manual review
          conflict.resolution = ConflictResolution.MANUAL_REVIEW;
          conflict.status = 'pending';
          break;
      }
    } catch (error) {
      this.logger.error(`Auto-resolution failed for conflict ${conflict.id}:`, error.message);
      conflict.status = 'pending';
    }
  }

  private async resolveStatusMismatch(conflict: ConflictRecord): Promise<void> {
    const subscription = await this.subscriptionModel.findById(conflict.subscriptionId);
    if (!subscription) return;

    if (subscription.dropsPaid >= subscription.totalDrops && subscription.status !== SubscriptionStatus.COMPLETED) {
      subscription.status = SubscriptionStatus.COMPLETED;
      subscription.isCompleted = true;
      subscription.endDate = new Date();
      await subscription.save();
      
      conflict.status = 'resolved';
      conflict.resolution = ConflictResolution.FORCE_RECONCILE;
      conflict.resolvedAt = new Date();
    }
  }

  private async resolveInsufficientFunds(conflict: ConflictRecord): Promise<void> {
    const subscription = await this.subscriptionModel.findById(conflict.subscriptionId);
    if (!subscription) return;

    // Pause subscription and schedule notification
    if (subscription.status === SubscriptionStatus.ACTIVE) {
      subscription.status = SubscriptionStatus.PAUSED;
      await subscription.save();
      
      // Send notification to user
      await this.notificationsService.sendEmail({
        recipientEmail: 'user@example.com', // Should get from user model
        type: 'EMAIL' as any,
        title: 'Subscription Paused - Insufficient Funds',
        message: 'Your subscription has been paused due to insufficient wallet balance',
        metadata: {
          subscriptionId: conflict.subscriptionId,
          conflictId: conflict.id,
          actionRequired: 'Please top up your wallet to resume subscription',
        }
      });
      
      conflict.status = 'resolved';
      conflict.resolution = ConflictResolution.PAUSE_SUBSCRIPTION;
      conflict.resolvedAt = new Date();
    }
  }

  private async resolveScheduleConflict(conflict: ConflictRecord): Promise<void> {
    const subscription = await this.subscriptionModel.findById(conflict.subscriptionId);
    if (!subscription) return;

    // Update next drop date to match next unpaid drop
    const nextUnpaidDrop = subscription.dropSchedule.find(drop => !drop.isPaid);
    if (nextUnpaidDrop) {
      subscription.nextDropDate = nextUnpaidDrop.scheduledDate;
      await subscription.save();
      
      conflict.status = 'resolved';
      conflict.resolution = ConflictResolution.ADJUST_SCHEDULE;
      conflict.resolvedAt = new Date();
    }
  }

  private async executeResolution(conflict: ConflictRecord): Promise<void> {
    switch (conflict.resolution) {
      case ConflictResolution.AUTO_RETRY:
        await this.executeAutoRetry(conflict);
        break;
        
      case ConflictResolution.FORCE_RECONCILE:
        await this.executeForceReconcile(conflict);
        break;
        
      case ConflictResolution.PAUSE_SUBSCRIPTION:
        await this.executePauseSubscription(conflict);
        break;
        
      case ConflictResolution.CANCEL_SUBSCRIPTION:
        await this.executeCancelSubscription(conflict);
        break;
        
      case ConflictResolution.ADJUST_SCHEDULE:
        await this.executeAdjustSchedule(conflict);
        break;
        
      case ConflictResolution.REFUND_EXCESS:
        await this.executeRefundExcess(conflict);
        break;
        
      default:
        this.logger.log(`Conflict ${conflict.id} marked for manual review`);
        break;
    }
  }

  private async executeAutoRetry(conflict: ConflictRecord): Promise<void> {
    // Implementation for auto retry logic
    this.logger.log(`Executing auto retry for conflict ${conflict.id}`);
  }

  private async executeForceReconcile(conflict: ConflictRecord): Promise<void> {
    // Implementation for force reconciliation
    this.logger.log(`Executing force reconcile for conflict ${conflict.id}`);
  }

  private async executePauseSubscription(conflict: ConflictRecord): Promise<void> {
    const subscription = await this.subscriptionModel.findById(conflict.subscriptionId);
    if (!subscription) return;

    subscription.status = SubscriptionStatus.PAUSED;
    await subscription.save();
    
    this.logger.log(`Paused subscription ${conflict.subscriptionId} due to conflict resolution`);
  }

  private async executeCancelSubscription(conflict: ConflictRecord): Promise<void> {
    const subscription = await this.subscriptionModel.findById(conflict.subscriptionId);
    if (!subscription) return;

    subscription.status = SubscriptionStatus.CANCELLED;
    subscription.endDate = new Date();
    await subscription.save();
    
    this.logger.log(`Cancelled subscription ${conflict.subscriptionId} due to conflict resolution`);
  }

  private async executeAdjustSchedule(conflict: ConflictRecord): Promise<void> {
    // Implementation for schedule adjustment
    this.logger.log(`Executing schedule adjustment for conflict ${conflict.id}`);
  }

  private async executeRefundExcess(conflict: ConflictRecord): Promise<void> {
    // Implementation for refund excess payments
    this.logger.log(`Executing refund excess for conflict ${conflict.id}`);
  }

  private createConflictRecord(
    subscriptionId: string,
    userId: string,
    conflictType: ConflictType,
    description: string,
    priority: 'low' | 'medium' | 'high' | 'critical'
  ): ConflictRecord {
    
    const conflictId = `${subscriptionId}_${conflictType}_${Date.now()}`;
    
    const conflict: ConflictRecord = {
      id: conflictId,
      subscriptionId,
      userId,
      conflictType,
      description,
      detectedAt: new Date(),
      status: 'pending',
      priority,
      automaticResolutionAttempts: 0,
    };
    
    this.conflicts.set(conflictId, conflict);
    
    this.logger.warn(`New conflict detected: ${conflictType} for subscription ${subscriptionId}`);
    
    return conflict;
  }

  /**
   * Get conflict resolution statistics
   */
  async getConflictStatistics(): Promise<{
    totalConflicts: number;
    pendingConflicts: number;
    resolvedConflicts: number;
    escalatedConflicts: number;
    conflictsByType: Record<ConflictType, number>;
    resolutionsByType: Record<ConflictResolution, number>;
  }> {
    const allConflicts = Array.from(this.conflicts.values());
    
    const conflictsByType = Object.values(ConflictType).reduce((acc, type) => {
      acc[type] = allConflicts.filter(c => c.conflictType === type).length;
      return acc;
    }, {} as Record<ConflictType, number>);
    
    const resolutionsByType = Object.values(ConflictResolution).reduce((acc, resolution) => {
      acc[resolution] = allConflicts.filter(c => c.resolution === resolution).length;
      return acc;
    }, {} as Record<ConflictResolution, number>);
    
    return {
      totalConflicts: allConflicts.length,
      pendingConflicts: allConflicts.filter(c => c.status === 'pending').length,
      resolvedConflicts: allConflicts.filter(c => c.status === 'resolved').length,
      escalatedConflicts: allConflicts.filter(c => c.status === 'escalated').length,
      conflictsByType,
      resolutionsByType,
    };
  }
}
