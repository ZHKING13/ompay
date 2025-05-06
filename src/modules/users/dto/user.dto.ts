import { IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UserDto {
  @ApiProperty({ example: '070707008', description: 'msisdn du client' })
  @IsString()
  @IsNotEmpty()
  msisdn: string;

  @ApiProperty({ example: '1000', description: 'pin du client' })
  @IsString()
  @IsNotEmpty()
  pin: string;
}
