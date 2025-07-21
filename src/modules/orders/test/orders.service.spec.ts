import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { OrdersService } from '../orders.service';
import { Order, OrderDocument } from '../entities/order.entity';
import { CreateOrderDto } from '../dto';
import { PaymentPlan, DeliveryMethod, OrderStatus } from '../entities/order.entity';

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
  save: jest.fn().mockResolvedValue(this),
};

const mockOrderModel = {
  new: jest.fn().mockResolvedValue(mockOrder),
  constructor: jest.fn().mockResolvedValue(mockOrder),
  find: jest.fn(),
  findOne: jest.fn(),
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  findByIdAndDelete: jest.fn(),
  create: jest.fn(),
  exec: jest.fn(),
  save: jest.fn(),
  aggregate: jest.fn(),
  countDocuments: jest.fn(),
  populate: jest.fn(),
  sort: jest.fn(),
  limit: jest.fn(),
  skip: jest.fn(),
};

describe('OrdersService', () => {
  let service: OrdersService;
  let model: Model<OrderDocument>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        {
          provide: getModelToken(Order.name),
          useValue: mockOrderModel,
        },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    model = module.get<Model<OrderDocument>>(getModelToken(Order.name));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
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

      mockOrderModel.create.mockResolvedValue(mockOrder);

      const result = await service.create(createOrderDto, '64f123456789abcdef123457');
      expect(result).toEqual(mockOrder);
      expect(mockOrderModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: '64f123456789abcdef123457',
          items: createOrderDto.items,
          paymentPlan: createOrderDto.paymentPlan,
          deliveryMethod: createOrderDto.deliveryMethod,
        })
      );
    });
  });

  describe('findAll', () => {
    it('should return an array of orders', async () => {
      const orders = [mockOrder];
      mockOrderModel.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              skip: jest.fn().mockReturnValue({
                exec: jest.fn().mockResolvedValue(orders),
              }),
            }),
          }),
        }),
      });

      const result = await service.findAll({});
      expect(result).toEqual(orders);
    });
  });

  describe('findOne', () => {
    it('should return a single order', async () => {
      mockOrderModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockOrder),
        }),
      });

      const result = await service.findOne('64f123456789abcdef123456');
      expect(result).toEqual(mockOrder);
      expect(mockOrderModel.findById).toHaveBeenCalledWith('64f123456789abcdef123456');
    });
  });

  describe('updateStatus', () => {
    it('should update order status', async () => {
      const updatedOrder = { ...mockOrder, status: OrderStatus.PAID };
      mockOrderModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(updatedOrder),
      });

      const result = await service.updateStatus('64f123456789abcdef123456', {
        status: OrderStatus.PAID,
      });
      expect(result).toEqual(updatedOrder);
    });
  });

  describe('processPayment', () => {
    it('should process payment for an order', async () => {
      const paymentDto = {
        amount: 3500,
        paymentMethod: 'CARD' as any,
        transactionRef: 'TXN123456',
      };

      mockOrderModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockOrder),
      });

      mockOrder.save.mockResolvedValue({
        ...mockOrder,
        amountPaid: 3500,
        remainingAmount: 0,
        status: OrderStatus.PAID,
      });

      const result = await service.processPayment('64f123456789abcdef123456', paymentDto);
      expect(result.amountPaid).toBe(3500);
      expect(result.remainingAmount).toBe(0);
      expect(result.status).toBe(OrderStatus.PAID);
    });
  });

  describe('cancel', () => {
    it('should cancel an order', async () => {
      const cancelDto = {
        cancellationReason: 'Customer request',
        processRefund: true,
      };

      mockOrderModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockOrder),
      });

      mockOrder.save.mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.CANCELLED,
        cancellationReason: 'Customer request',
      });

      const result = await service.cancel('64f123456789abcdef123456', cancelDto);
      expect(result.status).toBe(OrderStatus.CANCELLED);
      expect(result.cancellationReason).toBe('Customer request');
    });
  });

  describe('getOrderSummary', () => {
    it('should return order summary statistics', async () => {
      const summaryData = [
        {
          _id: null,
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
        },
      ];

      mockOrderModel.aggregate.mockResolvedValue(summaryData);

      const result = await service.getOrderSummary();
      expect(result.totalOrders).toBe(10);
      expect(result.totalAmount).toBe(50000);
    });
  });
});
