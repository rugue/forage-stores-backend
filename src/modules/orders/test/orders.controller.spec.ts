import { Test, TestingModule } from '@nestjs/testing';
import { OrdersController } from '../orders.controller';
import { OrdersService } from '../orders.service';
import { PaymentPlan, DeliveryMethod, OrderStatus } from '../entities/order.entity';
import { UserRole } from '../../users/entities/user.entity';

const mockOrdersService = {
  addToCart: jest.fn(),
  updateCartItem: jest.fn(),
  removeFromCart: jest.fn(),
  getCart: jest.fn(),
  clearCart: jest.fn(),
  checkout: jest.fn(),
  makePayment: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  cancelOrder: jest.fn(),
  getOrderAnalytics: jest.fn(),
  approveCreditCheck: jest.fn(),
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

  describe('findAll', () => {
    it('should return a list of orders', async () => {
      const filterDto = { page: 1, limit: 10 };
      const userId = '64f123456789abcdef123457';
      const userRole = UserRole.USER;
      const orders = [mockOrder];

      mockOrdersService.findAll.mockResolvedValue({ data: orders, total: 1 });

      const result = await controller.findAll(filterDto, userId, userRole);
      expect(result).toEqual({ data: orders, total: 1 });
      expect(service.findAll).toHaveBeenCalledWith(filterDto, userId, userRole);
    });
  });

  describe('findOne', () => {
    it('should return a single order', async () => {
      const orderId = '64f123456789abcdef123456';
      const userId = '64f123456789abcdef123457';
      const userRole = UserRole.USER;

      mockOrdersService.findOne.mockResolvedValue(mockOrder);

      const result = await controller.findOne(orderId, userId, userRole);
      expect(result).toEqual(mockOrder);
      expect(service.findOne).toHaveBeenCalledWith(orderId, userId, userRole);
    });
  });

  describe('update', () => {
    it('should update an order', async () => {
      const orderId = '64f123456789abcdef123456';
      const updateOrderDto = { status: OrderStatus.SHIPPED };
      const userRole = UserRole.ADMIN;

      const updatedOrder = { ...mockOrder, status: OrderStatus.SHIPPED };
      mockOrdersService.update.mockResolvedValue(updatedOrder);

      const result = await controller.update(orderId, updateOrderDto, userRole);
      expect(result).toEqual(updatedOrder);
      expect(service.update).toHaveBeenCalledWith(orderId, updateOrderDto, userRole);
    });
  });

  describe('getAnalytics', () => {
    it('should return order analytics', async () => {
      const analytics = {
        totalOrders: 100,
        totalRevenue: 500000,
        averageOrderValue: 5000,
      };

      const userRole = UserRole.ADMIN;
      mockOrdersService.getOrderAnalytics.mockResolvedValue(analytics);

      const result = await controller.getAnalytics(userRole);
      expect(result).toEqual(analytics);
      expect(service.getOrderAnalytics).toHaveBeenCalledWith(userRole);
    });
  });
});
