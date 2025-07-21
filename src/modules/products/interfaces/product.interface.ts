import { Types } from 'mongoose';
import { DeliveryType, ProductCategory } from '../entities/product.entity';

export interface IProduct {
  _id?: Types.ObjectId;
  name: string;
  description: string;
  price: number;
  priceInNibia: number;
  weight: number;
  city: string;
  category: ProductCategory;
  sellerId?: Types.ObjectId;
  tags: string[];
  deliveryType: DeliveryType;
  stock: number;
  isActive?: boolean;
  images?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ProductSearchParams {
  search?: string;
  category?: ProductCategory;
  city?: string;
  sellerId?: Types.ObjectId;
  deliveryType?: DeliveryType;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  isActive?: boolean;
  tags?: string[];
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ProductSummary {
  totalProducts: number;
  totalValue: number;
  productsByCategory: Record<ProductCategory, number>;
  productsByCity: Record<string, number>;
  productsByDeliveryType: Record<DeliveryType, number>;
  averagePrice: number;
  totalStock: number;
  outOfStockCount: number;
}

export interface ProductAnalytics {
  topSellingProducts: Array<{
    productId: Types.ObjectId;
    name: string;
    totalSold: number;
    revenue: number;
  }>;
  categoryPerformance: Array<{
    category: ProductCategory;
    totalProducts: number;
    totalSold: number;
    revenue: number;
  }>;
  cityDistribution: Array<{
    city: string;
    productCount: number;
    averagePrice: number;
  }>;
  priceRangeDistribution: Array<{
    range: string;
    count: number;
    percentage: number;
  }>;
}

export interface ProductInventory {
  productId: Types.ObjectId;
  name: string;
  currentStock: number;
  reservedStock: number;
  availableStock: number;
  reorderLevel: number;
  lastRestocked: Date;
  stockValue: number;
}

export interface ProductPricing {
  basePrice: number;
  nibiaPrice: number;
  discountPercentage?: number;
  discountedPrice?: number;
  effectiveDate: Date;
  expiryDate?: Date;
}

export interface ProductExport {
  name: string;
  description: string;
  price: number;
  priceInNibia: number;
  category: ProductCategory;
  city: string;
  stock: number;
  isActive: boolean;
  sellerId?: string;
  tags: string;
  createdAt: Date;
}
