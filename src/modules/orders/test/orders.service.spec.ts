import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { OrdersService } from '../orders.service';
import { Order, OrderDocument } from '../entities/order.entity';
import { CreateOrderDto } from '../dto';
import { PaymentPlan, DeliveryMethod, OrderStatus } from '../entities/order.entity';
import { UserRole } from '../../users/entities/user.entity';

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

  describe('basic operations', () => {
    it('should find all orders', async () => {
      const filterDto = { page: 1, limit: 10 };
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
      mockOrderModel.countDocuments.mockResolvedValue(1);

      const result = await service.findAll(filterDto, '64f123456789abcdef123457', UserRole.USER);
      expect(result).toBeDefined();
    });

    it('should find one order', async () => {
      mockOrderModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockOrder),
        }),
      });

      const result = await service.findOne('64f123456789abcdef123456', '64f123456789abcdef123457', UserRole.USER);
      expect(result).toEqual(mockOrder);
    });

    it('should update an order', async () => {
      const updatedOrder = { ...mockOrder, status: OrderStatus.SHIPPED };
      mockOrderModel.findByIdAndUpdate.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(updatedOrder),
        }),
      });

      const result = await service.update('64f123456789abcdef123456', {
        status: OrderStatus.SHIPPED,
      }, UserRole.ADMIN);
      expect(result).toEqual(updatedOrder);
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

  describe('update', () => {
    it('should update an order', async () => {
      const updatedOrder = { ...mockOrder, status: OrderStatus.SHIPPED };
      mockOrderModel.findByIdAndUpdate.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(updatedOrder),
        }),
      });

      const result = await service.update('64f123456789abcdef123456', {
        status: OrderStatus.SHIPPED,
      }, UserRole.ADMIN);
      expect(result).toEqual(updatedOrder);
    });
  });
});