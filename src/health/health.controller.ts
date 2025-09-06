/**
 * Application health endpoint controller
 * Provides comprehensive health checks for monitoring
 */

import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Connection } from 'mongoose';
import { InjectConnection } from '@nestjs/mongoose';

interface HealthCheckResponse {
  status: 'ok' | 'error';
  timestamp: string;
  uptime: number;
  environment: string;
  version: string;
  database: {
    status: 'connected' | 'disconnected';
    name?: string;
  };
  memory: {
    used: string;
    total: string;
    percentage: string;
  };
  services: {
    [key: string]: 'healthy' | 'unhealthy';
  };
}

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    @InjectConnection() private readonly connection: Connection,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Application health check' })
  @ApiResponse({ 
    status: 200, 
    description: 'Health check successful',
    schema: {
      example: {
        status: 'ok',
        timestamp: '2025-09-06T00:00:00.000Z',
        uptime: 3600,
        environment: 'production',
        version: '1.0.0',
        database: {
          status: 'connected',
          name: 'forage-stores'
        },
        memory: {
          used: '50MB',
          total: '512MB',
          percentage: '9.77%'
        },
        services: {
          database: 'healthy',
          api: 'healthy'
        }
      }
    }
  })
  @ApiResponse({ status: 503, description: 'Service unavailable' })
  async getHealth(): Promise<HealthCheckResponse> {
    const memoryUsage = process.memoryUsage();
    const totalMemory = memoryUsage.heapTotal + memoryUsage.external;
    const usedMemory = memoryUsage.heapUsed;
    
    // Check database connection
    const dbStatus = this.connection.readyState === 1 ? 'connected' : 'disconnected';
    
    // Basic service health checks
    const services: { [key: string]: 'healthy' | 'unhealthy' } = {
      database: dbStatus === 'connected' ? 'healthy' : 'unhealthy',
      api: 'healthy', // If we can respond, API is healthy
    };

    return {
      status: dbStatus === 'connected' ? 'ok' : 'error',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      database: {
        status: dbStatus,
        name: this.connection.db?.databaseName,
      },
      memory: {
        used: `${Math.round(usedMemory / 1024 / 1024)}MB`,
        total: `${Math.round(totalMemory / 1024 / 1024)}MB`,
        percentage: `${((usedMemory / totalMemory) * 100).toFixed(2)}%`,
      },
      services,
    };
  }

  @Get('ready')
  @ApiOperation({ summary: 'Readiness check for Kubernetes/Docker' })
  @ApiResponse({ status: 200, description: 'Service is ready' })
  @ApiResponse({ status: 503, description: 'Service is not ready' })
  async getReadiness(): Promise<{ status: string; ready: boolean }> {
    // Check if all critical services are available
    const dbReady = this.connection.readyState === 1;
    
    if (!dbReady) {
      throw new Error('Database not ready');
    }

    return {
      status: 'ready',
      ready: true,
    };
  }

  @Get('live')
  @ApiOperation({ summary: 'Liveness check for Kubernetes/Docker' })
  @ApiResponse({ status: 200, description: 'Service is alive' })
  async getLiveness(): Promise<{ status: string; alive: boolean }> {
    // Basic liveness check - if we can respond, we're alive
    return {
      status: 'alive',
      alive: true,
    };
  }
}
