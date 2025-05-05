import { Injectable, BadRequestException } from '@nestjs/common';
import { QRCodePartnerService } from '../interfaces/qr-code-partner.service';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class OdysseeService implements QRCodePartnerService {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  id = 'odyssee';
  countryCode = 'CI';

  supports(content: string): boolean {
    return content.includes('odyssee');
  }

  async getMerchantInfo(content: string): Promise<any> {
    const config = this.configService.get('countries.CI.odyssee');
    if (!config) throw new BadRequestException('Config manquante');

    //  MOCK mode
    if (config.mock) {
      console.log('[Mock] Odyssee merchant info for:', content);
      return {
        qrCodeId: content,
        merchantName: 'BOUTIQUE ODYSSEE MOCK',
        phoneNumber: '0755555555',
        city: 'Abidjan',
        status: 'ENABLED',
      };
    }

    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${config.apiUrl}/codes`,
          { qrCodeId: content },
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${config.apiKey}`,
            },
          },
        ),
      );

      return response.data;
    } catch (error) {
      console.error(
        'Odyssee API error:',
        error.response?.data || error.message,
      );
      throw new BadRequestException(
        'Erreur lors de la récupération du marchand Odyssee',
      );
    }
  }
}
