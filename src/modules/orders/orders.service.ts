import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Order, OrderDocument, OrderStatus, PaymentStatus, PaymentMethod, DeliveryMethod, PaymentPlan } from '../../entities/order.entity';
import { Product, ProductDocument } from '../../entities/product.entity';
import { User, UserDocument, UserRole } from '../../entities/user.entity';
import { Wallet, WalletDocument } from '../../entities/wallet.entity';
import {
  AddToCartDto,
  UpdateCartItemDto,
  RemoveFromCartDto,
  CheckoutDto,
  PaymentDto,
  UpdateOrderDto,
  OrderFilterDto,
} from './dto';

@Injectable()
export class OrdersService {
  private readonly cartStorage = new Map<string, any[]>(); // In-memory cart storage (use Redis in production)

  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Wallet.name) private walletModel: Model<WalletDocument>,
  ) {}

  // Cart Management
  async addToCart(userId: string, addToCartDto: AddToCartDto) {
    const { productId, quantity } = addToCartDto;

    // Verify product exists and is available
    const product = await this.productModel.findById(productId);
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (product.stock < quantity) {
      throw new BadRequestException(`Insufficient stock. Available: ${product.stock}`);
    }

    // Get or create cart
    let cart = this.cartStorage.get(userId) || [];

    // Check if product already in cart
    const existingItemIndex = cart.findIndex(item => item.productId === productId);

    if (existingItemIndex > -1) {
      // Update quantity
      const newQuantity = cart[existingItemIndex].quantity + quantity;
      if (product.stock < newQuantity) {
        throw new BadRequestException(`Insufficient stock. Available: ${product.stock}`);
      }
      cart[existingItemIndex].quantity = newQuantity;
      cart[existingItemIndex].totalPrice = newQuantity * product.price;
      cart[existingItemIndex].totalPriceInNibia = newQuantity * product.priceInNibia;
    } else {
      // Add new item
      cart.push({
        productId,
        quantity,
        unitPrice: product.price,
        unitPriceInNibia: product.priceInNibia,
        totalPrice: quantity * product.price,
        totalPriceInNibia: quantity * product.priceInNibia,
        productName: product.name,
        productDescription: product.description,
      });
    }

    this.cartStorage.set(userId, cart);
    return { message: 'Item added to cart', cart: this.calculateCartSummary(cart) };
  }

  async updateCartItem(userId: string, productId: string, updateCartItemDto: UpdateCartItemDto) {
    const { quantity } = updateCartItemDto;

    const cart = this.cartStorage.get(userId) || [];
    const itemIndex = cart.findIndex(item => item.productId === productId);

    if (itemIndex === -1) {
      throw new NotFoundException('Item not found in cart');
    }

    // Verify stock
    const product = await this.productModel.findById(productId);
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (product.stock < quantity) {
      throw new BadRequestException(`Insufficient stock. Available: ${product.stock}`);
    }

    cart[itemIndex].quantity = quantity;
    cart[itemIndex].totalPrice = quantity * cart[itemIndex].unitPrice;
    cart[itemIndex].totalPriceInNibia = quantity * cart[itemIndex].unitPriceInNibia;

    this.cartStorage.set(userId, cart);
    return { message: 'Cart item updated', cart: this.calculateCartSummary(cart) };
  }

  async removeFromCart(userId: string, removeFromCartDto: RemoveFromCartDto) {
    const { productId } = removeFromCartDto;

    let cart = this.cartStorage.get(userId) || [];
    cart = cart.filter(item => item.productId !== productId);

    this.cartStorage.set(userId, cart);
    return { message: 'Item removed from cart', cart: this.calculateCartSummary(cart) };
  }

  async getCart(userId: string) {
    const cart = this.cartStorage.get(userId) || [];
    return this.calculateCartSummary(cart);
  }

  async clearCart(userId: string) {
    this.cartStorage.delete(userId);
    return { message: 'Cart cleared' };
  }

  // Order Management
  async checkout(userId: string, checkoutDto: CheckoutDto) {
    const cart = this.cartStorage.get(userId) || [];
    
    if (cart.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    // Validate delivery address for home delivery
    if (checkoutDto.deliveryMethod === DeliveryMethod.HOME_DELIVERY && !checkoutDto.deliveryAddress) {
      throw new BadRequestException('Delivery address is required for home delivery');
    }

    // Verify all products are still available and update prices
    const updatedItems = [];
    let totalAmount = 0;
    let totalAmountInNibia = 0;

    for (const item of cart) {
      const product = await this.productModel.findById(item.productId);
      if (!product) {
        throw new NotFoundException(`Product ${item.productName} not found`);
      }

      if (product.stock < item.quantity) {
        throw new BadRequestException(`Insufficient stock for ${product.name}. Available: ${product.stock}`);
      }

      const cartItem = {
        productId: new Types.ObjectId(item.productId),
        quantity: item.quantity,
        unitPrice: product.price, // Use current price
        unitPriceInNibia: product.priceInNibia,
        totalPrice: item.quantity * product.price,
        totalPriceInNibia: item.quantity * product.priceInNibia,
      };

      updatedItems.push(cartItem);
      totalAmount += cartItem.totalPrice;
      totalAmountInNibia += cartItem.totalPriceInNibia;
    }

    // Calculate delivery fee
    const deliveryFee = checkoutDto.deliveryMethod === DeliveryMethod.HOME_DELIVERY ? 500 : 0; // 500 NGN for home delivery

    // Generate order number
    const orderNumber = this.generateOrderNumber();

    // Create order
    const order = new this.orderModel({
      orderNumber,
      userId: new Types.ObjectId(userId),
      items: updatedItems,
      totalAmount,
      totalAmountInNibia,
      deliveryFee,
      finalTotal: totalAmount + deliveryFee,
      status: OrderStatus.PENDING,
      paymentPlan: checkoutDto.paymentPlan,
      deliveryMethod: checkoutDto.deliveryMethod,
      deliveryAddress: checkoutDto.deliveryAddress,
      paymentHistory: [],
      amountPaid: 0,
      remainingAmount: totalAmount + deliveryFee,
      notes: checkoutDto.notes,
    });

    const savedOrder = await order.save();

    // Clear cart after successful order creation
    this.cartStorage.delete(userId);

    return savedOrder;
  }

  async makePayment(orderId: string, userId: string, userRole: UserRole, paymentDto: PaymentDto) {
    const order = await this.orderModel.findById(orderId);
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Check if user owns the order or is admin
    if (userRole !== UserRole.ADMIN && order.userId.toString() !== userId) {
      throw new ForbiddenException('You can only make payments for your own orders');
    }

    // Validate payment amount
    if (paymentDto.amount > order.remainingAmount) {
      throw new BadRequestException(`Payment amount exceeds remaining balance. Remaining: ${order.remainingAmount}`);
    }

    // Process payment based on method
    let paymentSuccess = false;
    let transactionRef = paymentDto.transactionRef;

    if (paymentDto.paymentMethod === PaymentMethod.FOOD_MONEY || paymentDto.paymentMethod === PaymentMethod.FOOD_POINTS) {
      // Process wallet payment
      const wallet = await this.walletModel.findOne({ userId: new Types.ObjectId(userId) });
      if (!wallet) {
        throw new NotFoundException('Wallet not found');
      }

      if (paymentDto.paymentMethod === PaymentMethod.FOOD_MONEY) {
        if (wallet.foodMoney < paymentDto.amount) {
          throw new BadRequestException('Insufficient food money balance');
        }
        wallet.foodMoney -= paymentDto.amount;
      } else {
        if (wallet.foodPoints < paymentDto.amount) {
          throw new BadRequestException('Insufficient food points balance');
        }
        wallet.foodPoints -= paymentDto.amount;
      }

      wallet.lastTransactionAt = new Date();
      await wallet.save();
      paymentSuccess = true;
      transactionRef = `WALLET_${Date.now()}`;
    } else {
      // For other payment methods, assume external payment processing
      paymentSuccess = true; // In real implementation, integrate with payment gateway
      transactionRef = transactionRef || `EXT_${Date.now()}`;
    }

    // Add payment to history
    const paymentRecord = {
      amount: paymentDto.amount,
      paymentMethod: paymentDto.paymentMethod,
      status: paymentSuccess ? PaymentStatus.COMPLETED : PaymentStatus.FAILED,
      paymentDate: new Date(),
      transactionRef,
      notes: paymentDto.notes,
    };

    order.paymentHistory.push(paymentRecord);
    order.amountPaid += paymentDto.amount;
    order.remainingAmount -= paymentDto.amount;

    // Update order status based on payment
    if (order.remainingAmount <= 0) {
      order.status = OrderStatus.PAID;
      
      // Reduce product stock
      for (const item of order.items) {
        await this.productModel.findByIdAndUpdate(
          item.productId,
          { $inc: { stock: -item.quantity } }
        );
      }
    }

    await order.save();

    return {
      message: 'Payment processed successfully',
      paymentRecord,
      order: {
        orderNumber: order.orderNumber,
        amountPaid: order.amountPaid,
        remainingAmount: order.remainingAmount,
        status: order.status,
      },
    };
  }

  async findAll(filterDto: OrderFilterDto, userId?: string, userRole?: UserRole) {
    const {
      status,
      paymentPlan,
      deliveryMethod,
      city,
      fromDate,
      toDate,
      orderNumber,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = filterDto;

    const query: any = {};

    // Non-admin users can only see their own orders
    if (userRole !== UserRole.ADMIN && userId) {
      query.userId = new Types.ObjectId(userId);
    }

    if (status) query.status = status;
    if (paymentPlan) query.paymentPlan = paymentPlan;
    if (deliveryMethod) query.deliveryMethod = deliveryMethod;
    if (city) query['deliveryAddress.city'] = new RegExp(city, 'i');
    if (orderNumber) query.orderNumber = new RegExp(orderNumber, 'i');

    if (fromDate || toDate) {
      query.createdAt = {};
      if (fromDate) query.createdAt.$gte = new Date(fromDate);
      if (toDate) query.createdAt.$lte = new Date(toDate);
    }

    const sortDirection = sortOrder === 'asc' ? 1 : -1;
    const skip = (page - 1) * limit;

    const [orders, totalCount] = await Promise.all([
      this.orderModel
        .find(query)
        .populate('userId', 'firstName lastName email phone')
        .populate('items.productId', 'name description category')
        .sort({ [sortBy]: sortDirection })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.orderModel.countDocuments(query),
    ]);

    return {
      orders,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        hasNext: page < Math.ceil(totalCount / limit),
        hasPrev: page > 1,
      },
    };
  }

  async findOne(id: string, userId?: string, userRole?: UserRole) {
    const order = await this.orderModel
      .findById(id)
      .populate('userId', 'firstName lastName email phone')
      .populate('items.productId', 'name description category sellerId')
      .exec();

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Check permissions
    if (userRole !== UserRole.ADMIN && order.userId.toString() !== userId) {
      throw new ForbiddenException('You can only view your own orders');
    }

    return order;
  }

  async update(id: string, updateOrderDto: UpdateOrderDto, userRole: UserRole) {
    // Only admins can update orders
    if (userRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can update orders');
    }

    const order = await this.orderModel.findByIdAndUpdate(
      id,
      updateOrderDto,
      { new: true, runValidators: true }
    );

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  async cancelOrder(id: string, userId: string, userRole: UserRole, reason: string) {
    const order = await this.orderModel.findById(id);
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Check permissions
    if (userRole !== UserRole.ADMIN && order.userId.toString() !== userId) {
      throw new ForbiddenException('You can only cancel your own orders');
    }

    // Can only cancel pending or paid orders
    if (![OrderStatus.PENDING, OrderStatus.PAID].includes(order.status)) {
      throw new BadRequestException('Cannot cancel order in current status');
    }

    const originalStatus = order.status;
    order.status = OrderStatus.CANCELLED;
    order.cancellationReason = reason;

    // If order was paid, handle refund logic here
    if (originalStatus === OrderStatus.PAID) {
      // Restore product stock
      for (const item of order.items) {
        await this.productModel.findByIdAndUpdate(
          item.productId,
          { $inc: { stock: item.quantity } }
        );
      }
      
      // Add refund logic here if needed
    }

    await order.save();
    return order;
  }

  async getOrderAnalytics(userRole: UserRole) {
    if (userRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can view analytics');
    }

    const [
      totalOrders,
      totalRevenue,
      statusCounts,
      paymentPlanCounts,
      deliveryMethodCounts,
      recentOrders,
    ] = await Promise.all([
      this.orderModel.countDocuments(),
      this.orderModel.aggregate([
        { $match: { status: { $in: [OrderStatus.PAID, OrderStatus.SHIPPED, OrderStatus.DELIVERED] } } },
        { $group: { _id: null, total: { $sum: '$finalTotal' } } },
      ]),
      this.orderModel.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      this.orderModel.aggregate([
        { $group: { _id: '$paymentPlan', count: { $sum: 1 } } },
      ]),
      this.orderModel.aggregate([
        { $group: { _id: '$deliveryMethod', count: { $sum: 1 } } },
      ]),
      this.orderModel
        .find()
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('userId', 'firstName lastName')
        .exec(),
    ]);

    return {
      totalOrders,
      totalRevenue: totalRevenue[0]?.total || 0,
      statusCounts,
      paymentPlanCounts,
      deliveryMethodCounts,
      recentOrders,
    };
  }

  // Helper methods
  private calculateCartSummary(cart: any[]) {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const totalAmount = cart.reduce((sum, item) => sum + item.totalPrice, 0);
    const totalAmountInNibia = cart.reduce((sum, item) => sum + item.totalPriceInNibia, 0);

    return {
      items: cart,
      summary: {
        totalItems,
        totalAmount,
        totalAmountInNibia,
        estimatedDeliveryFee: 500, // Fixed delivery fee for estimation
      },
    };
  }

  private generateOrderNumber(): string {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `ORD-${timestamp.slice(-6)}${random}`;
  }
}
