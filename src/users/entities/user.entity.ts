import { ApiProperty } from '@nestjs/swagger';

/**
 * Public-facing representation of a User. Never includes the password hash.
 */
export class UserEntity {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
