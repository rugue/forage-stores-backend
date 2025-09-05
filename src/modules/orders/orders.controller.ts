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
  Req,
  Res,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { Request, Response } from 'express';
import { OrdersService } from './orders.service';
import { OrderRealTimeService } from './gateways/orders.gateway';
import { BulkOperationsService } from './services/bulk-operations.service';
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
import { UserRole } from '../users/entities/user.entity';

@ApiTags('orders')
@Controller('orders')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly realTimeService: OrderRealTimeService,
    private readonly bulkOperationsService: BulkOperationsService,
  ) {}

  // Cart Management Endpoints
  @Post('cart/add')
  @ApiOperation({ summary: 'Add item to cart' })
  @ApiResponse({ status: 201, description: 'Item added to cart successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - insufficient stock or invalid data' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  addToCart(
    @CurrentUser('id') userId: string,
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
    @CurrentUser('id') userId: string,
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
    @CurrentUser('id') userId: string,
    @Body() removeFromCartDto: RemoveFromCartDto,
  ) {
    return this.ordersService.removeFromCart(userId, removeFromCartDto);
  }

  @Get('cart')
  @ApiOperation({ summary: 'Get user cart' })
  @ApiResponse({ status: 200, description: 'Cart retrieved successfully' })
  getCart(@CurrentUser('id') userId: string) {
    return this.ordersService.getCart(userId);
  }

  @Delete('cart')
  @ApiOperation({ summary: 'Clear user cart' })
  @ApiResponse({ status: 200, description: 'Cart cleared successfully' })
  @HttpCode(HttpStatus.OK)
  clearCart(@CurrentUser('id') userId: string) {
    return this.ordersService.clearCart(userId);
  }

  // Order Management Endpoints
  @Post('checkout')
  @ApiOperation({ summary: 'Checkout cart and create order' })
  @ApiResponse({ status: 201, description: 'Order created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - empty cart or validation error' })
  @ApiResponse({ status: 404, description: 'Product not found or insufficient stock' })
  checkout(
    @CurrentUser('id') userId: string,
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
    @CurrentUser('id') userId: string,
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
    @CurrentUser('id') userId: string,
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
    @CurrentUser('id') userId: string,
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
    @CurrentUser('id') userId: string,
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

  @Post(':id/enhanced-credit-approval')
  @ApiOperation({ summary: 'Enhanced credit approval using qualification engine' })
  @ApiResponse({ status: 200, description: 'Enhanced credit approval completed' })
  @ApiResponse({ status: 400, description: 'Bad request - not a Pay Later order' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @HttpCode(HttpStatus.OK)
  enhancedCreditApproval(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.ordersService.enhancedCreditApproval(id, userId);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Change order status using state machine validation' })
  @ApiResponse({ status: 200, description: 'Order status changed successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - invalid state transition' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  changeOrderStatus(
    @Param('id') id: string,
    @Body() body: { newStatus: string; action: string; reason?: string },
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
  ) {
    return this.ordersService.changeOrderStatus(
      id,
      body.newStatus as any,
      body.action,
      userId,
      userRole,
      body.reason
    );
  }

  @Get(':id/valid-actions')
  @ApiOperation({ summary: 'Get valid actions for an order in its current state' })
  @ApiResponse({ status: 200, description: 'Valid actions retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - can only view own orders' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  getValidOrderActions(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
  ) {
    return this.ordersService.getValidOrderActions(id, userId, userRole);
  }

  @Get('state-machine/documentation')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get order state machine documentation (Admin only)' })
  @ApiResponse({ status: 200, description: 'State machine documentation retrieved' })
  getStateMachineDocumentation() {
    return this.ordersService.getOrderStateMachineDocumentation();
  }

  @Get('events/subscribe')
  @ApiOperation({
    summary: 'Subscribe to real-time order updates (Server-Sent Events)',
    description: 'Establishes a Server-Sent Events connection for real-time order updates',
  })
  @ApiResponse({
    status: 200,
    description: 'SSE connection established',
    headers: {
      'Content-Type': { description: 'text/event-stream' },
      'Cache-Control': { description: 'no-cache' },
      'Connection': { description: 'keep-alive' },
    },
  })
  async subscribeToEvents(@Req() req: Request, @Res() res: Response) {
    // Set up Server-Sent Events
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    });

    // Extract user ID from request (assuming JWT middleware has set it)
    const userId = (req as any).user?.id;
    const userRole = (req as any).user?.role;

    if (!userId) {
      res.write('event: error\n');
      res.write('data: {"message": "Authentication required"}\n\n');
      res.end();
      return;
    }

    // Subscribe user to real-time updates
    const subscriptionId = this.realTimeService.subscribeToOrderUpdates(userId, userRole);

    // Send initial connection confirmation
    res.write('event: connected\n');
    res.write(`data: {"message": "Connected to order updates", "subscriptionId": "${subscriptionId}", "timestamp": "${new Date().toISOString()}"}\n\n`);

    // Set up periodic event sending
    const eventInterval = setInterval(() => {
      const events = this.realTimeService.getEventsForUser(userId);
      
      events.forEach(event => {
        res.write(`event: ${event.type}\n`);
        res.write(`data: ${JSON.stringify(event)}\n\n`);
      });
    }, 1000); // Check for events every second

    // Handle client disconnect
    req.on('close', () => {
      clearInterval(eventInterval);
      this.realTimeService.unsubscribe(userId, subscriptionId);
      res.end();
    });
  }

  @Get('events/stats')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get real-time connection statistics',
    description: 'Returns statistics about current real-time connections and subscriptions',
  })
  @ApiResponse({
    status: 200,
    description: 'Connection statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        totalSubscriptions: { type: 'number' },
        userCount: { type: 'number' },
        bufferedEvents: { type: 'number' },
        subscriptionTypes: {
          type: 'object',
          properties: {
            order_updates: { type: 'number' },
            delivery_tracking: { type: 'number' },
            payment_reminders: { type: 'number' },
          },
        },
      },
    },
  })
  async getConnectionStats() {
    return this.realTimeService.getConnectionStats();
  }

  @Post('bulk/status-update')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Bulk update order status (Admin only)',
    description: 'Update the status of multiple orders at once with state machine validation',
  })
  @ApiResponse({
    status: 200,
    description: 'Bulk update completed',
    schema: {
      type: 'object',
      properties: {
        totalOrders: { type: 'number' },
        successCount: { type: 'number' },
        failureCount: { type: 'number' },
        results: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              orderId: { type: 'string' },
              success: { type: 'boolean' },
              error: { type: 'string' },
              previousStatus: { type: 'string' },
              newStatus: { type: 'string' },
            },
          },
        },
      },
    },
  })
  async bulkUpdateStatus(
    @Body() bulkUpdate: any,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
  ) {
    return this.bulkOperationsService.bulkUpdateStatus(bulkUpdate, userId, userRole);
  }

  @Post('bulk/preview')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Preview bulk operation impact (Admin only)',
    description: 'Preview the impact of a bulk status update operation before executing it',
  })
  @ApiResponse({
    status: 200,
    description: 'Bulk operation preview generated',
    schema: {
      type: 'object',
      properties: {
        eligibleOrders: { type: 'number' },
        ineligibleOrders: { type: 'number' },
        statusDistribution: { type: 'object' },
        potentialIssues: { type: 'array', items: { type: 'string' } },
      },
    },
  })
  async previewBulkOperation(@Body() preview: any) {
    return this.bulkOperationsService.previewBulkOperation(
      preview.orderIds,
      preview.newStatus,
      preview.action
    );
  }

  @Post('bulk/filter')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get orders for bulk operations (Admin only)',
    description: 'Retrieve orders matching specific criteria for bulk operations',
  })
  @ApiResponse({
    status: 200,
    description: 'Orders retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        orders: { type: 'array' },
        totalCount: { type: 'number' },
      },
    },
  })
  async getOrdersForBulkOperation(@Body() filters: any) {
    return this.bulkOperationsService.getOrdersForBulkOperation(
      filters,
      filters.limit || 100
    );
  }
}
