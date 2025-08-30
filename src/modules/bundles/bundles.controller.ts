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
  Request,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { FilesInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { BundlesService } from './bundles.service';
import {
  CreateBundleDto,
  UpdateBundleDto,
  BundleFilterDto,
  OrderBundleDto,
  BundleAnalyticsDto,
  SeasonalControlDto,
  BulkSeasonalControlDto,
  CreateRecipientInfoDto,
  CreateGiftMessageDto,
} from './dto/bundle.dto';
import { Bundle, BundleStatus } from './entities/bundle.entity';
import { BundleOrder } from './entities/bundle-order.entity';
import { BUNDLE_MESSAGES } from './constants/bundle.constants';

@ApiTags('Bundles')
@Controller('bundles')
export class BundlesController {
  constructor(private readonly bundlesService: BundlesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all bundles with filtering' })
  @ApiResponse({ status: 200, description: 'Bundles retrieved successfully' })
  async getAllBundles(@Query() filterDto: BundleFilterDto) {
    return this.bundlesService.getAllBundles(filterDto);
  }

  @Get('seasonal/:seasonalType')
  @ApiOperation({ summary: 'Get bundles by seasonal type' })
  @ApiResponse({ status: 200, description: 'Seasonal bundles retrieved successfully' })
  async getSeasonalBundles(
    @Param('seasonalType') seasonalType: string,
    @Query() filterDto: BundleFilterDto,
  ) {
    return this.bundlesService.getAllBundles({
      ...filterDto,
      seasonalType: seasonalType as any,
    });
  }

  @Get('templates')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get available bundle templates' })
  @ApiResponse({ status: 200, description: 'Bundle templates retrieved successfully' })
  async getBundleTemplates() {
    // Return template information without creating actual bundles
    const { BUNDLE_TEMPLATES } = await import('./constants/bundle.constants');
    return {
      templates: Object.entries(BUNDLE_TEMPLATES).map(([type, template]) => ({
        type,
        ...template,
      })),
    };
  }

  @Get('analytics')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get bundle analytics' })
  @ApiResponse({ status: 200, description: 'Analytics retrieved successfully' })
  async getBundleAnalytics(@Query() analyticsDto: BundleAnalyticsDto) {
    return this.bundlesService.getBundleAnalytics(analyticsDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get bundle by ID' })
  @ApiResponse({ status: 200, description: 'Bundle retrieved successfully', type: Bundle })
  @ApiResponse({ status: 404, description: 'Bundle not found' })
  async getBundleById(@Param('id') id: string) {
    return this.bundlesService.getBundleById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new bundle (Admin only)' })
  @ApiResponse({ status: 201, description: 'Bundle created successfully', type: Bundle })
  @ApiResponse({ status: 401, description: 'Unauthorized - Admin access required' })
  async createBundle(@Body() createBundleDto: CreateBundleDto, @Request() req) {
    return this.bundlesService.createBundle(createBundleDto, req.user.id);
  }

  @Post('templates/create')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create all predefined bundle templates (Admin only)' })
  @ApiResponse({ status: 201, description: 'Bundle templates created successfully' })
  async createBundleTemplates(@Request() req) {
    return this.bundlesService.createBundleTemplates(req.user.id);
  }

  // Admin Management Endpoints
  @Post('admin/seasonal/bulk-control')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Bulk control seasonal bundles' })
  @ApiResponse({ status: 200, description: 'Seasonal bundles controlled successfully' })
  async bulkControlSeasonalBundles(
    @Body() bulkSeasonalControlDto: BulkSeasonalControlDto,
    @Request() req,
  ) {
    return this.bundlesService.bulkControlSeasonalBundles(
      bulkSeasonalControlDto.seasonalType,
      bulkSeasonalControlDto.year,
      bulkSeasonalControlDto.activate,
      req.user.id,
    );
  }

  @Get('admin/analytics/seasonal/:seasonalType/:year')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get seasonal bundle analytics' })
  @ApiResponse({ status: 200, description: 'Seasonal analytics returned' })
  async getSeasonalAnalytics(
    @Param('seasonalType') seasonalType: string,
    @Param('year') year: number,
  ) {
    return this.bundlesService.getSeasonalAnalytics(seasonalType, +year);
  }

  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all bundles for admin management' })
  @ApiResponse({ status: 200, description: 'All bundles returned' })
  async getAllBundlesAdmin(@Query() filterDto: BundleFilterDto) {
    return this.bundlesService.getAllBundlesAdmin(filterDto);
  }

  @Patch('admin/:id/activate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Activate a bundle' })
  @ApiResponse({ status: 200, description: 'Bundle activated successfully' })
  async activateBundle(@Param('id') id: string, @Request() req) {
    return this.bundlesService.activateBundle(id, req.user.id);
  }

  @Patch('admin/:id/deactivate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Deactivate a bundle' })
  @ApiResponse({ status: 200, description: 'Bundle deactivated successfully' })
  async deactivateBundle(@Param('id') id: string, @Request() req) {
    return this.bundlesService.deactivateBundle(id, req.user.id);
  }

  @Post('order')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Order a bundle' })
  @ApiResponse({ status: 201, description: 'Bundle order placed successfully', type: BundleOrder })
  @ApiResponse({ status: 400, description: 'Invalid order data or insufficient stock' })
  async orderBundle(@Body() orderBundleDto: OrderBundleDto, @Request() req) {
    return this.bundlesService.orderBundle(orderBundleDto, req.user.id);
  }

  @Post('seasonal/control')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Control seasonal bundle availability (Admin only)' })
  @ApiResponse({ status: 200, description: 'Seasonal bundles controlled successfully' })
  async controlSeasonalBundles(@Body() controlDto: SeasonalControlDto, @Request() req) {
    return this.bundlesService.controlSeasonalBundles(controlDto, req.user.id);
  }

  @Post('gift/process/:bundleOrderId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Process gift delivery for bundle order (Admin only)' })
  @ApiResponse({ status: 200, description: 'Gift delivery processed successfully' })
  async processGiftDelivery(@Param('bundleOrderId') bundleOrderId: string, @Request() req) {
    return this.bundlesService.processGiftDelivery(bundleOrderId, req.user.id);
  }

  @Post(':id/images')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @UseInterceptors(FilesInterceptor('images', 10))
  @ApiOperation({ summary: 'Upload bundle images (Admin only)' })
  @ApiResponse({ status: 200, description: 'Images uploaded successfully' })
  async uploadBundleImages(
    @Param('id') id: string,
    @UploadedFiles() files: Express.Multer.File[],
    @Request() req,
  ) {
    // Implementation would handle image upload to cloud storage
    // This is a placeholder for the actual image upload logic
    const imageUrls = files.map(file => `https://storage.example.com/bundles/${id}/${file.filename}`);
    
    return this.bundlesService.updateBundle(
      id,
      { images: imageUrls } as any,
      req.user.id
    );
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update bundle (Admin only)' })
  @ApiResponse({ status: 200, description: 'Bundle updated successfully', type: Bundle })
  @ApiResponse({ status: 401, description: 'Unauthorized - Admin access required' })
  @ApiResponse({ status: 404, description: 'Bundle not found' })
  async updateBundle(
    @Param('id') id: string,
    @Body() updateBundleDto: UpdateBundleDto,
    @Request() req,
  ) {
    return this.bundlesService.updateBundle(id, updateBundleDto, req.user.id);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update bundle status (Admin only)' })
  @ApiResponse({ status: 200, description: 'Bundle status updated successfully' })
  async updateBundleStatus(
    @Param('id') id: string,
    @Body('status') status: BundleStatus,
    @Request() req,
  ) {
    return this.bundlesService.updateBundle(id, { status }, req.user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete bundle (Admin only)' })
  @ApiResponse({ status: 200, description: 'Bundle deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Admin access required' })
  @ApiResponse({ status: 404, description: 'Bundle not found' })
  async deleteBundle(@Param('id') id: string, @Request() req) {
    await this.bundlesService.deleteBundle(id, req.user.id);
    return { message: BUNDLE_MESSAGES.BUNDLE_DELETED };
  }
}

// Bundle Orders Controller
@ApiTags('Bundle Orders')
@Controller('bundle-orders')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BundleOrdersController {
  constructor(private readonly bundlesService: BundlesService) {}

  @Get('my-orders')
  @ApiOperation({ summary: 'Get current user\'s bundle orders' })
  @ApiResponse({ status: 200, description: 'Bundle orders retrieved successfully' })
  async getMyBundleOrders(@Request() req, @Query() query: any) {
    const { page = 1, limit = 20 } = query;
    
    // Implementation would get user's bundle orders
    // This is a placeholder for the actual implementation
    return {
      orders: [],
      total: 0,
      page,
      totalPages: 0,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get bundle order by ID' })
  @ApiResponse({ status: 200, description: 'Bundle order retrieved successfully' })
  async getBundleOrderById(@Param('id') id: string, @Request() req) {
    // Implementation would get bundle order with validation
    // This is a placeholder for the actual implementation
    return { message: 'Bundle order details' };
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel bundle order' })
  @ApiResponse({ status: 200, description: 'Bundle order cancelled successfully' })
  async cancelBundleOrder(@Param('id') id: string, @Request() req) {
    // Implementation would cancel bundle order and restore stock
    // This is a placeholder for the actual implementation
    return { message: 'Bundle order cancelled successfully' };
  }
}
