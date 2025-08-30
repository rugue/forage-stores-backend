import { 
  IsString, 
  IsOptional, 
  IsNumber, 
  IsEnum, 
  IsArray, 
  IsBoolean,
  Min,
  ValidateNested,
  IsObject
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentType, PaymentMethod, PaymentGateway } from '../constants/payment.constants';

export class PaymentInitiationDto {
  @ApiProperty({ description: 'Order ID for payment' })
  @IsString()
  orderId: string;

  @ApiProperty({ description: 'Payment type', enum: PaymentType })
  @IsEnum(PaymentType)
  paymentType: PaymentType;

  @ApiProperty({ description: 'Payment method', enum: PaymentMethod })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiProperty({ description: 'Preferred payment gateway', enum: PaymentGateway })
  @IsEnum(PaymentGateway)
  gateway: PaymentGateway;

  @ApiPropertyOptional({ description: 'Payment amount in kobo (for partial payments)' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  amount?: number;

  @ApiPropertyOptional({ description: 'Number of installments for PAY Small-Small' })
  @IsOptional()
  @IsNumber()
  @Min(2)
  installments?: number;

  @ApiPropertyOptional({ description: 'Additional payment metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class PaymentVerificationDto {
  @ApiProperty({ description: 'Payment reference to verify' })
  @IsString()
  reference: string;

  @ApiProperty({ description: 'Payment gateway', enum: PaymentGateway })
  @IsEnum(PaymentGateway)
  gateway: PaymentGateway;
}

export class CardPaymentDto {
  @ApiProperty({ description: 'Card number' })
  @IsString()
  cardNumber: string;

  @ApiProperty({ description: 'Card expiry month' })
  @IsString()
  expiryMonth: string;

  @ApiProperty({ description: 'Card expiry year' })
  @IsString()
  expiryYear: string;

  @ApiProperty({ description: 'Card CVV' })
  @IsString()
  cvv: string;

  @ApiProperty({ description: 'Card holder name' })
  @IsString()
  cardHolderName: string;

  @ApiPropertyOptional({ description: 'Whether to save card for future use' })
  @IsOptional()
  @IsBoolean()
  saveCard?: boolean;
}

export class BankTransferDto {
  @ApiProperty({ description: 'Bank code' })
  @IsString()
  bankCode: string;

  @ApiProperty({ description: 'Account number' })
  @IsString()
  accountNumber: string;

  @ApiPropertyOptional({ description: 'Account holder name' })
  @IsOptional()
  @IsString()
  accountName?: string;
}

export class RefundRequestDto {
  @ApiProperty({ description: 'Payment ID to refund' })
  @IsString()
  paymentId: string;

  @ApiProperty({ description: 'Refund amount in kobo (for partial refunds)' })
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiProperty({ description: 'Reason for refund' })
  @IsString()
  reason: string;

  @ApiPropertyOptional({ description: 'Whether this is a partial refund' })
  @IsOptional()
  @IsBoolean()
  isPartialRefund?: boolean;
}

export class PaymentPlanUpdateDto {
  @ApiPropertyOptional({ description: 'Next payment date' })
  @IsOptional()
  @IsString()
  nextPaymentDate?: string;

  @ApiPropertyOptional({ description: 'Number of installments' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  installments?: number;

  @ApiPropertyOptional({ description: 'Whether plan is active' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class WebhookValidationDto {
  @ApiProperty({ description: 'Webhook signature' })
  @IsString()
  signature: string;

  @ApiProperty({ description: 'Webhook payload' })
  @IsObject()
  payload: Record<string, any>;

  @ApiProperty({ description: 'Payment gateway', enum: PaymentGateway })
  @IsEnum(PaymentGateway)
  gateway: PaymentGateway;
}

export class PaymentQueryDto {
  @ApiPropertyOptional({ description: 'Payment status filter' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Payment type filter', enum: PaymentType })
  @IsOptional()
  @IsEnum(PaymentType)
  paymentType?: PaymentType;

  @ApiPropertyOptional({ description: 'Payment method filter', enum: PaymentMethod })
  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @ApiPropertyOptional({ description: 'Payment gateway filter', enum: PaymentGateway })
  @IsOptional()
  @IsEnum(PaymentGateway)
  gateway?: PaymentGateway;

  @ApiPropertyOptional({ description: 'Start date for date range filter' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date for date range filter' })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'User ID filter' })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({ description: 'Order ID filter' })
  @IsOptional()
  @IsString()
  orderId?: string;

  @ApiPropertyOptional({ description: 'Page number for pagination' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: 'Number of items per page' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number;
}

export class PaymentAnalyticsDto {
  @ApiPropertyOptional({ description: 'Start date for analytics' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date for analytics' })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Grouping period (day, week, month)' })
  @IsOptional()
  @IsEnum(['day', 'week', 'month'])
  groupBy?: 'day' | 'week' | 'month';

  @ApiPropertyOptional({ description: 'Payment types to include', enum: PaymentType, isArray: true })
  @IsOptional()
  @IsArray()
  @IsEnum(PaymentType, { each: true })
  paymentTypes?: PaymentType[];

  @ApiPropertyOptional({ description: 'Payment gateways to include', enum: PaymentGateway, isArray: true })
  @IsOptional()
  @IsArray()
  @IsEnum(PaymentGateway, { each: true })
  gateways?: PaymentGateway[];
}
