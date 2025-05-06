import {
  IsString,
  IsEnum,
  IsOptional,
  IsNumber,
  IsDate,
  IsUUID,
  IsObject,
  MinLength,
} from 'class-validator';
import { TransactionStatus, TransactionType } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTransactionDto {
  @ApiProperty({
    description: 'Montant de la transaction',
    example: 1000.5,
    type: Number,
  })
  @IsNumber()
  amount: number;

  // @ApiProperty({
  //   description: 'Devise de la transaction (format ISO 4217)',
  //   example: 'XOF',
  //   minLength: 3,
  //   maxLength: 3,
  // })
  // @IsString()
  // @MinLength(3)
  // currency: string;

  @ApiProperty({
    description: "Numéro de téléphone de l'expéditeur",
    example: '0767929383',
    type: String,
  })
  @IsString()
  from: string;

  @ApiProperty({
    description: 'Numéro de téléphone ou codeMarchand du destinataire',
    example: '0747123456',
    type: String,
  })
  @IsString()
  to: string;
  @ApiProperty({
    description: 'pin de utilisateur',
    example: '0000',
    type: String,
  })
  @IsString()
  pin: string;

  @ApiProperty({
    description: 'Type de transaction',
    enum: TransactionType,
    example: 'P2P',
    enumName: 'TransactionType',
  })
  @IsEnum(TransactionType)
  type: TransactionType;

  @ApiPropertyOptional({
    description: 'Code pays ISO du pays de la transaction',
    example: 'CI',
    minLength: 2,
    maxLength: 2,
    default: 'CI',
  })
  @IsString()
  @IsOptional()
  country?: string = 'CI';
}
