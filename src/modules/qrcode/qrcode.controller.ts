// qr-code/qr-code.controller.ts
import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';
import { QRCodeService } from './qrcode.service';

@ApiTags('QRCode')
@Controller('qrcode')
export class QRCodeController {
  constructor(private readonly qrCodeService: QRCodeService) {}

  @Post('parse')
  @ApiOperation({
    summary:
      'Analyser le contenu d’un QR Code et obtenir les infos du marchand',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        content: {
          type: 'string',
          example:
            'https://multi.app.orange-money.com/app/v1/kapptivate/qrcode/fastpayqr/?merchantCode=2670',
        },
      },
      required: ['content'],
    },
  })
  async parseQRCode(@Body('content') content: string) {
    return this.qrCodeService.getMerchantInfo(content);
  }
}
