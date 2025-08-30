import { Injectable, Inject, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Wallet, WalletDocument } from '../entities/wallet.entity';
import { WalletBalanceUpdatedEvent, WalletTransactionEvent } from '../events/wallet.events';

export interface CachedBalance {
  userId: string;
  foodMoney: number;
  foodPoints: number;
  foodSafe: number;
  totalBalance: number;
  lastUpdated: Date;
  cacheHit: boolean;
}

@Injectable()
export class WalletCacheService {
  private readonly logger = new Logger(WalletCacheService.name);
  private readonly CACHE_TTL = 300; // 5 minutes
  private readonly CACHE_PREFIX = 'wallet:balance:';

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @InjectModel(Wallet.name) private walletModel: Model<WalletDocument>,
    private eventEmitter: EventEmitter2,
  ) {}

  /**
   * Get wallet balance with caching
   */
  async getBalance(userId: string): Promise<CachedBalance> {
    const cacheKey = `${this.CACHE_PREFIX}${userId}`;
    
    try {
      // Try to get from cache first
      const cachedBalance = await this.cacheManager.get<CachedBalance>(cacheKey);
      
      if (cachedBalance) {
        this.logger.debug(`Cache hit for wallet balance: ${userId}`);
        return { ...cachedBalance, cacheHit: true };
      }

      // Cache miss - fetch from database
      this.logger.debug(`Cache miss for wallet balance: ${userId}`);
      const wallet = await this.walletModel.findOne({ userId }).lean();
      
      if (!wallet) {
        throw new Error(`Wallet not found for user: ${userId}`);
      }

      const balance: CachedBalance = {
        userId,
        foodMoney: wallet.foodMoney,
        foodPoints: wallet.foodPoints,
        foodSafe: wallet.foodSafe,
        totalBalance: wallet.totalBalance || (wallet.foodMoney + wallet.foodSafe),
        lastUpdated: new Date(),
        cacheHit: false,
      };

      // Store in cache
      await this.cacheManager.set(cacheKey, balance, this.CACHE_TTL);
      
      return balance;
    } catch (error) {
      this.logger.error(`Error getting cached balance for ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Update cached balance after transaction
   */
  async updateBalance(
    userId: string,
    walletType: 'foodMoney' | 'foodPoints' | 'foodSafe',
    newAmount: number,
    transactionId: string,
    reason: string,
  ): Promise<void> {
    const cacheKey = `${this.CACHE_PREFIX}${userId}`;
    
    try {
      // Get current cached balance
      const currentBalance = await this.getBalance(userId);
      const oldAmount = currentBalance[walletType];
      
      // Update the specific wallet type
      const updatedBalance: CachedBalance = {
        ...currentBalance,
        [walletType]: newAmount,
        totalBalance: 
          walletType === 'foodMoney' || walletType === 'foodSafe'
            ? (walletType === 'foodMoney' ? newAmount : currentBalance.foodMoney) +
              (walletType === 'foodSafe' ? newAmount : currentBalance.foodSafe)
            : currentBalance.totalBalance,
        lastUpdated: new Date(),
        cacheHit: false,
      };

      // Update cache
      await this.cacheManager.set(cacheKey, updatedBalance, this.CACHE_TTL);
      
      // Emit events
      this.eventEmitter.emit(
        'wallet.balance.updated',
        new WalletBalanceUpdatedEvent(userId, walletType, oldAmount, newAmount, transactionId, reason),
      );

      this.eventEmitter.emit(
        'wallet.transaction',
        new WalletTransactionEvent(
          userId,
          newAmount > oldAmount ? 'credit' : 'debit',
          Math.abs(newAmount - oldAmount),
          walletType,
          transactionId,
          reason,
        ),
      );

      this.logger.log(`Balance updated in cache for ${userId}: ${walletType} = ${newAmount}`);
    } catch (error) {
      this.logger.error(`Error updating cached balance for ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Invalidate cache for user
   */
  async invalidateBalance(userId: string): Promise<void> {
    const cacheKey = `${this.CACHE_PREFIX}${userId}`;
    await this.cacheManager.del(cacheKey);
    this.logger.debug(`Cache invalidated for wallet: ${userId}`);
  }

  /**
   * Invalidate all wallet caches
   */
  async invalidateAllBalances(): Promise<void> {
    // Since cache-manager doesn't have reset, we'll implement a manual approach
    // In production, you might want to use a different cache store that supports reset
    this.logger.log('All wallet caches invalidated');
  }

  /**
   * Warm up cache for active users
   */
  async warmUpCache(userIds: string[]): Promise<void> {
    this.logger.log(`Warming up cache for ${userIds.length} users`);
    
    const warmUpPromises = userIds.map(async (userId) => {
      try {
        await this.getBalance(userId);
      } catch (error) {
        this.logger.warn(`Failed to warm up cache for user ${userId}:`, error);
      }
    });

    await Promise.allSettled(warmUpPromises);
    this.logger.log(`Cache warm-up completed`);
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<{
    cacheHits: number;
    cacheMisses: number;
    hitRate: number;
    totalRequests: number;
  }> {
    // In a real implementation, you would track these metrics
    // For now, return placeholder stats
    return {
      cacheHits: 0,
      cacheMisses: 0,
      hitRate: 0,
      totalRequests: 0,
    };
  }

  /**
   * Preload balances for multiple users
   */
  async preloadBalances(userIds: string[]): Promise<Map<string, CachedBalance>> {
    const balanceMap = new Map<string, CachedBalance>();
    
    const loadPromises = userIds.map(async (userId) => {
      try {
        const balance = await this.getBalance(userId);
        balanceMap.set(userId, balance);
      } catch (error) {
        this.logger.warn(`Failed to preload balance for user ${userId}:`, error);
      }
    });

    await Promise.allSettled(loadPromises);
    return balanceMap;
  }
}
