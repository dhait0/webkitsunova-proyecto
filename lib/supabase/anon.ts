import 'server-only';

import { createClient } from '@supabase/supabase-js';
import { getEnv } from '@/lib/validation/env';

/**
 * Publishable-key client that never stores a session. Server Actions use it
 * for flows where Supabase itself must act on behalf of the visitor (such as
 * sending the signup confirmation email) without writing auth cookies.
 */
export function createAnonClient() {
  const env = getEnv();

  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
