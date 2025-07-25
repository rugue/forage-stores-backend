import { Injectable, NotFoundException, BadRequestException, ForbiddenException, forwardRef, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { 
  Order, 
  OrderDocument, 
  OrderStatus, 
  PaymentStatus, 
  PaymentMethod, 
  DeliveryMethod, 
  PaymentPlan,
  PaymentFrequency,
  CreditStatus
} from '../orders/entities/order.entity';
import { Product, ProductDocument } from '../products/entities/product.entity';
import { User, UserDocument, UserRole } from '../users/entities/user.entity';
import { Wallet, WalletDocument } from '../wallets/entities/wallet.entity';
import { OrdersReferralHookService } from './orders-referral-hook.service';
import {
  AddToCartDto,
  UpdateCartItemDto,
  RemoveFromCartDto,
  CheckoutDto,
  PaymentDto,
  UpdateOrderDto,
  OrderFilterDto,
  PaymentPlanDetailsDto,
  PayNowPlanDto,
  PriceLockPlanDto,
  PaySmallSmallPlanDto,
  PayLaterPlanDto,
  CreditApprovalDto,
} from './dto';

@Injectable()
export class OrdersService {
  private readonly cartStorage = new Map<string, any[]>(); // In-memory cart storage (use Redis in production)

  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Wallet.name) private walletModel: Model<WalletDocument>,
    @Inject(forwardRef(() => OrdersReferralHookService))
    private readonly referralHook: OrdersReferralHookService,
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

    // Create base order object
    const orderData: any = {
      orderNumber,
      userId: new Types.ObjectId(userId),
      items: updatedItems,
      totalAmount,
      totalAmountInNibia,
      deliveryFee,
      finalTotal: totalAmount + deliveryFee,
      status: OrderStatus.PENDING,
      paymentPlan: checkoutDto.paymentPlan.type,
      deliveryMethod: checkoutDto.deliveryMethod,
      deliveryAddress: checkoutDto.deliveryAddress,
      paymentHistory: [],
      amountPaid: 0,
      remainingAmount: totalAmount + deliveryFee,
      notes: checkoutDto.notes,
    };

    // Process payment plan specific logic
    switch (checkoutDto.paymentPlan.type) {
      case PaymentPlan.PAY_NOW:
        // No additional processing needed for Pay Now option
        break;

      case PaymentPlan.PRICE_LOCK:
        await this.handlePriceLockOrder(orderData, checkoutDto.paymentPlan.priceLockDetails);
        break;

      case PaymentPlan.PAY_SMALL_SMALL:
        await this.handlePaySmallSmallOrder(orderData, checkoutDto.paymentPlan.paySmallSmallDetails, totalAmount + deliveryFee);
        break;

      case PaymentPlan.PAY_LATER:
        await this.handlePayLaterOrder(orderData, userId, checkoutDto.paymentPlan.payLaterDetails);
        break;

      default:
        throw new BadRequestException('Invalid payment plan type');
    }

    const order = new this.orderModel(orderData);
    const savedOrder = await order.save();

    // Clear cart after successful order creation
    this.cartStorage.delete(userId);

    return savedOrder;
  }

  // Helper methods for different payment plan types
  private async handlePriceLockOrder(orderData: any, priceLockDetails: PriceLockPlanDto) {
    if (!priceLockDetails || !priceLockDetails.preferredDeliveryDate) {
      throw new BadRequestException('Preferred delivery date is required for Price Lock orders');
    }

    const preferredDate = new Date(priceLockDetails.preferredDeliveryDate);
    const now = new Date();
    
    // Calculate minimum (30 days) and maximum (45 days) delivery dates
    const minDate = new Date(now);
    minDate.setDate(minDate.getDate() + 30);
    
    const maxDate = new Date(now);
    maxDate.setDate(maxDate.getDate() + 45);

    if (preferredDate < minDate || preferredDate > maxDate) {
      throw new BadRequestException('Preferred delivery date must be between 30 and 45 days from now');
    }

    // Set scheduled delivery date
    orderData.scheduledDeliveryDate = preferredDate;
    orderData.expectedDeliveryDate = preferredDate;
    
    // Price Lock requires a 20% down payment
    orderData.downPaymentRequired = orderData.finalTotal * 0.2;
  }

  private async handlePaySmallSmallOrder(orderData: any, paySmallSmallDetails: PaySmallSmallPlanDto, totalAmount: number) {
    if (!paySmallSmallDetails || !paySmallSmallDetails.frequency || !paySmallSmallDetails.totalInstallments) {
      throw new BadRequestException('Payment frequency and total installments are required for Pay Small-Small orders');
    }

    if (paySmallSmallDetails.totalInstallments < 2) {
      throw new BadRequestException('Total installments must be at least 2');
    }

    const { frequency, totalInstallments } = paySmallSmallDetails;
    const installmentAmount = totalAmount / totalInstallments;
    
    // Calculate payment dates based on frequency
    const startDate = new Date();
    let nextPaymentDate = new Date(startDate);
    let finalPaymentDate = new Date(startDate);
    
    switch (frequency) {
      case PaymentFrequency.WEEKLY:
        nextPaymentDate.setDate(nextPaymentDate.getDate() + 7); // Next week
        finalPaymentDate.setDate(finalPaymentDate.getDate() + (7 * totalInstallments));
        break;
      case PaymentFrequency.BIWEEKLY:
        nextPaymentDate.setDate(nextPaymentDate.getDate() + 14); // Two weeks
        finalPaymentDate.setDate(finalPaymentDate.getDate() + (14 * totalInstallments));
        break;
      case PaymentFrequency.MONTHLY:
        nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1); // Next month
        finalPaymentDate.setMonth(finalPaymentDate.getMonth() + totalInstallments);
        break;
      default:
        throw new BadRequestException('Invalid payment frequency');
    }

    // Create payment schedule
    orderData.paymentSchedule = {
      frequency,
      installmentAmount,
      totalInstallments,
      installmentsPaid: 0,
      startDate,
      nextPaymentDate,
      finalPaymentDate
    };
    
    // First installment is due immediately (25% down payment minimum)
    orderData.downPaymentRequired = Math.max(installmentAmount, totalAmount * 0.25);
    
    // For Pay Small-Small, products are only delivered after full payment or after 50% payment (depends on business rule)
    // Here we'll set expected delivery after full payment
    orderData.expectedDeliveryDate = new Date(finalPaymentDate);
  }

  private async handlePayLaterOrder(orderData: any, userId: string, payLaterDetails: PayLaterPlanDto) {
    if (!payLaterDetails || !payLaterDetails.monthlyIncome || !payLaterDetails.employmentStatus || !payLaterDetails.bvn) {
      throw new BadRequestException('Monthly income, employment status, and BVN are required for Pay Later orders');
    }

    // Retrieve user information
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Initialize credit check
    orderData.creditCheck = {
      status: CreditStatus.PENDING,
      checkDate: new Date(),
      notes: 'Credit check in progress',
    };

    // In a real system, we'd call a credit check API here
    // For this implementation, we'll simulate a credit check based on order amount and user's provided details
    const { monthlyIncome } = payLaterDetails;
    const orderTotal = orderData.finalTotal;
    
    // Simple credit check rule: Order total should not exceed 50% of monthly income
    const creditRatio = orderTotal / monthlyIncome;
    
    if (creditRatio <= 0.5) {
      // Approve credit
      orderData.creditCheck.status = CreditStatus.APPROVED;
      orderData.creditCheck.score = 700 + Math.floor(Math.random() * 100); // Random score between 700-799
      orderData.creditCheck.notes = 'Credit automatically approved';
      orderData.creditCheck.approvedLimit = monthlyIncome * 0.5;
      
      // Set expected delivery date to 1-3 days from now
      const deliveryDate = new Date();
      deliveryDate.setDate(deliveryDate.getDate() + 1 + Math.floor(Math.random() * 3));
      orderData.expectedDeliveryDate = deliveryDate;
    } else {
      // Set to pending for manual review
      orderData.creditCheck.notes = 'Order requires manual credit review';
      // Order will remain in PENDING status until manually approved
    }
    
    // Store the credit check details for reference
    orderData.creditDetails = {
      monthlyIncome: payLaterDetails.monthlyIncome,
      employmentStatus: payLaterDetails.employmentStatus,
      bvn: payLaterDetails.bvn,
      additionalInfo: payLaterDetails.additionalInfo,
    };
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

    // For Pay Later orders, check if credit has been approved
    if (order.paymentPlan === PaymentPlan.PAY_LATER && 
        order.creditCheck?.status !== CreditStatus.APPROVED) {
      throw new BadRequestException('Credit check must be approved before making payment on Pay Later orders');
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

    // Handle payment plan specific logic
    await this.handlePaymentByPlanType(order);

    // Save the order
    await order.save();

    // Check if the order is now fully paid, and if so, process referral commission
    if (order.remainingAmount <= 0) {
      // Process referral commission asynchronously
      this.referralHook.processReferralCommission(
        order.userId.toString(),
        order._id.toString(),
        order.finalTotal
      ).catch(error => {
        console.error(`Error processing referral commission: ${error.message}`);
      });
    }

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

  private async handlePaymentByPlanType(order) {
    // Handle order status update based on payment plan
    switch (order.paymentPlan) {
      case PaymentPlan.PAY_NOW:
        // For Pay Now, order is marked as PAID when fully paid
        if (order.remainingAmount <= 0) {
          order.status = OrderStatus.PAID;
          
          // Reduce product stock
          for (const item of order.items) {
            await this.productModel.findByIdAndUpdate(
              item.productId,
              { $inc: { stock: -item.quantity } }
            );
          }
          
          // Set expected delivery date to 1-2 days from now for PAY_NOW
          const deliveryDate = new Date();
          deliveryDate.setDate(deliveryDate.getDate() + 1 + Math.floor(Math.random() * 2));
          order.expectedDeliveryDate = deliveryDate;
        }
        break;
        
      case PaymentPlan.PRICE_LOCK:
        // For Price Lock, check if down payment requirement is met
        const downPaymentRequired = order.finalTotal * 0.2; // 20% down payment
        
        if (order.amountPaid >= downPaymentRequired && order.status === OrderStatus.PENDING) {
          // If down payment is made, keep the order in a special "PRICE_LOCKED" status
          // But technically still PENDING until scheduled delivery date
          order.status = OrderStatus.PENDING;
          order.priceLockConfirmed = true;
        }
        
        // If fully paid
        if (order.remainingAmount <= 0) {
          // Only change to PAID if we've reached the scheduled delivery date
          const now = new Date();
          if (order.scheduledDeliveryDate && now >= order.scheduledDeliveryDate) {
            order.status = OrderStatus.PAID;
            
            // Reduce product stock
            for (const item of order.items) {
              await this.productModel.findByIdAndUpdate(
                item.productId,
                { $inc: { stock: -item.quantity } }
              );
            }
          }
        }
        break;
        
      case PaymentPlan.PAY_SMALL_SMALL:
        // For Pay Small-Small, update installment tracking
        if (order.paymentSchedule) {
          order.paymentSchedule.installmentsPaid += 1;
          
          // Calculate next payment date
          const nextPaymentDate = new Date();
          switch (order.paymentSchedule.frequency) {
            case PaymentFrequency.WEEKLY:
              nextPaymentDate.setDate(nextPaymentDate.getDate() + 7);
              break;
            case PaymentFrequency.BIWEEKLY:
              nextPaymentDate.setDate(nextPaymentDate.getDate() + 14);
              break;
            case PaymentFrequency.MONTHLY:
              nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);
              break;
          }
          order.paymentSchedule.nextPaymentDate = nextPaymentDate;
          
          // If fully paid or paid 50% or more, we can update status
          if (order.remainingAmount <= 0) {
            order.status = OrderStatus.PAID;
            
            // Reduce product stock
            for (const item of order.items) {
              await this.productModel.findByIdAndUpdate(
                item.productId,
                { $inc: { stock: -item.quantity } }
              );
            }
            
            // Set delivery date to within a week
            const deliveryDate = new Date();
            deliveryDate.setDate(deliveryDate.getDate() + 3 + Math.floor(Math.random() * 4)); // 3-7 days
            order.expectedDeliveryDate = deliveryDate;
          } else if (order.amountPaid >= order.finalTotal * 0.5) {
            // If 50% or more is paid, optionally update delivery expectations
            // Business rule: Could release product after 50% payment for trusted customers
          }
        }
        break;
        
      case PaymentPlan.PAY_LATER:
        // For Pay Later, order is processed after credit approval
        if (order.remainingAmount <= 0) {
          order.status = OrderStatus.PAID;
          
          // Reduce product stock
          for (const item of order.items) {
            await this.productModel.findByIdAndUpdate(
              item.productId,
              { $inc: { stock: -item.quantity } }
            );
          }
          
          // Update delivery date if not already set
          if (!order.expectedDeliveryDate) {
            const deliveryDate = new Date();
            deliveryDate.setDate(deliveryDate.getDate() + 1 + Math.floor(Math.random() * 2)); // 1-3 days
            order.expectedDeliveryDate = deliveryDate;
          }
        }
        break;
    }
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

  async approveCreditCheck(orderId: string, creditApprovalDto: CreditApprovalDto) {
    const order = await this.orderModel.findById(orderId);
    
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Verify this is a Pay Later order with pending credit check
    if (order.paymentPlan !== PaymentPlan.PAY_LATER) {
      throw new BadRequestException('This is not a Pay Later order');
    }

    if (!order.creditCheck || order.creditCheck.status !== CreditStatus.PENDING) {
      throw new BadRequestException('This order does not have a pending credit check');
    }

    // Update the credit check based on approval decision
    if (creditApprovalDto.approve) {
      // Credit is approved
      order.creditCheck.status = CreditStatus.APPROVED;
      order.creditCheck.score = creditApprovalDto.score || 700; // Default score if not provided
      order.creditCheck.approvedLimit = creditApprovalDto.approvedLimit || order.finalTotal;
      order.creditCheck.notes = creditApprovalDto.notes || 'Credit manually approved';
      
      // Set expected delivery date to 1-3 days from now
      const deliveryDate = new Date();
      deliveryDate.setDate(deliveryDate.getDate() + 1 + Math.floor(Math.random() * 3));
      order.expectedDeliveryDate = deliveryDate;
    } else {
      // Credit is rejected
      order.creditCheck.status = CreditStatus.REJECTED;
      order.creditCheck.notes = creditApprovalDto.notes || 'Credit manually rejected';
      order.status = OrderStatus.CANCELLED;
      order.cancellationReason = 'Credit check failed';
    }

    // Save the updated order
    await order.save();

    return {
      message: creditApprovalDto.approve ? 'Credit approved successfully' : 'Credit rejected',
      order: {
        id: order._id,
        orderNumber: order.orderNumber,
        status: order.status,
        creditStatus: order.creditCheck.status,
        expectedDeliveryDate: order.expectedDeliveryDate,
      }
    };
  }
}
