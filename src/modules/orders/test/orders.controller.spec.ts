import { Test, TestingModule } from '@nestjs/testing';
import { OrdersController } from '../orders.controller';
import { OrdersService } from '../orders.service';
import { CreateOrderDto } from '../dto';
import { PaymentPlan, DeliveryMethod, OrderStatus } from '../entities/order.entity';

const mockOrdersService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  updateStatus: jest.fn(),
  processPayment: jest.fn(),
  cancel: jest.fn(),
  getOrderSummary: jest.fn(),
  getAnalytics: jest.fn(),
  exportOrders: jest.fn(),
};

const mockOrder = {
  _id: '64f123456789abcdef123456',
  orderNumber: 'FRG12345678',
  userId: '64f123456789abcdef123457',
  items: [
    {
      productId: '64f123456789abcdef123458',
      quantity: 2,
      unitPrice: 1500,
      unitPriceInNibia: 150000,
      totalPrice: 3000,
      totalPriceInNibia: 300000,
    },
  ],
  totalAmount: 3000,
  totalAmountInNibia: 300000,
  deliveryFee: 500,
  finalTotal: 3500,
  status: OrderStatus.PENDING,
  paymentPlan: PaymentPlan.PAY_NOW,
  deliveryMethod: DeliveryMethod.HOME_DELIVERY,
  paymentHistory: [],
  amountPaid: 0,
  remainingAmount: 3500,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('OrdersController', () => {
  let controller: OrdersController;
  let service: OrdersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrdersController],
      providers: [
        {
          provide: OrdersService,
          useValue: mockOrdersService,
        },
      ],
    }).compile();

    controller = module.get<OrdersController>(OrdersController);
    service = module.get<OrdersService>(OrdersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new order', async () => {
      const createOrderDto: CreateOrderDto = {
        items: [
          {
            productId: '64f123456789abcdef123458',
            quantity: 2,
          },
        ],
        paymentPlan: PaymentPlan.PAY_NOW,
        deliveryMethod: DeliveryMethod.HOME_DELIVERY,
        deliveryAddress: {
          street: '123 Test Street',
          city: 'Lagos',
          state: 'Lagos',
          country: 'Nigeria',
        },
      };

      const currentUser = { userId: '64f123456789abcdef123457' };
      mockOrdersService.create.mockResolvedValue(mockOrder);

      const result = await controller.create(createOrderDto, currentUser);
      expect(result).toEqual(mockOrder);
      expect(service.create).toHaveBeenCalledWith(createOrderDto, currentUser.userId);
    });
  });

  describe('findAll', () => {
    it('should return an array of orders', async () => {
      const orders = [mockOrder];
      const searchParams = {
        page: 1,
        limit: 20,
        status: OrderStatus.PENDING,
      };

      mockOrdersService.findAll.mockResolvedValue(orders);

      const result = await controller.findAll(searchParams);
      expect(result).toEqual(orders);
      expect(service.findAll).toHaveBeenCalledWith(searchParams);
    });
  });

  describe('findOne', () => {
    it('should return a single order', async () => {
      mockOrdersService.findOne.mockResolvedValue(mockOrder);

      const result = await controller.findOne('64f123456789abcdef123456');
      expect(result).toEqual(mockOrder);
      expect(service.findOne).toHaveBeenCalledWith('64f123456789abcdef123456');
    });
  });

  describe('updateStatus', () => {
    it('should update order status', async () => {
      const updateStatusDto = {
        status: OrderStatus.PAID,
        notes: 'Payment confirmed',
      };

      const updatedOrder = { ...mockOrder, status: OrderStatus.PAID };
      mockOrdersService.updateStatus.mockResolvedValue(updatedOrder);

      const result = await controller.updateStatus('64f123456789abcdef123456', updateStatusDto);
      expect(result).toEqual(updatedOrder);
      expect(service.updateStatus).toHaveBeenCalledWith('64f123456789abcdef123456', updateStatusDto);
    });
  });

  describe('processPayment', () => {
    it('should process payment for an order', async () => {
      const paymentDto = {
        amount: 3500,
        paymentMethod: 'CARD' as any,
        transactionRef: 'TXN123456',
      };

      const paidOrder = {
        ...mockOrder,
        amountPaid: 3500,
        remainingAmount: 0,
        status: OrderStatus.PAID,
      };

      mockOrdersService.processPayment.mockResolvedValue(paidOrder);

      const result = await controller.processPayment('64f123456789abcdef123456', paymentDto);
      expect(result).toEqual(paidOrder);
      expect(service.processPayment).toHaveBeenCalledWith('64f123456789abcdef123456', paymentDto);
    });
  });

  describe('cancel', () => {
    it('should cancel an order', async () => {
      const cancelDto = {
        cancellationReason: 'Customer request',
        processRefund: true,
      };

      const cancelledOrder = {
        ...mockOrder,
        status: OrderStatus.CANCELLED,
        cancellationReason: 'Customer request',
      };

      mockOrdersService.cancel.mockResolvedValue(cancelledOrder);

      const result = await controller.cancel('64f123456789abcdef123456', cancelDto);
      expect(result).toEqual(cancelledOrder);
      expect(service.cancel).toHaveBeenCalledWith('64f123456789abcdef123456', cancelDto);
    });
  });

  describe('getOrderSummary', () => {
    it('should return order summary statistics', async () => {
      const summary = {
        totalOrders: 10,
        totalAmount: 50000,
        totalAmountInNibia: 5000000,
        ordersByStatus: {
          [OrderStatus.PENDING]: 2,
          [OrderStatus.PAID]: 5,
          [OrderStatus.SHIPPED]: 2,
          [OrderStatus.DELIVERED]: 1,
          [OrderStatus.CANCELLED]: 0,
        },
        ordersByPaymentPlan: {
          [PaymentPlan.PAY_NOW]: 6,
          [PaymentPlan.PRICE_LOCK]: 2,
          [PaymentPlan.PAY_SMALL_SMALL]: 1,
          [PaymentPlan.PAY_LATER]: 1,
        },
      };

      mockOrdersService.getOrderSummary.mockResolvedValue(summary);

      const result = await controller.getOrderSummary();
      expect(result).toEqual(summary);
      expect(service.getOrderSummary).toHaveBeenCalled();
    });
  });

  describe('getAnalytics', () => {
    it('should return order analytics', async () => {
      const analytics = {
        dailyOrders: [
          { date: '2023-10-01', count: 5, totalAmount: 25000 },
          { date: '2023-10-02', count: 3, totalAmount: 15000 },
        ],
        topProducts: [
          { productId: '64f123456789abcdef123458', totalQuantity: 10, totalRevenue: 20000 },
        ],
        customerInsights: [
          { userId: '64f123456789abcdef123457', totalOrders: 3, totalSpent: 10000, averageOrderValue: 3333 },
        ],
      };

      const analyticsDto = {
        startDate: '2023-10-01',
        endDate: '2023-10-31',
        groupBy: 'day' as const,
      };

      mockOrdersService.getAnalytics.mockResolvedValue(analytics);

      const result = await controller.getAnalytics(analyticsDto);
      expect(result).toEqual(analytics);
      expect(service.getAnalytics).toHaveBeenCalledWith(analyticsDto);
    });
  });
});
