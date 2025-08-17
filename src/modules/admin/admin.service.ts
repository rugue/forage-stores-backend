import { Injectable, BadRequestException, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from '../users/entities/user.entity';
import { Wallet, WalletDocument } from '../wallets/entities/wallet.entity';
import { Order, OrderDocument } from '../orders/entities/order.entity';
import { Subscription, SubscriptionDocument } from '../subscriptions/entities/subscription.entity';
import { Referral, ReferralDocument } from '../referrals/entities/referral.entity';
import { Product, ProductDocument } from '../products/entities/product.entity';
import { ProfitPool, ProfitPoolDocument, ProfitPoolStatus } from '../profit-pool/entities/profit-pool.entity';
import { WithdrawalRequest, WithdrawalRequestDocument } from '../wallets/entities/withdrawal-request.entity';
import { 
  AdminWalletFundDto, 
  AdminWalletWipeDto, 
  CreateCategoryDto, 
  UpdateCategoryDto, 
  PriceHistoryDto,
  AnalyticsFilterDto,
  GetGrowthUsersByCityDto,
  AdminWithdrawalDecisionDto,
  BulkWithdrawalProcessingDto,
  OverrideReferralCommissionDto,
  CommissionOverrideHistoryDto,
  ProfitPoolAdjustmentDto,
  MonthlyProfitPoolReportDto,
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
    @InjectModel(ProfitPool.name) private profitPoolModel: Model<ProfitPoolDocument>,
    @InjectModel(WithdrawalRequest.name) private withdrawalRequestModel: Model<WithdrawalRequestDocument>,
    @InjectModel('Category') private categoryModel: Model<any>,
    @InjectModel('PriceHistory') private priceHistoryModel: Model<any>,
    @InjectModel('CommissionOverride') private commissionOverrideModel: Model<any>,
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

  /**
   * Growth Associates & Elite Management
   */
  async getGrowthUsersByCity(dto: GetGrowthUsersByCityDto) {
    const { city, role, page = 1, limit = 20 } = dto;
    const skip = (page - 1) * limit;

    // Build query for growth users in the city
    const query: any = {
      city: new RegExp(city, 'i'),
    };

    if (role) {
      query.role = role;
    } else {
      query.role = { $in: ['growth_associate', 'growth_elite'] };
    }

    const users = await this.userModel
      .find(query)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .exec();

    const total = await this.userModel.countDocuments(query);

    // Get stats for each user
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const referrals = await this.referralModel.find({ referrerId: user._id });
        const directReferralCount = referrals.length;

        // Calculate total spend of referred users
        const referredUserIds = referrals.map(ref => ref.referredUserId);
        const referredUsersOrders = await this.orderModel.find({
          userId: { $in: referredUserIds },
          status: 'completed'
        });

        const totalReferredSpend = referredUsersOrders.reduce(
          (sum, order) => sum + (order.totalAmount || 0), 0
        );

        // Calculate commission earned
        const totalCommissionEarned = referrals.reduce(
          (sum, ref) => sum + (ref.totalCommissionsEarned || 0), 0
        );

        // Active referrals this month
        const currentMonth = new Date();
        currentMonth.setDate(1);
        const activeReferralsThisMonth = await this.orderModel.countDocuments({
          userId: { $in: referredUserIds },
          createdAt: { $gte: currentMonth },
          status: 'completed'
        });

        return {
          userId: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          city: user.city,
          directReferralCount,
          totalReferredSpend,
          totalCommissionEarned,
          activeReferralsThisMonth,
          joinDate: user.createdAt,
          lastActivity: user.updatedAt || user.createdAt,
        };
      })
    );

    return {
      users: usersWithStats,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getGrowthUserDetailedStats(userId: string) {
    const user = await this.userModel.findById(userId);
    if (!user || !['growth_associate', 'growth_elite'].includes(user.role)) {
      throw new NotFoundException('Growth user not found');
    }

    const referrals = await this.referralModel
      .find({ referrerId: userId })
      .populate('referredUserId', 'name email createdAt')
      .sort({ createdAt: -1 });

    const referredUserIds = referrals.map(ref => ref.referredUserId);

    // Get detailed order stats
    const orders = await this.orderModel.find({
      userId: { $in: referredUserIds },
      status: 'completed'
    }).populate('userId', 'name email');

    const monthlyStats = await this.orderModel.aggregate([
      {
        $match: {
          userId: { $in: referredUserIds.map(id => new Types.ObjectId(id)) },
          status: 'completed',
          createdAt: { $gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          totalOrders: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' },
          avgOrderValue: { $avg: '$totalAmount' }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } }
    ]);

    return {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        city: user.city,
        joinDate: user.createdAt,
      },
      referralStats: {
        totalReferrals: referrals.length,
        totalCommissionEarned: referrals.reduce((sum, ref) => sum + (ref.totalCommissionsEarned || 0), 0),
        averageCommissionPerReferral: referrals.length > 0 
          ? referrals.reduce((sum, ref) => sum + (ref.totalCommissionsEarned || 0), 0) / referrals.length 
          : 0,
      },
      orderStats: {
        totalOrdersFromReferrals: orders.length,
        totalRevenueFromReferrals: orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0),
        averageOrderValue: orders.length > 0 
          ? orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0) / orders.length 
          : 0,
      },
      monthlyStats,
      recentReferrals: referrals.slice(0, 10),
    };
  }

  /**
   * Nibia Withdrawal Management
   */
  async getPendingWithdrawals(filters: { city?: string; priority?: number }) {
    const query: any = { status: 'pending' };

    if (filters.city) {
      // Find users in the city first
      const usersInCity = await this.userModel.find({ city: new RegExp(filters.city, 'i') });
      const userIds = usersInCity.map(user => user._id);
      query.userId = { $in: userIds };
    }

    if (filters.priority) {
      query.priority = filters.priority;
    }

    return this.withdrawalRequestModel
      .find(query)
      .populate('userId', 'name email city role')
      .sort({ priority: 1, createdAt: 1 })
      .exec();
  }

  async processWithdrawalDecision(withdrawalId: string, dto: AdminWithdrawalDecisionDto, adminId: string) {
    // Verify admin password
    const admin = await this.userModel.findById(adminId);
    if (!admin || !await bcrypt.compare(dto.adminPassword, admin.password)) {
      throw new UnauthorizedException('Invalid admin password');
    }

    const withdrawal = await this.withdrawalRequestModel.findById(withdrawalId);
    if (!withdrawal) {
      throw new NotFoundException('Withdrawal request not found');
    }

    if (withdrawal.status !== 'pending') {
      throw new BadRequestException('Withdrawal request is not in pending status');
    }

    const updateData: any = {
      status: dto.action === 'approve' ? 'approved' : 'rejected',
      processedBy: new Types.ObjectId(adminId),
      processedAt: new Date(),
      adminNotes: dto.adminNotes,
      priority: dto.priority || withdrawal.priority,
    };

    if (dto.action === 'approve') {
      // Check user's Nibia balance
      const wallet = await this.walletModel.findOne({ userId: withdrawal.userId });
      if (!wallet || wallet.foodPoints < withdrawal.nibiaAmount) {
        throw new BadRequestException('Insufficient Nibia balance');
      }

      await this.walletModel.findOneAndUpdate(
        { userId: withdrawal.userId },
        { 
          $inc: { foodPoints: -withdrawal.nibiaAmount },
          updatedAt: new Date()
        }
      );
    }

    return this.withdrawalRequestModel.findByIdAndUpdate(withdrawalId, updateData, { new: true });
  }

  async bulkProcessWithdrawals(dto: BulkWithdrawalProcessingDto, adminId: string) {
    // Verify admin password
    const admin = await this.userModel.findById(adminId);
    if (!admin || !await bcrypt.compare(dto.adminPassword, admin.password)) {
      throw new UnauthorizedException('Invalid admin password');
    }

    const withdrawals = await this.withdrawalRequestModel.find({
      _id: { $in: dto.withdrawalIds.map(id => new Types.ObjectId(id)) },
      status: 'pending'
    });

    if (withdrawals.length === 0) {
      throw new BadRequestException('No valid pending withdrawals found');
    }

    const results = [];

    for (const withdrawal of withdrawals) {
        try {
          if (dto.action === 'approve') {
            // Check user's Nibia balance
            const wallet = await this.walletModel.findOne({ userId: withdrawal.userId });
            if (!wallet || wallet.foodPoints < withdrawal.nibiaAmount) {
              results.push({
                withdrawalId: withdrawal._id,
                success: false,
                error: 'Insufficient Nibia balance'
              });
              continue;
            }

            // Deduct from balance
            await this.walletModel.findOneAndUpdate(
              { userId: withdrawal.userId },
              { 
                $inc: { foodPoints: -withdrawal.nibiaAmount },
                updatedAt: new Date()
              }
            );
          }        // Update withdrawal status
        await this.withdrawalRequestModel.findByIdAndUpdate(withdrawal._id, {
          status: dto.action === 'approve' ? 'approved' : 'rejected',
          processedBy: new Types.ObjectId(adminId),
          processedAt: new Date(),
          adminNotes: dto.bulkNotes,
        });

        results.push({
          withdrawalId: withdrawal._id,
          success: true,
          action: dto.action
        });
      } catch (error) {
        results.push({
          withdrawalId: withdrawal._id,
          success: false,
          error: error.message
        });
      }
    }

    return {
      processed: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results
    };
  }

  /**
   * Referral Commission Override
   */
  async overrideReferralCommission(dto: OverrideReferralCommissionDto, adminId: string) {
    // Verify admin password
    const admin = await this.userModel.findById(adminId);
    if (!admin || !await bcrypt.compare(dto.adminPassword, admin.password)) {
      throw new UnauthorizedException('Invalid admin password');
    }

    const referral = await this.referralModel.findById(dto.referralId);
    if (!referral) {
      throw new NotFoundException('Referral not found');
    }

    const originalAmount = referral.totalCommissionsEarned;
    const difference = dto.newCommissionAmount - originalAmount;

    // Update referral commission
    await this.referralModel.findByIdAndUpdate(dto.referralId, {
      totalCommissionsEarned: dto.newCommissionAmount,
      isOverridden: true,
      overrideHistory: {
        originalAmount,
        newAmount: dto.newCommissionAmount,
        difference,
        overrideType: dto.overrideType,
        reason: dto.reason,
        adminNotes: dto.adminNotes,
        overriddenBy: new Types.ObjectId(adminId),
        overriddenAt: new Date(),
      }
    });

    // Update user's wallet balance
    if (difference !== 0) {
      await this.walletModel.findOneAndUpdate(
        { userId: referral.referrerId },
        { 
          $inc: { foodPoints: difference },
          updatedAt: new Date()
        }
      );
    }

    // Log override action
    const overrideLog = new this.commissionOverrideModel({
      referralId: new Types.ObjectId(dto.referralId),
      userId: referral.referrerId,
      originalAmount,
      newAmount: dto.newCommissionAmount,
      difference,
      overrideType: dto.overrideType,
      reason: dto.reason,
      adminNotes: dto.adminNotes,
      adminId: new Types.ObjectId(adminId),
      createdAt: new Date(),
    });

    await overrideLog.save();

    return {
      referralId: dto.referralId,
      originalAmount,
      newAmount: dto.newCommissionAmount,
      difference,
      overrideType: dto.overrideType,
      processedAt: new Date(),
    };
  }

  async getCommissionOverrideHistory(dto: CommissionOverrideHistoryDto) {
    const query: any = {};

    if (dto.userId) {
      query.userId = new Types.ObjectId(dto.userId);
    }

    if (dto.overrideType) {
      query.overrideType = dto.overrideType;
    }

    if (dto.startDate || dto.endDate) {
      query.createdAt = {};
      if (dto.startDate) query.createdAt.$gte = dto.startDate;
      if (dto.endDate) query.createdAt.$lte = dto.endDate;
    }

    return this.commissionOverrideModel
      .find(query)
      .populate('userId', 'name email')
      .populate('adminId', 'name email')
      .sort({ createdAt: -1 })
      .exec();
  }

  async getReferralCommissionHistory(referralId: string) {
    const referral = await this.referralModel.findById(referralId)
      .populate('referrerId', 'name email')
      .populate('referredUserId', 'name email');

    if (!referral) {
      throw new NotFoundException('Referral not found');
    }

    const overrideHistory = await this.commissionOverrideModel
      .find({ referralId: new Types.ObjectId(referralId) })
      .populate('adminId', 'name email')
      .sort({ createdAt: -1 });

    return {
      referral,
      overrideHistory,
    };
  }

    /**
   * Profit Pool Management
   * TODO: Implement these methods when ProfitPool service is ready
   */
  async getAllProfitPools(filters: { city?: string; status?: string }) {
    // Placeholder - will implement when ProfitPool service is ready
    return { message: 'Profit pool management not yet implemented', filters };
  }

  async getProfitPoolDetails(poolId: string) {
    const pool = await this.profitPoolModel.findById(poolId);
    if (!pool) {
      throw new NotFoundException('Profit pool not found');
    }

    // Get user details for distributed recipients
    const distributionDetails = await Promise.all(
      pool.distributedTo.map(async (distribution: any) => {
        const user = await this.userModel.findById(distribution.userId).select('email name city role');
        return {
          ...distribution,
          user: user ? {
            email: user.email,
            name: user.name,
            city: user.city,
            role: user.role,
          } : null,
        };
      })
    );

    return {
      ...pool.toObject(),
      distributionDetails,
      calculatedMetrics: {
        percentageDistributed: pool.poolAmount > 0 ? (pool.totalDistributed / pool.poolAmount) * 100 : 0,
        remainingAmount: pool.poolAmount - pool.totalDistributed,
        averageAmountPerRecipient: pool.distributedTo.length > 0 ? pool.totalDistributed / pool.distributedTo.length : 0,
      },
    };
  }

  async adjustProfitPool(poolId: string, dto: ProfitPoolAdjustmentDto, adminId: string) {
    // Verify admin password
    const admin = await this.userModel.findById(adminId);
    if (!admin || !await bcrypt.compare(dto.adminPassword, admin.password)) {
      throw new UnauthorizedException('Invalid admin password');
    }

    const pool = await this.profitPoolModel.findById(poolId);
    if (!pool) {
      throw new NotFoundException('Profit pool not found');
    }

    const originalAmount = pool.poolAmount;
    let adjustmentAmount = dto.adjustmentAmount || 0;

    switch (dto.adjustmentType) {
      case 'increase':
        pool.poolAmount += adjustmentAmount;
        break;
      case 'decrease':
        if (adjustmentAmount > pool.poolAmount) {
          throw new BadRequestException('Adjustment amount exceeds pool total');
        }
        pool.poolAmount -= adjustmentAmount;
        break;
      case 'redistribute':
        // Reset distributions and recalculate
        pool.totalDistributed = 0;
        pool.distributedTo = [];
        pool.status = ProfitPoolStatus.CALCULATED; // Reset to calculated status
        break;
    }

    // Add admin metadata if the field supports it
    if (pool.metadata && typeof pool.metadata === 'object') {
      const metadata = pool.metadata as any;
      if (!metadata.adminActions) {
        metadata.adminActions = [];
      }
      metadata.adminActions.push({
        action: `${dto.adjustmentType}_adjustment`,
        adminId,
        timestamp: new Date(),
        originalAmount,
        newAmount: pool.poolAmount,
        adjustmentAmount,
        reason: dto.reason,
      });
    }

    await pool.save();

    return {
      poolId,
      adjustmentType: dto.adjustmentType,
      originalAmount,
      newAmount: pool.poolAmount,
      adjustmentAmount,
      processedAt: new Date(),
      reason: dto.reason,
    };
  }

  async getMonthlyProfitPoolReport(dto: MonthlyProfitPoolReportDto) {
    const [year, month] = dto.month.split('-').map(Number);
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const query: any = {
      createdAt: { $gte: startDate, $lte: endDate }
    };

    if (dto.city) {
      query.city = new RegExp(dto.city, 'i');
    }

    const pools = await this.profitPoolModel.find(query).sort({ createdAt: -1 });

    const summary = {
      totalPools: pools.length,
      totalAmount: pools.reduce((sum, pool) => sum + pool.poolAmount, 0),
      totalDistributed: pools.reduce((sum, pool) => sum + pool.totalDistributed, 0),
      totalRemaining: pools.reduce((sum, pool) => sum + (pool.poolAmount - pool.totalDistributed), 0),
      completedPools: pools.filter(pool => pool.status === ProfitPoolStatus.DISTRIBUTED).length,
      pendingPools: pools.filter(pool => pool.status === ProfitPoolStatus.CALCULATED).length,
    };

    const result: any = {
      month: dto.month,
      summary,
      pools: dto.includeDetails ? pools : undefined,
    };

    if (dto.includeDetails) {
      // Group by city for detailed breakdown
      result.cityBreakdown = {};
      pools.forEach(pool => {
        if (!result.cityBreakdown[pool.city]) {
          result.cityBreakdown[pool.city] = {
            totalAmount: 0,
            distributedAmount: 0,
            poolsCount: 0,
          };
        }
        result.cityBreakdown[pool.city].totalAmount += pool.poolAmount;
        result.cityBreakdown[pool.city].distributedAmount += pool.totalDistributed;
        result.cityBreakdown[pool.city].poolsCount++;
      });
    }

    return result;
  }

  async redistributeProfitPool(poolId: string, adminPassword: string, adminId: string) {
    // Verify admin password
    const admin = await this.userModel.findById(adminId);
    if (!admin || !await bcrypt.compare(adminPassword, admin.password)) {
      throw new UnauthorizedException('Invalid admin password');
    }

    const pool = await this.profitPoolModel.findById(poolId);
    if (!pool) {
      throw new NotFoundException('Profit pool not found');
    }

    // Reset the pool for redistribution
    const originalDistributedAmount = pool.totalDistributed;
    const originalDistributedTo = [...pool.distributedTo];
    
    pool.totalDistributed = 0;
    pool.distributedTo = [];
    pool.status = ProfitPoolStatus.CALCULATED; // Reset to calculated status

    // Add admin metadata for audit trail
    if (pool.metadata && typeof pool.metadata === 'object') {
      const metadata = pool.metadata as any;
      if (!metadata.adminActions) {
        metadata.adminActions = [];
      }
      metadata.adminActions.push({
        action: 'redistribute',
        adminId,
        timestamp: new Date(),
        originalDistributedAmount,
        originalDistributedTo: originalDistributedTo.length,
        reason: 'Admin triggered redistribution',
      });
    }

    await pool.save();

    return {
      poolId,
      message: 'Profit pool prepared for redistribution',
      originalDistributedAmount,
      originalRecipientsCount: originalDistributedTo.length,
      resetAt: new Date(),
    };
  }
}
