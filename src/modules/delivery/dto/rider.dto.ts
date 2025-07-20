import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsMongoId,
  IsNumber,
  Min,
  Max,
  IsBoolean,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { RiderStatus, VehicleType } from '../../../entities/rider.entity';

export class VehicleDto {
  @ApiProperty({ description: 'Vehicle type', enum: VehicleType })
  @IsEnum(VehicleType)
  type: VehicleType;

  @ApiProperty({ description: 'Vehicle model', required: false })
  @IsOptional()
  @IsString()
  model?: string;

  @ApiProperty({ description: 'License plate number', required: false })
  @IsOptional()
  @IsString()
  licensePlate?: string;

  @ApiProperty({ description: 'Year of manufacture', required: false })
  @IsOptional()
  @IsNumber()
  year?: number;

  @ApiProperty({ description: 'Vehicle color', required: false })
  @IsOptional()
  @IsString()
  color?: string;
}

export class VerificationDocumentDto {
  @ApiProperty({ description: 'Document type (ID, License, etc)' })
  @IsString()
  @IsNotEmpty()
  documentType: string;

  @ApiProperty({ description: 'Document number' })
  @IsString()
  @IsNotEmpty()
  documentNumber: string;

  @ApiProperty({ description: 'Document issue date', required: false })
  @IsOptional()
  @Type(() => Date)
  issueDate?: Date;

  @ApiProperty({ description: 'Document expiry date', required: false })
  @IsOptional()
  @Type(() => Date)
  expiryDate?: Date;

  @ApiProperty({ description: 'Document URL or reference', required: false })
  @IsOptional()
  @IsString()
  documentUrl?: string;
}

export class CreateRiderDto {
  @ApiProperty({ description: 'User ID of the rider' })
  @IsMongoId()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ description: 'Vehicle information' })
  @ValidateNested()
  @Type(() => VehicleDto)
  vehicle: VehicleDto;

  @ApiProperty({ description: 'Rider\'s current location coordinates [longitude, latitude]', required: false })
  @IsOptional()
  @IsArray()
  currentLocation?: number[];

  @ApiProperty({ description: 'Rider\'s preferred service areas (city names)', required: false })
  @IsOptional()
  @IsArray()
  serviceAreas?: string[];

  @ApiProperty({ description: 'Maximum delivery distance (km)', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxDeliveryDistance?: number;

  @ApiProperty({ description: 'Verification documents', required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VerificationDocumentDto)
  verificationDocuments?: VerificationDocumentDto[];

  @ApiProperty({ description: 'Security deposit amount (NGN)', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  securityDeposit?: number;

  @ApiProperty({ description: 'Account number for payment', required: false })
  @IsOptional()
  @IsString()
  accountNumber?: string;

  @ApiProperty({ description: 'Bank name for payment', required: false })
  @IsOptional()
  @IsString()
  bankName?: string;

  @ApiProperty({ description: 'Account name for payment', required: false })
  @IsOptional()
  @IsString()
  accountName?: string;

  @ApiProperty({ description: 'Notes or additional information', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateRiderDto {
  @ApiProperty({ description: 'Rider status', enum: RiderStatus, required: false })
  @IsOptional()
  @IsEnum(RiderStatus)
  status?: RiderStatus;

  @ApiProperty({ description: 'Vehicle information', required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => VehicleDto)
  vehicle?: VehicleDto;

  @ApiProperty({ description: 'Rider\'s current location coordinates [longitude, latitude]', required: false })
  @IsOptional()
  @IsArray()
  currentLocation?: number[];

  @ApiProperty({ description: 'Rider\'s preferred service areas (city names)', required: false })
  @IsOptional()
  @IsArray()
  serviceAreas?: string[];

  @ApiProperty({ description: 'Maximum delivery distance (km)', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxDeliveryDistance?: number;

  @ApiProperty({ description: 'Whether rider is currently available for deliveries', required: false })
  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;

  @ApiProperty({ description: 'Security deposit amount (NGN)', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  securityDeposit?: number;

  @ApiProperty({ description: 'Account number for payment', required: false })
  @IsOptional()
  @IsString()
  accountNumber?: string;

  @ApiProperty({ description: 'Bank name for payment', required: false })
  @IsOptional()
  @IsString()
  bankName?: string;

  @ApiProperty({ description: 'Account name for payment', required: false })
  @IsOptional()
  @IsString()
  accountName?: string;

  @ApiProperty({ description: 'Notes or additional information', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class AddVerificationDocumentDto {
  @ApiProperty({ description: 'Document to add' })
  @ValidateNested()
  @Type(() => VerificationDocumentDto)
  document: VerificationDocumentDto;
}

export class VerifyDocumentDto {
  @ApiProperty({ description: 'Document verification status (pending, verified, rejected)' })
  @IsString()
  @IsNotEmpty()
  status: string;

  @ApiProperty({ description: 'Notes about verification decision', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateLocationDto {
  @ApiProperty({ description: 'Rider\'s current location coordinates [longitude, latitude]' })
  @IsArray()
  @IsNotEmpty()
  currentLocation: number[];

  @ApiProperty({ description: 'Whether rider is available for deliveries', required: false })
  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;
}

export class RiderFilterDto {
  @ApiProperty({ description: 'Filter by status', required: false, enum: RiderStatus })
  @IsOptional()
  @IsEnum(RiderStatus)
  status?: RiderStatus;

  @ApiProperty({ description: 'Filter by availability', required: false })
  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;

  @ApiProperty({ description: 'Filter by city (service area)', required: false })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiProperty({ description: 'Filter by vehicle type', required: false, enum: VehicleType })
  @IsOptional()
  @IsEnum(VehicleType)
  vehicleType?: VehicleType;

  @ApiProperty({ description: 'Minimum security deposit amount', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minSecurityDeposit?: number;

  @ApiProperty({ description: 'Only include riders not currently on delivery', required: false })
  @IsOptional()
  @IsBoolean()
  notOnDelivery?: boolean;
}

export class UpdateSecurityDepositDto {
  @ApiProperty({ description: 'Security deposit amount (NGN)' })
  @IsNumber()
  @Min(0)
  securityDeposit: number;

  @ApiProperty({ description: 'Transaction reference', required: false })
  @IsOptional()
  @IsString()
  transactionRef?: string;

  @ApiProperty({ description: 'Notes about the transaction', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
