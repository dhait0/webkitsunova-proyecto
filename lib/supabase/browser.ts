'use client';

import { createBrowserClient } from '@supabase/ssr';

/**
 * Supabase client for the browser. Present only so Client Components that must
 * talk to Auth directly (sign in, sign out, MFA enrolment) can do so; data
 * reads go through Server Components and mutations through Server Actions.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
