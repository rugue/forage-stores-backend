import { 
  Controller, 
  Post, 
  Get, 
  Patch, 
  Delete, 
  Body, 
  Param, 
  Query, 
  UseGuards, 
  Request,
  HttpStatus,
  HttpCode,
  Logger,
  ValidationPipe,
  UsePipes
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth, 
  ApiParam,
  ApiQuery 
} from '@nestjs/swagger';
import { PaymentService } from '../services/payment.service';
import { 
  PaymentInitiationDto, 
  PaymentVerificationDto, 
  RefundRequestDto,
  PaymentQueryDto,
  PaymentAnalyticsDto,
  WebhookValidationDto
} from '../dto/payment.dto';
import { Payment } from '../entities/payment.entity';
import { Refund } from '../entities/refund.entity';
import { PaymentPlanEntity } from '../entities/payment-plan.entity';
// import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
// import { RolesGuard } from '../../auth/guards/roles.guard';
// import { Roles } from '../../auth/decorators/roles.decorator';

@ApiTags('Payments')
@Controller('payments')
@UsePipes(new ValidationPipe({ transform: true }))
export class PaymentController {
  private readonly logger = new Logger(PaymentController.name);

  constructor(private readonly paymentService: PaymentService) {}

  @Post('initiate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Initiate a payment' })
  @ApiResponse({ status: 200, description: 'Payment initiated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  // @UseGuards(JwtAuthGuard)
  // @ApiBearerAuth()
  async initiatePayment(
    @Request() req: any,
    @Body() dto: PaymentInitiationDto,
  ) {
    const userId = req.user?.id || 'mock-user-id'; // Mock for development
    this.logger.log(`Payment initiation request for user ${userId}`);
    
    return await this.paymentService.initiatePayment(userId, dto);
  }

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify a payment' })
  @ApiResponse({ status: 200, description: 'Payment verified successfully' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  async verifyPayment(@Body() dto: PaymentVerificationDto) {
    this.logger.log(`Payment verification request for reference ${dto.reference}`);
    
    return await this.paymentService.verifyPayment(dto);
  }

  @Post('refund')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request a refund' })
  @ApiResponse({ status: 200, description: 'Refund processed successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  // @UseGuards(JwtAuthGuard)
  // @ApiBearerAuth()
  async processRefund(
    @Request() req: any,
    @Body() dto: RefundRequestDto,
  ) {
    const userId = req.user?.id || 'mock-user-id'; // Mock for development
    this.logger.log(`Refund request for payment ${dto.paymentId} by user ${userId}`);
    
    return await this.paymentService.processRefund(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get payments with pagination and filters' })
  @ApiResponse({ status: 200, description: 'Payments retrieved successfully', type: [Payment] })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'paymentType', required: false, type: String })
  @ApiQuery({ name: 'paymentMethod', required: false, type: String })
  @ApiQuery({ name: 'gateway', required: false, type: String })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiQuery({ name: 'userId', required: false, type: String })
  @ApiQuery({ name: 'orderId', required: false, type: String })
  // @UseGuards(JwtAuthGuard)
  // @ApiBearerAuth()
  async getPayments(
    @Request() req: any,
    @Query() dto: PaymentQueryDto,
  ) {
    const userId = req.user?.id; // Optional for admin access
    this.logger.log(`Getting payments for user ${userId || 'admin'}`);
    
    return await this.paymentService.getPayments(dto, userId);
  }

  @Get('analytics')
  @ApiOperation({ summary: 'Get payment analytics' })
  @ApiResponse({ status: 200, description: 'Analytics retrieved successfully' })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiQuery({ name: 'groupBy', required: false, enum: ['day', 'week', 'month'] })
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles('admin', 'finance')
  // @ApiBearerAuth()
  async getPaymentAnalytics(@Query() dto: PaymentAnalyticsDto) {
    this.logger.log('Getting payment analytics');
    
    return await this.paymentService.getPaymentAnalytics(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get payment by ID' })
  @ApiParam({ name: 'id', description: 'Payment ID' })
  @ApiResponse({ status: 200, description: 'Payment retrieved successfully', type: Payment })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  // @UseGuards(JwtAuthGuard)
  // @ApiBearerAuth()
  async getPaymentById(
    @Request() req: any,
    @Param('id') paymentId: string,
  ) {
    const userId = req.user?.id; // Optional for admin access
    this.logger.log(`Getting payment ${paymentId} for user ${userId || 'admin'}`);
    
    return await this.paymentService.getPaymentById(paymentId, userId);
  }

  // Webhook endpoints for payment gateways
  @Post('webhooks/paystack')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Paystack webhook endpoint' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  async paystackWebhook(@Body() payload: any) {
    this.logger.log('Paystack webhook received');
    
    // TODO: Implement webhook validation and processing
    // For now, just log the payload
    this.logger.debug('Paystack webhook payload:', payload);
    
    return { message: 'Webhook received' };
  }

  @Post('webhooks/flutterwave')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Flutterwave webhook endpoint' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  async flutterwaveWebhook(@Body() payload: any) {
    this.logger.log('Flutterwave webhook received');
    
    // TODO: Implement webhook validation and processing
    // For now, just log the payload
    this.logger.debug('Flutterwave webhook payload:', payload);
    
    return { message: 'Webhook received' };
  }
}

// Admin Payment Controller for administrative operations
@ApiTags('Admin - Payments')
@Controller('admin/payments')
@UsePipes(new ValidationPipe({ transform: true }))
export class AdminPaymentController {
  private readonly logger = new Logger(AdminPaymentController.name);

  constructor(private readonly paymentService: PaymentService) {}

  @Get()
  @ApiOperation({ summary: 'Get all payments (admin)' })
  @ApiResponse({ status: 200, description: 'Payments retrieved successfully' })
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles('admin', 'finance')
  // @ApiBearerAuth()
  async getAllPayments(@Query() dto: PaymentQueryDto) {
    this.logger.log('Admin getting all payments');
    
    return await this.paymentService.getPayments(dto);
  }

  @Get('analytics')
  @ApiOperation({ summary: 'Get comprehensive payment analytics (admin)' })
  @ApiResponse({ status: 200, description: 'Analytics retrieved successfully' })
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles('admin', 'finance')
  // @ApiBearerAuth()
  async getComprehensiveAnalytics(@Query() dto: PaymentAnalyticsDto) {
    this.logger.log('Admin getting payment analytics');
    
    return await this.paymentService.getPaymentAnalytics(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get any payment by ID (admin)' })
  @ApiParam({ name: 'id', description: 'Payment ID' })
  @ApiResponse({ status: 200, description: 'Payment retrieved successfully', type: Payment })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles('admin', 'finance')
  // @ApiBearerAuth()
  async getAnyPaymentById(@Param('id') paymentId: string) {
    this.logger.log(`Admin getting payment ${paymentId}`);
    
    return await this.paymentService.getPaymentById(paymentId);
  }

  @Post(':id/manual-verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Manually verify a payment (admin)' })
  @ApiParam({ name: 'id', description: 'Payment ID' })
  @ApiResponse({ status: 200, description: 'Payment manually verified' })
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles('admin')
  // @ApiBearerAuth()
  async manuallyVerifyPayment(@Param('id') paymentId: string) {
    this.logger.log(`Admin manually verifying payment ${paymentId}`);
    
    // TODO: Implement manual verification logic
    return { message: 'Payment manually verified', paymentId };
  }
}
