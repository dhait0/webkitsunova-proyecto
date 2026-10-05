import { z } from 'zod';

/**
 * Server-only environment. Next.js loads `.env` files itself, so there is no
 * `dotenv` import here. Values are read lazily so that importing this module
 * never throws at build time, when a variable may legitimately be absent.
 */
const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  SUPABASE_URL: z.string().min(1),
  SUPABASE_SECRET_KEY: z.string().min(1),
  NEXT_PUBLIC_SUPABASE_URL: z.string().min(1),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  DATABASE_URL: z.string().min(1),
  DIRECT_URL: z.string().min(1).optional(),
});

export type ServerEnv = z.infer<typeof schema>;

let cached: ServerEnv | null = null;

export function getEnv(): ServerEnv {
  if (cached) return cached;

  const parsed = schema.safeParse(process.env);

  if (!parsed.success) {
    const missing = parsed.error.issues
      .map((issue) => issue.path.join('.'))
      .join(', ');

    throw new Error(
      `[env] Faltan o son inválidas las variables de entorno: ${missing}. ` +
        'Revisa .env.local o las variables configuradas en Vercel.'
    );
  }

  cached = parsed.data;
  return cached;
}
