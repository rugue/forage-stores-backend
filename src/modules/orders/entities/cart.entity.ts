import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type CartDocument = Cart & Document;

@Schema()
export class CartItem {
  @ApiProperty({ description: 'Product ID' })
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  productId: Types.ObjectId;

  @ApiProperty({ description: 'Product name for quick reference' })
  @Prop({ required: true })
  productName: string;

  @ApiProperty({ description: 'Product description for quick reference' })
  @Prop({ required: true })
  productDescription: string;

  @ApiProperty({ description: 'Quantity of the product' })
  @Prop({ required: true, min: 1 })
  quantity: number;

  @ApiProperty({ description: 'Unit price in NGN at time of adding to cart' })
  @Prop({ required: true, min: 0 })
  unitPrice: number;

  @ApiProperty({ description: 'Unit price in Nibia at time of adding to cart' })
  @Prop({ required: true, min: 0 })
  unitPriceInNibia: number;

  @ApiProperty({ description: 'Total price in NGN for this item' })
  @Prop({ required: true, min: 0 })
  totalPrice: number;

  @ApiProperty({ description: 'Total price in Nibia for this item' })
  @Prop({ required: true, min: 0 })
  totalPriceInNibia: number;

  @ApiProperty({ description: 'When this item was added to cart' })
  @Prop({ default: Date.now })
  addedAt: Date;

  @ApiProperty({ description: 'When this item was last updated' })
  @Prop({ default: Date.now })
  updatedAt: Date;
}

const CartItemSchema = SchemaFactory.createForClass(CartItem);

@Schema({ timestamps: true })
export class Cart {
  @ApiProperty({ description: 'User ID who owns this cart' })
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true })
  userId: Types.ObjectId;

  @ApiProperty({ description: 'Cart items', type: [CartItem] })
  @Prop({ type: [CartItemSchema], default: [] })
  items: CartItem[];

  @ApiProperty({ description: 'Total number of items in cart' })
  @Prop({ default: 0 })
  totalItems: number;

  @ApiProperty({ description: 'Total amount in NGN' })
  @Prop({ default: 0 })
  totalAmount: number;

  @ApiProperty({ description: 'Total amount in Nibia' })
  @Prop({ default: 0 })
  totalAmountInNibia: number;

  @ApiProperty({ description: 'Cart expiration date' })
  @Prop({ 
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from creation
    index: { expireAfterSeconds: 0 } // MongoDB TTL index
  })
  expiresAt: Date;

  @ApiProperty({ description: 'When cart was created' })
  createdAt: Date;

  @ApiProperty({ description: 'When cart was last updated' })
  updatedAt: Date;
}

export const CartSchema = SchemaFactory.createForClass(Cart);

// Create indexes for better performance
CartSchema.index({ userId: 1 }, { unique: true });
CartSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Update totals before saving
CartSchema.pre('save', function() {
  const cart = this as CartDocument;
  cart.totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
  cart.totalAmount = cart.items.reduce((sum, item) => sum + item.totalPrice, 0);
  cart.totalAmountInNibia = cart.items.reduce((sum, item) => sum + item.totalPriceInNibia, 0);
  
  // Update item timestamps
  cart.items.forEach(item => {
    if (!item.addedAt) item.addedAt = new Date();
    item.updatedAt = new Date();
  });
});
