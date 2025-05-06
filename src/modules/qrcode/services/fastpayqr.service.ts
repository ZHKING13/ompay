import { HttpService } from "@nestjs/axios";
import { ConfigService } from "@nestjs/config";
import { QRCodePartnerService } from "../interfaces/qr-code-partner.service";
import { BadRequestException, Injectable } from "@nestjs/common";
import { firstValueFrom } from "rxjs";

@Injectable()
export class FastPayQRService implements QRCodePartnerService {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  id = 'fastpayqr';
  countryCode = 'CI';

  supports(content: string): boolean {
    return content.includes('fastpayqr');
  }

  async getMerchantInfo(content: string): Promise<any> {
    const config = this.configService.get('countries.CI.fastpayqr');
    if (!config) throw new BadRequestException('Config manquante');

    const url = new URL(content);
    const merchantCode = url.searchParams.get('merchantCode');
    if (!merchantCode) throw new BadRequestException('merchantCode manquant');

    //  MOCK MODE
    if (config.mock) {
      console.log('[Mock] FastPay merchant info for:', merchantCode);
      return {
        merchantCode,
        merchantName: 'BOUTIQUE TEST MOCK',
        phoneNumber: '0700000000',
        location: 'Abidjan, Plateau',
        registeredAt: '2024-05-01T10:00:00Z',
        status: 'ACTIVE',
      };
    }

    // call api
    const endpoint = `${config.apiUrl}/merchant/all`;
    try {
      const response = await firstValueFrom(
        this.httpService.get(endpoint, {
          headers: {
            Authorization: `Bearer ${config.apiKey}`,
          },
          params: { merchantCode },
        }),
      );

      return response.data;
    } catch (error) {
      console.error(
        'FastPay API error:',
        error.response?.data || error.message,
      );
      throw new BadRequestException(
        'Erreur lors de la récupération du marchand FastPay',
      );
    }
  }
}
