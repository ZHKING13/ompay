import { IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class InitP2PDto {
  @ApiProperty({ example: '070XXXXXX', description: 'numero du client' })
  @IsString()
  from: string;

  @ApiProperty({
    example: '0707000000',
    description: 'numero ou code marchant ',
  })
  @IsString()
  @IsOptional()
  to: string;

  @ApiProperty({ example: '0000', description: 'pin du client' })
  @IsString()
  @IsNotEmpty()
  pin: string;

  @ApiProperty({ example: '1000', description: 'montant' })
  @IsString()
  @IsNotEmpty()
  amount: string;
}
