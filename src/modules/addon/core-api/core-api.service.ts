import {
  Injectable,
  Logger,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import * as qs from 'qs';
import { performance } from 'perf_hooks';
import { Histogram } from 'prom-client';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
@Injectable()
export class CoreApiService {
  private readonly logger = new Logger(CoreApiService.name);
  private tokenCache: { token: string; expiresAt: number } | null = null;

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
    @InjectMetric('core_api_request_duration_seconds')
    private readonly durationHistogram: Histogram<string>,
  ) {}

  private async authenticate(): Promise<string> {
    if (this.tokenCache && this.tokenCache.expiresAt > Date.now()) {
      return this.tokenCache.token;
    }
    this.logger.log('Authenticating to CoreAPI...');
    const endTimer = this.durationHistogram.startTimer({
      endpoint: 'authenticate',
    });
    const url = `${this.config.get('addon.coreApiUrl')}/coreauth/auth`;
    const payload = qs.stringify({
      login: this.config.get('addon.coreApiLogin'),
      password: this.config.get('addon.coreApiPassword'),
      clientId: this.config.get('addon.coreApiClientId'),
    });

    const start = performance.now();
    try {
      const response = await firstValueFrom(
        this.http.post(url, payload, {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Accept: 'application/json',
          },
        }),
      );
      const end = performance.now();
      this.logger.log(`Auth request duration: ${(end - start).toFixed(2)}ms`);

      const { accesstoken, expiresin } = response.data;
      this.tokenCache = {
        token: accesstoken,
        expiresAt: Date.now() + expiresin * 1000 - 10000,
      };
      return accesstoken;
    } catch (err) {
      throw new UnauthorizedException('Échec de l’authentification à CoreAPI');
    } finally {
      endTimer();
    }
  }

  async getUserDetails(msisdn: string, userType = 'CUSTOMER') {
    const token = await this.authenticate();
    const url = `${this.config.get('addon.coreApiUrl')}/coreapi/api/v1/userDetails`;
    const endTimer = this.durationHistogram.startTimer({
      endpoint: 'getUserDetails',
    });
    const start = performance.now();
    try {
      const response = await firstValueFrom(
        this.http.get(url, {
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
          params: { msisdn, userType },
        }),
      );
      const end = performance.now();
      this.logger.log(
        `User details request for ${msisdn} took ${(end - start).toFixed(2)}ms`,
      );

      return response.data;
    } catch (err) {
      throw new InternalServerErrorException(
        'Erreur lors de la récupération des détails utilisateur',
      );
    } finally {
      endTimer();
    }
  }
}
