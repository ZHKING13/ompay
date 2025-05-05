import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class ApiAuthService {
  private readonly logger = new Logger(ApiAuthService.name);
  private accessToken: string | null = null;
  private tokenExpiry: number | null = null;

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {}

  private async fetchToken(): Promise<void> {
    const authUrl = this.config.get<string>('addon.brokerAuthUrl');
    const credentials = this.config.get<string>('addon.brokerAccessToken');
    if (!authUrl || !credentials) {
      throw new Error(
        'Tango auth configuration is missing in environment variables',
      );
    }
    const headers = {
      Authorization: credentials,
      'Content-Type': 'application/x-www-form-urlencoded',
    };

    const body = new URLSearchParams({ grant_type: 'client_credentials' });

    try {
      const response = await firstValueFrom(
        this.http.post(authUrl, body.toString(), { headers }),
      );
      const { access_token, expires_in } = response.data;
      this.accessToken = access_token;
      this.tokenExpiry = Date.now() + expires_in * 1000;
      this.logger.log('Tango access token fetched successfully');
    } catch (error) {
      this.logger.error('Failed to fetch Tango access token', error.message);
      throw error;
    }
  }

  async getAccessToken(): Promise<string> {
    if (
      !this.accessToken ||
      !this.tokenExpiry ||
      Date.now() > this.tokenExpiry
    ) {
      await this.fetchToken();
    }
    return this.accessToken!;
  }
}
