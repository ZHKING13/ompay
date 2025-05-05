import { envSchema } from './env.validation';

export const validatedEnv = envSchema.parse(process.env);
