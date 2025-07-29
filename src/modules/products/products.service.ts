import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Product, ProductDocument } from '../products/entities/product.entity';
import { PriceLock, PriceLockDocument, PriceLockStatus } from '../products/entities/price-lock.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType, NotificationChannel } from '../notifications/entities/notification.entity';
import { CreateProductDto, UpdateProductDto, ProductFilterDto } from './dto';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(PriceLock.name) private priceLockModel: Model<PriceLockDocument>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(
    createProductDto: CreateProductDto,
    userId?: string,
    userRole?: string,
  ): Promise<Product> {
    try {
      // If user is not admin, set sellerId to current user
      if (userRole !== 'admin' && !createProductDto.sellerId) {
        createProductDto.sellerId = userId;
      }

      // Only admin can create products for other sellers
      if (userRole !== 'admin' && createProductDto.sellerId && createProductDto.sellerId !== userId) {
        throw new ForbiddenException('You can only create products for yourself');
      }

      // Convert sellerId to ObjectId if it's a string
      const productData = {
        ...createProductDto,
        sellerId: createProductDto.sellerId ? new Types.ObjectId(createProductDto.sellerId) : undefined,
      };

      const product = new this.productModel(productData);
      return await product.save();
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      throw new BadRequestException('Failed to create product: ' + error.message);
    }
  }

  async findAll(filterDto: ProductFilterDto = {}): Promise<{
    products: Product[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const {
      search,
      city,
      category,
      deliveryType,
      sellerId,
      minPrice,
      maxPrice,
      minPriceInNibia,
      maxPriceInNibia,
      isActive,
      tags,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = filterDto;

    const query: any = {};

    // Build search query
    if (search) {
      query.$text = { $search: search };
    }

    if (city) {
      query.city = { $regex: city, $options: 'i' };
    }

    if (category) {
      query.category = category;
    }

    if (deliveryType) {
      query.deliveryType = deliveryType;
    }

    if (sellerId) {
      query.sellerId = new Types.ObjectId(sellerId);
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      query.price = {};
      if (minPrice !== undefined) query.price.$gte = minPrice;
      if (maxPrice !== undefined) query.price.$lte = maxPrice;
    }

    if (minPriceInNibia !== undefined || maxPriceInNibia !== undefined) {
      query.priceInNibia = {};
      if (minPriceInNibia !== undefined) query.priceInNibia.$gte = minPriceInNibia;
      if (maxPriceInNibia !== undefined) query.priceInNibia.$lte = maxPriceInNibia;
    }

    if (isActive !== undefined) {
      query.isActive = isActive;
    }

    if (tags && tags.length > 0) {
      query.tags = { $in: tags };
    }

    const skip = (page - 1) * limit;
    const sortOptions: any = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const [products, total] = await Promise.all([
      this.productModel
        .find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .populate('sellerId', 'name email')
        .exec(),
      this.productModel.countDocuments(query).exec(),
    ]);

    return {
      products,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<Product> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid product ID');
    }

    const product = await this.productModel
      .findById(id)
      .populate('sellerId', 'name email phone')
      .exec();

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async findByCity(city: string, filterDto: ProductFilterDto = {}): Promise<{
    products: Product[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    return this.findAll({ ...filterDto, city });
  }

  async findByCategory(category: string, filterDto: ProductFilterDto = {}): Promise<{
    products: Product[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    return this.findAll({ ...filterDto, category: category as any });
  }

  async findBySeller(sellerId: string, filterDto: ProductFilterDto = {}): Promise<{
    products: Product[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    if (!Types.ObjectId.isValid(sellerId)) {
      throw new BadRequestException('Invalid seller ID');
    }

    return this.findAll({ ...filterDto, sellerId });
  }

  async update(
    id: string,
    updateProductDto: UpdateProductDto,
    userId?: string,
    userRole?: string,
  ): Promise<Product> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid product ID');
    }

    const existingProduct = await this.productModel.findById(id);
    if (!existingProduct) {
      throw new NotFoundException('Product not found');
    }

    // Check permissions
    if (userRole !== 'admin') {
      if (!existingProduct.sellerId || existingProduct.sellerId.toString() !== userId) {
        throw new ForbiddenException('You can only update your own products');
      }

      // Sellers cannot change sellerId
      if (updateProductDto.sellerId && updateProductDto.sellerId !== userId) {
        throw new ForbiddenException('You cannot transfer product ownership');
      }
    }

    try {
      const updatedProduct = await this.productModel
        .findByIdAndUpdate(id, updateProductDto, { new: true })
        .populate('sellerId', 'name email')
        .exec();

      return updatedProduct;
    } catch (error) {
      throw new BadRequestException('Failed to update product: ' + error.message);
    }
  }

  async remove(id: string, userId?: string, userRole?: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid product ID');
    }

    const product = await this.productModel.findById(id);
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Check permissions
    if (userRole !== 'admin') {
      if (!product.sellerId || product.sellerId.toString() !== userId) {
        throw new ForbiddenException('You can only delete your own products');
      }
    }

    await this.productModel.findByIdAndDelete(id);
  }

  async updateStock(id: string, quantity: number, operation: 'add' | 'subtract' = 'subtract'): Promise<Product> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid product ID');
    }

    const product = await this.productModel.findById(id);
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const newStock = operation === 'add' 
      ? product.stock + quantity 
      : product.stock - quantity;

    if (newStock < 0) {
      throw new BadRequestException('Insufficient stock');
    }

    const updatedProduct = await this.productModel
      .findByIdAndUpdate(
        id,
        { stock: newStock },
        { new: true }
      )
      .populate('sellerId', 'name email')
      .exec();

    return updatedProduct;
  }

  async getStatistics(): Promise<{
    totalProducts: number;
    totalActiveProducts: number;
    totalInactiveProducts: number;
    categoriesStats: any[];
    citiesStats: any[];
    deliveryTypeStats: any[];
  }> {
    const [
      totalProducts,
      totalActiveProducts,
      totalInactiveProducts,
      categoriesStats,
      citiesStats,
      deliveryTypeStats,
    ] = await Promise.all([
      this.productModel.countDocuments(),
      this.productModel.countDocuments({ isActive: true }),
      this.productModel.countDocuments({ isActive: false }),
      this.productModel.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      this.productModel.aggregate([
        { $group: { _id: '$city', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      this.productModel.aggregate([
        { $group: { _id: '$deliveryType', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
    ]);

    return {
      totalProducts,
      totalActiveProducts,
      totalInactiveProducts,
      categoriesStats,
      citiesStats,
      deliveryTypeStats,
    };
  }

  async bulkUpdateStock(updates: { productId: string; quantity: number; operation: 'add' | 'subtract' }[]): Promise<{
    successful: string[];
    failed: { productId: string; error: string }[];
  }> {
    const results = {
      successful: [],
      failed: [],
    };

    for (const update of updates) {
      try {
        await this.updateStock(update.productId, update.quantity, update.operation);
        results.successful.push(update.productId);
      } catch (error) {
        results.failed.push({
          productId: update.productId,
          error: error.message,
        });
      }
    }

    return results;
  }


  // Added methods for scheduled tasks
  async expirePriceLocks(): Promise<number> {
    const now = new Date();
    
    // Find active price locks that have expired
    const priceLocks = await this.priceLockModel.find({
      expiryDate: { $lte: now },
      status: PriceLockStatus.ACTIVE
    }).populate('userId').populate('productId').exec();
    
    if (priceLocks.length === 0) {
      return 0;
    }
    
    let expiredCount = 0;
    
    for (const priceLock of priceLocks) {
      try {
        // Update status to expired
        priceLock.status = PriceLockStatus.EXPIRED;
        await priceLock.save();
        
        // Notify user
        const user = priceLock.userId as any;
        const product = priceLock.productId as any;
        
        await this.notificationsService.sendEmail({
          recipientEmail: user.email,
          type: NotificationType.PRICE_LOCK_EXPIRED,
          title: `Your Price Lock for ${product.name} Has Expired`,
          message: `
            Hello,
            
            Your price lock for ${product.name} at $${priceLock.price.toFixed(2)} has expired.
            
            The current price is now $${product.price.toFixed(2)}.
            
            Thank you,
            Forage Stores Team
          `,
          recipientId: user._id.toString(),
          metadata: {
            priceLockId: priceLock._id.toString(),
            productName: product.name,
            lockedPrice: priceLock.price,
            currentPrice: product.price,
            expiredAt: priceLock.expiryDate.toISOString()
          }
        });
        
        expiredCount++;
      } catch (error) {
        this.logger.error(`Failed to expire price lock ${priceLock._id}:`, error);
      }
    }
    
    return expiredCount;
  }
}
