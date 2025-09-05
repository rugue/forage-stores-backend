import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { RiderAssignmentService, RiderAssignmentCriteria } from './services/rider-assignment.service';
import { DeliveryOrchestrationService } from './services/delivery-orchestration.service';
import { IsString, IsNotEmpty, IsNumber, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ManualAssignmentDto {
  @ApiProperty({ description: 'Order ID to assign rider to' })
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @ApiProperty({ description: 'Rider ID to assign' })
  @IsString()
  @IsNotEmpty()
  riderId: string;
}

export class DeliveryAddressDto {
  @ApiProperty({ description: 'Latitude coordinate' })
  @IsNumber()
  latitude: number;

  @ApiProperty({ description: 'Longitude coordinate' })
  @IsNumber()
  longitude: number;

  @ApiProperty({ description: 'City name' })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({ description: 'State name' })
  @IsString()
  @IsNotEmpty()
  state: string;
}

export class RiderAssignmentDto {
  @ApiProperty({ description: 'Order ID' })
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @ApiProperty({ description: 'Delivery address with coordinates' })
  deliveryAddress: DeliveryAddressDto;

  @ApiProperty({ description: 'Order value in NGN' })
  @IsNumber()
  orderValue: number;

  @ApiProperty({ description: 'Delivery fee in NGN' })
  @IsNumber()
  deliveryFee: number;

  @ApiProperty({ description: 'Order urgency level', enum: ['low', 'medium', 'high'] })
  @IsEnum(['low', 'medium', 'high'])
  urgency: 'low' | 'medium' | 'high';
}

export class ReassignmentDto {
  @ApiProperty({ description: 'Order ID to reassign' })
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @ApiProperty({ description: 'Reason for reassignment' })
  @IsString()
  @IsNotEmpty()
  reason: string;
}

export class MetricsQueryDto {
  @ApiProperty({ description: 'Time frame for metrics', enum: ['day', 'week', 'month'], required: false })
  @IsOptional()
  @IsEnum(['day', 'week', 'month'])
  timeframe?: 'day' | 'week' | 'month';
}

@ApiTags('delivery-management')
@Controller('delivery-management')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class DeliveryManagementController {
  constructor(
    private readonly riderAssignmentService: RiderAssignmentService,
    private readonly deliveryOrchestrationService: DeliveryOrchestrationService,
  ) {}

  @Post('assign-rider')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Assign rider to order automatically' })
  @ApiResponse({ status: 200, description: 'Rider assignment result' })
  async assignRider(@Body() assignmentDto: RiderAssignmentDto) {
    try {
      const criteria: RiderAssignmentCriteria = {
        orderId: assignmentDto.orderId,
        deliveryAddress: assignmentDto.deliveryAddress,
        orderValue: assignmentDto.orderValue,
        deliveryFee: assignmentDto.deliveryFee,
        urgency: assignmentDto.urgency,
      };

      const result = await this.riderAssignmentService.assignRider(criteria);
      
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        `Failed to assign rider: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('assign-rider-manual')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Manually assign specific rider to order' })
  @ApiResponse({ status: 200, description: 'Manual assignment successful' })
  async manuallyAssignRider(@Body() assignmentDto: ManualAssignmentDto) {
    try {
      const success = await this.deliveryOrchestrationService.manuallyAssignRider(
        assignmentDto.orderId,
        assignmentDto.riderId,
        'admin', // TODO: Get from authenticated user
      );

      if (!success) {
        throw new HttpException('Failed to assign rider manually', HttpStatus.BAD_REQUEST);
      }

      return {
        success: true,
        message: 'Rider assigned successfully',
      };
    } catch (error) {
      throw new HttpException(
        `Failed to manually assign rider: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('reassign-order')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Reassign order to a different rider' })
  @ApiResponse({ status: 200, description: 'Order reassignment result' })
  async reassignOrder(@Body() reassignmentDto: ReassignmentDto) {
    try {
      const result = await this.riderAssignmentService.reassignOrder(
        reassignmentDto.orderId,
        reassignmentDto.reason,
      );

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        `Failed to reassign order: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('pending-assignments')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get orders pending rider assignment' })
  @ApiResponse({ status: 200, description: 'List of orders pending assignment' })
  async getPendingAssignments() {
    try {
      const orders = await this.deliveryOrchestrationService.getPendingAssignments();
      
      return {
        success: true,
        data: orders,
        count: orders.length,
      };
    } catch (error) {
      throw new HttpException(
        `Failed to get pending assignments: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('assignment-analytics')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get rider assignment analytics' })
  @ApiResponse({ status: 200, description: 'Assignment analytics data' })
  async getAssignmentAnalytics(@Query() query: MetricsQueryDto) {
    try {
      const analytics = await this.riderAssignmentService.getAssignmentAnalytics(
        query.timeframe || 'day',
      );

      return {
        success: true,
        data: analytics,
      };
    } catch (error) {
      throw new HttpException(
        `Failed to get assignment analytics: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('delivery-metrics')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get delivery performance metrics' })
  @ApiResponse({ status: 200, description: 'Delivery performance metrics' })
  async getDeliveryMetrics(@Query() query: MetricsQueryDto) {
    try {
      const metrics = await this.deliveryOrchestrationService.getDeliveryMetrics(
        query.timeframe || 'day',
      );

      return {
        success: true,
        data: metrics,
      };
    } catch (error) {
      throw new HttpException(
        `Failed to get delivery metrics: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('process-order/:orderId')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Process order for delivery assignment' })
  @ApiResponse({ status: 200, description: 'Order processed for delivery' })
  async processOrderForDelivery(@Param('orderId') orderId: string) {
    try {
      await this.deliveryOrchestrationService.processOrderForDelivery(orderId);
      
      return {
        success: true,
        message: 'Order processed for delivery',
      };
    } catch (error) {
      throw new HttpException(
        `Failed to process order for delivery: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('rider-unavailable/:riderId')
  @Roles(UserRole.ADMIN, UserRole.RIDER)
  @ApiOperation({ summary: 'Handle rider becoming unavailable' })
  @ApiResponse({ status: 200, description: 'Rider unavailability handled' })
  async handleRiderUnavailable(
    @Param('riderId') riderId: string,
    @Body('reason') reason: string,
  ) {
    try {
      await this.deliveryOrchestrationService.handleRiderUnavailable(riderId, reason);
      
      return {
        success: true,
        message: 'Rider unavailability handled, affected orders reassigned',
      };
    } catch (error) {
      throw new HttpException(
        `Failed to handle rider unavailability: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
