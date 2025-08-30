// Wallet events for event-driven architecture
export class WalletBalanceUpdatedEvent {
  constructor(
    public readonly userId: string,
    public readonly walletType: string,
    public readonly oldBalance: number,
    public readonly newBalance: number,
    public readonly transactionId: string,
    public readonly reason: string,
  ) {}
}

export class WalletTransactionEvent {
  constructor(
    public readonly userId: string,
    public readonly transactionType: 'credit' | 'debit',
    public readonly amount: number,
    public readonly walletType: string,
    public readonly transactionId: string,
    public readonly description: string,
    public readonly metadata?: Record<string, any>,
  ) {}
}

export class WalletStatusChangedEvent {
  constructor(
    public readonly userId: string,
    public readonly oldStatus: string,
    public readonly newStatus: string,
    public readonly changedBy: string,
    public readonly reason?: string,
  ) {}
}

export class WalletCreatedEvent {
  constructor(
    public readonly userId: string,
    public readonly walletId: string,
    public readonly initialBalances: {
      foodMoney: number;
      foodPoints: number;
      foodSafe: number;
    },
  ) {}
}

export class SuspiciousActivityEvent {
  constructor(
    public readonly userId: string,
    public readonly activityType: string,
    public readonly amount: number,
    public readonly details: Record<string, any>,
    public readonly timestamp: Date,
  ) {}
}
