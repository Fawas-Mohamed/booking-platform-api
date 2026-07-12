import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEmail,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MinLength,
} from 'class-validator';

export class CreateBookingDto {
  @ApiProperty({ example: 'Jane Smith' })
  @IsString()
  @MinLength(2, { message: 'Customer name must be at least 2 characters long' })
  customerName!: string;

  @ApiProperty({ example: 'jane@example.com' })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  customerEmail!: string;

  @ApiProperty({ example: '+94771234567' })
  @IsString()
  @Matches(/^\+?[0-9]{7,15}$/, {
    message: 'Phone number must contain 7 to 15 digits, optionally prefixed with +',
  })
  customerPhone!: string;

  @ApiProperty({ description: 'UUID of the service being booked' })
  @IsUUID('4', { message: 'serviceId must be a valid UUID' })
  serviceId!: string;

  @ApiProperty({ example: '2026-08-15', description: 'Date in YYYY-MM-DD format' })
  @IsDateString({ strict: true }, { message: 'bookingDate must be a valid date (YYYY-MM-DD)' })
  bookingDate!: string;

  @ApiProperty({ example: '14:30', description: 'Time in 24-hour HH:mm format' })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'bookingTime must be in 24-hour HH:mm format (e.g. 14:30)',
  })
  bookingTime!: string;

  @ApiPropertyOptional({ example: 'Please call 10 minutes before arrival.' })
  @IsOptional()
  @IsString()
  notes?: string;
}
