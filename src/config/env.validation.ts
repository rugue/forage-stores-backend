import { plainToInstance } from 'class-transformer';
import { IsString, IsNotEmpty, validateSync, IsOptional, IsNumber, Min } from 'class-validator';

export class EnvironmentVariables {
  @IsString()
  @IsNotEmpty()
  JWT_SECRET: string;

  @IsOptional()
  @IsString()
  JWT_EXPIRES_IN?: string = '1d';

  @IsOptional()
  @IsString()
  MONGODB_URI?: string = 'mongodb://localhost:27017/forage-stores';

  @IsOptional()
  @IsNumber()
  @Min(1)
  PORT?: number = 3000;

  @IsOptional()
  @IsString()
  NODE_ENV?: string = 'development';

  @IsOptional()
  @IsString()
  FRONTEND_URL?: string;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(`Environment validation failed: ${errors.toString()}`);
  }

  return validatedConfig;
}
