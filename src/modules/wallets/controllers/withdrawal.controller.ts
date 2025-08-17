import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
  HttpStatus,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../users/entities/user.entity';
import { WithdrawalService } from '../services/withdrawal.service';
import {
  CreateWithdrawalRequestDto,
  ProcessWithdrawalRequestDto,
  GetWithdrawalRequestsDto,
  WithdrawalStatsDto,
} from '../dto/withdrawal-request.dto';
import { WithdrawalRequest } from '../entities/withdrawal-request.entity';

@ApiTags('Wallet Withdrawals')
@Controller('wallets/withdrawals')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class WithdrawalController {
  constructor(private readonly withdrawalService: WithdrawalService) {}

  @Post('request')
  @UseGuards(RolesGuard)
  @Roles(UserRole.GROWTH_ASSOCIATE, UserRole.GROWTH_ELITE)
  @ApiOperation({
    summary: 'Create Nibia withdrawal request',
    description: 'Create a new withdrawal request for GA/GE users to convert Nibia to NGN',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Withdrawal request created successfully',
    type: WithdrawalRequest,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Only Growth Associates and Growth Elites can create withdrawal requests',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Insufficient balance or invalid withdrawal amount',
  })
  async createWithdrawalRequest(
    @Request() req: any,
    @Body() createDto: CreateWithdrawalRequestDto,
  ) {
    return await this.withdrawalService.createWithdrawalRequest(req.user.id, createDto);
  }

  @Get('my-requests')
  @ApiOperation({
    summary: 'Get my withdrawal requests',
    description: 'Get all withdrawal requests for the authenticated user',
  })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User withdrawal requests retrieved successfully',
  })
  async getMyWithdrawalRequests(
    @Request() req: any,
    @Query() queryDto: GetWithdrawalRequestsDto,
  ) {
    return await this.withdrawalService.getUserWithdrawalRequests(req.user.id, queryDto);
  }

  @Get('admin/all')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get all withdrawal requests (Admin)',
    description: 'Admin endpoint to get all withdrawal requests system-wide',
  })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status' })
  @ApiQuery({ name: 'userId', required: false, description: 'Filter by user ID' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'All withdrawal requests retrieved successfully',
  })
  async getAllWithdrawalRequests(@Query() queryDto: GetWithdrawalRequestsDto) {
    return await this.withdrawalService.getAllWithdrawalRequests(queryDto);
  }

  @Patch('admin/:requestId/process')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Process withdrawal request (Admin)',
    description: 'Admin endpoint to approve or reject withdrawal requests',
  })
  @ApiParam({ name: 'requestId', description: 'Withdrawal request ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Withdrawal request processed successfully',
    type: WithdrawalRequest,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Withdrawal request not found',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid admin password',
  })
  async processWithdrawalRequest(
    @Param('requestId') requestId: string,
    @Request() req: any,
    @Body() processDto: ProcessWithdrawalRequestDto,
  ) {
    return await this.withdrawalService.processWithdrawalRequest(
      requestId,
      req.user.id,
      processDto,
    );
  }

  @Get('admin/stats')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get withdrawal statistics (Admin)',
    description: 'Admin endpoint to get comprehensive withdrawal statistics',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Withdrawal statistics retrieved successfully',
    type: WithdrawalStatsDto,
  })
  async getWithdrawalStats() {
    return await this.withdrawalService.getWithdrawalStats();
  }

  @Get(':requestId')
  @ApiOperation({
    summary: 'Get withdrawal request details',
    description: 'Get details of a specific withdrawal request',
  })
  @ApiParam({ name: 'requestId', description: 'Withdrawal request ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Withdrawal request details retrieved successfully',
    type: WithdrawalRequest,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Withdrawal request not found',
  })
  async getWithdrawalRequest(
    @Param('requestId') requestId: string,
    @Request() req: any,
  ) {
    return await this.withdrawalService.getWithdrawalRequestById(requestId, req.user.id, req.user.role);
  }

  @Post('admin/enable-withdrawal/:userId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Enable withdrawal for user (Admin)',
    description: 'Admin endpoint to enable Nibia withdrawal for GA/GE users',
  })
  @ApiParam({ name: 'userId', description: 'User ID to enable withdrawal for' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Withdrawal enabled successfully',
  })
  async enableWithdrawal(@Param('userId') userId: string) {
    await this.withdrawalService.enableWithdrawalForUser(userId);
    return { message: 'Nibia withdrawal enabled for user', userId };
  }

  @Post('admin/disable-withdrawal/:userId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Disable withdrawal for user (Admin)',
    description: 'Admin endpoint to disable Nibia withdrawal for users',
  })
  @ApiParam({ name: 'userId', description: 'User ID to disable withdrawal for' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Withdrawal disabled successfully',
  })
  async disableWithdrawal(@Param('userId') userId: string) {
    await this.withdrawalService.disableWithdrawalForUser(userId);
    return { message: 'Nibia withdrawal disabled for user', userId };
  }
}
