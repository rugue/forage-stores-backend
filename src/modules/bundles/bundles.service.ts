import { Injectable, BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { 
  Bundle, 
  BundleDocument, 
  BundleType, 
  BundleStatus, 
  SeasonalType,
  BundleProduct,
} from './entities/bundle.entity';
import { 
  BundleOrder, 
  BundleOrderDocument, 
  BundleOrderStatus,
  GiftDeliveryStatus,
} from './entities/bundle-order.entity';
import { Product, ProductDocument } from '../products/entities/product.entity';
import { User, UserDocument } from '../users/entities/user.entity';
import { 
  CreateBundleDto, 
  UpdateBundleDto, 
  BundleFilterDto, 
  OrderBundleDto,
  BundleAnalyticsDto,
  SeasonalControlDto,
} from './dto/bundle.dto';
import { 
  BUNDLE_CONSTANTS, 
  BUNDLE_TEMPLATES, 
  SEASONAL_CONFIGS, 
  BUNDLE_CALCULATOR,
  BUNDLE_MESSAGES,
} from './constants/bundle.constants';
import {
  BundleAnalytics,
  IBundleValidation,
  SeasonalAnalytics,
} from './interfaces/bundle.interface';
import { NotificationsService } from '../notifications/notifications.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Cache } from 'cache-manager';
import { Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

@Injectable()
export class BundlesService {
  constructor(
    @InjectModel(Bundle.name) private bundleModel: Model<BundleDocument>,
    @InjectModel(BundleOrder.name) private bundleOrderModel: Model<BundleOrderDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private notificationsService: NotificationsService,
    private eventEmitter: EventEmitter2,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  /**
   * Create a new bundle
   */
  async createBundle(createBundleDto: CreateBundleDto, adminId: string): Promise<Bundle> {
    // Validate admin permissions
    const admin = await this.userModel.findById(adminId);
    if (!admin || admin.role !== 'admin') {
      throw new UnauthorizedException('Only admins can create bundles');
    }

    // Validate products exist and calculate pricing
    const productValidation = await this.validateBundleProducts(createBundleDto.products);
    
    // Calculate bundle pricing
    const calculatedPricing = await this.calculateBundlePricing(
      createBundleDto.products,
      createBundleDto.pricing.discountPercentage || 0
    );

    // Create bundle
    const bundle = new this.bundleModel({
      ...createBundleDto,
      pricing: {
        basePrice: calculatedPricing.basePrice,
        priceInNibia: calculatedPricing.priceInNibia,
        discountPercentage: createBundleDto.pricing.discountPercentage || 0,
        discountedPrice: calculatedPricing.discountedPrice,
        savingsAmount: calculatedPricing.savingsAmount,
      },
      products: productValidation.validatedProducts,
      createdBy: new Types.ObjectId(adminId),
      giftSettings: createBundleDto.giftSettings || {
        canBeGifted: false,
        giftWrappingAvailable: false,
      },
    });

    const savedBundle = await bundle.save();

    // Emit bundle creation event
    this.eventEmitter.emit('bundle.created', {
      bundleId: savedBundle._id,
      bundleType: savedBundle.type,
      adminId,
    });

    // Clear relevant caches
    await this.clearBundleCache(savedBundle.type);

    return savedBundle;
  }

  /**
   * Get all bundles with filtering
   */
  async getAllBundles(filterDto: BundleFilterDto): Promise<{
    bundles: Bundle[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const cacheKey = `bundles:${JSON.stringify(filterDto)}`;
    
    // Try to get from cache first
    const cachedResult = await this.cacheManager.get(cacheKey);
    if (cachedResult) {
      return cachedResult as any;
    }

    const {
      bundleType,
      status,
      city,
      seasonalType,
      search,
      page = 1,
      limit = BUNDLE_CONSTANTS.DEFAULT_PAGE_SIZE,
    } = filterDto;

    // Build query
    const query: any = {};

    if (bundleType) query.type = bundleType;
    if (status) query.status = status;
    if (city) query.availableCities = { $in: [city] };
    if (seasonalType) query['seasonalAvailability.seasonalType'] = seasonalType;

    // Search filter
    if (search) {
      query.$text = { $search: search };
    }

    const skip = (page - 1) * limit;
    
    const [bundles, total] = await Promise.all([
      this.bundleModel
        .find(query)
        .populate('products.productId', 'name price priceInNibia stock images category')
        .populate('createdBy', 'name email')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .exec(),
      this.bundleModel.countDocuments(query),
    ]);

    const result = {
      bundles,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };

    // Cache the result
    const cacheTTL = seasonalType ? BUNDLE_CONSTANTS.SEASONAL_BUNDLE_CACHE_TTL : BUNDLE_CONSTANTS.BUNDLE_CACHE_TTL;
    await this.cacheManager.set(cacheKey, result, cacheTTL);

    return result;
  }

  /**
   * Get bundle by ID
   */
  async getBundleById(id: string): Promise<Bundle> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid bundle ID');
    }

    const cacheKey = `bundle:${id}`;
    const cachedBundle = await this.cacheManager.get(cacheKey);
    if (cachedBundle) {
      return cachedBundle as Bundle;
    }

    const bundle = await this.bundleModel
      .findById(id)
      .populate('products.productId', 'name price priceInNibia stock images category')
      .populate('createdBy', 'name email')
      .exec();

    if (!bundle) {
      throw new NotFoundException('Bundle not found');
    }

    // Check if bundle is currently available
    const isAvailable = await this.isBundleAvailable(bundle);
    if (!isAvailable) {
      throw new BadRequestException('Bundle is not currently available');
    }

    await this.cacheManager.set(cacheKey, bundle, BUNDLE_CONSTANTS.BUNDLE_CACHE_TTL);
    return bundle;
  }

  /**
   * Update bundle
   */
  async updateBundle(id: string, updateBundleDto: UpdateBundleDto, adminId: string): Promise<Bundle> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid bundle ID');
    }

    // Validate admin permissions
    const admin = await this.userModel.findById(adminId);
    if (!admin || admin.role !== 'admin') {
      throw new UnauthorizedException('Only admins can update bundles');
    }

    const bundle = await this.bundleModel.findById(id);
    if (!bundle) {
      throw new NotFoundException('Bundle not found');
    }

    // If products are being updated, validate them
    if (updateBundleDto.products) {
      await this.validateBundleProducts(updateBundleDto.products);
    }

    // If pricing is being updated, recalculate
    if (updateBundleDto.pricing) {
      const calculatedPricing = await this.calculateBundlePricing(
        updateBundleDto.products || bundle.products,
        updateBundleDto.pricing.discountPercentage || 0
      );
      updateBundleDto.pricing = calculatedPricing;
    }

    const updatedBundle = await this.bundleModel
      .findByIdAndUpdate(
        id,
        { 
          ...updateBundleDto, 
          updatedBy: new Types.ObjectId(adminId),
        },
        { new: true }
      )
      .populate('products.productId', 'name price priceInNibia stock images category')
      .exec();

    // Emit bundle update event
    this.eventEmitter.emit('bundle.updated', {
      bundleId: id,
      bundleType: updatedBundle.type,
      adminId,
      changes: updateBundleDto,
    });

    // Clear caches
    await this.clearBundleCache(updatedBundle.type, id);

    return updatedBundle;
  }

  /**
   * Delete bundle
   */
  async deleteBundle(id: string, adminId: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid bundle ID');
    }

    // Validate admin permissions
    const admin = await this.userModel.findById(adminId);
    if (!admin || admin.role !== 'admin') {
      throw new UnauthorizedException('Only admins can delete bundles');
    }

    const bundle = await this.bundleModel.findById(id);
    if (!bundle) {
      throw new NotFoundException('Bundle not found');
    }

    // Check if bundle has active orders
    const activeOrders = await this.bundleOrderModel.countDocuments({
      bundleId: new Types.ObjectId(id),
      status: { $in: [BundleOrderStatus.PENDING, BundleOrderStatus.CONFIRMED, BundleOrderStatus.PROCESSING] },
    });

    if (activeOrders > 0) {
      throw new BadRequestException('Cannot delete bundle with active orders. Cancel or complete orders first.');
    }

    await this.bundleModel.findByIdAndDelete(id);

    // Emit bundle deletion event
    this.eventEmitter.emit('bundle.deleted', {
      bundleId: id,
      bundleType: bundle.type,
      adminId,
    });

    // Clear caches
    await this.clearBundleCache(bundle.type, id);
  }

  /**
   * Order a bundle
   */
  async orderBundle(orderBundleDto: OrderBundleDto, userId: string): Promise<BundleOrder> {
    const { bundleId, quantity, isGift, recipientInfo, giftMessage, includeGiftWrapping, specialInstructions } = orderBundleDto;

    // Validate bundle exists and is available
    const bundle = await this.getBundleById(bundleId);
    
    // Validate user
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check bundle availability for user
    await this.validateBundleOrderEligibility(bundle, user, quantity);

    // Validate stock availability for all products in bundle
    await this.validateBundleStock(bundle, quantity);

    // Calculate total cost
    const totalAmount = bundle.pricing.discountedPrice * quantity;
    const totalAmountInNibia = bundle.pricing.priceInNibia * quantity;

    // Add gift wrapping fee if requested
    let giftWrappingFee = 0;
    if (includeGiftWrapping && bundle.giftSettings.giftWrappingAvailable) {
      giftWrappingFee = (bundle.giftSettings.giftWrappingFee || BUNDLE_CONSTANTS.GIFT_WRAPPING_BASE_FEE) * quantity;
    }

    // Create bundle order
    const bundleOrder = new this.bundleOrderModel({
      bundleId: new Types.ObjectId(bundleId),
      userId: new Types.ObjectId(userId),
      quantity,
      totalAmount: totalAmount + giftWrappingFee,
      totalAmountInNibia,
      isGift: isGift || false,
      recipientInfo,
      giftMessage,
      specialInstructions,
      status: bundle.requiresAdminApproval ? BundleOrderStatus.PENDING : BundleOrderStatus.CONFIRMED,
      giftDeliveryStatus: isGift ? GiftDeliveryStatus.PENDING : undefined,
    });

    const savedOrder = await bundleOrder.save();

    // Reserve stock for bundle products
    await this.reserveBundleStock(bundle, quantity);

    // Update bundle statistics
    await this.updateBundleStats(bundleId, quantity, totalAmount);

    // Emit bundle order event
    this.eventEmitter.emit('bundle.ordered', {
      bundleOrderId: savedOrder._id,
      bundleId,
      userId,
      quantity,
      totalAmount,
      isGift,
    });

    // Send notifications
    if (isGift && recipientInfo) {
      await this.sendGiftNotification(savedOrder);
    }

    if (bundle.requiresAdminApproval) {
      await this.notifyAdminsForApproval(savedOrder);
    }

    return savedOrder;
  }

  /**
   * Create bundle templates for predefined types
   */
  async createBundleTemplates(adminId: string): Promise<Bundle[]> {
    const admin = await this.userModel.findById(adminId);
    if (!admin || admin.role !== 'admin') {
      throw new UnauthorizedException('Only admins can create bundle templates');
    }

    const templates = [];

    for (const [bundleType, template] of Object.entries(BUNDLE_TEMPLATES)) {
      // Check if template already exists
      const existingBundle = await this.bundleModel.findOne({ 
        type: bundleType,
        createdBy: new Types.ObjectId(adminId),
      });

      if (existingBundle) {
        console.log(`Bundle template ${bundleType} already exists, skipping...`);
        continue;
      }

      // Get products for this template based on categories
      const bundleProducts = await this.getProductsForTemplate([...template.defaultProducts]);

      if (bundleProducts.length < BUNDLE_CONSTANTS.MIN_PRODUCTS_PER_BUNDLE) {
        console.log(`Not enough products found for ${bundleType} template, skipping...`);
        continue;
      }

      // Create bundle
      const bundleData = {
        name: template.name,
        description: template.description,
        type: bundleType as BundleType,
        status: BundleStatus.ACTIVE,
        products: bundleProducts,
        pricing: {
          basePrice: template.basePrice,
          discountPercentage: template.discountPercentage,
        },
        giftSettings: {
          canBeGifted: template.canBeGifted,
          giftMessageTemplate: template.giftMessageTemplate,
          giftWrappingAvailable: template.canBeGifted,
          giftWrappingFee: template.canBeGifted ? BUNDLE_CONSTANTS.GIFT_WRAPPING_BASE_FEE : undefined,
        },
        availableCities: ['Lagos', 'Abuja', 'Port Harcourt', 'Kano'], // Default cities
        tags: template.tags,
      };

      // Add seasonal availability for seasonal bundles
      const templateWithSeasonal = template as any;
      if (templateWithSeasonal.seasonalType) {
        const currentYear = new Date().getFullYear();
        const seasonalConfig = SEASONAL_CONFIGS[templateWithSeasonal.seasonalType];
        
        bundleData['seasonalAvailability'] = {
          seasonalType: templateWithSeasonal.seasonalType,
          startDate: new Date(currentYear, seasonalConfig.startMonth - 1, seasonalConfig.startDay),
          endDate: new Date(currentYear, seasonalConfig.endMonth - 1, seasonalConfig.endDay),
          year: currentYear,
          isCurrentlyActive: false, // Will be calculated by pre-save middleware
        };
      }

      const bundle = await this.createBundle(bundleData as any, adminId);
      templates.push(bundle);
    }

    return templates;
  }

  /**
   * Activate/deactivate seasonal bundles
   */
  async controlSeasonalBundles(controlDto: SeasonalControlDto, adminId: string): Promise<{
    updated: number;
    bundles: Bundle[];
  }> {
    const admin = await this.userModel.findById(adminId);
    if (!admin || admin.role !== 'admin') {
      throw new UnauthorizedException('Only admins can control seasonal bundles');
    }

    const { seasonalType, year, activate } = controlDto;

    // Find all bundles of this seasonal type
    const bundles = await this.bundleModel.find({
      'seasonalAvailability.seasonalType': seasonalType,
      'seasonalAvailability.year': year,
    });

    if (bundles.length === 0) {
      throw new NotFoundException(`No ${seasonalType} bundles found for year ${year}`);
    }

    // Update seasonal availability
    const seasonalConfig = SEASONAL_CONFIGS[seasonalType];
    const updates = {
      'seasonalAvailability.isCurrentlyActive': activate,
      status: activate ? BundleStatus.SEASONAL : BundleStatus.INACTIVE,
    };

    if (activate) {
      // Set dates for the season
      updates['seasonalAvailability.startDate'] = new Date(year, seasonalConfig.startMonth - 1, seasonalConfig.startDay);
      updates['seasonalAvailability.endDate'] = new Date(year, seasonalConfig.endMonth - 1, seasonalConfig.endDay);
    }

    const result = await this.bundleModel.updateMany(
      {
        'seasonalAvailability.seasonalType': seasonalType,
        'seasonalAvailability.year': year,
      },
      { $set: updates }
    );

    // Get updated bundles
    const updatedBundles = await this.bundleModel.find({
      'seasonalAvailability.seasonalType': seasonalType,
      'seasonalAvailability.year': year,
    }).populate('products.productId', 'name price priceInNibia');

    // Emit seasonal control event
    this.eventEmitter.emit('bundle.seasonal.controlled', {
      seasonalType,
      year,
      activate,
      bundleCount: result.modifiedCount,
      adminId,
    });

    // Clear caches
    await this.clearSeasonalBundleCache(seasonalType);

    return {
      updated: result.modifiedCount,
      bundles: updatedBundles,
    };
  }

  /**
   * Get bundle analytics
   */
  async getBundleAnalytics(analyticsDto: BundleAnalyticsDto): Promise<any> {
    const { startDate, endDate, bundleType, city } = analyticsDto;

    const matchStage: any = {};
    
    if (startDate && endDate) {
      matchStage.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    if (bundleType) {
      matchStage.type = bundleType;
    }

    // Analytics aggregation pipeline
    const analytics = await this.bundleModel.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalBundles: { $sum: 1 },
          totalRevenue: { $sum: '$totalRevenue' },
          totalPurchases: { $sum: '$purchaseCount' },
          avgBundlePrice: { $avg: '$pricing.discountedPrice' },
          bundles: { $push: '$$ROOT' },
        },
      },
      {
        $project: {
          totalBundles: 1,
          totalRevenue: 1,
          totalPurchases: 1,
          avgBundlePrice: { $round: ['$avgBundlePrice', 2] },
          topBundles: {
            $slice: [
              {
                $sortArray: {
                  input: '$bundles',
                  sortBy: { purchaseCount: -1 },
                },
              },
              5,
            ],
          },
        },
      },
    ]);

    // Bundle type analytics
    const typeAnalytics = await this.bundleModel.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          revenue: { $sum: '$totalRevenue' },
          purchases: { $sum: '$purchaseCount' },
        },
      },
      { $sort: { revenue: -1 } },
    ]);

    // City analytics
    const cityAnalytics = await this.bundleOrderModel.aggregate([
      ...(city ? [{ $match: { 'recipientInfo.city': city } }] : []),
      {
        $lookup: {
          from: 'bundles',
          localField: 'bundleId',
          foreignField: '_id',
          as: 'bundle',
        },
      },
      { $unwind: '$bundle' },
      {
        $group: {
          _id: '$recipientInfo.city',
          orderCount: { $sum: 1 },
          revenue: { $sum: '$totalAmount' },
        },
      },
      { $sort: { revenue: -1 } },
    ]);

    return {
      overview: analytics[0] || {
        totalBundles: 0,
        totalRevenue: 0,
        totalPurchases: 0,
        avgBundlePrice: 0,
        topBundles: [],
      },
      byType: typeAnalytics,
      byCity: cityAnalytics,
    };
  }

  /**
   * Process gift delivery for Send Food bundles
   */
  async processGiftDelivery(bundleOrderId: string, adminId: string): Promise<BundleOrder> {
    const admin = await this.userModel.findById(adminId);
    if (!admin || admin.role !== 'admin') {
      throw new UnauthorizedException('Only admins can process gift deliveries');
    }

    const bundleOrder = await this.bundleOrderModel
      .findById(bundleOrderId)
      .populate('bundleId')
      .populate('userId', 'name email phone')
      .exec();

    if (!bundleOrder) {
      throw new NotFoundException('Bundle order not found');
    }

    if (!bundleOrder.isGift) {
      throw new BadRequestException('This is not a gift order');
    }

    // Update gift delivery status
    bundleOrder.giftDeliveryStatus = GiftDeliveryStatus.GIFT_MESSAGE_SENT;
    await bundleOrder.save();

    // Send gift notification to recipient
    if (bundleOrder.recipientInfo && bundleOrder.giftMessage) {
      await this.notificationsService.sendEmail({
        type: 'GENERAL' as any,
        title: 'Gift Bundle Delivered',
        message: bundleOrder.giftMessage.message || (bundleOrder.bundleId as any).giftSettings?.giftMessageTemplate,
        recipientEmail: bundleOrder.recipientInfo.email,
        metadata: {
          senderName: bundleOrder.giftMessage.senderName,
          bundleName: (bundleOrder.bundleId as any).name,
        },
      });

      // Update status to recipient notified
      bundleOrder.giftDeliveryStatus = GiftDeliveryStatus.RECIPIENT_NOTIFIED;
      await bundleOrder.save();
    }

    // Emit gift delivery event
    this.eventEmitter.emit('bundle.gift.processed', {
      bundleOrderId: bundleOrder._id,
      recipientEmail: bundleOrder.recipientInfo?.email,
      senderName: bundleOrder.giftMessage?.senderName,
      adminId,
    });

    return bundleOrder;
  }

  /**
   * Private helper methods
   */
  private async validateBundleProducts(products: any[]): Promise<{
    validatedProducts: BundleProduct[];
    totalValue: number;
  }> {
    if (products.length < BUNDLE_CONSTANTS.MIN_PRODUCTS_PER_BUNDLE) {
      throw new BadRequestException(`Bundle must contain at least ${BUNDLE_CONSTANTS.MIN_PRODUCTS_PER_BUNDLE} products`);
    }

    if (products.length > BUNDLE_CONSTANTS.MAX_PRODUCTS_PER_BUNDLE) {
      throw new BadRequestException(`Bundle cannot contain more than ${BUNDLE_CONSTANTS.MAX_PRODUCTS_PER_BUNDLE} products`);
    }

    const validatedProducts: BundleProduct[] = [];
    let totalValue = 0;

    for (const productDto of products) {
      const product = await this.productModel.findById(productDto.productId);
      if (!product) {
        throw new NotFoundException(`Product ${productDto.productId} not found`);
      }

      if (!product.isActive) {
        throw new BadRequestException(`Product ${product.name} is not active`);
      }

      if (product.stock < productDto.quantity) {
        throw new BadRequestException(`Insufficient stock for product ${product.name}`);
      }

      validatedProducts.push({
        productId: new Types.ObjectId(productDto.productId),
        quantity: productDto.quantity,
        isRequired: productDto.isRequired !== false,
        alternatives: productDto.alternatives?.map(alt => new Types.ObjectId(alt)) || [],
      });

      totalValue += product.price * productDto.quantity;
    }

    return { validatedProducts, totalValue };
  }

  private async calculateBundlePricing(products: any[], discountPercentage: number = 0): Promise<{
    basePrice: number;
    priceInNibia: number;
    discountedPrice: number;
    savingsAmount: number;
  }> {
    let basePrice = 0;

    for (const productInfo of products) {
      const product = await this.productModel.findById(productInfo.productId);
      if (product) {
        basePrice += product.price * productInfo.quantity;
      }
    }

    const discountedPrice = BUNDLE_CALCULATOR.calculateDiscountedPrice(basePrice, discountPercentage);
    const savingsAmount = BUNDLE_CALCULATOR.calculateSavings(basePrice, discountedPrice);
    const priceInNibia = BUNDLE_CALCULATOR.calculateNibiaPrice(discountedPrice);

    return {
      basePrice,
      priceInNibia,
      discountedPrice,
      savingsAmount,
    };
  }

  private async getProductsForTemplate(productRequirements: any[]): Promise<BundleProduct[]> {
    const bundleProducts: BundleProduct[] = [];

    for (const requirement of productRequirements) {
      const products = await this.productModel
        .find({ 
          category: requirement.category, 
          isActive: true,
          stock: { $gte: requirement.minQuantity },
        })
        .limit(1)
        .exec();

      if (products.length > 0) {
        bundleProducts.push({
          productId: (products[0] as any)._id,
          quantity: requirement.minQuantity,
          isRequired: true,
          alternatives: [],
        });
      }
    }

    return bundleProducts;
  }

  private async isBundleAvailable(bundle: Bundle): Promise<boolean> {
    const now = new Date();

    // Check general availability dates
    if (bundle.availableFrom && now < bundle.availableFrom) {
      return false;
    }

    if (bundle.availableUntil && now > bundle.availableUntil) {
      return false;
    }

    // Check seasonal availability
    if (bundle.seasonalAvailability) {
      return bundle.seasonalAvailability.isCurrentlyActive;
    }

    // Check status
    return bundle.status === BundleStatus.ACTIVE || bundle.status === BundleStatus.SEASONAL;
  }

  private async validateBundleOrderEligibility(bundle: Bundle, user: User, quantity: number): Promise<void> {
    // Check max order quantity
    if (bundle.maxOrderQuantity && quantity > bundle.maxOrderQuantity) {
      throw new BadRequestException(`Maximum ${bundle.maxOrderQuantity} bundles allowed per order`);
    }

    // Check minimum order history
    if (bundle.minOrderHistory && bundle.minOrderHistory > 0) {
      const userOrderCount = await this.bundleOrderModel.countDocuments({
        userId: (user as any)._id,
        status: BundleOrderStatus.DELIVERED,
      });

      if (userOrderCount < bundle.minOrderHistory) {
        throw new BadRequestException(`Minimum ${bundle.minOrderHistory} completed orders required`);
      }
    }

    // Staff Gift Box requires admin approval
    if (bundle.type === BundleType.STAFF_GIFT_BOX && user.role !== 'admin') {
      throw new BadRequestException('Staff Gift Box bundles require admin approval');
    }
  }

  private async validateBundleStock(bundle: Bundle, orderQuantity: number): Promise<void> {
    for (const bundleProduct of bundle.products) {
      const product = await this.productModel.findById(bundleProduct.productId);
      if (!product) {
        throw new NotFoundException(`Product in bundle not found`);
      }

      const requiredStock = bundleProduct.quantity * orderQuantity;
      if (product.stock < requiredStock) {
        throw new BadRequestException(
          `Insufficient stock for ${product.name}. Required: ${requiredStock}, Available: ${product.stock}`
        );
      }
    }
  }

  private async reserveBundleStock(bundle: Bundle, orderQuantity: number): Promise<void> {
    for (const bundleProduct of bundle.products) {
      const requiredStock = bundleProduct.quantity * orderQuantity;
      await this.productModel.findByIdAndUpdate(
        bundleProduct.productId,
        { $inc: { stock: -requiredStock } }
      );
    }
  }

  private async updateBundleStats(bundleId: string, quantity: number, revenue: number): Promise<void> {
    await this.bundleModel.findByIdAndUpdate(bundleId, {
      $inc: {
        purchaseCount: quantity,
        totalRevenue: revenue,
      },
    });
  }

  private async sendGiftNotification(bundleOrder: BundleOrder): Promise<void> {
    if (!bundleOrder.recipientInfo || !bundleOrder.giftMessage) {
      return;
    }

    // Implementation would send email/SMS to recipient
    // This is a placeholder for the actual notification service call
    console.log('Sending gift notification to:', bundleOrder.recipientInfo.email || bundleOrder.recipientInfo.phoneNumber);
  }

  private async notifyAdminsForApproval(bundleOrder: BundleOrder): Promise<void> {
    // Implementation would notify admins about pending approval
    console.log('Notifying admins for bundle order approval:', (bundleOrder as any)._id);
  }

  private async clearBundleCache(bundleType?: BundleType, bundleId?: string): Promise<void> {
    const patterns = ['bundles:*'];
    if (bundleType) {
      patterns.push(`bundle_type:${bundleType}:*`);
    }
    if (bundleId) {
      patterns.push(`bundle:${bundleId}`);
    }

    // Clear cache patterns (implementation depends on cache manager)
    for (const pattern of patterns) {
      await this.cacheManager.del(pattern);
    }
  }

  private async clearSeasonalBundleCache(seasonalType: SeasonalType): Promise<void> {
    await this.cacheManager.del(`seasonal:${seasonalType}:*`);
  }

  // Admin Management Methods
  async getAllBundlesAdmin(filterDto: BundleFilterDto): Promise<Bundle[]> {
    const filter: any = {};

    if (filterDto.bundleType) {
      filter.bundleType = filterDto.bundleType;
    }

    if (filterDto.seasonalType) {
      filter.seasonalType = filterDto.seasonalType;
    }

    if (filterDto.isActive !== undefined) {
      filter.isActive = filterDto.isActive;
    }

    if (filterDto.isSeasonallyActive !== undefined) {
      filter.isSeasonallyActive = filterDto.isSeasonallyActive;
    }

    return this.bundleModel
      .find(filter)
      .populate('products.productId', 'name price category')
      .sort({ createdAt: -1 })
      .exec();
  }

  async activateBundle(bundleId: string, adminId: string): Promise<Bundle> {
    const bundle = await this.bundleModel.findById(bundleId);
    if (!bundle) {
      throw new NotFoundException('Bundle not found');
    }

    bundle.isActive = true;
    bundle.lastModifiedBy = adminId;
    await bundle.save();

    await this.clearBundleCache(bundle.type);
    
    this.eventEmitter.emit('bundle.updated', {
      bundleId,
      adminId,
      action: 'activated',
    });

    return bundle;
  }

  async deactivateBundle(bundleId: string, adminId: string): Promise<Bundle> {
    const bundle = await this.bundleModel.findById(bundleId);
    if (!bundle) {
      throw new NotFoundException('Bundle not found');
    }

    bundle.isActive = false;
    bundle.lastModifiedBy = adminId;
    await bundle.save();

    await this.clearBundleCache(bundle.type);
    
    this.eventEmitter.emit('bundle.updated', {
      bundleId,
      adminId,
      action: 'deactivated',
    });

    return bundle;
  }

  async getSeasonalAnalytics(seasonalType: string, year: number): Promise<SeasonalAnalytics> {
    const cacheKey = `seasonal:analytics:${seasonalType}:${year}`;
    const cached = await this.cacheManager.get<SeasonalAnalytics>(cacheKey);
    if (cached) {
      return cached;
    }

    const [bundles, orders] = await Promise.all([
      this.bundleModel.find({
        seasonalType,
        'seasonalConfig.year': year,
      }),
      this.bundleOrderModel.find({
        bundleId: { $in: [] }, // Will be populated below
        createdAt: {
          $gte: new Date(year, 0, 1),
          $lt: new Date(year + 1, 0, 1),
        },
      }),
    ]);

    const bundleIds = bundles.map(b => b._id);
    const seasonalOrders = await this.bundleOrderModel.find({
      bundleId: { $in: bundleIds },
    });

    const analytics: SeasonalAnalytics = {
      seasonalType,
      year,
      totalBundles: bundles.length,
      activeBundles: bundles.filter(b => b.isActive && b.isSeasonallyActive).length,
      totalOrders: seasonalOrders.length,
      totalRevenue: seasonalOrders.reduce((sum, order) => sum + order.totalAmount, 0),
      topBundles: bundles
        .sort((a, b) => b.purchaseCount - a.purchaseCount)
        .slice(0, 5)
        .map(b => ({
          id: b._id.toString(),
          name: b.name,
          purchaseCount: b.purchaseCount,
          revenue: b.totalRevenue,
        })),
      dateRange: {
        start: new Date(year, 0, 1),
        end: new Date(year + 1, 0, 1),
      },
    };

    await this.cacheManager.set(cacheKey, analytics, 300000); // 5 minutes
    return analytics;
  }

  async bulkControlSeasonalBundles(
    seasonalType: string,
    year: number,
    activate: boolean,
    adminId: string,
  ): Promise<{ affected: number; bundles: Bundle[] }> {
    const result = await this.bundleModel.updateMany(
      {
        seasonalType,
        'seasonalConfig.year': year,
      },
      {
        $set: {
          isSeasonallyActive: activate,
          lastModifiedBy: adminId,
        },
      },
    );

    const updatedBundles = await this.bundleModel.find({
      seasonalType,
      'seasonalConfig.year': year,
    });

    await this.clearSeasonalBundleCache(seasonalType as SeasonalType);

    this.eventEmitter.emit('bundle.seasonal.controlled', {
      seasonalType,
      year,
      activate,
      bundleCount: result.modifiedCount,
      adminId,
    });

    return {
      affected: result.modifiedCount,
      bundles: updatedBundles,
    };
  }
}
