import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { UserAnalyticsService } from '../user-analytics.service';
import { Order } from '../../orders/entities/order.entity';
import { User } from '../../users/entities/user.entity';
import { ANALYTICS_CONSTANTS } from '../constants';

describe('UserAnalyticsService', () => {
  let service: UserAnalyticsService;
  let orderModel: any;
  let userModel: any;

  // Mock data
  const mockUser = {
    _id: '507f1f77bcf86cd799439011',
    name: 'Test User',
    email: 'test@example.com'
  };

  const mockOrders = [
    {
      _id: '507f1f77bcf86cd799439012',
      userId: '507f1f77bcf86cd799439011',
      orderNumber: 'ORD-001',
      finalTotal: 25000,
      items: [
        {
          productId: {
            _id: '507f1f77bcf86cd799439013',
            categoryId: '507f1f77bcf86cd799439014',
            categoryName: 'Groceries'
          },
          quantity: 2,
          totalPrice: 25000
        }
      ],
      paymentHistory: [
        {
          amount: 25000,
          paymentMethod: 'card',
          status: 'completed'
        }
      ],
      createdAt: new Date('2024-06-01'),
      status: 'delivered'
    },
    {
      _id: '507f1f77bcf86cd799439015',
      userId: '507f1f77bcf86cd799439011',
      orderNumber: 'ORD-002',
      finalTotal: 15000,
      items: [
        {
          productId: {
            _id: '507f1f77bcf86cd799439016',
            categoryId: '507f1f77bcf86cd799439017',
            categoryName: 'Electronics'
          },
          quantity: 1,
          totalPrice: 15000
        }
      ],
      paymentHistory: [
        {
          amount: 15000,
          paymentMethod: 'food_money',
          status: 'completed'
        }
      ],
      createdAt: new Date('2024-06-15'),
      status: 'delivered'
    }
  ];

  beforeEach(async () => {
    const mockOrderModel = {
      find: jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            sort: jest.fn().mockReturnValue({
              exec: jest.fn().mockResolvedValue(mockOrders)
            })
          })
        })
      })
    };

    const mockUserModel = {
      findById: jest.fn().mockResolvedValue(mockUser)
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserAnalyticsService,
        {
          provide: getModelToken(Order.name),
          useValue: mockOrderModel
        },
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel
        }
      ]
    }).compile();

    service = module.get<UserAnalyticsService>(UserAnalyticsService);
    orderModel = module.get(getModelToken(Order.name));
    userModel = module.get(getModelToken(User.name));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getExpenseTrackingDashboard', () => {
    it('should generate expense tracking dashboard', async () => {
      const result = await service.getExpenseTrackingDashboard('507f1f77bcf86cd799439011');

      expect(result).toBeDefined();
      expect(result.overview).toBeDefined();
      expect(result.overview.totalSpent).toBe(40000); // 25000 + 15000
      expect(result.overview.orderCount).toBe(2);
      expect(result.overview.averageOrderValue).toBe(20000);
      
      expect(result.charts).toBeDefined();
      expect(result.insights).toBeDefined();
    });

    it('should throw NotFoundException when no orders found', async () => {
      orderModel.find.mockReturnValueOnce({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            sort: jest.fn().mockReturnValue({
              exec: jest.fn().mockResolvedValue([])
            })
          })
        })
      });

      await expect(
        service.getExpenseTrackingDashboard('507f1f77bcf86cd799439011')
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for invalid user ID', async () => {
      await expect(
        service.getExpenseTrackingDashboard('invalid-id')
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getPersonalSpendingBreakdown', () => {
    it('should generate spending breakdown by categories', async () => {
      const result = await service.getPersonalSpendingBreakdown('507f1f77bcf86cd799439011', {});

      expect(result).toBeDefined();
      expect(result.totalSpending).toBe(40000);
      expect(result.categoryBreakdown).toBeDefined();
      expect(result.categoryBreakdown.length).toBeGreaterThan(0);
      
      expect(result.charts).toBeDefined();
      expect(result.charts.pieChart).toBeDefined();
      expect(result.charts.barChart).toBeDefined();
    });
  });

  describe('getSpendingVisualizations', () => {
    it('should generate pie chart visualization', async () => {
      const chartDto = {
        chartType: 'pie' as const,
        title: 'Test Chart',
        includeConfig: true
      };

      const result = await service.getSpendingVisualizations(
        '507f1f77bcf86cd799439011',
        {},
        chartDto
      );

      expect(result).toBeDefined();
      expect(result.chartData).toBeDefined();
      expect(result.configuration).toBeDefined();
      expect(result.configuration?.type).toBe('pie');
    });

    it('should generate histogram visualization', async () => {
      const chartDto = {
        chartType: 'histogram' as const,
        includeConfig: false
      };

      const result = await service.getSpendingVisualizations(
        '507f1f77bcf86cd799439011',
        {},
        chartDto
      );

      expect(result).toBeDefined();
      expect(result.chartData).toBeDefined();
      expect(result.configuration).toBeUndefined();
    });
  });

  describe('getSpendingComparison', () => {
    it('should compare spending between periods', async () => {
      const comparisonDto = {
        currentPeriodStart: new Date('2024-06-01'),
        currentPeriodEnd: new Date('2024-06-30'),
        previousPeriodStart: new Date('2024-05-01'),
        previousPeriodEnd: new Date('2024-05-31')
      };

      const result = await service.getSpendingComparison('507f1f77bcf86cd799439011', comparisonDto);

      expect(result).toBeDefined();
      expect(result.currentPeriod).toBeDefined();
      expect(result.previousPeriod).toBeDefined();
      expect(result.growth).toBeDefined();
    });
  });

  describe('generateSpendingReport', () => {
    it('should generate summary report', async () => {
      const reportDto = {
        reportType: 'summary' as const,
        startDate: new Date('2024-06-01'),
        endDate: new Date('2024-06-30')
      };

      const result = await service.generateSpendingReport('507f1f77bcf86cd799439011', reportDto);

      expect(result).toBeDefined();
      expect(result.summary).toBeDefined();
      expect(result.period).toBeDefined();
    });

    it('should generate detailed report', async () => {
      const reportDto = {
        reportType: 'detailed' as const,
        groupBy: 'category' as const,
        startDate: new Date('2024-06-01'),
        endDate: new Date('2024-06-30')
      };

      const result = await service.generateSpendingReport('507f1f77bcf86cd799439011', reportDto);

      expect(result).toBeDefined();
      expect(result.groupBy).toBe('category');
      expect(result.groups).toBeDefined();
    });
  });
});
