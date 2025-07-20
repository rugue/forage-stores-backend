import { Injectable, BadRequestException, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from '../../entities/user.entity';
import { Wallet, WalletDocument } from '../../entities/wallet.entity';
import { Order, OrderDocument } from '../../entities/order.entity';
import { Subscription, SubscriptionDocument } from '../../entities/subscription.entity';
import { Referral, ReferralDocument } from '../../entities/referral.entity';
import { Product, ProductDocument } from '../../entities/product.entity';
import { 
  AdminWalletFundDto, 
  AdminWalletWipeDto, 
  CreateCategoryDto, 
  UpdateCategoryDto, 
  PriceHistoryDto,
  AnalyticsFilterDto
} from './dto';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Wallet.name) private walletModel: Model<WalletDocument>,
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(Subscription.name) private subscriptionModel: Model<SubscriptionDocument>,
    @InjectModel(Referral.name) private referralModel: Model<ReferralDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel('Category') private categoryModel: Model<any>,
    @InjectModel('PriceHistory') private priceHistoryModel: Model<any>,
  ) {}

  /**
   * User Management
   */
  async getAllUsers() {
    return this.userModel.find().sort({ createdAt: -1 }).exec();
  }

  async getUserById(userId: string) {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }
    return user;
  }

  /**
   * Wallet Management
   */
  async getAllWallets() {
    return this.walletModel.find()
      .populate('userId', 'name email phone')
      .sort({ createdAt: -1 })
      .exec();
  }

  async getWalletById(walletId: string) {
    const wallet = await this.walletModel.findById(walletId)
      .populate('userId', 'name email phone')
      .exec();
    
    if (!wallet) {
      throw new NotFoundException(`Wallet with ID ${walletId} not found`);
    }
    
    return wallet;
  }

  async getUserWallet(userId: string) {
    const wallet = await this.walletModel.findOne({ userId: new Types.ObjectId(userId) })
      .populate('userId', 'name email phone')
      .exec();
    
    if (!wallet) {
      throw new NotFoundException(`Wallet for user ${userId} not found`);
    }
    
    return wallet;
  }

  async fundWallet(fundDto: AdminWalletFundDto, adminId: string) {
    const { userId, amount, currencyType, adminPassword, reason } = fundDto;
    
    // Verify admin password
    const admin = await this.userModel.findById(adminId).select('+password');
    if (!admin) {
      throw new UnauthorizedException('Admin not found');
    }
    
    const isPasswordValid = await bcrypt.compare(adminPassword, admin.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid admin password');
    }
    
    // Find user wallet
    const wallet = await this.walletModel.findOne({ userId: new Types.ObjectId(userId) });
    if (!wallet) {
      throw new NotFoundException(`Wallet for user ${userId} not found`);
    }
    
    // Update wallet balance
    if (currencyType === 'foodMoney') {
      wallet.foodMoney += amount;
    } else if (currencyType === 'foodPoints') {
      wallet.foodPoints += amount;
    } else {
      throw new BadRequestException('Invalid currency type');
    }
    
    // Create transaction history record if schema supports it
    const transactionData = {
      type: 'ADMIN_FUND',
      amount,
      currencyType,
      description: reason,
      adminId: new Types.ObjectId(adminId),
      timestamp: new Date()
    };
    
    // Try to add to transaction history if it exists
    if (wallet['transactionHistory'] && Array.isArray(wallet['transactionHistory'])) {
      wallet['transactionHistory'].push(transactionData);
    }
    
    await wallet.save();
    
    return wallet;
  }

  async wipeWallet(wipeDto: AdminWalletWipeDto, adminId: string) {
    const { userId, currencyType, adminPassword, reason } = wipeDto;
    
    // Verify admin password
    const admin = await this.userModel.findById(adminId).select('+password');
    if (!admin) {
      throw new UnauthorizedException('Admin not found');
    }
    
    const isPasswordValid = await bcrypt.compare(adminPassword, admin.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid admin password');
    }
    
    // Find user wallet
    const wallet = await this.walletModel.findOne({ userId: new Types.ObjectId(userId) });
    if (!wallet) {
      throw new NotFoundException(`Wallet for user ${userId} not found`);
    }
    
    // Track amounts being wiped for transaction history
    const wipeDetails = {
      foodMoney: 0,
      foodPoints: 0
    };
    
    // Wipe wallet balances
    if (currencyType === 'foodMoney' || currencyType === 'both') {
      wipeDetails.foodMoney = wallet.foodMoney;
      wallet.foodMoney = 0;
    }
    
    if (currencyType === 'foodPoints' || currencyType === 'both') {
      wipeDetails.foodPoints = wallet.foodPoints;
      wallet.foodPoints = 0;
    }
    
    // Save transaction history
    const transactionData = {
      type: 'ADMIN_WIPE',
      amount: currencyType === 'both' ? null : 
             (currencyType === 'foodMoney' ? wipeDetails.foodMoney : wipeDetails.foodPoints),
      currencyType,
      description: reason,
      adminId: new Types.ObjectId(adminId),
      timestamp: new Date(),
      metadata: {
        foodMoneyWiped: wipeDetails.foodMoney,
        foodPointsWiped: wipeDetails.foodPoints
      }
    };
    
    // Try to add to transaction history if it exists
    if (wallet['transactionHistory'] && Array.isArray(wallet['transactionHistory'])) {
      wallet['transactionHistory'].push(transactionData);
    }
    
    await wallet.save();
    
    return wallet;
  }

  /**
   * Analytics & Reports
   */
  async getOrdersAnalytics(filterDto: AnalyticsFilterDto = {}) {
    const { dateRange, categoryId, productId, city } = filterDto;
    
    const query: any = {};
    
    if (dateRange) {
      query.createdAt = {
        $gte: new Date(dateRange.startDate),
        $lte: new Date(dateRange.endDate)
      };
    }
    
    if (city) {
      query.city = city;
    }
    
    let orders = await this.orderModel.find(query)
      .populate('userId', 'name email')
      .populate('items.productId')
      .sort({ createdAt: -1 })
      .exec();
    
    // Filter by product or category if needed
    if (productId || categoryId) {
      orders = orders.filter(order => {
        return order.items.some(item => {
          if (productId && item.productId && item.productId._id && 
              item.productId._id.toString() === productId) {
            return true;
          }
          
          if (categoryId && item.productId && 
              item.productId['categoryId'] && 
              item.productId['categoryId'].toString() === categoryId) {
            return true;
          }
          
          return false;
        });
      });
    }
    
    // Calculate analytics
    const analytics = {
      totalOrders: orders.length,
      totalRevenue: orders.reduce((sum, order) => sum + order.totalAmount, 0),
      averageOrderValue: 0,
      ordersByStatus: {},
      ordersByCity: {},
      ordersByDay: {},
      topProducts: {},
      topCategories: {}
    };
    
    // Calculate average order value
    if (orders.length > 0) {
      analytics.averageOrderValue = analytics.totalRevenue / orders.length;
    }
    
    // Group by status
    orders.forEach(order => {
      analytics.ordersByStatus[order.status] = (analytics.ordersByStatus[order.status] || 0) + 1;
      
      // Group by city
      if (order['city']) {
        analytics.ordersByCity[order['city']] = (analytics.ordersByCity[order['city']] || 0) + 1;
      }
      
      // Group by day
      if (order['createdAt']) {
        const day = new Date(order['createdAt']).toISOString().split('T')[0];
        analytics.ordersByDay[day] = (analytics.ordersByDay[day] || 0) + 1;
      }
      
      // Collect product & category data
      order.items.forEach(item => {
        if (!item.productId) return;
        
        const productId = item.productId._id.toString();
        const product = item.productId;
        
        // Top products
        if (!analytics.topProducts[productId]) {
          analytics.topProducts[productId] = {
            id: productId,
            name: product['name'] || 'Unknown',
            quantity: 0,
            revenue: 0
          };
        }
        
        analytics.topProducts[productId].quantity += item.quantity;
        analytics.topProducts[productId].revenue += (item['price'] || 0) * item.quantity;
        
        // Top categories
        if (product['categoryId']) {
          const categoryId = product['categoryId'].toString();
          
          if (!analytics.topCategories[categoryId]) {
            analytics.topCategories[categoryId] = {
              id: categoryId,
              name: product['categoryName'] || 'Unknown',
              quantity: 0,
              revenue: 0
            };
          }
          
          analytics.topCategories[categoryId].quantity += item.quantity;
          analytics.topCategories[categoryId].revenue += (item['price'] || 0) * item.quantity;
        }
      });
    });
    
    // Convert objects to arrays for easier consumption
    analytics.topProducts = Object.values(analytics.topProducts)
      .sort((a: any, b: any) => b.revenue - a.revenue)
      .slice(0, 10);
    
    analytics.topCategories = Object.values(analytics.topCategories)
      .sort((a: any, b: any) => b.revenue - a.revenue)
      .slice(0, 10);
    
    return analytics;
  }

  async getSubscriptionAnalytics(filterDto: AnalyticsFilterDto = {}) {
    const { dateRange, city } = filterDto;
    
    const query: any = {};
    
    if (dateRange) {
      query.createdAt = {
        $gte: new Date(dateRange.startDate),
        $lte: new Date(dateRange.endDate)
      };
    }
    
    if (city) {
      query.city = city;
    }
    
    const subscriptions = await this.subscriptionModel.find(query)
      .populate('userId', 'name email city')
      .populate('orderId')
      .sort({ createdAt: -1 })
      .exec();
    
    // Calculate analytics
    const analytics = {
      totalSubscriptions: subscriptions.length,
      totalValue: subscriptions.reduce((sum, sub) => sum + sub.totalAmount, 0),
      activeSubscriptions: subscriptions.filter(sub => !sub.isCompleted).length,
      completedSubscriptions: subscriptions.filter(sub => sub.isCompleted).length,
      averageDropAmount: 0,
      subscriptionsByPaymentPlan: {},
      subscriptionsByCity: {},
      subscriptionsByMonth: {},
      dropCompletionRate: 0,
      averageCompletionTime: 0
    };
    
    // Calculate average drop amount
    const totalDrops = subscriptions.reduce((sum, sub) => sum + sub.dropsPaid, 0);
    if (totalDrops > 0) {
      analytics.averageDropAmount = analytics.totalValue / totalDrops;
    }
    
    // Group by payment plan
    subscriptions.forEach(sub => {
      analytics.subscriptionsByPaymentPlan[sub.paymentPlan] = 
        (analytics.subscriptionsByPaymentPlan[sub.paymentPlan] || 0) + 1;
      
      // Group by city (from user or order)
      const city = (sub.userId as any).city || 'Unknown';
      analytics.subscriptionsByCity[city] = (analytics.subscriptionsByCity[city] || 0) + 1;
      
      // Group by month
      if (sub['createdAt']) {
        const month = new Date(sub['createdAt']).toISOString().slice(0, 7); // YYYY-MM
        analytics.subscriptionsByMonth[month] = (analytics.subscriptionsByMonth[month] || 0) + 1;
      }
    });
    
    // Calculate drop completion rate
    const totalExpectedDrops = subscriptions.reduce((sum, sub) => {
      const totalDrops = sub.dropSchedule?.length || 0;
      return sum + totalDrops;
    }, 0);
    
    if (totalExpectedDrops > 0) {
      analytics.dropCompletionRate = (totalDrops / totalExpectedDrops) * 100;
    }
    
    // Calculate average completion time for completed subscriptions
    const completedSubs = subscriptions.filter(sub => sub.isCompleted);
    if (completedSubs.length > 0) {
      const totalDays = completedSubs.reduce((sum, sub) => {
        if (sub['createdAt'] && sub['updatedAt']) {
          const startDate = new Date(sub['createdAt']);
          const endDate = new Date(sub['updatedAt']);
          const days = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24));
          return sum + days;
        }
        return sum;
      }, 0);
      
      analytics.averageCompletionTime = totalDays / completedSubs.length;
    }
    
    return analytics;
  }

  async getCommissionAnalytics(filterDto: AnalyticsFilterDto = {}) {
    const { dateRange, city } = filterDto;
    
    const query: any = {};
    
    if (dateRange) {
      query.createdAt = {
        $gte: new Date(dateRange.startDate),
        $lte: new Date(dateRange.endDate)
      };
    }
    
    const referrals = await this.referralModel.find(query)
      .populate('referrerId', 'name email city accountType')
      .populate('referredUserId', 'name email city')
      .sort({ createdAt: -1 })
      .exec();
    
    // Filter by city if needed
    let filteredReferrals = referrals;
    if (city) {
      filteredReferrals = referrals.filter(ref => {
        const referrerCity = (ref.referrerId as any).city;
        return referrerCity === city;
      });
    }
    
    // Calculate analytics
    const analytics = {
      totalReferrals: filteredReferrals.length,
      totalCommissionAmount: filteredReferrals.reduce((sum, ref) => {
        return sum + (ref.commissionHistory.reduce((s, c) => s + c.amount, 0));
      }, 0),
      activeReferrers: new Set(filteredReferrals.map(r => r.referrerId._id.toString())).size,
      commissionsByType: {
        foodMoney: 0,
        foodPoints: 0
      },
      commissionsByUserType: {
        regular: 0,
        proAffiliate: 0
      },
      topReferrers: [],
      referralsByMonth: {},
      conversionRate: 0, // Percentage of referred users who made purchases
    };
    
    // Process commission data
    filteredReferrals.forEach(ref => {
      // Track commissions by currency type
      ref.commissionHistory.forEach(c => {
        if (c['currencyType'] === 'foodMoney') {
          analytics.commissionsByType.foodMoney += c.amount;
        } else if (c['currencyType'] === 'foodPoints') {
          analytics.commissionsByType.foodPoints += c.amount;
        }
      });
      
      // Track by referrer type
      const referrerType = (ref.referrerId as any).accountType === 'pro-affiliate' ? 
        'proAffiliate' : 'regular';
      
      analytics.commissionsByUserType[referrerType] += 
        ref.commissionHistory.reduce((sum, c) => sum + c.amount, 0);
      
      // Group by month
      if (ref['createdAt']) {
        const month = new Date(ref['createdAt']).toISOString().slice(0, 7); // YYYY-MM
        analytics.referralsByMonth[month] = (analytics.referralsByMonth[month] || 0) + 1;
      }
    });
    
    // Calculate top referrers
    const referrerStats = {};
    filteredReferrals.forEach(ref => {
      const referrerId = ref.referrerId._id.toString();
      const referrerName = (ref.referrerId as any).name;
      
      if (!referrerStats[referrerId]) {
        referrerStats[referrerId] = {
          id: referrerId,
          name: referrerName,
          totalReferrals: 0,
          totalCommission: 0,
          accountType: (ref.referrerId as any).accountType
        };
      }
      
      referrerStats[referrerId].totalReferrals += 1;
      referrerStats[referrerId].totalCommission += 
        ref.commissionHistory.reduce((sum, c) => sum + c.amount, 0);
    });
    
    analytics.topReferrers = Object.values(referrerStats)
      .sort((a: any, b: any) => b.totalCommission - a.totalCommission)
      .slice(0, 10);
    
    // Calculate conversion rate (if we have purchase data available)
    const referredUserIds = filteredReferrals.map(r => r.referredUserId._id.toString());
    const ordersCount = await this.orderModel.countDocuments({
      userId: { $in: referredUserIds.map(id => new Types.ObjectId(id)) }
    });
    
    if (referredUserIds.length > 0) {
      analytics.conversionRate = (ordersCount / referredUserIds.length) * 100;
    }
    
    return analytics;
  }

  /**
   * Category Management
   */
  async getAllCategories() {
    return this.categoryModel.find().sort({ name: 1 }).exec();
  }

  async getCategoryById(categoryId: string) {
    const category = await this.categoryModel.findById(categoryId).exec();
    if (!category) {
      throw new NotFoundException(`Category with ID ${categoryId} not found`);
    }
    return category;
  }

  async createCategory(createDto: CreateCategoryDto) {
    // Check if the parent category exists if provided
    if (createDto.parentCategoryId) {
      const parentExists = await this.categoryModel.findById(createDto.parentCategoryId);
      if (!parentExists) {
        throw new NotFoundException(`Parent category with ID ${createDto.parentCategoryId} not found`);
      }
    }
    
    const newCategory = new this.categoryModel({
      ...createDto,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    return newCategory.save();
  }

  async updateCategory(categoryId: string, updateDto: UpdateCategoryDto) {
    // Check if the category exists
    const category = await this.categoryModel.findById(categoryId);
    if (!category) {
      throw new NotFoundException(`Category with ID ${categoryId} not found`);
    }
    
    // Check if the parent category exists if provided
    if (updateDto.parentCategoryId) {
      const parentExists = await this.categoryModel.findById(updateDto.parentCategoryId);
      if (!parentExists) {
        throw new NotFoundException(`Parent category with ID ${updateDto.parentCategoryId} not found`);
      }
      
      // Prevent circular reference
      if (updateDto.parentCategoryId === categoryId) {
        throw new BadRequestException('A category cannot be its own parent');
      }
    }
    
    return this.categoryModel.findByIdAndUpdate(
      categoryId,
      {
        ...updateDto,
        updatedAt: new Date()
      },
      { new: true }
    );
  }

  async deleteCategory(categoryId: string) {
    // Check if the category exists
    const category = await this.categoryModel.findById(categoryId);
    if (!category) {
      throw new NotFoundException(`Category with ID ${categoryId} not found`);
    }
    
    // Check if this category is used as a parent
    const hasChildren = await this.categoryModel.findOne({ parentCategoryId: categoryId });
    if (hasChildren) {
      throw new BadRequestException('Cannot delete a category that has child categories');
    }
    
    // Check if products are using this category
    const productsWithCategory = await this.productModel.findOne({ categoryId });
    if (productsWithCategory) {
      throw new BadRequestException('Cannot delete a category that is being used by products');
    }
    
    return this.categoryModel.findByIdAndDelete(categoryId);
  }

  /**
   * Price History Management
   */
  async getProductPriceHistory(productId: string) {
    const product = await this.productModel.findById(productId);
    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }
    
    return this.priceHistoryModel.find({ productId: new Types.ObjectId(productId) })
      .sort({ effectiveDate: -1 })
      .exec();
  }

  async addPriceHistory(priceHistoryDto: PriceHistoryDto, adminId: string) {
    const { productId, price, effectiveDate, reason } = priceHistoryDto;
    
    // Check if product exists
    const product = await this.productModel.findById(productId);
    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }
    
    // Create price history entry
    const priceHistory = new this.priceHistoryModel({
      productId: new Types.ObjectId(productId),
      oldPrice: product.price,
      newPrice: price,
      effectiveDate,
      reason,
      adminId: new Types.ObjectId(adminId),
      createdAt: new Date()
    });
    
    // Update product price
    await this.productModel.findByIdAndUpdate(
      productId,
      { 
        price,
        updatedAt: new Date()
      }
    );
    
    return priceHistory.save();
  }
}
