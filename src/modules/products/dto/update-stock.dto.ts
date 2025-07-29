import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsEnum, Min } from 'class-validator';

export enum StockOperation {
  ADD = 'add',
  SUBTRACT = 'subtract'
}

export class UpdateStockDto {
  @ApiProperty({
    description: 'Quantity to add or subtract from current stock',
    example: 25,
    minimum: 1
  })
  @IsNumber()
  @Min(1, { message: 'Quantity must be at least 1' })
  quantity: number;

  @ApiProperty({
    description: 'Operation to perform on stock',
    enum: StockOperation,
    example: StockOperation.ADD,
    required: false,
    default: StockOperation.SUBTRACT
  })
  @IsOptional()
  @IsEnum(StockOperation)
  operation?: StockOperation;
}
