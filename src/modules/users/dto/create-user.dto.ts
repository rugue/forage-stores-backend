import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsEnum,
  IsOptional,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AccountType, UserRole } from '../../../entities/user.entity';

export class CreateUserDto {
  @ApiProperty({ description: 'User full name', example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'User email address',
    example: 'john.doe@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'User phone number',
    example: '+1234567890',
    required: false,
  })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ description: 'User password', example: 'password123' })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiProperty({
    description: 'Account type',
    enum: AccountType,
    example: AccountType.FAMILY,
  })
  @IsEnum(AccountType)
  @IsOptional()
  accountType?: AccountType;

  @ApiProperty({
    description: 'User role',
    enum: UserRole,
    example: UserRole.USER,
  })
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @ApiProperty({ description: 'User city', example: 'Lagos', required: false })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiProperty({
    description: 'User referral code',
    example: 'REF123456',
    required: false,
  })
  @IsString()
  @IsOptional()
  referralCode?: string;

  @ApiProperty({
    description: 'User credit score',
    example: 750,
    minimum: 300,
    maximum: 850,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Min(300)
  @Max(850)
  creditScore?: number;
}
