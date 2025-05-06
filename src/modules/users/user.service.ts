import {
  Injectable,
  Logger,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';

import { CoreApiService } from '../addon/core-api/core-api.service';
import { TangoService } from '../addon/tango/tango.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    private coreApi: CoreApiService,
    private tangoService: TangoService,
    private readonly config: ConfigService,
  ) {}

  async getUser(msisdn: string, pin: string) {
    if (!msisdn || !pin) {
      throw new BadRequestException('MSISDN et PIN sont requis');
    }

    try {
      const response = await this.tangoService.userEnquiry({
        msisdn,
        country_id: this.config.get<string>('defaultCountry') || 'ci',
        pin,
      });

      if (!response) {
        throw new UnauthorizedException(
          'Utilisateur non trouvé ou identifiants incorrects',
        );
      }

      return response;
    } catch (error) {
      this.logger.error(
        `Erreur lors de la récupération des détails utilisateur: ${error.message}`,
        {
          msisdn,
          error: error.stack,
        },
      );

      if (error.response?.status === 401) {
        throw new UnauthorizedException('Identifiants invalides');
      }

      throw error;
    }
  }

  async getUserBalance(msisdn: string, pin: string) {
    return this.tangoService.getCustomerBalance({
      msisdn,
      pin,

      country_id: 'ci',
      addon_id:
        this.config.get<string>('addon.brokerAddonId') || '32nd5KAPPqfs49',
    });
  }

  async getUserTranscactions(msisdn: string, pin: string) {
    return this.tangoService.customerLastNTransaction({
      msisdn,
      pin,
      country_id: 'ci',
    });
  }
}
