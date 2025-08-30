import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UploadProfileImageDto {
  @ApiProperty({
    description: 'Profile image file',
    type: 'string',
    format: 'binary',
  })
  profileImage: any; // Multer file type
}

export class UpdateProfileImageDto {
  @ApiProperty({
    description: 'Profile image URL',
    example: 'https://storage.example.com/profiles/user123.jpg',
    required: false,
  })
  @IsOptional()
  @IsString()
  profileImage?: string;
}
