import { Controller, Get, Post, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { ScheduledJobsService } from './scheduled-jobs.service';

@ApiTags('Scheduled Jobs (Admin)')
@Controller('scheduled-jobs')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class ScheduledJobsController {
  constructor(private readonly scheduledJobsService: ScheduledJobsService) {}

  @Get('status')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get scheduled jobs status',
    description: 'View the status and last execution times of all scheduled jobs',
  })
  @ApiResponse({
    status: 200,
    description: 'Scheduled jobs status retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        jobs: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              schedule: { type: 'string' },
              lastExecution: { type: 'string' },
              nextExecution: { type: 'string' },
              status: { type: 'string' },
            },
          },
        },
      },
    },
  })
  async getJobsStatus() {
    return {
      jobs: [
        {
          name: 'check-ga-ge-qualifications',
          schedule: '0 2 * * * (Daily at 2:00 AM)',
          description: 'Check GA/GE qualifications and promote eligible users',
          timezone: 'Africa/Lagos',
          status: 'active',
        },
        {
          name: 'monthly-profit-pool-distribution',
          schedule: '0 3 1 * * (Monthly on 1st at 3:00 AM)',
          description: 'Run monthly profit pool distribution per city',
          timezone: 'Africa/Lagos',
          status: 'active',
        },
        {
          name: 'daily-ga-ge-notifications',
          schedule: '0 9 * * * (Daily at 9:00 AM)',
          description: 'Send daily notifications to GA/GE users',
          timezone: 'Africa/Lagos',
          status: 'active',
        },
      ],
    };
  }

  @Post('manual/qualification-check')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Manual GA/GE qualification check',
    description: 'Manually trigger the GA/GE qualification check and promotion process',
  })
  @ApiResponse({
    status: 200,
    description: 'Manual qualification check triggered successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        triggeredAt: { type: 'string' },
      },
    },
  })
  async triggerQualificationCheck() {
    // Trigger the qualification check manually
    this.scheduledJobsService.checkGrowthUserQualifications().catch(error => {
      console.error('Manual qualification check failed:', error);
    });

    return {
      message: 'Manual GA/GE qualification check triggered successfully',
      triggeredAt: new Date().toISOString(),
    };
  }

  @Post('manual/profit-distribution')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Manual profit pool distribution',
    description: 'Manually trigger the monthly profit pool distribution process',
  })
  @ApiResponse({
    status: 200,
    description: 'Manual profit pool distribution triggered successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        triggeredAt: { type: 'string' },
      },
    },
  })
  async triggerProfitDistribution() {
    // Trigger the profit distribution manually
    this.scheduledJobsService.runMonthlyProfitPoolDistribution().catch(error => {
      console.error('Manual profit distribution failed:', error);
    });

    return {
      message: 'Manual profit pool distribution triggered successfully',
      triggeredAt: new Date().toISOString(),
    };
  }

  @Post('manual/daily-notifications')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Manual daily notifications',
    description: 'Manually trigger the daily GA/GE notifications',
  })
  @ApiResponse({
    status: 200,
    description: 'Manual daily notifications triggered successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        triggeredAt: { type: 'string' },
      },
    },
  })
  async triggerDailyNotifications() {
    // Trigger the daily notifications manually
    this.scheduledJobsService.sendDailyGrowthUserNotifications().catch(error => {
      console.error('Manual daily notifications failed:', error);
    });

    return {
      message: 'Manual daily notifications triggered successfully',
      triggeredAt: new Date().toISOString(),
    };
  }

  @Get('city-caps')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get city capacity limits',
    description: 'View the current GA/GE capacity limits and current counts per city',
  })
  @ApiResponse({
    status: 200,
    description: 'City capacity limits retrieved successfully',
  })
  async getCityCapacities() {
    // This would be implemented to show current city capacities
    return {
      message: 'City capacity limits - this endpoint can be enhanced with real-time data',
      cityLimits: {
        'Lagos': { maxGA: 50, maxGE: 20 },
        'Abuja': { maxGA: 30, maxGE: 15 },
        'Port Harcourt': { maxGA: 25, maxGE: 12 },
        'Kano': { maxGA: 20, maxGE: 10 },
        'Ibadan': { maxGA: 20, maxGE: 10 },
        'Benin': { maxGA: 15, maxGE: 8 },
        'Jos': { maxGA: 15, maxGE: 8 },
        'Calabar': { maxGA: 12, maxGE: 6 },
        'Uyo': { maxGA: 12, maxGE: 6 },
        'Warri': { maxGA: 10, maxGE: 5 },
      },
    };
  }
}
