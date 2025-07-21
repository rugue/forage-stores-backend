import { 
  Controller, 
  Get, 
  Post, 
  Patch, 
  Delete, 
  Body, 
  Param, 
  Query, 
  UseGuards, 
  BadRequestException
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth 
} from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../users/entities/user.entity';
import { 
  AdminWalletFundDto, 
  AdminWalletWipeDto, 
  CreateCategoryDto, 
  UpdateCategoryDto, 
  PriceHistoryDto,
  AnalyticsFilterDto
} from './dto';

@ApiTags('admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  /**
   * User Management Endpoints
   */
  @Get('users')
  @ApiOperation({ summary: 'Get all users (admin only)' })
  @ApiResponse({ status: 200, description: 'Return all users' })
  async getAllUsers() {
    return this.adminService.getAllUsers();
  }

  @Get('users/:userId')
  @ApiOperation({ summary: 'Get user by ID (admin only)' })
  @ApiResponse({ status: 200, description: 'Return user details' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserById(@Param('userId') userId: string) {
    return this.adminService.getUserById(userId);
  }

  /**
   * Wallet Management Endpoints
   */
  @Get('wallets')
  @ApiOperation({ summary: 'Get all wallets (admin only)' })
  @ApiResponse({ status: 200, description: 'Return all wallets' })
  async getAllWallets() {
    return this.adminService.getAllWallets();
  }

  @Get('wallets/:walletId')
  @ApiOperation({ summary: 'Get wallet by ID (admin only)' })
  @ApiResponse({ status: 200, description: 'Return wallet details' })
  @ApiResponse({ status: 404, description: 'Wallet not found' })
  async getWalletById(@Param('walletId') walletId: string) {
    return this.adminService.getWalletById(walletId);
  }

  @Get('users/:userId/wallet')
  @ApiOperation({ summary: 'Get user wallet (admin only)' })
  @ApiResponse({ status: 200, description: 'Return user wallet' })
  @ApiResponse({ status: 404, description: 'Wallet not found' })
  async getUserWallet(@Param('userId') userId: string) {
    return this.adminService.getUserWallet(userId);
  }

  @Post('wallets/fund')
  @ApiOperation({ summary: 'Fund a user wallet (admin only, requires password)' })
  @ApiResponse({ status: 201, description: 'Wallet successfully funded' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid admin password' })
  @ApiResponse({ status: 404, description: 'User or wallet not found' })
  async fundWallet(
    @Body() fundDto: AdminWalletFundDto,
    @CurrentUser() user: any
  ) {
    return this.adminService.fundWallet(fundDto, user.id);
  }

  @Post('wallets/wipe')
  @ApiOperation({ summary: 'Wipe a user wallet (admin only, requires password)' })
  @ApiResponse({ status: 201, description: 'Wallet successfully wiped' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid admin password' })
  @ApiResponse({ status: 404, description: 'User or wallet not found' })
  async wipeWallet(
    @Body() wipeDto: AdminWalletWipeDto,
    @CurrentUser() user: any
  ) {
    return this.adminService.wipeWallet(wipeDto, user.id);
  }

  /**
   * Analytics Endpoints
   */
  @Get('analytics/orders')
  @ApiOperation({ summary: 'Get orders analytics (admin only)' })
  @ApiResponse({ status: 200, description: 'Return orders analytics' })
  async getOrdersAnalytics(@Query() filterDto: AnalyticsFilterDto) {
    return this.adminService.getOrdersAnalytics(filterDto);
  }

  @Get('analytics/subscriptions')
  @ApiOperation({ summary: 'Get subscription analytics (admin only)' })
  @ApiResponse({ status: 200, description: 'Return subscription analytics' })
  async getSubscriptionAnalytics(@Query() filterDto: AnalyticsFilterDto) {
    return this.adminService.getSubscriptionAnalytics(filterDto);
  }

  @Get('analytics/commissions')
  @ApiOperation({ summary: 'Get commission analytics (admin only)' })
  @ApiResponse({ status: 200, description: 'Return commission analytics' })
  async getCommissionAnalytics(@Query() filterDto: AnalyticsFilterDto) {
    return this.adminService.getCommissionAnalytics(filterDto);
  }

  /**
   * Category Management Endpoints
   */
  @Get('categories')
  @ApiOperation({ summary: 'Get all product categories (admin only)' })
  @ApiResponse({ status: 200, description: 'Return all categories' })
  async getAllCategories() {
    return this.adminService.getAllCategories();
  }

  @Get('categories/:categoryId')
  @ApiOperation({ summary: 'Get category by ID (admin only)' })
  @ApiResponse({ status: 200, description: 'Return category details' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async getCategoryById(@Param('categoryId') categoryId: string) {
    return this.adminService.getCategoryById(categoryId);
  }

  @Post('categories')
  @ApiOperation({ summary: 'Create a new category (admin only)' })
  @ApiResponse({ status: 201, description: 'Category successfully created' })
  async createCategory(@Body() createDto: CreateCategoryDto) {
    return this.adminService.createCategory(createDto);
  }

  @Patch('categories/:categoryId')
  @ApiOperation({ summary: 'Update a category (admin only)' })
  @ApiResponse({ status: 200, description: 'Category successfully updated' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async updateCategory(
    @Param('categoryId') categoryId: string,
    @Body() updateDto: UpdateCategoryDto
  ) {
    return this.adminService.updateCategory(categoryId, updateDto);
  }

  @Delete('categories/:categoryId')
  @ApiOperation({ summary: 'Delete a category (admin only)' })
  @ApiResponse({ status: 200, description: 'Category successfully deleted' })
  @ApiResponse({ status: 400, description: 'Cannot delete category in use' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async deleteCategory(@Param('categoryId') categoryId: string) {
    return this.adminService.deleteCategory(categoryId);
  }

  /**
   * Price History Management Endpoints
   */
  @Get('products/:productId/price-history')
  @ApiOperation({ summary: 'Get product price history (admin only)' })
  @ApiResponse({ status: 200, description: 'Return price history' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async getProductPriceHistory(@Param('productId') productId: string) {
    return this.adminService.getProductPriceHistory(productId);
  }

  @Post('products/price-history')
  @ApiOperation({ summary: 'Add price history and update product price (admin only)' })
  @ApiResponse({ status: 201, description: 'Price history added and product updated' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async addPriceHistory(
    @Body() priceHistoryDto: PriceHistoryDto,
    @CurrentUser() user: any
  ) {
    return this.adminService.addPriceHistory(priceHistoryDto, user.id);
  }
}
