import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * Health endpoint for production monitoring
 */
async function createHealthApp() {
  const logger = new Logger('HealthCheck');
  
  try {
    const app = await NestFactory.create(AppModule, {
      logger: ['error', 'warn'],
    });
    
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }));

    return app;
  } catch (error) {
    logger.error('Failed to create health check app:', error);
    throw error;
  }
}

/**
 * Perform comprehensive health check
 */
async function performHealthCheck() {
  const logger = new Logger('HealthCheck');
  
  try {
    logger.log('Starting health check...');
    
    const app = await createHealthApp();
    
    // Check if app can be initialized
    await app.init();
    
    logger.log('✅ Application initialized successfully');
    
    // Additional health checks can be added here:
    // - Database connectivity
    // - External service availability
    // - Memory usage
    // - Disk space
    
    await app.close();
    
    logger.log('✅ Health check completed successfully');
    return true;
    
  } catch (error) {
    logger.error('❌ Health check failed:', error);
    return false;
  }
}

// Run health check if this file is executed directly
if (require.main === module) {
  performHealthCheck()
    .then((healthy) => {
      process.exit(healthy ? 0 : 1);
    })
    .catch(() => {
      process.exit(1);
    });
}

export { performHealthCheck };
