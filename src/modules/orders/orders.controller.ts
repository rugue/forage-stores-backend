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
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import {
  AddToCartDto,
  UpdateCartItemDto,
  RemoveFromCartDto,
  CheckoutDto,
  PaymentDto,
  UpdateOrderDto,
  OrderFilterDto,
  CreditApprovalDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards';
import { RolesGuard } from '../auth/guards';
import { Roles } from '../auth/decorators';
import { CurrentUser } from '../auth/decorators';
import { UserRole } from '../../entities/user.entity';

@ApiTags('orders')
@Controller('orders')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // Cart Management Endpoints
  @Post('cart/add')
  @ApiOperation({ summary: 'Add item to cart' })
  @ApiResponse({ status: 201, description: 'Item added to cart successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - insufficient stock or invalid data' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  addToCart(
    @CurrentUser('sub') userId: string,
    @Body() addToCartDto: AddToCartDto,
  ) {
    return this.ordersService.addToCart(userId, addToCartDto);
  }

  @Patch('cart/:productId')
  @ApiOperation({ summary: 'Update cart item quantity' })
  @ApiResponse({ status: 200, description: 'Cart item updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - insufficient stock' })
  @ApiResponse({ status: 404, description: 'Item not found in cart' })
  updateCartItem(
    @CurrentUser('sub') userId: string,
    @Param('productId') productId: string,
    @Body() updateCartItemDto: UpdateCartItemDto,
  ) {
    return this.ordersService.updateCartItem(userId, productId, updateCartItemDto);
  }

  @Delete('cart/remove')
  @ApiOperation({ summary: 'Remove item from cart' })
  @ApiResponse({ status: 200, description: 'Item removed from cart successfully' })
  @HttpCode(HttpStatus.OK)
  removeFromCart(
    @CurrentUser('sub') userId: string,
    @Body() removeFromCartDto: RemoveFromCartDto,
  ) {
    return this.ordersService.removeFromCart(userId, removeFromCartDto);
  }

  @Get('cart')
  @ApiOperation({ summary: 'Get user cart' })
  @ApiResponse({ status: 200, description: 'Cart retrieved successfully' })
  getCart(@CurrentUser('sub') userId: string) {
    return this.ordersService.getCart(userId);
  }

  @Delete('cart')
  @ApiOperation({ summary: 'Clear user cart' })
  @ApiResponse({ status: 200, description: 'Cart cleared successfully' })
  @HttpCode(HttpStatus.OK)
  clearCart(@CurrentUser('sub') userId: string) {
    return this.ordersService.clearCart(userId);
  }

  // Order Management Endpoints
  @Post('checkout')
  @ApiOperation({ summary: 'Checkout cart and create order' })
  @ApiResponse({ status: 201, description: 'Order created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - empty cart or validation error' })
  @ApiResponse({ status: 404, description: 'Product not found or insufficient stock' })
  checkout(
    @CurrentUser('sub') userId: string,
    @Body() checkoutDto: CheckoutDto,
  ) {
    return this.ordersService.checkout(userId, checkoutDto);
  }

  @Post(':id/payment')
  @ApiOperation({ summary: 'Make payment for an order' })
  @ApiResponse({ status: 201, description: 'Payment processed successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - invalid payment amount or insufficient funds' })
  @ApiResponse({ status: 403, description: 'Forbidden - can only pay for own orders' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  makePayment(
    @Param('id') orderId: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') userRole: UserRole,
    @Body() paymentDto: PaymentDto,
  ) {
    return this.ordersService.makePayment(orderId, userId, userRole, paymentDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all orders (filtered)' })
  @ApiResponse({ status: 200, description: 'Orders retrieved successfully' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by order status' })
  @ApiQuery({ name: 'paymentPlan', required: false, description: 'Filter by payment plan' })
  @ApiQuery({ name: 'deliveryMethod', required: false, description: 'Filter by delivery method' })
  @ApiQuery({ name: 'city', required: false, description: 'Filter by city' })
  @ApiQuery({ name: 'fromDate', required: false, description: 'Filter from date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'toDate', required: false, description: 'Filter to date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'orderNumber', required: false, description: 'Search by order number' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  @ApiQuery({ name: 'sortBy', required: false, description: 'Sort by field' })
  @ApiQuery({ name: 'sortOrder', required: false, description: 'Sort order (asc/desc)' })
  findAll(
    @Query() filterDto: OrderFilterDto,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') userRole: UserRole,
  ) {
    return this.ordersService.findAll(filterDto, userId, userRole);
  }

  @Get('analytics')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get order analytics (Admin only)' })
  @ApiResponse({ status: 200, description: 'Analytics retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  getAnalytics(@CurrentUser('role') userRole: UserRole) {
    return this.ordersService.getOrderAnalytics(userRole);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order by ID' })
  @ApiResponse({ status: 200, description: 'Order retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - can only view own orders' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  findOne(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') userRole: UserRole,
  ) {
    return this.ordersService.findOne(id, userId, userRole);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update order (Admin only)' })
  @ApiResponse({ status: 200, description: 'Order updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  update(
    @Param('id') id: string,
    @Body() updateOrderDto: UpdateOrderDto,
    @CurrentUser('role') userRole: UserRole,
  ) {
    return this.ordersService.update(id, updateOrderDto, userRole);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel an order' })
  @ApiResponse({ status: 200, description: 'Order cancelled successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - cannot cancel order in current status' })
  @ApiResponse({ status: 403, description: 'Forbidden - can only cancel own orders' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @HttpCode(HttpStatus.OK)
  cancelOrder(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') userRole: UserRole,
    @Body('reason') reason: string,
  ) {
    return this.ordersService.cancelOrder(id, userId, userRole, reason);
  }

  @Post(':id/credit-approval')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Approve or reject credit check for Pay Later orders (Admin only)' })
  @ApiResponse({ status: 200, description: 'Credit check processed successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - not a Pay Later order or no pending credit check' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires admin role' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @HttpCode(HttpStatus.OK)
  approveCreditCheck(
    @Param('id') id: string,
    @Body() creditApprovalDto: CreditApprovalDto,
  ) {
    return this.ordersService.approveCreditCheck(id, creditApprovalDto);
  }
}
