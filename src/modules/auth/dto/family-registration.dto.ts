import { IsEmail, IsString, IsNotEmpty, MaxLength, MinLength, Matches, Validate } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { MatchPasswordConstraint } from './create-account.dto';

export class FamilyRegistrationDto {
  @ApiProperty({ description: 'User first name', example: 'John' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Transform(({ value }) => value?.trim())
  firstName: string;

  @ApiProperty({ description: 'User last name', example: 'Doe' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Transform(({ value }) => value?.trim())
  lastName: string;

  @ApiProperty({
    description: 'User email address',
    example: 'john@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(255)
  @Transform(({ value }) => value?.toLowerCase().trim())
  email: string;

  @ApiProperty({
    description: 'User phone number',
    example: '+2348012345678',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  phone: string;

  @ApiProperty({
    description: 'User location/city',
    example: 'Lagos',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Transform(({ value }) => value?.trim())
  location: string;

  @ApiProperty({
    description: 'User password (min 8 chars, must contain uppercase, lowercase, number, and special character)',
    example: 'MySecure123!',
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
    example: 'MySecure123!',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: 'Confirm password must be at least 8 characters long' })
  @MaxLength(128, { message: 'Confirm password must not exceed 128 characters' })
  @Validate(MatchPasswordConstraint)
  confirmPassword: string;
}
