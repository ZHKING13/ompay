import { BadGatewayException, Injectable, Logger } from '@nestjs/common';
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

  async fetchToken(): Promise<void> {
    const authUrl = 'http://192.168.237.174:8280/token';
    const credentials =
      'NzVraHlETEh3c3VhelhFbTdYeVVPX1dHNWdNYTptYzdWcldoUU56OGZMclg2Y0xLOGJDdTU4bXNh';

    this.logger.log("Configuration d'authentification:", {
      authUrlConfigured: !!authUrl,
      credentialsConfigured: !!credentials,
    });

    if (!authUrl || !credentials) {
      this.logger.error("Configuration d'authentification manquante", {
        authUrlPresent: !!authUrl,
        credentialsPresent: !!credentials,
      });
      throw new BadGatewayException(
        "Configuration d'authentification manquante",
      );
    }

    const headers = {
      Authorization: credentials,
      'Content-Type': 'application/x-www-form-urlencoded',
    };

    const body = new URLSearchParams({ grant_type: 'client_credentials' });

    this.logger.log('Tentative de recuperation du token Tango...', {
      authUrl,
      headerKeys: Object.keys(headers),
    });

    try {
      const response = await firstValueFrom(
        this.http.post(authUrl, body.toString(), { headers }),
      );

      const { access_token, expires_in } = response.data;

      if (!access_token || !expires_in) {
        this.logger.error("Réponse invalide du serveur d'authentification", {
          hasAccessToken: !!access_token,
          hasExpiry: !!expires_in,
        });
        throw new BadGatewayException("Réponse d'authentification invalide");
      }

      this.accessToken = access_token;
      this.tokenExpiry = Date.now() + expires_in * 1000;

      this.logger.log('Token Tango obtenu avec succès', {
        expiresIn: expires_in,
        expiryDate: new Date(this.tokenExpiry).toISOString(),
      });
    } catch (error) {
      this.logger.error('Échec de la récupération du token Tango', {
        error: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      throw new BadGatewayException('Échec de la récupération du token Tango');
    }
  }

  async getAccessToken(): Promise<string> {
    if (
      !this.accessToken ||
      !this.tokenExpiry ||
      Date.now() > this.tokenExpiry
    ) {
      this.logger.log(
        "Token expiré ou manquant, récupération d'un nouveau token...",
      );
      await this.fetchToken();
    }

    if (!this.accessToken) {
      throw new BadGatewayException("Impossible d'obtenir un token valide");
    }

    return this.accessToken;
  }
}
