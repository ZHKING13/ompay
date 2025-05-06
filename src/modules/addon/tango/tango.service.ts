import { BadGatewayException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { Histogram } from 'prom-client';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { XMLParser } from 'fast-xml-parser';
import { ApiAuthService } from 'src/service/auth.service';
import {
  buildGetFeesParams,
  buildMerchantPaymentParams,
  buildP2PInitParams,
} from 'src/common/utils/tango.helpers';
import {
  TangoResponse,
  TangoBalanceResponse,
} from './interfaces/tango-response.interface';
import {
  TangoApiError,
  TangoMappingCode,
  TangoTxnStatus,
} from './interfaces/tango-error.interface';

@Injectable()
export class TangoService {
  private readonly logger = new Logger(TangoService.name);
  private accessToken: string | null = null;
  private tokenExpiry: number | null = null;
  private parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '',
    parseTagValue: true,
  });
  constructor(
    private readonly http: HttpService,
    private readonly authService: ApiAuthService,
    private readonly config: ConfigService,
    @InjectMetric('tango_api_request_duration_seconds')
    private readonly durationHistogram: Histogram<string>,
  ) {}

  private validateTangoResponse(response: TangoResponse): void {
    const { broker_response, mapping_response, wallet_response } =
      response.response;

    this.logger.debug('Validation de la réponse Tango', {
      brokerCode: broker_response?.broker_code,
      mappingCode: mapping_response?.mapping_code,
      txnStatus: wallet_response?.txnstatus,
      message: wallet_response?.message,
    });

    // Vérification du succès de la transaction
    const isSuccess =
      mapping_response?.mapping_code === TangoMappingCode.SUCCESS &&
      wallet_response?.txnstatus === TangoTxnStatus.SUCCESS;

    if (isSuccess) {
      return;
    }

    // Gestion des différents cas d'erreur
    switch (wallet_response?.txnstatus) {
      case TangoTxnStatus.PIN_INCORRECT:
        throw new TangoApiError(
          mapping_response?.mapping_code,
          wallet_response?.txnstatus,
          'Code PIN incorrect',
          broker_response?.session_id,
        );

      case TangoTxnStatus.INSUFFICIENT_BALANCE:
        throw new TangoApiError(
          mapping_response?.mapping_code,
          wallet_response?.txnstatus,
          'Solde insuffisant',
          broker_response?.session_id,
        );

      case TangoTxnStatus.INVALID_MSISDN:
        throw new TangoApiError(
          mapping_response?.mapping_code,
          wallet_response?.txnstatus,
          'Numéro de téléphone invalide',
          broker_response?.session_id,
        );

      case TangoTxnStatus.ACCOUNT_NOT_FOUND:
        throw new TangoApiError(
          mapping_response?.mapping_code,
          wallet_response?.txnstatus,
          'Compte non trouvé',
          broker_response?.session_id,
        );

      case TangoTxnStatus.ACCOUNT_BLOCKED:
        throw new TangoApiError(
          mapping_response?.mapping_code,
          wallet_response?.txnstatus,
          'Compte bloqué',
          broker_response?.session_id,
        );

      case TangoTxnStatus.TIMEOUT:
        throw new TangoApiError(
          mapping_response?.mapping_code,
          wallet_response?.txnstatus,
          'La requête a expiré',
          broker_response?.session_id,
        );

      case TangoTxnStatus.SERVICE_UNAVAILABLE:
        throw new TangoApiError(
          mapping_response?.mapping_code,
          wallet_response?.txnstatus,
          'Service temporairement indisponible',
          broker_response?.session_id,
        );

      default:
        throw new TangoApiError(
          mapping_response?.mapping_code,
          wallet_response?.txnstatus,
          wallet_response?.message || 'Une erreur est survenue',
          broker_response?.session_id,
        );
    }
  }

  async getCustomerBalance(params: {
    msisdn: string;
    pin: string;
    provider?: string;
    payid?: string;
    blocksms?: 'PAYER' | 'BOTH' | 'NONE';
    em?: string;
    txnmode?: string;
    service_id?: string;
    country_id: string;
    addon_id: string;
  }): Promise<TangoBalanceResponse> {
    const baseUrl = this.config.get('addon.brokerUrl');
    const url = new URL('/customerbalance', baseUrl);

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, value);
      }
    });

    const start = Date.now();

    const endTimer = this.durationHistogram.startTimer({
      endpoint: 'customerbalance',
    });
    try {
      const headers = {
        Authorization: `Bearer ${await this.getAccessToken()}`,
      };
      const response = await firstValueFrom(
        this.http.get(url.toString(), { headers }),
      );

      const duration = Date.now() - start;
      this.logger.log(`GET /wallet/customerbalance responded in ${duration}ms`);

      const rawResponse = this.parseXmlToJson(response) as TangoResponse;

      try {
        this.validateTangoResponse(rawResponse);
      } catch (error) {
        if (error instanceof TangoApiError) {
          if (error.txnStatus === TangoTxnStatus.PIN_INCORRECT) {
            throw new UnauthorizedException('Code PIN incorrect');
          }
          throw error;
        }
        throw error;
      }

      return this.transformBalanceResponse(rawResponse);
    } catch (error) {
      const duration = Date.now() - start;
      this.logger.error(
        `GET /wallet/customerbalance failed after ${duration}ms: ${error.message}`,
        { error: error.stack, params: { ...params, pin: '****' } },
      );
      throw error;
    } finally {
      endTimer();
    }
  }

  private transformBalanceResponse(
    rawResponse: TangoResponse,
  ): TangoBalanceResponse {
    const { broker_response, mapping_response, wallet_response } =
      rawResponse.response;

    // Extraire les frais du message s'ils existent
    const feeRegex =
      /service charge (\d+(?:\.\d+)?)(?: FCFA)?.*Commission (\d+(?:\.\d+)?)/i;
    const feeMatch = wallet_response.message.match(feeRegex);

    const fees = feeMatch
      ? {
          serviceCharge: parseFloat(feeMatch[1]) || 0,
          commission: parseFloat(feeMatch[2]) || 0,
        }
      : undefined;

    return {
      sessionId: broker_response.session_id,
      status: {
        code: wallet_response.txnstatus,
        message: broker_response.broker_msg,
      },
      balance: {
        available: parseFloat(wallet_response.balance) || 0,
        frozen: parseFloat(wallet_response.frbalance) || 0,
      },
      transaction: {
        id: wallet_response.txnid,
        type: wallet_response.type,
        reference: wallet_response.trid,
      },
      ...(fees && { fees }),
    };
  }

  async getFees(params: {
    amount: string;
    service_type: string;
    payer_user_type: 'CHANNEL' | 'SUBSCRIBER' | 'MERCHANT' | 'OPERATOR';
    payer_account_id: string;
    payer_provider_id: string;
    payer_pay_id: string;
    payee_user_type: 'CHANNEL' | 'SUBSCRIBER' | 'MERCHANT' | 'OPERATOR';
    payee_account_id: string;
    payee_provider_id: string;
    payee_pay_id: string;
    country_id: string;
    addon_id: string;
  }) {
    const baseUrl = this.config.get('addon.brokerUrl');
    const url = new URL('/pricing', baseUrl);
    const fullParams = buildGetFeesParams(params);
    this.logger.log(`url PRICING: ${url}`);
    Object.entries(fullParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, value);
      }
    });

    const start = Date.now();
    const endTimer = this.durationHistogram.startTimer({
      endpoint: 'customerbalance',
    });
    try {
      const headers = {
        Authorization: `Bearer ${await this.getAccessToken()}`,
      };
      const response = await firstValueFrom(
        this.http.get(url.toString(), { headers }),
      );

      const duration = Date.now() - start;
      this.logger.log(`GET /wallet/pricing responded in ${duration}ms`);
      return this.parseXmlToJson(response);
    } catch (error) {
      const duration = Date.now() - start;
      this.logger.error(
        `GET /wallet/pricing failed after ${duration}ms: ${error.message}`,
      );
      throw error;
    } finally {
      endTimer();
    }
  }

  async p2pInit(params: {
    amount: string;
    msisdn: string;
    msisdn2: string;
    pin: string;
    em?: string;
    provider?: string;
    provider2?: string;
    payid?: string;
    payid2?: string;
    blocksms: 'PAYER' | 'BOTH' | 'PAYEE' | 'NONE';
    txnmode: 'P2P';
    country_id: string;
  }) {
    const baseUrl = this.config.get('addon.brokerUrl');
    const url = new URL('/p2pinit', baseUrl);
    const fullParams = buildP2PInitParams(params);
    this.logger.log(`url P2P: ${url}`);
    Object.entries(fullParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, value);
      }
    });

    const start = Date.now();

    const endTimer = this.durationHistogram.startTimer({
      endpoint: 'p2pinit',
    });
    try {
      const headers = {
        Authorization: `Bearer ${await this.getAccessToken()}`,
      };
      const response = await firstValueFrom(
        this.http.get(url.toString(), { headers }),
      );

      const duration = Date.now() - start;
      this.logger.log(`GET /p2pinit responded in ${duration}ms`);
      return this.parseXmlToJson(response);
    } catch (error) {
      const duration = Date.now() - start;
      this.logger.error(
        `GET /p2pinit failed after ${duration}ms: ${error.message}`,
      );
      throw error;
    } finally {
      endTimer();
    }
  }

  async merchantPaymentOneStep(params: {
    amount: string;
    mercode: string;
    pin2: string; //user pin
    msisdn2: string; //user phone number
    msisdn?: string; //marchant phone number
    provider?: string;
    provider2?: string;
    payid?: string;
    payid2?: string;
    blocksms?: 'PAYER' | 'BOTH' | 'PAYEE' | 'NONE';
    txnmode?: 'P2P' | 'B2B' | 'C2B';
    service_id?: string;
    country_id: string;
  }) {
    const baseUrl = this.config.get('addon.brokerUrl');
    const url = new URL('/merchantpaymentonestep', baseUrl);
    const fullParams = buildMerchantPaymentParams(params);

    Object.entries(fullParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, value);
      }
    });
    this.logger.log(`url MPAY: ${url}`);
    const start = Date.now();
    const endTimer = this.durationHistogram.startTimer({
      endpoint: 'merchantPaymentOneStep',
    });
    try {
      const headers = {
        Authorization: `Bearer ${await this.getAccessToken()}`,
      };
      const response = await firstValueFrom(
        this.http.get(url.toString(), { headers }),
      );

      const duration = Date.now() - start;
      this.logger.log(`GET /merchantpaymentonestep responded in ${duration}ms`);
      return this.parseXmlToJson(response);
    } catch (error) {
      const duration = Date.now() - start;
      this.logger.error(
        `GET /merchantpaymentonestep failed after ${duration}ms: ${error.message}`,
      );
      throw error;
    } finally {
      endTimer();
    }
  }

  async customerLastNTransaction(params: {
    pin: string;
    em?: string;
    msisdn: string;
    provider?: string;
    payid?: string;
    service?: string;
    nooftxnreq?: string;
    blocksms?: 'PAYER' | 'BOTH' | 'PAYEE' | 'NONE';
    txnmode?: 'P2P' | 'P2B' | 'B2P' | 'B2B';
    country_id: string;
  }) {
    const baseUrl = this.config.get('addon.brokerUrl');
    const url = new URL('/customerlastntransaction', baseUrl);

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, value.toString());
      }
    });

    const start = Date.now();

    const endTimer = this.durationHistogram.startTimer({
      endpoint: 'customerlastntransaction',
    });
    try {
      const headers = {
        Authorization: `Bearer ${await this.getAccessToken()}`,
      };
      const response = await firstValueFrom(
        this.http.get(url.toString(), { headers }),
      );

      const duration = Date.now() - start;
      this.logger.log(
        `GET /wallet/customerlastntransaction responded in ${duration}ms`,
      );
      return this.parseXmlToJson(response);
    } catch (error) {
      const duration = Date.now() - start;
      this.logger.error(
        `GET /wallet/customerlastntransaction failed after ${duration}ms: ${error.message}`,
      );
      throw error;
    } finally {
      endTimer();
    }
  }
  async userEnquiry(params: {
    pin: string;
    em?: string;
    msisdn: string;
    provider?: string;
    payid?: string;
    usertype?: 'CHANNEL' | 'SUBSCRIBER' | 'MERCHANT' | 'OPERATOR';
    blocksms?: 'BOTH' | 'NONE';
    country_id: string;
  }) {
    const baseUrl = this.config.get('addon.brokerUrl');
    const url = new URL('/userenquiry', baseUrl);

    this.logger.log(
      `Tentative de requête userenquiry pour msisdn: ${params.msisdn}`,
    );

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, value.toString());
      }
    });

    const start = Date.now();
    const endTimer = this.durationHistogram.startTimer({
      endpoint: 'userenquiry',
    });

    try {
      this.logger.log(`Envoi de la requete vers : ${url.toString()}`);
      this.logger.log(`Params de la requete : ${JSON.stringify(params)}`);
      const headers = {
        Authorization: `Bearer ${await this.getAccessToken()}`,
      };

      this.logger.log(`Envoi de la requete vers : ${url.toString()}`);

      const response = await firstValueFrom(
        this.http.get(url.toString(), { headers }),
      );

      const duration = Date.now() - start;
      this.logger.log(`GET /userenquiry responded in ${duration}ms`);

      const result = this.parseXmlToJson(response);
      this.logger.log('Réponse userenquiry reçue', { result });

      return result;
    } catch (error) {
      const duration = Date.now() - start;
      this.logger.error(
        `GET /userenquiry failed after ${duration}ms: ${error.message}`,
        {
          error: error.stack,
          params,
        },
      );
      throw error.message;
    } finally {
      endTimer();
    }
  }
  private parseXmlToJson(response: any) {
    try {
      if (!response?.data) {
        this.logger.error('Réponse XML invalide : données manquantes');
        throw new Error('Réponse XML invalide : données manquantes');
      }

      const xml = response.data;
      const json = this.parser.parse(xml);

      if (!json?.response) {
        this.logger.error('Structure JSON invalide après parsing', { json });
        throw new Error('Structure de réponse invalide');
      }

      // Log détaillé de la réponse
      this.logger.debug('Réponse Tango parsée', {
        brokerCode: json.response?.broker_response?.broker_code,
        mappingCode: json.response?.mapping_response?.mapping_code,
        walletStatus: json.response?.wallet_response?.txnstatus,
        sessionId: json.response?.broker_response?.session_id,
      });

      return json;
    } catch (error) {
      this.logger.error('Erreur lors du parsing XML vers JSON', {
        error: error.message,
        stack: error.stack,
        responseData: response?.data,
      });
      throw error;
    }
  }

  async fetchToken() {
    const authUrl = 'http://192.168.237.174:8280/token';
    const credentials =
      'NzVraHlETEh3c3VhelhFbTdYeVVPX1dHNWdNYTptYzdWcldoUU56OGZMclg2Y0xLOGJDdTU4bXNh';

    this.logger.log("Configuration d'authentification:", {
      authUrlConfigured: !!authUrl,
      credentialsConfigured: !!credentials,
    });
 this.logger.log(
   `Tentative de recuperation: ${authUrl} avec acces token: ${credentials}`,
 );
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
   Authorization: `Basic ${credentials}`,
   'Content-Type': 'application/x-www-form-urlencoded',
 };

 const body = new URLSearchParams();
 body.append('grant_type', 'client_credentials');


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
