import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsEmail, MaxLength } from 'class-validator';

export class CreateStoreDto {
  @ApiProperty({ description: 'Store name', example: 'My Awesome Store' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({ description: 'Store description', example: 'The best store in town' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Store address', example: '123 Main St, City, Country' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  address: string;

  @ApiPropertyOptional({ description: 'Store phone number', example: '+1234567890' })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  phone?: string;

  @ApiPropertyOptional({ description: 'Store email address', example: 'store@example.com' })
  @IsEmail()
  @IsOptional()
  @MaxLength(255)
  email?: string;
}

export class UpdateStoreDto extends CreateStoreDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  id: string;
}
