import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateMessageDto {
  @IsString()
  @IsNotEmpty()
  message: string;

  @IsOptional()
  @IsString({ each: true })
  attachments?: string[];

  @IsOptional()
  @IsBoolean()
  isInternal?: boolean;
}
