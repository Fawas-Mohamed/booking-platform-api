import { ApiProperty } from '@nestjs/swagger';
import { BookingStatus } from '../../common/enums/booking-status.enum';

export class BookingEntity {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  customerName!: string;

  @ApiProperty()
  customerEmail!: string;

  @ApiProperty()
  customerPhone!: string;

  @ApiProperty()
  serviceId!: string;

  @ApiProperty()
  bookingDate!: Date;

  @ApiProperty()
  bookingTime!: string;

  @ApiProperty({ enum: BookingStatus })
  status!: BookingStatus;

  @ApiProperty({ required: false, nullable: true })
  notes?: string | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
