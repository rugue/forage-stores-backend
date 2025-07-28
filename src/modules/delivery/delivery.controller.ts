import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  Query,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { DeliveryService } from './delivery.service';
import {
  CreateDeliveryDto,
  AssignRiderDto,
  RiderResponseDto,
  UpdateDeliveryStatusDto,
  ReleasePaymentDto,
  RateDeliveryDto,
  DeliveryFilterDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('delivery')
@Controller('delivery')
export class DeliveryController {
  constructor(private readonly deliveryService: DeliveryService) {}

  @Post()
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new delivery for an order' })
  @ApiResponse({ status: 201, description: 'The delivery has been successfully created' })
  async create(@Body() createDeliveryDto: CreateDeliveryDto) {
    return this.deliveryService.create(createDeliveryDto);
  }

  @Get()
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get deliveries with optional filtering' })
  @ApiResponse({ status: 200, description: 'Returns deliveries matching the filter criteria' })
  async findAll(@Query() filterDto: DeliveryFilterDto, @CurrentUser() user: any) {
    // For non-admin users, filter based on their role
    if (user.role !== UserRole.ADMIN && !user.roles?.includes(UserRole.ADMIN)) {
      if (user.roles?.includes(UserRole.RIDER)) {
        // Riders can only see deliveries assigned to them
        filterDto.riderId = user.id;
      } else {
        // Regular users can only see their own deliveries
        filterDto.customerId = user.id;
      }
    }
    
    return this.deliveryService.findAll(filterDto);
  }

  @Get('my-deliveries')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get deliveries for the current user' })
  @ApiResponse({ status: 200, description: 'Returns the user\'s deliveries' })
  async findMyDeliveries(@CurrentUser() user: any) {
    if (user.roles?.includes(UserRole.RIDER)) {
      // Get deliveries assigned to this rider
      return this.deliveryService.findAll({ riderId: user.id });
    } else {
      // Get deliveries for this customer
      return this.deliveryService.findAll({ customerId: user.id });
    }
  }

  @Get('order/:orderId')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get delivery for a specific order' })
  @ApiResponse({ status: 200, description: 'Returns the delivery for the order' })
  @ApiResponse({ status: 404, description: 'Delivery not found for this order' })
  async findByOrderId(@Param('orderId') orderId: string, @CurrentUser() user: any) {
    const delivery = await this.deliveryService.findByOrderId(orderId);
    
    // For non-admin users, check permissions
    if (user.role !== UserRole.ADMIN && !user.roles?.includes(UserRole.ADMIN)) {
      const isRider = user.roles?.includes(UserRole.RIDER);
      
      if (isRider && delivery.riderId?.toString() !== user.id) {
        throw new ForbiddenException('You are not assigned to this delivery');
      }
      
      if (!isRider && delivery.customerId.toString() !== user.id) {
        throw new ForbiddenException('This delivery does not belong to you');
      }
    }
    
    return delivery;
  }

  @Get(':id')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get a delivery by ID' })
  @ApiResponse({ status: 200, description: 'Returns the delivery' })
  @ApiResponse({ status: 404, description: 'Delivery not found' })
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    const delivery = await this.deliveryService.findOne(id);
    
    // For non-admin users, check permissions
    if (user.role !== UserRole.ADMIN && !user.roles?.includes(UserRole.ADMIN)) {
      const isRider = user.roles?.includes(UserRole.RIDER);
      
      if (isRider && delivery.riderId?.toString() !== user.id) {
        throw new ForbiddenException('You are not assigned to this delivery');
      }
      
      if (!isRider && delivery.customerId.toString() !== user.id) {
        throw new ForbiddenException('This delivery does not belong to you');
      }
    }
    
    return delivery;
  }

  @Post(':id/assign')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Assign a rider to a delivery' })
  @ApiResponse({ status: 200, description: 'Rider successfully assigned' })
  @ApiResponse({ status: 404, description: 'Delivery or rider not found' })
  async assignRider(
    @Param('id') id: string,
    @Body() assignRiderDto: AssignRiderDto,
  ) {
    return this.deliveryService.assignRider(id, assignRiderDto);
  }

  @Post(':id/respond')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Respond to a delivery assignment (accept/decline)' })
  @ApiResponse({ status: 200, description: 'Response processed successfully' })
  @ApiResponse({ status: 400, description: 'Cannot respond to this delivery' })
  async respondToAssignment(
    @Param('id') id: string,
    @Body() response: RiderResponseDto,
    @CurrentUser() user: any,
  ) {
    // Only riders can respond to assignments
    if (!user.roles?.includes(UserRole.RIDER)) {
      throw new ForbiddenException('Only riders can respond to delivery assignments');
    }
    
    return this.deliveryService.respondToAssignment(id, user.id, response);
  }

  @Patch(':id/status')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update delivery status' })
  @ApiResponse({ status: 200, description: 'Status updated successfully' })
  @ApiResponse({ status: 404, description: 'Delivery not found' })
  async updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateDeliveryStatusDto,
    @CurrentUser() user: any,
  ) {
    return this.deliveryService.updateStatus(id, updateStatusDto, user.id, user.role);
  }

  @Post(':id/release-payment')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Release payment to rider for completed delivery' })
  @ApiResponse({ status: 200, description: 'Payment released successfully' })
  @ApiResponse({ status: 404, description: 'Delivery not found' })
  async releasePayment(
    @Param('id') id: string,
    @Body() releasePaymentDto: ReleasePaymentDto,
    @CurrentUser() user: any,
  ) {
    return this.deliveryService.releasePayment(id, releasePaymentDto, user.role);
  }

  @Post(':id/rate')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Rate a delivery' })
  @ApiResponse({ status: 200, description: 'Rating submitted successfully' })
  @ApiResponse({ status: 404, description: 'Delivery not found' })
  async rateDelivery(
    @Param('id') id: string,
    @Body() rateDeliveryDto: RateDeliveryDto,
    @CurrentUser() user: any,
  ) {
    return this.deliveryService.rateDelivery(id, rateDeliveryDto, user.id);
  }
}
