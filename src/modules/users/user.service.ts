import {
  Injectable,
  Logger,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { CoreApiService } from '../addon/core-api/core-api.service';
import { TangoService } from '../addon/tango/tango.service';
import { ConfigService } from '@nestjs/config';
import { TangoApiError } from '../addon/tango/interfaces/tango-error.interface';

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
      throw new BadRequestException(
        'Le numéro de téléphone et le code PIN sont requis',
      );
    }

    try {
      const response = await this.tangoService.userEnquiry({
        msisdn,
        country_id: this.config.get<string>('defaultCountry') || 'ci',
        pin,
      });

      return response;
    } catch (error) {
      this.logger.error(
        `Erreur lors de la récupération des détails utilisateur: ${error.message}`,
        {
          msisdn,
          error: error.stack,
        },
      );

      if (error instanceof TangoApiError) {
        throw new UnauthorizedException(error.message || 'Code PIN incorrect');
      }

      throw error;
    }
  }

  async getUserBalance(msisdn: string, pin: string) {
    if (!msisdn || !pin) {
      throw new BadRequestException(
        'Le numéro de téléphone et le code PIN sont requis',
      );
    }

    try {
      return await this.tangoService.getCustomerBalance({
        msisdn,
        pin,
        country_id: 'ci',
        addon_id:
          this.config.get<string>('addon.brokerAddonId') || '32nd5KAPPqfs49',
      });
    } catch (error) {
      this.logger.error(
        `Erreur lors de la récupération du solde: ${error.message}`,
        {
          msisdn,
          error: error.stack,
        },
      );

      if (error instanceof TangoApiError) {
        throw new UnauthorizedException(error.message || 'Code PIN incorrect');
      }

      throw new BadRequestException(
        'Impossible de récupérer le solde. Veuillez réessayer plus tard.',
      );
    }
  }

  async getUserTranscactions(msisdn: string, pin: string) {
    if (!msisdn || !pin) {
      throw new BadRequestException(
        'Le numéro de téléphone et le code PIN sont requis',
      );
    }

    try {
      return await this.tangoService.customerLastNTransaction({
        msisdn,
        pin,
        country_id: 'ci',
      });
    } catch (error) {
      this.logger.error(
        `Erreur lors de la récupération des transactions: ${error.message}`,
        {
          msisdn,
          error: error.stack,
        },
      );

      if (error instanceof TangoApiError) {
        throw new UnauthorizedException(error.message || 'Code PIN incorrect');
      }

      throw new BadRequestException(
        'Impossible de récupérer les transactions. Veuillez réessayer plus tard.',
      );
    }
  }
}
