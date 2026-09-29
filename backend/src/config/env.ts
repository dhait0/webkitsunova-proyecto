import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3002),
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_SECRET_KEY: z.string().min(1).optional(),
  FRONTEND_URL: z.string().url().default('http://localhost:5174'),
  CORS_ORIGIN: z.string().default('http://localhost:5174'),
  DATABASE_URL: z.string().optional(),
});

export const env = schema.parse(process.env);
