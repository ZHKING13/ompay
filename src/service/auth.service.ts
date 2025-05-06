import { BadGatewayException, Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

interface TangoAuthResponse {
  access_token: string;
  scope: string;
  token_type: string;
  expires_in: number;
}

@Injectable()
export class ApiAuthService {
  private readonly logger = new Logger(ApiAuthService.name);
  private accessToken: string | null = null;
  private tokenExpiry: number | null = null;

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {}

  async fetchToken(): Promise<void> {
    const authUrl = this.config.get('addon.brokerAuthUrl');
    const credentials = this.config.get<string>('addon.brokerAccessToken');

    this.logger.log('Tentative de récupération du token...', { 
      authUrl,
      hasCredentials: !!credentials
    });

    if (!authUrl || !credentials) {
      this.logger.error('Configuration d\'authentification manquante');
      throw new BadGatewayException('Configuration d\'authentification manquante');
    }

    const headers = {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    };

    const body = new URLSearchParams();
    body.append('grant_type', 'client_credentials');

    try {
      const response = await firstValueFrom<{ data: TangoAuthResponse }>(
        this.http.post(authUrl, body, { 
          headers,
          validateStatus: status => status === 200
        })
      );

      const { access_token, expires_in, token_type, scope } = response.data;
      
      if (!access_token || !expires_in) {
        this.logger.error('Réponse invalide du serveur d\'authentification', { 
          hasAccessToken: !!access_token,
          hasExpiresIn: !!expires_in 
        });
        throw new BadGatewayException('Réponse d\'authentification invalide');
      }

      this.accessToken = access_token;
      this.tokenExpiry = Date.now() + (expires_in * 1000);

      this.logger.log('Token obtenu avec succès', {
        tokenType: token_type,
        scope,
        expiresIn: expires_in,
        expiryDate: new Date(this.tokenExpiry).toISOString()
      });

    } catch (error) {
      this.logger.error('Échec de la récupération du token', {
        error: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      throw new BadGatewayException('Échec de la récupération du token');
    }
  }

  async getAccessToken(): Promise<string> {
    if (!this.accessToken || !this.tokenExpiry || Date.now() >= this.tokenExpiry) {
      this.logger.log('Token expiré ou manquant, récupération d\'un nouveau token...');
      await this.fetchToken();
    }

    if (!this.accessToken) {
      throw new BadGatewayException('Impossible d\'obtenir un token valide');
    }

    return this.accessToken;
  }
}
