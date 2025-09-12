import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AccountType } from '../../users/entities/user.entity';

export class SelectAccountTypeDto {
  @ApiProperty({
    description: 'Account type selection',
    enum: AccountType,
    example: AccountType.FAMILY,
  })
  @IsEnum(AccountType)
  accountType: AccountType;
}
