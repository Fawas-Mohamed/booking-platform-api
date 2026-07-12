import { Injectable, NotFoundException } from '@nestjs/common';
import { Booking, Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import {
  buildPaginatedResult,
  getPaginationOffsets,
  PaginatedResult,
} from '../common/utils/pagination.util';
import { BookingStatus, ALLOWED_BOOKING_TRANSITIONS } from '../common/enums/booking-status.enum';
import {
  DuplicateBookingException,
  InvalidStatusTransitionException,
  PastBookingDateException,
  ServiceNotFoundException,
} from '../common/exceptions/business.exceptions';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import { QueryBookingDto } from './dto/query-booking.dto';

@Injectable()
export class BookingsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateBookingDto): Promise<Booking> {
    // Rule 1: the referenced service must exist.
    const service = await this.prisma.service.findUnique({ where: { id: dto.serviceId } });
    if (!service) {
      throw new ServiceNotFoundException(dto.serviceId);
    }

    // Rule 2: booking date/time cannot be in the past.
    this.assertNotInPast(dto.bookingDate, dto.bookingTime);

    // Rule 6 (bonus): no duplicate booking for the same service/date/time.
    const existing = await this.prisma.booking.findFirst({
      where: {
        serviceId: dto.serviceId,
        bookingDate: new Date(dto.bookingDate),
        bookingTime: dto.bookingTime,
      },
    });
    if (existing) {
      throw new DuplicateBookingException();
    }

    return this.prisma.booking.create({
      data: {
        customerName: dto.customerName,
        customerEmail: dto.customerEmail,
        customerPhone: dto.customerPhone,
        serviceId: dto.serviceId,
        bookingDate: new Date(dto.bookingDate),
        bookingTime: dto.bookingTime,
        notes: dto.notes,
        status: BookingStatus.PENDING,
      },
    });
  }

  async findAll(query: QueryBookingDto): Promise<PaginatedResult<Booking>> {
    const { page, limit, search, status } = query;

    const where: Prisma.BookingWhereInput = {
      ...(status ? { status } : {}),
      ...(search
        ? {
            OR: [
              { customerName: { contains: search, mode: Prisma.QueryMode.insensitive } },
              { customerEmail: { contains: search, mode: Prisma.QueryMode.insensitive } },
            ],
          }
        : {}),
    };

    const { skip, take } = getPaginationOffsets({ page, limit });

    const [data, total] = await this.prisma.$transaction([
      this.prisma.booking.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
      this.prisma.booking.count({ where }),
    ]);

    return buildPaginatedResult(data, total, { page, limit });
  }

  async findOne(id: string): Promise<Booking> {
    const booking = await this.prisma.booking.findUnique({ where: { id } });

    if (!booking) {
      throw new NotFoundException(`Booking with id "${id}" was not found`);
    }

    return booking;
  }

  async updateStatus(id: string, dto: UpdateBookingStatusDto): Promise<Booking> {
    const booking = await this.findOne(id);

    this.assertValidTransition(booking.status as BookingStatus, dto.status);

    return this.prisma.booking.update({
      where: { id },
      data: { status: dto.status },
    });
  }

  async cancel(id: string): Promise<Booking> {
    const booking = await this.findOne(id);

    this.assertValidTransition(booking.status as BookingStatus, BookingStatus.CANCELLED);

    return this.prisma.booking.update({
      where: { id },
      data: { status: BookingStatus.CANCELLED },
    });
  }

  /** Rule 2: reject any booking whose date+time has already passed. */
  private assertNotInPast(bookingDate: string, bookingTime: string): void {
    const [hours, minutes] = bookingTime.split(':').map(Number);
    const candidate = new Date(bookingDate);
    candidate.setHours(hours, minutes, 0, 0);

    if (candidate.getTime() < Date.now()) {
      throw new PastBookingDateException();
    }
  }

  /** Rule 3: only allow transitions declared in ALLOWED_BOOKING_TRANSITIONS. */
  private assertValidTransition(from: BookingStatus, to: BookingStatus): void {
    if (from === to) {
      return; // no-op transition, nothing to validate
    }

    const allowed = ALLOWED_BOOKING_TRANSITIONS[from] ?? [];
    if (!allowed.includes(to)) {
      throw new InvalidStatusTransitionException(from, to);
    }
  }
}
