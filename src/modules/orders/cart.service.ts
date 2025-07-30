import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Cart, CartDocument, CartItem } from './entities/cart.entity';
import { Product, ProductDocument } from '../products/entities/product.entity';

@Injectable()
export class CartService {
  private readonly logger = new Logger(CartService.name);

  constructor(
    @InjectModel(Cart.name) private cartModel: Model<CartDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
  ) {}

  /**
   * Get or create a cart for a user
   */
  private async getOrCreateCart(userId: string): Promise<CartDocument> {
    let cart = await this.cartModel.findOne({ 
      userId: new Types.ObjectId(userId),
      expiresAt: { $gt: new Date() }
    }).exec();
    
    if (!cart) {
      cart = await this.cartModel.create({
        userId: new Types.ObjectId(userId),
        items: [],
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      });
      this.logger.log(`Created new cart for user ${userId}`);
    }
    
    return cart;
  }

  /**
   * Get cart for a user
   */
  async getCart(userId: string): Promise<any> {
    try {
      const cart = await this.cartModel
        .findOne({ 
          userId: new Types.ObjectId(userId),
          expiresAt: { $gt: new Date() }
        })
        .populate({
          path: 'items.productId',
          model: 'Product',
          select: 'name price priceInNibia category images seller stock',
        })
        .exec();

      if (!cart || cart.items.length === 0) {
        return {
          items: [],
          totalPriceInNaira: 0,
          totalPriceInNibia: 0,
          itemCount: 0,
        };
      }

      // Filter out items with deleted products
      const validItems = cart.items.filter(item => item.productId);

      const summary = this.calculateCartSummary(validItems);
      
      return {
        items: validItems,
        ...summary,
      };
    } catch (error) {
      this.logger.error(`Error getting cart for user ${userId}:`, error);
      throw new BadRequestException('Failed to get cart');
    }
  }

  /**
   * Add item to cart
   */
  async addToCart(userId: string, productId: string, quantity: number): Promise<any> {
    try {
      // Validate product exists and has stock
      const product = await this.productModel.findById(productId).exec();
      if (!product) {
        throw new NotFoundException('Product not found');
      }

      if (product.stock < quantity) {
        throw new BadRequestException(`Only ${product.stock} items available in stock`);
      }

      // Get or create cart
      const cart = await this.getOrCreateCart(userId);

      // Check if item already exists in cart
      const existingItemIndex = cart.items.findIndex(
        item => item.productId.toString() === productId
      );

      if (existingItemIndex > -1) {
        // Update existing item
        const existingItem = cart.items[existingItemIndex];
        const newQuantity = existingItem.quantity + quantity;

        if (newQuantity > product.stock) {
          throw new BadRequestException(`Cannot add ${quantity} items. Only ${product.stock - existingItem.quantity} more available`);
        }

        existingItem.quantity = newQuantity;
        existingItem.totalPrice = newQuantity * product.price;
        existingItem.totalPriceInNibia = newQuantity * product.priceInNibia;
        existingItem.updatedAt = new Date();
      } else {
        // Add new item
        const newItem: CartItem = {
          productId: new Types.ObjectId(productId),
          productName: product.name,
          productDescription: product.description,
          quantity,
          unitPrice: product.price,
          unitPriceInNibia: product.priceInNibia,
          totalPrice: quantity * product.price,
          totalPriceInNibia: quantity * product.priceInNibia,
          addedAt: new Date(),
          updatedAt: new Date(),
        };
        cart.items.push(newItem);
      }

      // Extend cart expiration and save
      cart.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      const updatedCart = await this.cartModel.findByIdAndUpdate(
        cart._id, 
        { items: cart.items, expiresAt: cart.expiresAt }, 
        { new: true }
      ).exec();
      
      this.logger.log(`Added ${quantity} of product ${productId} to cart for user ${userId}`);
      
      return {
        message: 'Item added to cart successfully',
        cart: await this.getCart(userId),
      };
    } catch (error) {
      this.logger.error(`Error adding to cart for user ${userId}:`, error);
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to add item to cart');
    }
  }

  /**
   * Update cart item quantity
   */
  async updateCartItem(userId: string, productId: string, quantity: number): Promise<any> {
    try {
      if (quantity <= 0) {
        return this.removeFromCart(userId, productId);
      }

      const cart = await this.cartModel.findOne({ 
        userId: new Types.ObjectId(userId),
        expiresAt: { $gt: new Date() }
      }).exec();

      if (!cart) {
        throw new NotFoundException('Cart not found');
      }

      const itemIndex = cart.items.findIndex(
        item => item.productId.toString() === productId
      );

      if (itemIndex === -1) {
        throw new NotFoundException('Item not found in cart');
      }

      // Validate product and stock
      const product = await this.productModel.findById(productId).exec();
      if (!product) {
        throw new NotFoundException('Product not found');
      }

      if (quantity > product.stock) {
        throw new BadRequestException(`Only ${product.stock} items available in stock`);
      }

      // Update item
      const item = cart.items[itemIndex];
      item.quantity = quantity;
      item.totalPrice = quantity * product.price;
      item.totalPriceInNibia = quantity * product.priceInNibia;
      item.updatedAt = new Date();

      // Extend cart expiration and save
      cart.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      await this.cartModel.findByIdAndUpdate(
        cart._id, 
        { items: cart.items, expiresAt: cart.expiresAt }, 
        { new: true }
      ).exec();
      
      this.logger.log(`Updated cart item ${productId} to quantity ${quantity} for user ${userId}`);
      
      return {
        message: 'Cart item updated successfully',
        cart: await this.getCart(userId),
      };
    } catch (error) {
      this.logger.error(`Error updating cart item for user ${userId}:`, error);
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to update cart item');
    }
  }

  /**
   * Remove item from cart
   */
  async removeFromCart(userId: string, productId: string): Promise<any> {
    try {
      const cart = await this.cartModel.findOne({ 
        userId: new Types.ObjectId(userId),
        expiresAt: { $gt: new Date() }
      }).exec();

      if (!cart) {
        throw new NotFoundException('Cart not found');
      }

      const itemIndex = cart.items.findIndex(
        item => item.productId.toString() === productId
      );

      if (itemIndex === -1) {
        throw new NotFoundException('Item not found in cart');
      }

      cart.items.splice(itemIndex, 1);

      // Extend cart expiration only if items remain
      if (cart.items.length > 0) {
        cart.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        await this.cartModel.findByIdAndUpdate(
          cart._id, 
          { items: cart.items, expiresAt: cart.expiresAt }, 
          { new: true }
        ).exec();
      } else {
        // Delete empty cart
        await this.cartModel.findByIdAndDelete(cart._id).exec();
      }
      
      this.logger.log(`Removed product ${productId} from cart for user ${userId}`);
      
      return {
        message: 'Item removed from cart successfully',
        cart: await this.getCart(userId),
      };
    } catch (error) {
      this.logger.error(`Error removing from cart for user ${userId}:`, error);
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to remove item from cart');
    }
  }

  /**
   * Clear entire cart
   */
  async clearCart(userId: string): Promise<any> {
    try {
      await this.cartModel.findOneAndDelete({ 
        userId: new Types.ObjectId(userId) 
      }).exec();
      
      this.logger.log(`Cleared cart for user ${userId}`);
      
      return {
        message: 'Cart cleared successfully',
        cart: {
          items: [],
          totalPriceInNaira: 0,
          totalPriceInNibia: 0,
          itemCount: 0,
        },
      };
    } catch (error) {
      this.logger.error(`Error clearing cart for user ${userId}:`, error);
      throw new BadRequestException('Failed to clear cart');
    }
  }

  /**
   * Get cart item count
   */
  async getCartItemCount(userId: string): Promise<number> {
    try {
      const cart = await this.cartModel.findOne({ 
        userId: new Types.ObjectId(userId),
        expiresAt: { $gt: new Date() }
      }).exec();
      
      if (!cart) {
        return 0;
      }
      
      return cart.items.reduce((total, item) => total + item.quantity, 0);
    } catch (error) {
      this.logger.error(`Error getting cart item count for user ${userId}:`, error);
      return 0;
    }
  }

  /**
   * Validate cart before checkout
   */
  async validateCartForCheckout(userId: string): Promise<{ valid: boolean; issues: string[] }> {
    try {
      const cart = await this.cartModel.findOne({ 
        userId: new Types.ObjectId(userId),
        expiresAt: { $gt: new Date() }
      }).populate('items.productId').exec();

      const issues: string[] = [];

      if (!cart || cart.items.length === 0) {
        issues.push('Cart is empty');
        return { valid: false, issues };
      }

      // Check each item for availability and stock
      for (const item of cart.items) {
        const product = item.productId as any;
        
        if (!product) {
          issues.push(`Product no longer exists`);
          continue;
        }

        if (product.stock < item.quantity) {
          issues.push(`${product.name}: Only ${product.stock} available, but ${item.quantity} requested`);
        }

        // Check if prices have changed
        if (product.price !== item.unitPrice || 
            product.priceInNibia !== item.unitPriceInNibia) {
          issues.push(`${product.name}: Price has changed`);
        }
      }

      return { valid: issues.length === 0, issues };
    } catch (error) {
      this.logger.error(`Error validating cart for user ${userId}:`, error);
      return { valid: false, issues: ['Failed to validate cart'] };
    }
  }

  /**
   * Clean up expired carts
   */
  async cleanupExpiredCarts(): Promise<void> {
    try {
      const result = await this.cartModel.deleteMany({
        expiresAt: { $lt: new Date() }
      }).exec();
      
      if (result.deletedCount > 0) {
        this.logger.log(`Cleaned up ${result.deletedCount} expired carts`);
      }
    } catch (error) {
      this.logger.error('Error cleaning up expired carts:', error);
    }
  }

  /**
   * Calculate cart summary
   */
  private calculateCartSummary(items: CartItem[]): any {
    const totalPrice = items.reduce((sum, item) => sum + item.totalPrice, 0);
    const totalPriceInNibia = items.reduce((sum, item) => sum + item.totalPriceInNibia, 0);
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

    return {
      totalPriceInNaira: totalPrice, // For backward compatibility
      totalPriceInNibia,
      itemCount,
    };
  }
}
