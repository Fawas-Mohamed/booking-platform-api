import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { BookingStatus } from '../../common/enums/booking-status.enum';

export class UpdateBookingStatusDto {
  @ApiProperty({ enum: BookingStatus, example: BookingStatus.CONFIRMED })
  @IsEnum(BookingStatus, {
    message: 'status must be one of PENDING, CONFIRMED, CANCELLED, COMPLETED',
  })
  status!: BookingStatus;
}
