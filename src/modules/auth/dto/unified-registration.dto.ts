import { IsEnum, IsNotEmpty, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { AccountType } from '../../users/entities/user.entity';
import { FamilyRegistrationDto } from './family-registration.dto';
import { BusinessRegistrationDto } from './business-registration.dto';

export class CreateAccountDto {
  @ApiProperty({
    description: 'Account type selection',
    enum: AccountType,
    example: AccountType.FAMILY,
  })
  @IsEnum(AccountType)
  @IsNotEmpty()
  accountType: AccountType;

  @ApiProperty({
    description: 'Family registration data (required when accountType is FAMILY)',
    type: FamilyRegistrationDto,
    required: false,
  })
  @ValidateNested()
  @Type(() => FamilyRegistrationDto)
  familyData?: FamilyRegistrationDto;

  @ApiProperty({
    description: 'Business registration data (required when accountType is BUSINESS)',
    type: BusinessRegistrationDto,
    required: false,
  })
  @ValidateNested()
  @Type(() => BusinessRegistrationDto)
  businessData?: BusinessRegistrationDto;
}
