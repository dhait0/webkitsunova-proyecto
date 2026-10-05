import 'server-only';

import { createClient } from '@supabase/supabase-js';
import { getEnv } from '@/lib/validation/env';

/**
 * Supabase client with the secret key. Server-only by construction: the import
 * of `server-only` makes any client-side use a build error rather than a
 * credential leak.
 */
export function createAdminClient() {
  const env = getEnv();

  return createClient(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
