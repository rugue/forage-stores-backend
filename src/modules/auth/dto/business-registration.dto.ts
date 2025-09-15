import { IsEmail, IsString, IsNotEmpty, MaxLength, MinLength, Matches, Validate } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { MatchPasswordConstraint } from './create-account.dto';

export class BusinessRegistrationDto {
  @ApiProperty({ description: 'Company name', example: 'Acme Food Services Ltd' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  @Transform(({ value }) => value?.trim())
  companyName: string;

  @ApiProperty({ description: 'Business category', example: 'Restaurant' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Transform(({ value }) => value?.trim())
  category: string;

  @ApiProperty({ description: 'City where business is located', example: 'Lagos' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Transform(({ value }) => value?.trim())
  city: string;

  @ApiProperty({ 
    description: 'Company physical address', 
    example: '123 Business District, Victoria Island, Lagos' 
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  @Transform(({ value }) => value?.trim())
  companyAddress: string;

  @ApiProperty({ description: 'Business owner first name', example: 'Jane' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Transform(({ value }) => value?.trim())
  ownerFirstName: string;

  @ApiProperty({ description: 'Business owner last name', example: 'Smith' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Transform(({ value }) => value?.trim())
  ownerLastName: string;

  @ApiProperty({ 
    description: 'Role/position in the company', 
    example: 'CEO' 
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Transform(({ value }) => value?.trim())
  roleInCompany: string;

  @ApiProperty({
    description: 'Office phone number',
    example: '+2341234567890',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  officePhoneNumber: string;

  @ApiProperty({
    description: 'Office email address',
    example: 'info@acmefood.com',
  })
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(255)
  @Transform(({ value }) => value?.toLowerCase().trim())
  officeEmailAddress: string;

  @ApiProperty({
    description: 'Password (min 8 chars, must contain uppercase, lowercase, number, and special character)',
    example: 'BusinessSecure123!',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(128, { message: 'Password must not exceed 128 characters' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)',
  })
  password: string;

  @ApiProperty({
    description: 'Confirm password (must match password)',
    example: 'BusinessSecure123!',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: 'Confirm password must be at least 8 characters long' })
  @MaxLength(128, { message: 'Confirm password must not exceed 128 characters' })
  @Validate(MatchPasswordConstraint)
  confirmPassword: string;
}
