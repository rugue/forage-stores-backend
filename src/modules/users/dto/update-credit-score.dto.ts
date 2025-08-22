import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min, Max, IsNotEmpty } from 'class-validator';

export class UpdateCreditScoreDto {
  @ApiProperty({
    description: 'User credit score (300-850)',
    example: 750,
    minimum: 300,
    maximum: 850,
  })
  @IsNumber()
  @IsNotEmpty()
  @Min(300, { message: 'Credit score must be at least 300' })
  @Max(850, { message: 'Credit score cannot exceed 850' })
  creditScore: number;
}
