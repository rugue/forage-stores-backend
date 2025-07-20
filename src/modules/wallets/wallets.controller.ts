import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { WalletsService } from './wallets.service';
import {
  UpdateBalanceDto,
  TransferFundsDto,
  LockFundsDto,
  UnlockFundsDto,
} from './dto';
import { JwtAuthGuard, RolesGuard } from '../auth/guards';
import { Roles, CurrentUser } from '../auth/decorators';
import { UserRole } from '../../entities/user.entity';
import { Wallet } from '../../entities/wallet.entity';

@ApiTags('wallets')
@Controller('wallets')
export class WalletsController {
  constructor(private readonly walletsService: WalletsService) {}

  // User endpoints
  @Get('my-wallet')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get current user wallet balance' })
  @ApiResponse({
    status: 200,
    description: 'Wallet balance retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        foodMoney: { type: 'number', example: 5000.50 },
        foodPoints: { type: 'number', example: 1250.75 },
        foodSafe: { type: 'number', example: 2000.00 },
        totalBalance: { type: 'number', example: 7000.50 },
        status: { type: 'string', example: 'active' },
        lastTransactionAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Wallet not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMyWallet(@CurrentUser() user: any) {
    const userId = user.id || user._id?.toString();
    return this.walletsService.getWalletBalance(userId);
  }

  @Post('create')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create wallet for current user' })
  @ApiResponse({
    status: 201,
    description: 'Wallet created successfully',
    type: Wallet,
  })
  @ApiResponse({ status: 400, description: 'Wallet already exists' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @HttpCode(HttpStatus.CREATED)
  async createMyWallet(@CurrentUser() user: any) {
    const userId = user.id || user._id?.toString();
    return this.walletsService.createWallet(userId);
  }

  @Post('transfer')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Transfer funds to another user' })
  @ApiResponse({
    status: 200,
    description: 'Transfer completed successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Successfully transferred ₦100.00 to recipient' },
        transactionId: { type: 'string', example: 'TXN_1234567890_abc123def' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Transfer failed - insufficient funds or invalid recipient' })
  @ApiResponse({ status: 403, description: 'Wallet not active' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @HttpCode(HttpStatus.OK)
  async transferFunds(
    @CurrentUser() user: any,
    @Body() transferFundsDto: TransferFundsDto,
  ) {
    const userId = user.id || user._id?.toString();
    return this.walletsService.transferFunds(userId, transferFundsDto);
  }

  @Post('lock-funds')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Lock funds in food safe (move from foodMoney to foodSafe)' })
  @ApiResponse({
    status: 200,
    description: 'Funds locked successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Successfully locked ₦200.00 in food safe' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Insufficient food money balance' })
  @ApiResponse({ status: 403, description: 'Wallet not active' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @HttpCode(HttpStatus.OK)
  async lockFunds(
    @CurrentUser() user: any,
    @Body() lockFundsDto: LockFundsDto,
  ) {
    const userId = user.id || user._id?.toString();
    return this.walletsService.lockFunds(userId, lockFundsDto);
  }

  @Post('unlock-funds')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Unlock funds from food safe (move from foodSafe to foodMoney)' })
  @ApiResponse({
    status: 200,
    description: 'Funds unlocked successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Successfully unlocked ₦100.00 from food safe' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Insufficient food safe balance' })
  @ApiResponse({ status: 403, description: 'Wallet not active' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @HttpCode(HttpStatus.OK)
  async unlockFunds(
    @CurrentUser() user: any,
    @Body() unlockFundsDto: UnlockFundsDto,
  ) {
    const userId = user.id || user._id?.toString();
    return this.walletsService.unlockFunds(userId, unlockFundsDto);
  }

  // Admin endpoints
  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get all wallets (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'All wallets retrieved successfully',
    type: [Wallet],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  async getAllWallets() {
    return this.walletsService.getAllWallets();
  }

  @Get('admin/stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get wallet statistics (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Wallet statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        totalWallets: { type: 'number', example: 1500 },
        activeWallets: { type: 'number', example: 1450 },
        totalFoodMoney: { type: 'number', example: 2500000.50 },
        totalFoodPoints: { type: 'number', example: 875000.25 },
        totalFoodSafe: { type: 'number', example: 1200000.00 },
        totalBalance: { type: 'number', example: 3700000.50 },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  async getWalletStats() {
    return this.walletsService.getWalletStats();
  }

  @Get('admin/user/:userId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get wallet by user ID (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'User wallet retrieved successfully',
    type: Wallet,
  })
  @ApiResponse({ status: 404, description: 'Wallet not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  async getWalletByUserId(@Param('userId') userId: string) {
    return this.walletsService.getWalletByUserId(userId);
  }

  @Get('admin/:walletId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get wallet by wallet ID (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Wallet retrieved successfully',
    type: Wallet,
  })
  @ApiResponse({ status: 404, description: 'Wallet not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  @ApiParam({ name: 'walletId', description: 'Wallet ID' })
  async getWalletById(@Param('walletId') walletId: string) {
    return this.walletsService.getWalletById(walletId);
  }

  @Post('admin/:userId/create')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create wallet for specific user (Admin only)' })
  @ApiResponse({
    status: 201,
    description: 'Wallet created successfully',
    type: Wallet,
  })
  @ApiResponse({ status: 400, description: 'Wallet already exists' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @HttpCode(HttpStatus.CREATED)
  async createWalletForUser(@Param('userId') userId: string) {
    return this.walletsService.createWallet(userId);
  }

  @Patch('admin/:userId/balance')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update user wallet balance (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Wallet balance updated successfully',
    type: Wallet,
  })
  @ApiResponse({ status: 404, description: 'Wallet not found' })
  @ApiResponse({ status: 400, description: 'Invalid transaction or insufficient funds' })
  @ApiResponse({ status: 403, description: 'Wallet not active or forbidden' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  async updateUserBalance(
    @Param('userId') userId: string,
    @Body() updateBalanceDto: UpdateBalanceDto,
  ) {
    return this.walletsService.updateBalance(userId, updateBalanceDto);
  }

  @Patch('admin/:walletId/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update wallet status (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Wallet status updated successfully',
    type: Wallet,
  })
  @ApiResponse({ status: 404, description: 'Wallet not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  @ApiParam({ name: 'walletId', description: 'Wallet ID' })
  async updateWalletStatus(
    @Param('walletId') walletId: string,
    @Body('status') status: 'active' | 'suspended' | 'frozen',
  ) {
    return this.walletsService.updateWalletStatus(walletId, status);
  }
}
