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
} from '@nestjs/swagger';
import { SubscriptionsService } from './subscriptions.service';
import {
  CreateSubscriptionDto,
  UpdateSubscriptionDto,
  ProcessDropDto,
  SubscriptionFilterDto,
} from './dto';
import { JwtAuthGuard, RolesGuard } from '../auth/guards';
import { Roles, CurrentUser } from '../auth/decorators';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('subscriptions')
@Controller('subscriptions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new subscription from an order' })
  @ApiResponse({ status: 201, description: 'Subscription created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - order not eligible for subscription' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  create(
    @CurrentUser('sub') userId: string,
    @Body() createSubscriptionDto: CreateSubscriptionDto,
  ) {
    return this.subscriptionsService.create(userId, createSubscriptionDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all subscriptions (filtered by query params)' })
  @ApiResponse({ status: 200, description: 'List of subscriptions' })
  findAll(@Query() filterDto: SubscriptionFilterDto) {
    return this.subscriptionsService.findAll(filterDto);
  }

  @Get('my-subscriptions')
  @ApiOperation({ summary: 'Get all subscriptions for the current user' })
  @ApiResponse({ status: 200, description: 'List of user subscriptions' })
  findAllByUser(@CurrentUser('sub') userId: string) {
    return this.subscriptionsService.findAllByUser(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get subscription by ID' })
  @ApiResponse({ status: 200, description: 'Subscription details' })
  @ApiResponse({ status: 404, description: 'Subscription not found' })
  findOne(@Param('id') id: string) {
    return this.subscriptionsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update subscription (pause, cancel, etc.)' })
  @ApiResponse({ status: 200, description: 'Subscription updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - invalid update' })
  @ApiResponse({ status: 404, description: 'Subscription not found' })
  update(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') userRole: UserRole,
    @Body() updateSubscriptionDto: UpdateSubscriptionDto,
  ) {
    return this.subscriptionsService.update(id, userId, userRole, updateSubscriptionDto);
  }

  @Post(':id/process-drop')
  @ApiOperation({ summary: 'Process the next drop for a subscription' })
  @ApiResponse({ status: 200, description: 'Drop processed successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - no pending drops or insufficient balance' })
  @ApiResponse({ status: 404, description: 'Subscription not found' })
  @HttpCode(HttpStatus.OK)
  processNextDrop(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') userRole: UserRole,
    @Body() processDropDto: ProcessDropDto,
  ) {
    return this.subscriptionsService.processNextDrop(id, userId, userRole, processDropDto);
  }

  @Post('admin/:id/process-drop')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: Process the next drop for any subscription' })
  @ApiResponse({ status: 200, description: 'Drop processed successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - no pending drops' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires admin role' })
  @ApiResponse({ status: 404, description: 'Subscription not found' })
  @HttpCode(HttpStatus.OK)
  adminProcessDrop(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') userRole: UserRole,
    @Body() processDropDto: ProcessDropDto,
  ) {
    // Force mark as paid for admin (no wallet deduction)
    const adminProcessDto = { ...processDropDto, markAsPaid: true };
    return this.subscriptionsService.processNextDrop(id, userId, userRole, adminProcessDto);
  }
}
