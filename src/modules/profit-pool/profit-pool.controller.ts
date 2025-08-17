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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { ProfitPoolService } from './services/profit-pool.service';
import { JwtAuthGuard, RolesGuard } from '../auth/guards';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { PROFIT_POOL_CONSTANTS } from './constants/profit-pool.constants';
import {
  CreateProfitPoolDto,
  DistributeProfitPoolDto,
  GetProfitPoolsDto,
  ProfitPoolStatsDto,
  ProcessDistributionDto,
  ProfitPoolResponseDto,
} from './dto/profit-pool.dto';
import { ApiEndpoint } from '../../common/decorators/api-endpoint.decorator';

@ApiTags('profit-pool')
@Controller('profit-pool')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ProfitPoolController {
  constructor(private readonly profitPoolService: ProfitPoolService) {}

  @Post('create')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiEndpoint('Create Profit Pool', 'Create a profit pool for a city and month')
  @ApiResponse({
    status: 201,
    description: 'Profit pool created successfully',
    type: ProfitPoolResponseDto,
  })
  @ApiResponse({ status: 409, description: 'Profit pool already exists' })
  async createProfitPool(@Body() dto: CreateProfitPoolDto): Promise<ProfitPoolResponseDto> {
    try {
      const pool = await this.profitPoolService.createProfitPool(dto);
      return {
        success: true,
        message: PROFIT_POOL_CONSTANTS.SUCCESS.POOL_CREATED,
        data: pool,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
          error: error.name,
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('distribute')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiEndpoint('Distribute Profit Pool', 'Distribute a profit pool to Growth Elites')
  @ApiResponse({
    status: 200,
    description: 'Profit pool distributed successfully',
    type: ProfitPoolResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Profit pool not found' })
  @ApiResponse({ status: 409, description: 'Profit pool already distributed' })
  async distributeProfitPool(@Body() dto: DistributeProfitPoolDto): Promise<ProfitPoolResponseDto> {
    try {
      const pool = await this.profitPoolService.distributeProfitPool(dto);
      return {
        success: true,
        message: PROFIT_POOL_CONSTANTS.SUCCESS.POOL_DISTRIBUTED,
        data: pool,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
          error: error.name,
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('retry/:poolId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiEndpoint('Retry Failed Distributions', 'Retry failed distributions in a profit pool')
  @ApiParam({ name: 'poolId', description: 'Profit pool ID' })
  @ApiResponse({
    status: 200,
    description: 'Failed distributions retried successfully',
    type: ProfitPoolResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Profit pool not found' })
  async retryFailedDistributions(
    @Param('poolId') poolId: string,
    @Body() dto: Partial<ProcessDistributionDto>,
  ): Promise<ProfitPoolResponseDto> {
    try {
      const pool = await this.profitPoolService.retryFailedDistributions({
        poolId,
        retryFailedOnly: dto.retryFailedOnly ?? true,
      });
      return {
        success: true,
        message: 'Failed distributions retried successfully',
        data: pool,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
          error: error.name,
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.GROWTH_ELITE)
  @ApiEndpoint('Get Profit Pools', 'Get profit pools with pagination and filters')
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  @ApiQuery({ name: 'city', required: false, description: 'Filter by city' })
  @ApiQuery({ name: 'month', required: false, description: 'Filter by month (YYYY-MM)' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status' })
  @ApiQuery({ name: 'fromDate', required: false, description: 'Filter from date' })
  @ApiQuery({ name: 'toDate', required: false, description: 'Filter to date' })
  @ApiResponse({
    status: 200,
    description: 'Profit pools retrieved successfully',
    type: ProfitPoolResponseDto,
  })
  async getProfitPools(@Query() dto: GetProfitPoolsDto): Promise<ProfitPoolResponseDto> {
    try {
      const result = await this.profitPoolService.getProfitPools(dto);
      return {
        success: true,
        message: PROFIT_POOL_CONSTANTS.SUCCESS.POOLS_RETRIEVED,
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
          error: error.name,
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('stats')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiEndpoint('Get Profit Pool Statistics', 'Get profit pool statistics and analytics')
  @ApiQuery({ name: 'city', required: false, description: 'Filter by city' })
  @ApiQuery({ name: 'month', required: false, description: 'Filter by month (YYYY-MM)' })
  @ApiQuery({ name: 'year', required: false, description: 'Filter by year (YYYY)' })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved successfully',
    type: ProfitPoolResponseDto,
  })
  async getProfitPoolStats(@Query() dto: ProfitPoolStatsDto): Promise<ProfitPoolResponseDto> {
    try {
      const stats = await this.profitPoolService.getProfitPoolStats(dto);
      return {
        success: true,
        message: PROFIT_POOL_CONSTANTS.SUCCESS.STATS_RETRIEVED,
        data: stats,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
          error: error.name,
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':poolId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.GROWTH_ELITE)
  @ApiEndpoint('Get Profit Pool by ID', 'Get a specific profit pool by ID')
  @ApiParam({ name: 'poolId', description: 'Profit pool ID' })
  @ApiResponse({
    status: 200,
    description: 'Profit pool retrieved successfully',
    type: ProfitPoolResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Profit pool not found' })
  async getProfitPoolById(@Param('poolId') poolId: string): Promise<ProfitPoolResponseDto> {
    try {
      const pool = await this.profitPoolService.getProfitPoolById(poolId);
      return {
        success: true,
        message: 'Profit pool retrieved successfully',
        data: pool,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
          error: error.name,
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('trigger/calculate')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiEndpoint('Trigger Monthly Calculation', 'Manually trigger monthly profit pool calculation')
  @ApiResponse({
    status: 200,
    description: 'Monthly calculation triggered successfully',
    type: ProfitPoolResponseDto,
  })
  async triggerMonthlyCalculation(): Promise<ProfitPoolResponseDto> {
    try {
      // This will trigger the calculation for the previous month
      await this.profitPoolService.calculateMonthlyProfitPools();
      return {
        success: true,
        message: 'Monthly profit pool calculation triggered successfully',
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
          error: error.name,
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('trigger/distribute')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiEndpoint('Trigger Monthly Distribution', 'Manually trigger monthly profit pool distribution')
  @ApiResponse({
    status: 200,
    description: 'Monthly distribution triggered successfully',
    type: ProfitPoolResponseDto,
  })
  async triggerMonthlyDistribution(): Promise<ProfitPoolResponseDto> {
    try {
      // This will trigger the distribution for the previous month
      await this.profitPoolService.distributeMonthlyProfitPools();
      return {
        success: true,
        message: 'Monthly profit pool distribution triggered successfully',
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
          error: error.name,
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
