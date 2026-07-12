import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import { QueryBookingDto } from './dto/query-booking.dto';
import { BookingEntity } from './entities/booking.entity';

@ApiTags('Bookings')
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Public()
  @Post()
  @ApiOperation({ summary: 'Create a booking (public - no authentication required)' })
  @ApiResponse({ status: 201, description: 'Booking created successfully', type: BookingEntity })
  @ApiResponse({ status: 404, description: 'Service not found' })
  @ApiResponse({ status: 400, description: 'Booking date/time is in the past' })
  @ApiResponse({ status: 409, description: 'Duplicate booking for this service/date/time' })
  async create(@Body() dto: CreateBookingDto) {
    const data = await this.bookingsService.create(dto);
    return { message: 'Booking created successfully', data };
  }

  @ApiBearerAuth()
  @Get()
  @ApiOperation({
    summary: 'List bookings with pagination, search and status filter (authenticated)',
  })
  @ApiResponse({ status: 200, description: 'Paginated list of bookings' })
  async findAll(@Query() query: QueryBookingDto) {
    const data = await this.bookingsService.findAll(query);
    return { message: 'Bookings retrieved successfully', data };
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get a booking by id (public, e.g. for a confirmation page)' })
  @ApiResponse({ status: 200, description: 'Booking found', type: BookingEntity })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.bookingsService.findOne(id);
    return { message: 'Booking retrieved successfully', data };
  }

  @ApiBearerAuth()
  @Patch(':id/status')
  @ApiOperation({ summary: 'Update booking status (authenticated - business/admin action)' })
  @ApiResponse({ status: 200, description: 'Booking status updated', type: BookingEntity })
  @ApiResponse({ status: 400, description: 'Invalid status transition' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  async updateStatus(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateBookingStatusDto) {
    const data = await this.bookingsService.updateStatus(id, dto);
    return { message: 'Booking status updated successfully', data };
  }

  @Public()
  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel a booking (public - a customer can cancel their own booking)' })
  @ApiResponse({ status: 200, description: 'Booking cancelled', type: BookingEntity })
  @ApiResponse({ status: 400, description: 'Booking cannot be cancelled from its current status' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  async cancel(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.bookingsService.cancel(id);
    return { message: 'Booking cancelled successfully', data };
  }
}
