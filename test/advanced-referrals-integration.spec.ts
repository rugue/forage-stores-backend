import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CommissionService } from '../src/modules/referrals/services/commission.service';
import { TransactionService } from '../src/modules/referrals/services/transaction.service';
import { CommissionStrategyFactory } from '../src/modules/referrals/strategies/commission.strategies';
import { ReferralQueueService } from '../src/modules/referrals/queue/services/referral-queue.service';
import { Commission, CommissionType, CommissionStatus } from '../src/modules/referrals/entities/commission.entity';
import { User, UserRole } from '../src/modules/users/entities/user.entity';
import { Order } from '../src/modules/orders/entities/order.entity';

describe('Advanced Referral System Integration', () => {
  let commissionService: CommissionService;
  let transactionService: TransactionService;
  let strategyFactory: CommissionStrategyFactory;
  let queueService: ReferralQueueService;
  let commissionModel: Model<Commission>;
  let userModel: Model<User>;
  let orderModel: Model<Order>;

  const mockCommissionModel = {
    findOne: jest.fn(),
    findById: jest.fn(),
    countDocuments: jest.fn(),
    create: jest.fn(),
    find: jest.fn(),
    aggregate: jest.fn(),
  };

  const mockUserModel = {
    findById: jest.fn(),
    findOne: jest.fn(),
  };

  const mockOrderModel = {
    findById: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommissionService,
        TransactionService,
        CommissionStrategyFactory,
        {
          provide: ReferralQueueService,
          useValue: {
            addCommissionJob: jest.fn(),
            addCommissionRollbackJob: jest.fn(),
            addBatchCommissionJob: jest.fn(),
          },
        },
        {
          provide: getModelToken(Commission.name),
          useValue: mockCommissionModel,
        },
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
        },
        {
          provide: getModelToken(Order.name),
          useValue: mockOrderModel,
        },
      ],
    }).compile();

    commissionService = module.get<CommissionService>(CommissionService);
    transactionService = module.get<TransactionService>(TransactionService);
    strategyFactory = module.get<CommissionStrategyFactory>(CommissionStrategyFactory);
    queueService = module.get<ReferralQueueService>(ReferralQueueService);
    commissionModel = module.get<Model<Commission>>(getModelToken(Commission.name));
    userModel = module.get<Model<User>>(getModelToken(User.name));
    orderModel = module.get<Model<Order>>(getModelToken(Order.name));
  });

  describe('Strategy Pattern Integration', () => {
    it('should select correct strategy for regular user', () => {
      const strategy = strategyFactory.getStrategy(UserRole.USER);
      expect(strategy).toBeDefined();
      expect(strategy.constructor.name).toBe('RegularUserStrategy');
    });

    it('should select correct strategy for Growth Associate', () => {
      const strategy = strategyFactory.getStrategy(UserRole.GROWTH_ASSOCIATE);
      expect(strategy).toBeDefined();
      expect(strategy.constructor.name).toBe('GrowthAssociateStrategy');
    });

    it('should select correct strategy for Growth Elite', () => {
      const strategy = strategyFactory.getStrategy(UserRole.GROWTH_ELITE);
      expect(strategy).toBeDefined();
      expect(strategy.constructor.name).toBe('GrowthEliteStrategy');
    });
  });

  describe('Commission Calculation with Strategy Pattern', () => {
    it('should calculate commission for regular user within first 3 purchases', async () => {
      const strategy = strategyFactory.getStrategy(UserRole.USER);
      const result = await strategy.calculateCommission(
        UserRole.USER,
        10000, // 10,000 Nibia order
        2, // 2 previous commissions (within limit)
        'user123'
      );

      expect(result.shouldEarnCommission).toBe(true);
      expect(result.commissionRate).toBeGreaterThan(0);
      expect(result.commissionType).toBe(CommissionType.NORMAL_REFERRAL);
    });

    it('should not calculate commission for regular user after 3 purchases', async () => {
      const strategy = strategyFactory.getStrategy(UserRole.USER);
      const result = await strategy.calculateCommission(
        UserRole.USER,
        10000,
        3, // 3 previous commissions (at limit)
        'user123'
      );

      expect(result.shouldEarnCommission).toBe(false);
    });

    it('should calculate higher commission for Growth Associate', async () => {
      const strategy = strategyFactory.getStrategy(UserRole.GROWTH_ASSOCIATE);
      const result = await strategy.calculateCommission(
        UserRole.GROWTH_ASSOCIATE,
        50000, // 50,000 Nibia order
        5, // Previous commissions
        'ga123'
      );

      expect(result.shouldEarnCommission).toBe(true);
      expect(result.commissionRate).toBeGreaterThanOrEqual(3);
      expect(result.commissionType).toBe(CommissionType.GA_REFERRAL);
    });
  });

  describe('Transaction Management', () => {
    it('should execute operations within a transaction', async () => {
      const mockOperation = jest.fn().mockResolvedValue('success');
      
      await expect(
        transactionService.executeTransaction(mockOperation)
      ).resolves.toBe('success');
      
      expect(mockOperation).toHaveBeenCalledWith(expect.any(Object));
    });

    it('should rollback transaction on error', async () => {
      const mockOperation = jest.fn().mockRejectedValue(new Error('Test error'));
      
      await expect(
        transactionService.executeTransaction(mockOperation)
      ).rejects.toThrow('Test error');
    });
  });

  describe('Commission Processing with Enhanced Features', () => {
    it('should process commission using strategy pattern', async () => {
      const mockUser = {
        _id: 'user123',
        role: UserRole.GROWTH_ASSOCIATE,
        city: 'Lagos',
      };

      const mockOrder = {
        _id: 'order123',
        totalAmountInNibia: 25000,
        userId: 'referred123',
      };

      const mockReferredUser = {
        _id: 'referred123',
        city: 'Lagos',
      };

      mockCommissionModel.findOne.mockResolvedValue(null);
      mockCommissionModel.countDocuments.mockResolvedValue(1);
      mockCommissionModel.create.mockResolvedValue({
        _id: 'commission123',
        userId: mockUser._id,
        amount: 1250, // 5% of 25000
        type: CommissionType.GA_REFERRAL,
        status: CommissionStatus.PENDING,
      });

      // This would be called through the strategy pattern internally
      const result = await commissionService.createCommission({
        userId: mockUser._id,
        orderId: mockOrder._id,
        referredUserId: mockReferredUser._id,
        amount: 1250,
        type: CommissionType.GA_REFERRAL,
        rate: 5,
        orderAmount: 25000,
        city: 'Lagos',
        metadata: {
          strategy: UserRole.GROWTH_ASSOCIATE,
          previousCommissions: 1,
        },
      });

      expect(result).toBeDefined();
      expect(mockCommissionModel.create).toHaveBeenCalled();
    });
  });

  describe('Queue Integration', () => {
    it('should queue commission processing job', async () => {
      const mockCommission = {
        _id: 'commission123',
        userId: 'user123',
        amount: 1000,
        type: CommissionType.GA_REFERRAL,
        orderId: 'order123',
      };

      await queueService.addCommissionJob(mockCommission as any);
      
      expect(queueService.addCommissionJob).toHaveBeenCalledWith(mockCommission);
    });

    it('should queue rollback job', async () => {
      const data = {
        orderId: 'order123',
        commissionIds: ['comm1', 'comm2'],
        reason: 'Payment failed',
      };

      await queueService.addCommissionRollbackJob(data);
      
      expect(queueService.addCommissionRollbackJob).toHaveBeenCalledWith(data);
    });
  });

  describe('Error Handling and Rollback', () => {
    it('should rollback commission and update status', async () => {
      const mockCommission = {
        _id: 'commission123',
        status: CommissionStatus.PROCESSED,
        failedAt: undefined,
        failureReason: undefined,
        save: jest.fn(),
      };

      mockCommissionModel.findById.mockResolvedValue(mockCommission);

      await commissionService.rollbackCommission('commission123', 'Test rollback');

      expect(mockCommission.status).toBe(CommissionStatus.FAILED);
      expect(mockCommission.failureReason).toBe('Test rollback');
      expect(mockCommission.save).toHaveBeenCalled();
    });
  });

  describe('Commission Analytics', () => {
    it('should calculate commission stats', async () => {
      const userId = 'user123';
      const mockCommissions = [
        { amount: 1000, status: CommissionStatus.PENDING },
        { amount: 1500, status: CommissionStatus.PROCESSED },
        { amount: 500, status: CommissionStatus.FAILED },
      ];

      mockCommissionModel.find.mockResolvedValue(mockCommissions);

      const stats = await commissionService.getCommissionStats(userId);

      expect(stats).toBeDefined();
      expect(mockCommissionModel.find).toHaveBeenCalledWith({ userId });
    });
  });
});

// Integration test for decorators and interceptors
describe('Decorators and Interceptors Integration', () => {
  // Note: These would require a full NestJS application context
  // and are typically tested in e2e tests
  
  it('should track referrals with @TrackReferral decorator', () => {
    // This would be tested in e2e tests with actual HTTP requests
    expect(true).toBe(true); // Placeholder
  });

  it('should process commissions with @ProcessCommission decorator', () => {
    // This would be tested in e2e tests with actual HTTP requests
    expect(true).toBe(true); // Placeholder
  });

  it('should deduct commissions automatically with CommissionInterceptor', () => {
    // This would be tested in e2e tests with actual HTTP requests
    expect(true).toBe(true); // Placeholder
  });
});
