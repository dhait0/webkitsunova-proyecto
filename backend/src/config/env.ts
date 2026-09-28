import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3002),
  SUPABASE_URL: z.string().url(),
  SUPABASE_SECRET_KEY: z.string().min(1),
  FRONTEND_URL: z.string().url().default('http://localhost:5174'),
  CORS_ORIGIN: z.string().default('http://localhost:5174'),
});

export const env = schema.parse(process.env);
