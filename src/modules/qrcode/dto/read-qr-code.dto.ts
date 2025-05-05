import { IsNotEmpty, IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ReadQRCodeDto {
  @ApiProperty({ description: 'Contenu du QR code à lire' })
  @IsString()
  @IsNotEmpty()
  qrCodeContent: string;

  @ApiProperty({ example: 'FR', description: 'Code pays ISO du QR code' })
  @IsString()
  @Length(2, 2)
  countryCode: string;

  @ApiProperty({ example: 'partner1', description: 'ID du partenaire QR code' })
  @IsString()
  @IsNotEmpty()
  partnerId: string;
}
