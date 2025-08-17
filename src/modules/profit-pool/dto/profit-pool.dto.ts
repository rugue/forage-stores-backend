import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsDateString,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { ProfitPoolStatus } from '../entities/profit-pool.entity';

export class CreateProfitPoolDto {
  @ApiProperty({ description: 'City name', example: 'Lagos' })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({ description: 'Month in YYYY-MM format', example: '2025-08' })
  @IsString()
  @IsNotEmpty()
  month: string;

  @ApiPropertyOptional({ description: 'Force recalculation if pool exists' })
  @IsOptional()
  force?: boolean;
}

export class DistributeProfitPoolDto {
  @ApiProperty({ description: 'Profit pool ID' })
  @IsString()
  @IsNotEmpty()
  poolId: string;

  @ApiPropertyOptional({ description: 'Admin notes for the distribution' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class GetProfitPoolsDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Filter by city' })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({ description: 'Filter by month (YYYY-MM)' })
  @IsString()
  @IsOptional()
  month?: string;

  @ApiPropertyOptional({ description: 'Filter by status' })
  @IsEnum(ProfitPoolStatus)
  @IsOptional()
  status?: ProfitPoolStatus;

  @ApiPropertyOptional({ description: 'Filter from date (ISO string)' })
  @IsDateString()
  @IsOptional()
  fromDate?: string;

  @ApiPropertyOptional({ description: 'Filter to date (ISO string)' })
  @IsDateString()
  @IsOptional()
  toDate?: string;
}

export class ProfitPoolStatsDto {
  @ApiPropertyOptional({ description: 'City to get stats for' })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({ description: 'Month to get stats for (YYYY-MM)' })
  @IsString()
  @IsOptional()
  month?: string;

  @ApiPropertyOptional({ description: 'Year to get stats for (YYYY)' })
  @IsString()
  @IsOptional()
  year?: string;
}

export class ProcessDistributionDto {
  @ApiProperty({ description: 'Profit pool ID' })
  @IsString()
  @IsNotEmpty()
  poolId: string;

  @ApiPropertyOptional({ description: 'Retry failed distributions only' })
  @IsOptional()
  retryFailedOnly?: boolean;
}

export class ProfitPoolResponseDto {
  @ApiProperty({ description: 'Success status' })
  success: boolean;

  @ApiProperty({ description: 'Response message' })
  message: string;

  @ApiProperty({ description: 'Profit pool data', required: false })
  data?: any;

  @ApiProperty({ description: 'Error details', required: false })
  error?: string;
}
