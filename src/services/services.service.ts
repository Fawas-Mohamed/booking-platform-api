import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Service } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import {
  buildPaginatedResult,
  getPaginationOffsets,
  PaginatedResult,
} from '../common/utils/pagination.util';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { QueryServiceDto } from './dto/query-service.dto';

@Injectable()
export class ServicesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateServiceDto): Promise<Service> {
    return this.prisma.service.create({
      data: {
        title: dto.title,
        description: dto.description,
        duration: dto.duration,
        price: dto.price,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async findAll(query: QueryServiceDto): Promise<PaginatedResult<Service>> {
    const { page, limit, search, isActive } = query;

    const where: Prisma.ServiceWhereInput = {
      ...(isActive !== undefined ? { isActive } : {}),
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: Prisma.QueryMode.insensitive } },
              { description: { contains: search, mode: Prisma.QueryMode.insensitive } },
            ],
          }
        : {}),
    };

    const { skip, take } = getPaginationOffsets({ page, limit });

    const [data, total] = await this.prisma.$transaction([
      this.prisma.service.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
      this.prisma.service.count({ where }),
    ]);

    return buildPaginatedResult(data, total, { page, limit });
  }

  async findOne(id: string): Promise<Service> {
    const service = await this.prisma.service.findUnique({ where: { id } });

    if (!service) {
      throw new NotFoundException(`Service with id "${id}" was not found`);
    }

    return service;
  }

  async update(id: string, dto: UpdateServiceDto): Promise<Service> {
    // Ensures a 404 (not a Prisma P2025) is thrown when the service is missing.
    await this.findOne(id);

    return this.prisma.service.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string): Promise<Service> {
    await this.findOne(id);

    return this.prisma.service.delete({ where: { id } });
  }
}
