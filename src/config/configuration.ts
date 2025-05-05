import { validatedEnv } from './env.config';

export default () => ({
  port: validatedEnv.PORT,

  database: {
    // host: validatedEnv.DB_HOST,
    // port: validatedEnv.DB_PORT,
    // username: validatedEnv.DB_USERNAME,
    // password: validatedEnv.DB_PASSWORD,
    // database: validatedEnv.DB_NAME,
  },

  redis: {
    host: validatedEnv.REDIS_HOST,
    port: validatedEnv.REDIS_PORT,
  },

  rateLimit: {
    ttl: validatedEnv.THROTTLE_TTL,
    limit: validatedEnv.THROTTLE_LIMIT,
  },

  addon: {
    defaultCurrency: validatedEnv.DEFAULT_CURRENCY,
    coreApiLogin: validatedEnv.CORE_API_LOGIN,
    coreApiUrl: validatedEnv.CORE_API_URL,
    coreApiPassword: validatedEnv.CORE_API_PASSWORD,
    coreApiClientId: validatedEnv.CORE_API_CLIENT_ID,
    brokerUrl: validatedEnv.BROKER_URL,
    brokerAddonId: validatedEnv.BROKER_ADDON_ID,
    brokerAuthUrl: validatedEnv.BROKER_AUTH_URL,
    brokerAccessToken: validatedEnv.BROKER_ACCESS_TOKEN,
  },

  countries: {
    CI: {
      qrCodePartners: ['fastpayqr', 'odyssee'],
      fastpayqr: {
        apiUrl: validatedEnv.CI_FASTPAYQR_API_URL,
        apiKey: validatedEnv.CI_FASTPAYQR_API_KEY,
        mock: process.env.FASTPAYQR_MOCK === 'true',
      },
      odyssee: {
        apiUrl: validatedEnv.CI_ODYSSEE_API_URL,
        apiKey: validatedEnv.CI_ODYSSEE_API_KEY,
        mock: process.env.ODYSSEE_MOCK === 'true',
      },
      addonId: validatedEnv.CI_ADDON_ID,
    },
  },

  monitoring: {
    logLevel: validatedEnv.LOG_LEVEL,
    prometheusPath: '/metrics',
  },
});
