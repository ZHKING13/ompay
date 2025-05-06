import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import {
  QRCodePartnerService,
  MerchantInfo,
} from '../interfaces/qr-code-partner.service';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { FastPayResponse } from '../interfaces/fastpay-response.interface';

@Injectable()
export class KaptiPayService implements QRCodePartnerService {
  private readonly logger = new Logger(KaptiPayService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  id = 'fastpayqr';
  countryCode = 'CI';
  userType: 'MERCHANT';
  supports(content: string): boolean {
    try {
      const url = new URL(content);
      return (
        url.hostname.includes('fastpay') || url.pathname.includes('fastpay')
      );
    } catch {
      return false;
    }
  }

  async getMerchantInfo(content: string): Promise<MerchantInfo> {
    const config = this.configService.get('countries.CI.fastpayqr');
    if (!config) {
      this.logger.error('Configuration FastPay manquante');
      throw new BadRequestException('Configuration manquante');
    }

    return {
      merchantName: 'MARCHAND TEST MOCK',
        merchantAgentCode: '123456',
      type: 'MERCHANT',
    };
  }
}
