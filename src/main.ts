import { NestFactory } from '@nestjs/core';
import { ValidationPipe, ValidationError, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import helmet from 'helmet';
import { 
  HttpExceptionFilter, 
  MongoExceptionFilter, 
  AllExceptionsFilter 
} from './common/filters';
import { ValidationException } from './common/exceptions/validation.exception';

dotenv.config();

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'], // Enable all log levels
  });

  // Security headers with Helmet
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
        },
      },
      crossOriginEmbedderPolicy: false, // Required for Swagger UI
    }),
  );

  // Enhanced CORS configuration
  app.enableCors({
    origin: process.env.FRONTEND_URL || [
      'http://localhost:3000',
      'http://localhost:3001',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  // Enhanced global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      exceptionFactory: (validationErrors: ValidationError[]) => {
        return new ValidationException(validationErrors);
      },
    }),
  );

  // Register global exception filters
  app.useGlobalFilters(
    new AllExceptionsFilter(),
    new HttpExceptionFilter(),
    new MongoExceptionFilter(),
  );

  // Swagger documentation setup
  const config = new DocumentBuilder()
    .setTitle('Forage Stores API')
    .setDescription(
      'Backend API for Forage Stores application with JWT Authentication and Role-Based Access Control.\n\n' +
      '- Protected routes require JWT authentication.\n' +
      '- Admin routes require ADMIN role.\n' +
      '- Exception handling and validation are implemented globally.'
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth', // This name here is important for matching up with @ApiBearerAuth() in your controller!
    )
    .addTag('auth', 'Authentication endpoints')
    .addTag('users', 'User management endpoints')
    .addTag('wallets', 'Wallet management endpoints')
    .addTag('stores', 'Store management endpoints')
    .addTag('products', 'Product management endpoints')
    .addTag('orders', 'Order and cart management endpoints')
    .addTag('subscriptions', 'Subscription management for payment plans')
    .addTag('referrals', 'Referral and commission management endpoints')
    .addTag('analytics', 'User expense tracking and spending analytics endpoints')
    .build();
  const document = SwaggerModule.createDocument(app, config);

  // Customize Swagger UI options
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      persistAuthorization: true, // Keep authorization when page refreshes
      tagsSorter: 'alpha', // Sort tags alphabetically (auth will be first)
      operationsSorter: 'alpha', // Sort operations alphabetically
    },
    customSiteTitle: 'Forage Stores API Documentation',
    customfavIcon: '/favicon.ico',
    customCss: `
      .swagger-ui .topbar { display: none; }
      .swagger-ui .info { margin: 20px 0; }
    `,
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
  console.log(
    `Swagger documentation available at: http://localhost:${port}/api`,
  );
}
bootstrap();
