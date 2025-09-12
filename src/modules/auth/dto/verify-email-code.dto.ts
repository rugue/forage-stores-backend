import { IsString, IsNotEmpty, Length, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyEmailWithCodeDto {
  @ApiProperty({
    description: 'User email address',
    example: 'john@example.com',
  })
  @IsString()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: '4-digit verification code',
    example: '1234',
  })
  @IsString()
  @IsNotEmpty()
  @Length(4, 4, { message: 'Verification code must be exactly 4 digits' })
  @Matches(/^\d{4}$/, { message: 'Verification code must be 4 digits' })
  code: string;
}
