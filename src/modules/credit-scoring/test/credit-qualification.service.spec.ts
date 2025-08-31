import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreditQualificationService } from '../services/credit-qualification.service';
import { DefaultRecoveryService } from '../services/default-recovery.service';
import { User, UserDocument } from '../../users/entities/user.entity';
import { Wallet, WalletDocument } from '../../wallets/entities/wallet.entity';
import { Order, OrderDocument } from '../../orders/entities/order.entity';
import { CreditCheck, CreditCheckDocument } from '../entities/credit-check.entity';
import { WalletsService } from '../../wallets/wallets.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CREDIT_QUALIFICATION_CONSTANTS } from '../constants/credit-qualification.constants';

describe('CreditQualificationService', () => {
  let service: CreditQualificationService;
  let recoveryService: DefaultRecoveryService;
  let userModel: Model<UserDocument>;
  let walletModel: Model<WalletDocument>;
  let orderModel: Model<OrderDocument>;
  let creditCheckModel: Model<CreditCheckDocument>;

  const mockUser = {
    _id: '60f1b2b3c9e1a2b3c4d5e6f7',
    email: 'test@example.com',
    createdAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000), // 4 months old
  };

  const mockWallet = {
    _id: '60f1b2b3c9e1a2b3c4d5e6f8',
    userId: mockUser._id,
    foodMoney: 50000,
    foodSafe: 15000, // 23% of total wallet (65000)
    foodPoints: 0,
  };

  const mockOrders = [
    // Recent orders (last 4 months) - Total: ₦300,000
    {
      _id: '60f1b2b3c9e1a2b3c4d5e6f9',
      userId: mockUser._id,
      totalAmount: 100000,
      status: 'delivered',
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 1 month ago
      paymentHistory: [{ status: 'completed', amount: 100000, paymentDate: new Date() }],
    },
    {
      _id: '60f1b2b3c9e1a2b3c4d5e6fa',
      userId: mockUser._id,
      totalAmount: 150000,
      status: 'delivered',
      createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 2 months ago
      paymentHistory: [{ status: 'completed', amount: 150000, paymentDate: new Date() }],
    },
    {
      _id: '60f1b2b3c9e1a2b3c4d5e6fb',
      userId: mockUser._id,
      totalAmount: 50000,
      status: 'delivered',
      createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 3 months ago
      paymentHistory: [{ status: 'completed', amount: 50000, paymentDate: new Date() }],
    },
    // Previous year orders - Total: ₦900,000 (distributed across 2 years to meet threshold)
    {
      _id: '60f1b2b3c9e1a2b3c4d5e6fd',
      userId: mockUser._id,
      totalAmount: 450000,
      status: 'delivered',
      createdAt: new Date('2024-06-15'), // 2024
      paymentHistory: [{ status: 'completed', amount: 450000, paymentDate: new Date() }],
    },
    // Additional orders to meet yearly thresholds
    {
      _id: '60f1b2b3c9e1a2b3c4d5e6fe',
      userId: mockUser._id,
      totalAmount: 850000, // 2023 total = 850,000 (meets threshold)
      status: 'delivered',
      createdAt: new Date('2023-12-15'), // 2023
      paymentHistory: [{ status: 'completed', amount: 850000, paymentDate: new Date() }],
    },
    {
      _id: '60f1b2b3c9e1a2b3c4d5e6ff',
      userId: mockUser._id,
      totalAmount: 400000, // 2024 total = 450,000 + 400,000 = 850,000
      status: 'delivered',
      createdAt: new Date('2024-12-15'), // 2024
      paymentHistory: [{ status: 'completed', amount: 400000, paymentDate: new Date() }],
    },
  ];

  const mockCreditCheck = {
    _id: '60f1b2b3c9e1a2b3c4d5e6fe',
    userId: mockUser._id,
    currentScore: 720,
    isActive: true,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreditQualificationService,
        DefaultRecoveryService,
        {
          provide: getModelToken(User.name),
          useValue: {
            findById: jest.fn(),
            countDocuments: jest.fn(),
          },
        },
        {
          provide: getModelToken(Wallet.name),
          useValue: {
            findOne: jest.fn(),
            findByIdAndUpdate: jest.fn(),
            db: {
              startSession: jest.fn().mockReturnValue({
                startTransaction: jest.fn(),
                commitTransaction: jest.fn(),
                abortTransaction: jest.fn(),
                endSession: jest.fn(),
              }),
            },
          },
        },
        {
          provide: getModelToken(Order.name),
          useValue: {
            find: jest.fn(),
            findById: jest.fn(),
            findByIdAndUpdate: jest.fn(),
            aggregate: jest.fn(),
          },
        },
        {
          provide: getModelToken(CreditCheck.name),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: WalletsService,
          useValue: {
            transferFunds: jest.fn(),
            updateBalance: jest.fn().mockResolvedValue({}),
          },
        },
        {
          provide: EventEmitter2,
          useValue: {
            emit: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<CreditQualificationService>(CreditQualificationService);
    recoveryService = module.get<DefaultRecoveryService>(DefaultRecoveryService);
    userModel = module.get<Model<UserDocument>>(getModelToken(User.name));
    walletModel = module.get<Model<WalletDocument>>(getModelToken(Wallet.name));
    orderModel = module.get<Model<OrderDocument>>(getModelToken(Order.name));
    creditCheckModel = module.get<Model<CreditCheckDocument>>(getModelToken(CreditCheck.name));
  });

  describe('Credit Qualification Assessment', () => {
    it('should qualify user who meets all criteria', async () => {
      // Setup mocks for qualified user
      jest.spyOn(userModel, 'findById').mockResolvedValue(mockUser as any);
      jest.spyOn(walletModel, 'findOne').mockResolvedValue(mockWallet as any);
      
      // Mock orderModel.find for different calls
      const mockFind = jest.spyOn(orderModel, 'find');
      mockFind
        .mockReturnValueOnce({
          sort: jest.fn().mockReturnThis(),
          exec: jest.fn().mockResolvedValue(mockOrders),
        } as any) // First call: get user order history
        .mockReturnValueOnce({
          exec: jest.fn().mockResolvedValue([]), // Second call: check active defaults (no defaults)
        } as any);
      
      jest.spyOn(creditCheckModel, 'findOne').mockResolvedValue(mockCreditCheck as any);

      const result = await service.assessCreditQualification(mockUser._id);

      expect(result.isQualified).toBe(true);
      expect(result.criteria.hasSufficientFoodSafeBalance).toBe(true);
      expect(result.criteria.meetsRecentPurchaseThreshold).toBe(true);
      expect(result.criteria.meetsYearlyPurchaseThreshold).toBe(true);
      expect(result.criteria.hasGoodCreditScore).toBe(true);
      expect(result.criteria.accountAgeRequirement).toBe(true);
      expect(result.criteria.hasPositivePaymentHistory).toBe(true);
      expect(result.recommendedCreditLimit).toBeGreaterThan(0);
    });

    it('should reject user with insufficient FoodSafe balance', async () => {
      // Mock user with insufficient FoodSafe balance (only 5% instead of 10%)
      const mockWalletLowFoodSafe = {
        ...mockWallet,
        foodSafe: 3000, // Only 5% of total wallet
      };

      jest.spyOn(userModel, 'findById').mockResolvedValue(mockUser as any);
      jest.spyOn(walletModel, 'findOne').mockResolvedValue(mockWalletLowFoodSafe as any);
      jest.spyOn(orderModel, 'find').mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockOrders),
      } as any);
      jest.spyOn(creditCheckModel, 'findOne').mockResolvedValue(mockCreditCheck as any);

      const result = await service.assessCreditQualification(mockUser._id);

      expect(result.isQualified).toBe(false);
      expect(result.criteria.hasSufficientFoodSafeBalance).toBe(false);
      expect(result.failureReasons).toContain('INSUFFICIENT_FOODSAFE_BALANCE');
    });

    it('should reject user with insufficient recent purchases', async () => {
      // Mock user with low recent purchases
      const mockOrdersLowRecent = [
        {
          ...mockOrders[0],
          totalAmount: 50000, // Only ₦50,000 in recent purchases
        }
      ];

      jest.spyOn(userModel, 'findById').mockResolvedValue(mockUser as any);
      jest.spyOn(walletModel, 'findOne').mockResolvedValue(mockWallet as any);
      jest.spyOn(orderModel, 'find').mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockOrdersLowRecent),
      } as any);
      jest.spyOn(creditCheckModel, 'findOne').mockResolvedValue(mockCreditCheck as any);

      const result = await service.assessCreditQualification(mockUser._id);

      expect(result.isQualified).toBe(false);
      expect(result.criteria.meetsRecentPurchaseThreshold).toBe(false);
      expect(result.failureReasons).toContain('INSUFFICIENT_RECENT_PURCHASES');
    });

    it('should reject user with poor credit score', async () => {
      // Mock user with poor credit score
      const mockCreditCheckPoor = {
        ...mockCreditCheck,
        currentScore: 600, // Below 650 requirement
      };

      jest.spyOn(userModel, 'findById').mockResolvedValue(mockUser as any);
      jest.spyOn(walletModel, 'findOne').mockResolvedValue(mockWallet as any);
      jest.spyOn(orderModel, 'find').mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockOrders),
      } as any);
      jest.spyOn(creditCheckModel, 'findOne').mockResolvedValue(mockCreditCheckPoor as any);

      const result = await service.assessCreditQualification(mockUser._id);

      expect(result.isQualified).toBe(false);
      expect(result.criteria.hasGoodCreditScore).toBe(false);
      expect(result.failureReasons).toContain('POOR_CREDIT_SCORE');
    });
  });

  describe('Default Recovery Service', () => {
    it('should successfully recover from FoodSafe', async () => {
      const mockOrderWithDefault = {
        _id: '60f1b2b3c9e1a2b3c4d5e6ff',
        userId: mockUser._id,
        totalAmount: 25000,
        paymentDueDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days overdue
        defaultRecoveryStatus: 'pending',
      };

      jest.spyOn(userModel, 'findById').mockResolvedValue(mockUser as any);
      jest.spyOn(walletModel, 'findOne').mockResolvedValue(mockWallet as any);
      jest.spyOn(orderModel, 'findById').mockResolvedValue(mockOrderWithDefault as any);

      const result = await recoveryService.processDefaultRecovery({
        userId: mockUser._id,
        orderId: mockOrderWithDefault._id,
        defaultAmount: 25000,
        dueDate: mockOrderWithDefault.paymentDueDate,
        daysOverdue: 10,
        recoveryMethod: 'foodsafe_deduction',
      });

      expect(result.success).toBe(true);
      expect(result.recoveredAmount).toBe(15000); // Maximum recovery limited by foodSafe balance
      expect(result.recoveryMethod).toBe('foodsafe_deduction');
      expect(result.remainingDefault).toBe(10000); // 25000 - 15000
    });

    it('should not recover during grace period', async () => {
      const mockOrderWithDefault = {
        _id: '60f1b2b3c9e1a2b3c4d5e6ff',
        userId: mockUser._id,
        totalAmount: 25000,
        paymentDueDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days overdue (within grace period)
        defaultRecoveryStatus: 'pending',
      };

      jest.spyOn(userModel, 'findById').mockResolvedValue(mockUser as any);
      jest.spyOn(walletModel, 'findOne').mockResolvedValue(mockWallet as any);
      jest.spyOn(orderModel, 'findById').mockResolvedValue(mockOrderWithDefault as any);

      const result = await recoveryService.processDefaultRecovery({
        userId: mockUser._id,
        orderId: mockOrderWithDefault._id,
        defaultAmount: 25000,
        dueDate: mockOrderWithDefault.paymentDueDate,
        daysOverdue: 3,
        recoveryMethod: 'foodsafe_deduction',
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('Grace period active');
    });

    it('should handle insufficient FoodSafe balance for recovery', async () => {
      const mockWalletLowBalance = {
        ...mockWallet,
        foodSafe: 5000, // Less than default amount
      };

      const mockOrderWithDefault = {
        _id: '60f1b2b3c9e1a2b3c4d5e6ff',
        userId: mockUser._id,
        totalAmount: 25000,
        paymentDueDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        defaultRecoveryStatus: 'pending',
      };

      jest.spyOn(userModel, 'findById').mockResolvedValue(mockUser as any);
      jest.spyOn(walletModel, 'findOne').mockResolvedValue(mockWalletLowBalance as any);
      jest.spyOn(orderModel, 'findById').mockResolvedValue(mockOrderWithDefault as any);

      const result = await recoveryService.processDefaultRecovery({
        userId: mockUser._id,
        orderId: mockOrderWithDefault._id,
        defaultAmount: 25000,
        dueDate: mockOrderWithDefault.paymentDueDate,
        daysOverdue: 10,
        recoveryMethod: 'foodsafe_deduction',
      });

      expect(result.success).toBe(true); // Should still succeed but with partial recovery
      expect(result.recoveredAmount).toBe(5000); // Only what's available
      expect(result.remainingDefault).toBe(20000);
    });
  });

  describe('Qualification Criteria Tests', () => {
    beforeEach(() => {
      jest.spyOn(userModel, 'findById').mockResolvedValue(mockUser as any);
      jest.spyOn(walletModel, 'findOne').mockResolvedValue(mockWallet as any);
      jest.spyOn(orderModel, 'find').mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockOrders),
      } as any);
      jest.spyOn(creditCheckModel, 'findOne').mockResolvedValue(mockCreditCheck as any);
    });

    it('should validate FoodSafe balance requirement (10% minimum)', async () => {
      jest.spyOn(userModel, 'findById').mockResolvedValue(mockUser as any);
      jest.spyOn(walletModel, 'findOne').mockResolvedValue(mockWallet as any);
      
      // Mock orderModel.find for different calls
      const mockFind = jest.spyOn(orderModel, 'find');
      mockFind
        .mockReturnValueOnce({
          sort: jest.fn().mockReturnThis(),
          exec: jest.fn().mockResolvedValue(mockOrders),
        } as any) // First call: get user order history
        .mockReturnValueOnce({
          exec: jest.fn().mockResolvedValue([]), // Second call: check active defaults (no defaults)
        } as any);
      
      jest.spyOn(creditCheckModel, 'findOne').mockResolvedValue(mockCreditCheck as any);
      
      const result = await service.assessCreditQualification(mockUser._id);
      
      // mockWallet has 15000 FoodSafe out of 65000 total = 23%, should pass
      expect(result.criteria.hasSufficientFoodSafeBalance).toBe(true);
    });

    it('should validate recent purchase threshold (₦250,000 in 4 months)', async () => {
      jest.spyOn(userModel, 'findById').mockResolvedValue(mockUser as any);
      jest.spyOn(walletModel, 'findOne').mockResolvedValue(mockWallet as any);
      
      // Mock orderModel.find for different calls
      const mockFind = jest.spyOn(orderModel, 'find');
      mockFind
        .mockReturnValueOnce({
          sort: jest.fn().mockReturnThis(),
          exec: jest.fn().mockResolvedValue(mockOrders),
        } as any) // First call: get user order history
        .mockReturnValueOnce({
          exec: jest.fn().mockResolvedValue([]), // Second call: check active defaults (no defaults)
        } as any);
      
      jest.spyOn(creditCheckModel, 'findOne').mockResolvedValue(mockCreditCheck as any);
      
      const result = await service.assessCreditQualification(mockUser._id);
      
      // mockOrders total ₦300,000 in recent orders, should pass
      expect(result.criteria.meetsRecentPurchaseThreshold).toBe(true);
    });

    it('should validate yearly purchase threshold (₦800,000 for 2 years)', async () => {
      jest.spyOn(userModel, 'findById').mockResolvedValue(mockUser as any);
      jest.spyOn(walletModel, 'findOne').mockResolvedValue(mockWallet as any);
      
      // Mock orderModel.find for different calls
      const mockFind = jest.spyOn(orderModel, 'find');
      mockFind
        .mockReturnValueOnce({
          sort: jest.fn().mockReturnThis(),
          exec: jest.fn().mockResolvedValue(mockOrders),
        } as any) // First call: get user order history
        .mockReturnValueOnce({
          exec: jest.fn().mockResolvedValue([]), // Second call: check active defaults (no defaults)
        } as any);
      
      jest.spyOn(creditCheckModel, 'findOne').mockResolvedValue(mockCreditCheck as any);
      
      const result = await service.assessCreditQualification(mockUser._id);
      
      // mockOrders show ₦900,000 in previous year, should pass
      expect(result.criteria.meetsYearlyPurchaseThreshold).toBe(true);
    });

    it('should validate credit score requirement (650 minimum)', async () => {
      const result = await service.assessCreditQualification(mockUser._id);
      
      // mockCreditCheck has score of 720, should pass
      expect(result.criteria.hasGoodCreditScore).toBe(true);
    });

    it('should validate account age requirement (90 days minimum)', async () => {
      const result = await service.assessCreditQualification(mockUser._id);
      
      // mockUser is 120 days old, should pass
      expect(result.criteria.accountAgeRequirement).toBe(true);
    });

    it('should validate payment history requirement (5 orders minimum)', async () => {
      const result = await service.assessCreditQualification(mockUser._id);
      
      // mockOrders has 5 completed orders, should pass
      expect(result.criteria.hasPositivePaymentHistory).toBe(true);
    });
  });

  describe('Credit Limit Calculation', () => {
    it('should calculate appropriate credit limit for qualified user', async () => {
      jest.spyOn(userModel, 'findById').mockResolvedValue(mockUser as any);
      jest.spyOn(walletModel, 'findOne').mockResolvedValue(mockWallet as any);
      
      // Mock orderModel.find for different calls
      const mockFind = jest.spyOn(orderModel, 'find');
      mockFind
        .mockReturnValueOnce({
          sort: jest.fn().mockReturnThis(),
          exec: jest.fn().mockResolvedValue(mockOrders),
        } as any) // First call: get user order history
        .mockReturnValueOnce({
          exec: jest.fn().mockResolvedValue([]), // Second call: check active defaults (no defaults)
        } as any);
      jest.spyOn(creditCheckModel, 'findOne').mockResolvedValue(mockCreditCheck as any);

      const result = await service.assessCreditQualification(mockUser._id);

      expect(result.isQualified).toBe(true);
      expect(result.recommendedCreditLimit).toBeGreaterThan(CREDIT_QUALIFICATION_CONSTANTS.MINIMUM_CREDIT_LIMIT);
      expect(result.recommendedCreditLimit).toBeLessThanOrEqual(CREDIT_QUALIFICATION_CONSTANTS.MAXIMUM_CREDIT_LIMIT);
    });

    it('should return zero credit limit for unqualified user', async () => {
      const mockUserNew = {
        ...mockUser,
        createdAt: new Date(), // New account
      };

      jest.spyOn(userModel, 'findById').mockResolvedValue(mockUserNew as any);
      jest.spyOn(walletModel, 'findOne').mockResolvedValue(mockWallet as any);
      jest.spyOn(orderModel, 'find').mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]), // No orders
      } as any);
      jest.spyOn(creditCheckModel, 'findOne').mockResolvedValue(null);

      const result = await service.assessCreditQualification(mockUser._id);

      expect(result.isQualified).toBe(false);
      expect(result.recommendedCreditLimit).toBe(0);
    });
  });

  describe('Integration Tests', () => {
    it('should provide improvement recommendations for unqualified user', async () => {
      const mockUserNew = {
        ...mockUser,
        createdAt: new Date(), // New account
      };

      const mockWalletNoFoodSafe = {
        ...mockWallet,
        foodSafe: 0, // No FoodSafe balance
      };

      jest.spyOn(userModel, 'findById').mockResolvedValue(mockUserNew as any);
      jest.spyOn(walletModel, 'findOne').mockResolvedValue(mockWalletNoFoodSafe as any);
      jest.spyOn(orderModel, 'find').mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]), // No orders
      } as any);
      jest.spyOn(creditCheckModel, 'findOne').mockResolvedValue(null);

      const report = await service.getQualificationReport(mockUser._id);

      expect(report.qualification.isQualified).toBe(false);
      expect(report.recommendations).toContain('Increase your FoodSafe balance to at least 10% of your total wallet balance');
      expect(report.recommendations).toContain('Make more purchases to reach ₦250,000 in recent 4-month spending');
      expect(report.timeToQualification).toBeTruthy();
    });
  });
});
