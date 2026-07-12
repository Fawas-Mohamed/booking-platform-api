import { Test, TestingModule } from '@nestjs/testing';
import { BookingsService } from './bookings.service';
import { PrismaService } from '../database/prisma.service';
import { BookingStatus } from '../common/enums/booking-status.enum';
import {
  DuplicateBookingException,
  InvalidStatusTransitionException,
  PastBookingDateException,
  ServiceNotFoundException,
} from '../common/exceptions/business.exceptions';
import { NotFoundException } from '@nestjs/common';

describe('BookingsService', () => {
  let bookingsService: BookingsService;
  let prisma: {
    service: { findUnique: jest.Mock };
    booking: {
      create: jest.Mock;
      findFirst: jest.Mock;
      findUnique: jest.Mock;
      findMany: jest.Mock;
      count: jest.Mock;
      update: jest.Mock;
    };
    $transaction: jest.Mock;
  };

  const mockService = { id: 'service-1', title: 'Massage', isActive: true };

  const futureDate = new Date();
  futureDate.setFullYear(futureDate.getFullYear() + 1);
  const futureDateString = futureDate.toISOString().split('T')[0];

  const baseBookingDto = {
    customerName: 'Jane Smith',
    customerEmail: 'jane@example.com',
    customerPhone: '+94771234567',
    serviceId: 'service-1',
    bookingDate: futureDateString,
    bookingTime: '14:30',
  };

  const mockBooking = {
    id: 'booking-1',
    ...baseBookingDto,
    status: BookingStatus.PENDING,
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    prisma = {
      service: { findUnique: jest.fn() },
      booking: {
        create: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [BookingsService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    bookingsService = module.get<BookingsService>(BookingsService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('create - business rules', () => {
    it('Rule 1: throws ServiceNotFoundException when the service does not exist', async () => {
      prisma.service.findUnique.mockResolvedValue(null);

      await expect(bookingsService.create(baseBookingDto)).rejects.toThrow(
        ServiceNotFoundException,
      );
      expect(prisma.booking.create).not.toHaveBeenCalled();
    });

    it('Rule 2: throws PastBookingDateException when the date/time is in the past', async () => {
      prisma.service.findUnique.mockResolvedValue(mockService);

      await expect(
        bookingsService.create({ ...baseBookingDto, bookingDate: '2000-01-01' }),
      ).rejects.toThrow(PastBookingDateException);
      expect(prisma.booking.create).not.toHaveBeenCalled();
    });

    it('Rule 6: throws DuplicateBookingException for a duplicate service/date/time', async () => {
      prisma.service.findUnique.mockResolvedValue(mockService);
      prisma.booking.findFirst.mockResolvedValue(mockBooking);

      await expect(bookingsService.create(baseBookingDto)).rejects.toThrow(
        DuplicateBookingException,
      );
      expect(prisma.booking.create).not.toHaveBeenCalled();
    });

    it('creates a booking with PENDING status when all rules pass', async () => {
      prisma.service.findUnique.mockResolvedValue(mockService);
      prisma.booking.findFirst.mockResolvedValue(null);
      prisma.booking.create.mockResolvedValue(mockBooking);

      const result = await bookingsService.create(baseBookingDto);

      expect(prisma.booking.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: BookingStatus.PENDING }),
        }),
      );
      expect(result).toEqual(mockBooking);
    });
  });

  describe('updateStatus - Rule 3 (status transitions)', () => {
    it('allows PENDING -> CONFIRMED', async () => {
      prisma.booking.findUnique.mockResolvedValue({
        ...mockBooking,
        status: BookingStatus.PENDING,
      });
      prisma.booking.update.mockResolvedValue({ ...mockBooking, status: BookingStatus.CONFIRMED });

      const result = await bookingsService.updateStatus('booking-1', {
        status: BookingStatus.CONFIRMED,
      });

      expect(result.status).toBe(BookingStatus.CONFIRMED);
    });

    it('rejects CANCELLED -> COMPLETED', async () => {
      prisma.booking.findUnique.mockResolvedValue({
        ...mockBooking,
        status: BookingStatus.CANCELLED,
      });

      await expect(
        bookingsService.updateStatus('booking-1', { status: BookingStatus.COMPLETED }),
      ).rejects.toThrow(InvalidStatusTransitionException);
      expect(prisma.booking.update).not.toHaveBeenCalled();
    });

    it('throws NotFoundException for a missing booking', async () => {
      prisma.booking.findUnique.mockResolvedValue(null);

      await expect(
        bookingsService.updateStatus('missing-id', { status: BookingStatus.CONFIRMED }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('cancel', () => {
    it('cancels a PENDING booking', async () => {
      prisma.booking.findUnique.mockResolvedValue({
        ...mockBooking,
        status: BookingStatus.PENDING,
      });
      prisma.booking.update.mockResolvedValue({ ...mockBooking, status: BookingStatus.CANCELLED });

      const result = await bookingsService.cancel('booking-1');

      expect(result.status).toBe(BookingStatus.CANCELLED);
    });

    it('cannot cancel an already COMPLETED booking', async () => {
      prisma.booking.findUnique.mockResolvedValue({
        ...mockBooking,
        status: BookingStatus.COMPLETED,
      });

      await expect(bookingsService.cancel('booking-1')).rejects.toThrow(
        InvalidStatusTransitionException,
      );
    });
  });
});
