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
export class FastPayQRService implements QRCodePartnerService {
  private readonly logger = new Logger(FastPayQRService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  id = 'fastpayqr';
  countryCode = 'CI';
  userType : 'MERCHANT';

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

    try {
      const url = new URL(content);
      const merchantId = url.searchParams.get('merchantId');
      if (!merchantId) {
        this.logger.warn('ID marchand manquant dans le QR code');
        throw new BadRequestException('ID marchand manquant');
      }

      // Mode MOCK
      if (config.mock) {
        this.logger.debug(
          '[Mock] Récupération des informations du marchand FastPay',
          { merchantId },
        );
        return {
          merchantName: 'MARCHAND TEST MOCK',
          phoneNumber: '0700000000',
          merchantAgentCode: '123456',
          type: 'MERCHANT',
        };
      }

      // Appel API
      const endpoint = `${config.apiUrl}/merchant/${merchantId}`;
      this.logger.debug('Appel API FastPay', { endpoint, merchantId });

      const response = await firstValueFrom(
        this.httpService.get<FastPayResponse>(endpoint, {
          headers: {
            Authorization: `Bearer ${config.apiKey}`,
          },
        }),
      );

      if (!response.data || response.data.error) {
        throw new BadRequestException(
          response.data?.message || "Réponse invalide de l'API FastPay",
        );
      }

      const { data } = response.data;

      if (!data.merchantAgentCode || !data.merchantName) {
        throw new BadRequestException('Informations marchand incomplètes');
      }

      // Transformation en format standardisé
      const merchantInfo: MerchantInfo = {
        merchantName: data.merchantName,
        phoneNumber: data.merchantMsisdn,
        merchantAgentCode: data.merchantAgentCode,
        type: 'MERCHANT',
      };

      this.logger.debug('Informations marchand récupérées', {
        merchantInfo,
        merchantAgentCode: data.merchantAgentCode, // Log important pour le débogage des paiements
      });

      return merchantInfo;
    } catch (error) {
      this.logger.error(
        'Erreur lors de la récupération des informations marchand',
        {
          error: error.response?.data || error.message,
          content,
        },
      );

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new BadRequestException(
        'Erreur lors de la récupération des informations du marchand FastPay',
      );
    }
  }
}
