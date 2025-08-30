import { PartialType, OmitType, ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { CreateUserDto } from './create-user.dto';

export class UpdateUserDto extends PartialType(
  OmitType(CreateUserDto, ['password'] as const),
) {
  @ApiProperty({
    description: 'Profile image URL',
    example: 'https://storage.example.com/profiles/user123.jpg',
    required: false,
  })
  @IsOptional()
  @IsString()
  profileImage?: string;
  
  // All fields from CreateUserDto except password are optional for updates
}
