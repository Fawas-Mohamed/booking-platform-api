import { ApiProperty } from '@nestjs/swagger';

export class AuthResponseDto {
  @ApiProperty({ description: 'Signed JWT access token' })
  accessToken!: string;
}
