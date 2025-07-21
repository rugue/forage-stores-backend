import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { CreateProductDto, UpdateProductDto, ProductFilterDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.USER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new product' })
  @ApiResponse({ status: 201, description: 'Product created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async create(
    @Body() createProductDto: CreateProductDto,
    @CurrentUser() user: any,
  ) {
    return this.productsService.create(
      createProductDto,
      user.sub,
      user.role,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get all products with optional filtering' })
  @ApiResponse({ status: 200, description: 'Products retrieved successfully' })
  @ApiQuery({ name: 'search', required: false, description: 'Search term' })
  @ApiQuery({ name: 'city', required: false, description: 'Filter by city' })
  @ApiQuery({ name: 'category', required: false, description: 'Filter by category' })
  @ApiQuery({ name: 'deliveryType', required: false, description: 'Filter by delivery type' })
  @ApiQuery({ name: 'sellerId', required: false, description: 'Filter by seller ID' })
  @ApiQuery({ name: 'minPrice', required: false, description: 'Minimum price in NGN' })
  @ApiQuery({ name: 'maxPrice', required: false, description: 'Maximum price in NGN' })
  @ApiQuery({ name: 'minPriceInNibia', required: false, description: 'Minimum price in Nibia' })
  @ApiQuery({ name: 'maxPriceInNibia', required: false, description: 'Maximum price in Nibia' })
  @ApiQuery({ name: 'isActive', required: false, description: 'Filter by active status' })
  @ApiQuery({ name: 'tags', required: false, description: 'Filter by tags (comma-separated)' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  @ApiQuery({ name: 'sortBy', required: false, description: 'Sort field' })
  @ApiQuery({ name: 'sortOrder', required: false, description: 'Sort order (asc/desc)' })
  async findAll(@Query() filterDto: ProductFilterDto) {
    return this.productsService.findAll(filterDto);
  }

  @Get('my-products')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user/seller products' })
  @ApiResponse({ status: 200, description: 'User products retrieved successfully' })
  async findMyProducts(
    @CurrentUser() user: any,
    @Query() filterDto: ProductFilterDto,
  ) {
    return this.productsService.findBySeller(user.sub, filterDto);
  }

  @Get('city/:city')
  @ApiOperation({ summary: 'Get products by city' })
  @ApiResponse({ status: 200, description: 'Products retrieved successfully' })
  async findByCity(
    @Param('city') city: string,
    @Query() filterDto: ProductFilterDto,
  ) {
    return this.productsService.findByCity(city, filterDto);
  }

  @Get('category/:category')
  @ApiOperation({ summary: 'Get products by category' })
  @ApiResponse({ status: 200, description: 'Products retrieved successfully' })
  async findByCategory(
    @Param('category') category: string,
    @Query() filterDto: ProductFilterDto,
  ) {
    return this.productsService.findByCategory(category, filterDto);
  }

  @Get('seller/:sellerId')
  @ApiOperation({ summary: 'Get products by seller ID' })
  @ApiResponse({ status: 200, description: 'Products retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Invalid seller ID' })
  async findBySeller(
    @Param('sellerId') sellerId: string,
    @Query() filterDto: ProductFilterDto,
  ) {
    return this.productsService.findBySeller(sellerId, filterDto);
  }

  @Get('statistics')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get product statistics (Admin only)' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  async getStatistics() {
    return this.productsService.getStatistics();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a product by ID' })
  @ApiResponse({ status: 200, description: 'Product retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.USER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a product' })
  @ApiResponse({ status: 200, description: 'Product updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
    @CurrentUser() user: any,
  ) {
    return this.productsService.update(
      id,
      updateProductDto,
      user.sub,
      user.role,
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.USER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a product' })
  @ApiResponse({ status: 200, description: 'Product deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async remove(@Param('id') id: string, @CurrentUser() user: any) {
    await this.productsService.remove(id, user.sub, user.role);
    return { message: 'Product deleted successfully' };
  }

  @Patch(':id/stock')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.USER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update product stock' })
  @ApiResponse({ status: 200, description: 'Stock updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async updateStock(
    @Param('id') id: string,
    @Body() body: { quantity: number; operation?: 'add' | 'subtract' },
  ) {
    return this.productsService.updateStock(
      id,
      body.quantity,
      body.operation || 'subtract',
    );
  }

  // Admin-only endpoints
  @Post('admin/bulk-stock-update')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Bulk update product stock (Admin only)' })
  @ApiResponse({ status: 200, description: 'Bulk update completed' })
  async bulkUpdateStock(
    @Body() 
    updates: { productId: string; quantity: number; operation: 'add' | 'subtract' }[],
  ) {
    return this.productsService.bulkUpdateStock(updates);
  }

  @Post('admin/:sellerId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create product for specific seller (Admin only)' })
  @ApiResponse({ status: 201, description: 'Product created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async createForSeller(
    @Param('sellerId') sellerId: string,
    @Body() createProductDto: CreateProductDto,
  ) {
    createProductDto.sellerId = sellerId;
    return this.productsService.create(createProductDto, undefined, 'admin');
  }

  @Get('admin/seller/:sellerId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all products by seller (Admin only)' })
  @ApiResponse({ status: 200, description: 'Products retrieved successfully' })
  async findBySellerAdmin(
    @Param('sellerId') sellerId: string,
    @Query() filterDto: ProductFilterDto,
  ) {
    return this.productsService.findBySeller(sellerId, filterDto);
  }

  @Patch('admin/:id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update product status (Admin only)' })
  @ApiResponse({ status: 200, description: 'Product status updated successfully' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { isActive: boolean },
  ) {
    return this.productsService.update(id, { isActive: body.isActive }, undefined, 'admin');
  }
}
