import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ServicesService } from './services.service';
import { PrismaService } from '../database/prisma.service';

describe('ServicesService', () => {
  let servicesService: ServicesService;
  let prisma: {
    service: {
      create: jest.Mock;
      findMany: jest.Mock;
      count: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
    $transaction: jest.Mock;
  };

  const mockService = {
    id: 'service-1',
    title: 'Deep Tissue Massage',
    description: 'A relaxing 60 minute massage',
    duration: 60,
    price: 49.99,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    prisma = {
      service: {
        create: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [ServicesService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    servicesService = module.get<ServicesService>(ServicesService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('creates a service with the provided data', async () => {
      prisma.service.create.mockResolvedValue(mockService);

      const result = await servicesService.create({
        title: 'Deep Tissue Massage',
        description: 'A relaxing 60 minute massage',
        duration: 60,
        price: 49.99,
      });

      expect(prisma.service.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ isActive: true }) }),
      );
      expect(result).toEqual(mockService);
    });
  });

  describe('findOne', () => {
    it('returns the service when found', async () => {
      prisma.service.findUnique.mockResolvedValue(mockService);

      const result = await servicesService.findOne('service-1');

      expect(result).toEqual(mockService);
    });

    it('throws NotFoundException when the service does not exist', async () => {
      prisma.service.findUnique.mockResolvedValue(null);

      await expect(servicesService.findOne('missing-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('returns a paginated result', async () => {
      prisma.$transaction.mockResolvedValue([[mockService], 1]);

      const result = await servicesService.findAll({ page: 1, limit: 10 });

      expect(result).toEqual({
        data: [mockService],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
    });
  });

  describe('update', () => {
    it('throws NotFoundException when updating a missing service', async () => {
      prisma.service.findUnique.mockResolvedValue(null);

      await expect(servicesService.update('missing-id', { title: 'New Title' })).rejects.toThrow(
        NotFoundException,
      );
      expect(prisma.service.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('throws NotFoundException when deleting a missing service', async () => {
      prisma.service.findUnique.mockResolvedValue(null);

      await expect(servicesService.remove('missing-id')).rejects.toThrow(NotFoundException);
      expect(prisma.service.delete).not.toHaveBeenCalled();
    });
  });
});
