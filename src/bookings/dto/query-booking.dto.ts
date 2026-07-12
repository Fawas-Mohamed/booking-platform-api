import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { BookingStatus } from '../../common/enums/booking-status.enum';

export class QueryBookingDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Search by customer name or email' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: BookingStatus })
  @IsOptional()
  @IsEnum(BookingStatus, {
    message: 'status must be one of PENDING, CONFIRMED, CANCELLED, COMPLETED',
  })
  status?: BookingStatus;
}
