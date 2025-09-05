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
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../users/entities/user.entity';
import { 
  RefundCancellationService, 
  CancellationRequest, 
  RefundRequest, 
  RefundReason, 
  RefundType 
} from '../services/refund-cancellation.service';
import { IsString, IsNotEmpty, IsOptional, IsEnum, IsNumber, Min, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CancelOrderDto {
  @ApiProperty({ description: 'Order ID to cancel' })
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @ApiProperty({ description: 'Reason for cancellation', enum: RefundReason })
  @IsEnum(RefundReason)
  reason: RefundReason;

  @ApiProperty({ description: 'Custom reason description', required: false })
  @IsOptional()
  @IsString()
  customReason?: string;
}

export class ProcessRefundDto {
  @ApiProperty({ description: 'Order ID for refund' })
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @ApiProperty({ description: 'Refund type', enum: RefundType })
  @IsEnum(RefundType)
  type: RefundType;

  @ApiProperty({ description: 'Reason for refund', enum: RefundReason })
  @IsEnum(RefundReason)
  reason: RefundReason;

  @ApiProperty({ description: 'Custom reason description', required: false })
  @IsOptional()
  @IsString()
  customReason?: string;

  @ApiProperty({ description: 'Refund amount in NGN' })
  @IsNumber()
  @Min(0)
  refundAmount: number;

  @ApiProperty({ description: 'Processing fee (admin override)', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  processingFee?: number;

  @ApiProperty({ description: 'Admin notes', required: false })
  @IsOptional()
  @IsString()
  adminNotes?: string;
}

export class RefundHistoryQueryDto {
  @ApiProperty({ description: 'Number of records to return', required: false, default: 20 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number = 20;

  @ApiProperty({ description: 'Offset for pagination', required: false, default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  offset?: number = 0;
}

export class AnalyticsQueryDto {
  @ApiProperty({ description: 'Time frame for analytics', enum: ['day', 'week', 'month'], required: false })
  @IsOptional()
  @IsEnum(['day', 'week', 'month'])
  timeframe?: 'day' | 'week' | 'month';
}

@ApiTags('refunds-cancellations')
@Controller('refunds')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class RefundCancellationController {
  constructor(
    private readonly refundCancellationService: RefundCancellationService,
  ) {}

  @Post('cancel-order')
  @Roles(UserRole.USER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Cancel an order with automatic refund processing' })
  @ApiResponse({ status: 200, description: 'Order cancellation result' })
  async cancelOrder(@Body() cancelDto: CancelOrderDto, @Req() req: any) {
    try {
      const userId = req.user.id;
      const userRole = req.user.role;

      const cancellationRequest: CancellationRequest = {
        orderId: cancelDto.orderId,
        userId,
        reason: cancelDto.reason,
        customReason: cancelDto.customReason,
        requestedBy: userRole === UserRole.ADMIN ? `admin:${userId}` : `user:${userId}`,
        adminApproval: userRole === UserRole.ADMIN,
      };

      const result = await this.refundCancellationService.cancelOrder(cancellationRequest);

      return {
        success: result.success,
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        `Failed to cancel order: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('process-refund')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Process refund for an order (Admin only)' })
  @ApiResponse({ status: 200, description: 'Refund processing result' })
  async processRefund(@Body() refundDto: ProcessRefundDto, @Req() req: any) {
    try {
      const adminId = req.user.id;

      const refundRequest: RefundRequest = {
        orderId: refundDto.orderId,
        userId: req.user.id, // Will be validated against order ownership
        type: refundDto.type,
        reason: refundDto.reason,
        customReason: refundDto.customReason,
        refundAmount: refundDto.refundAmount,
        processingFee: refundDto.processingFee,
        requestedBy: `admin:${adminId}`,
        adminNotes: refundDto.adminNotes,
      };

      const result = await this.refundCancellationService.processRefund(refundRequest);

      return {
        success: result.success,
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        `Failed to process refund: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('eligibility/:orderId')
  @Roles(UserRole.USER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Check refund eligibility for an order' })
  @ApiResponse({ status: 200, description: 'Refund eligibility information' })
  async getRefundEligibility(@Param('orderId') orderId: string, @Req() req: any) {
    try {
      const userId = req.user.id;
      const eligibility = await this.refundCancellationService.getRefundEligibility(orderId, userId);

      return {
        success: true,
        data: eligibility,
      };
    } catch (error) {
      throw new HttpException(
        `Failed to check refund eligibility: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('history')
  @Roles(UserRole.USER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get refund history for the authenticated user' })
  @ApiResponse({ status: 200, description: 'Refund history list' })
  async getRefundHistory(@Query() query: RefundHistoryQueryDto, @Req() req: any) {
    try {
      const userId = req.user.id;
      const history = await this.refundCancellationService.getRefundHistory(
        userId,
        query.limit || 20,
        query.offset || 0
      );

      return {
        success: true,
        data: history,
      };
    } catch (error) {
      throw new HttpException(
        `Failed to get refund history: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('analytics')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get refund and cancellation analytics (Admin only)' })
  @ApiResponse({ status: 200, description: 'Refund analytics data' })
  async getRefundAnalytics(@Query() query: AnalyticsQueryDto) {
    try {
      const analytics = await this.refundCancellationService.getRefundAnalytics(
        query.timeframe || 'month'
      );

      return {
        success: true,
        data: analytics,
      };
    } catch (error) {
      throw new HttpException(
        `Failed to get refund analytics: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('reasons')
  @Roles(UserRole.USER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get available refund/cancellation reasons' })
  @ApiResponse({ status: 200, description: 'Available refund reasons' })
  getRefundReasons() {
    return {
      success: true,
      data: {
        reasons: Object.values(RefundReason).map(reason => ({
          value: reason,
          label: this.getReasonLabel(reason),
          description: this.getReasonDescription(reason),
        })),
        types: Object.values(RefundType).map(type => ({
          value: type,
          label: this.getTypeLabel(type),
        })),
      },
    };
  }

  private getReasonLabel(reason: RefundReason): string {
    const labels = {
      [RefundReason.CUSTOMER_REQUEST]: 'Customer Request',
      [RefundReason.PRODUCT_UNAVAILABLE]: 'Product Unavailable',
      [RefundReason.QUALITY_ISSUE]: 'Quality Issue',
      [RefundReason.DELIVERY_FAILURE]: 'Delivery Failure',
      [RefundReason.PAYMENT_DISPUTE]: 'Payment Dispute',
      [RefundReason.ADMIN_DECISION]: 'Admin Decision',
      [RefundReason.SYSTEM_ERROR]: 'System Error',
    };
    return labels[reason] || reason;
  }

  private getReasonDescription(reason: RefundReason): string {
    const descriptions = {
      [RefundReason.CUSTOMER_REQUEST]: 'Customer requested cancellation',
      [RefundReason.PRODUCT_UNAVAILABLE]: 'Product is out of stock or unavailable',
      [RefundReason.QUALITY_ISSUE]: 'Product quality does not meet standards',
      [RefundReason.DELIVERY_FAILURE]: 'Failed to deliver within expected timeframe',
      [RefundReason.PAYMENT_DISPUTE]: 'Payment related dispute or chargeback',
      [RefundReason.ADMIN_DECISION]: 'Administrative decision to cancel/refund',
      [RefundReason.SYSTEM_ERROR]: 'Technical error in order processing',
    };
    return descriptions[reason] || '';
  }

  private getTypeLabel(type: RefundType): string {
    const labels = {
      [RefundType.FULL]: 'Full Refund',
      [RefundType.PARTIAL]: 'Partial Refund',
      [RefundType.PROCESSING_FEE_DEDUCTION]: 'Refund with Processing Fee',
    };
    return labels[type] || type;
  }
}
