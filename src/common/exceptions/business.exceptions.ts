import { ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';

/**
 * Thrown when a booking references a service that does not exist.
 * (Business Rule 1)
 */
export class ServiceNotFoundException extends NotFoundException {
  constructor(serviceId: string) {
    super(`Service with id "${serviceId}" was not found`);
  }
}

/**
 * Thrown when a booking date/time is in the past.
 * (Business Rule 2)
 */
export class PastBookingDateException extends BadRequestException {
  constructor() {
    super('Booking date and time cannot be in the past');
  }
}

/**
 * Thrown when a status transition is not allowed
 * (e.g. CANCELLED -> COMPLETED). (Business Rule 3)
 */
export class InvalidStatusTransitionException extends BadRequestException {
  constructor(from: string, to: string) {
    super(`Cannot change booking status from "${from}" to "${to}"`);
  }
}

/**
 * Thrown when a duplicate booking (same service, date and time) is
 * attempted. (Business Rule 6 - bonus)
 */
export class DuplicateBookingException extends ConflictException {
  constructor() {
    super('A booking for this service at the selected date and time already exists');
  }
}

/**
 * Thrown on duplicate user registration.
 */
export class EmailAlreadyRegisteredException extends ConflictException {
  constructor(email: string) {
    super(`An account with email "${email}" already exists`);
  }
}
