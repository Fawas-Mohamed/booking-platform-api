import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ServicesService } from './services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { QueryServiceDto } from './dto/query-service.dto';
import { ServiceEntity } from './entities/service.entity';

/**
 * All endpoints in this controller require a valid JWT (Business Rule 4).
 * The global JwtAuthGuard protects everything by default; no @Public()
 * decorator is applied anywhere in this controller.
 */
@ApiTags('Services')
@ApiBearerAuth()
@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new service (authenticated)' })
  @ApiResponse({ status: 201, description: 'Service created successfully', type: ServiceEntity })
  async create(@Body() dto: CreateServiceDto) {
    const data = await this.servicesService.create(dto);
    return { message: 'Service created successfully', data };
  }

  @Get()
  @ApiOperation({ summary: 'List services with pagination and optional search/filter' })
  @ApiResponse({ status: 200, description: 'Paginated list of services' })
  async findAll(@Query() query: QueryServiceDto) {
    const data = await this.servicesService.findAll(query);
    return { message: 'Services retrieved successfully', data };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single service by id' })
  @ApiResponse({ status: 200, description: 'Service found', type: ServiceEntity })
  @ApiResponse({ status: 404, description: 'Service not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.servicesService.findOne(id);
    return { message: 'Service retrieved successfully', data };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a service (authenticated)' })
  @ApiResponse({ status: 200, description: 'Service updated successfully', type: ServiceEntity })
  @ApiResponse({ status: 404, description: 'Service not found' })
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateServiceDto) {
    const data = await this.servicesService.update(id, dto);
    return { message: 'Service updated successfully', data };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a service (authenticated)' })
  @ApiResponse({ status: 200, description: 'Service deleted successfully' })
  @ApiResponse({ status: 404, description: 'Service not found' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.servicesService.remove(id);
    return { message: 'Service deleted successfully', data };
  }
}
