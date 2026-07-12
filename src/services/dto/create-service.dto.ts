import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateServiceDto {
  @ApiProperty({ example: 'Deep Tissue Massage', minLength: 3 })
  @IsString()
  @MinLength(3, { message: 'Title must be at least 3 characters long' })
  title!: string;

  @ApiProperty({
    example: 'A 60-minute deep tissue massage session performed by a licensed therapist.',
  })
  @IsString()
  @MinLength(1, { message: 'Description is required' })
  description!: string;

  @ApiProperty({ example: 60, description: 'Duration in minutes' })
  @Type(() => Number)
  @IsInt({ message: 'Duration must be an integer number of minutes' })
  @IsPositive({ message: 'Duration must be a positive number' })
  duration!: number;

  @ApiProperty({ example: 49.99, description: 'Price in the platform currency' })
  @Type(() => Number)
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'Price must be a valid decimal with up to 2 places' },
  )
  @IsPositive({ message: 'Price must be a positive number' })
  price!: number;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;
}
