import * as dotenv from 'dotenv';
dotenv.config();
import { z } from 'zod';

export const envSchema = z.object({
  PORT: z.string().transform(Number).default('3000'),

  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.string().transform(Number).default('6379'),

  THROTTLE_TTL: z.string().transform(Number).default('60'),
  THROTTLE_LIMIT: z.string().transform(Number).default('100'),

  DEFAULT_CURRENCY: z.string().default('XOF'),
  CORE_API_URL: z.string(),
  CORE_API_LOGIN: z.string(),
  CORE_API_PASSWORD: z.string(),
  CORE_API_CLIENT_ID: z.string(),

  CI_FASTPAYQR_API_URL: z.string(),
  CI_FASTPAYQR_API_KEY: z.string(),

  CI_ODYSSEE_API_URL: z.string(),
  CI_ODYSSEE_API_KEY: z.string(),
  BROKER_AUTH_URL: z.string(),
  BROKER_ACCESS_TOKEN: z.string(),
  
  CI_ADDON_ID: z.string(),
  BROKER_URL: z.string(),
  BROKER_ADDON_ID: z.string(),
  LOG_LEVEL: z.string().default('info'),
});

