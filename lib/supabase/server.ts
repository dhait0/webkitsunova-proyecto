import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Supabase client bound to the request's cookies. Server Components and Server
 * Actions read and write the session through this client, which is why the
 * migration away from localStorage was unavoidable: they have no access to
 * browser storage.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // `setAll` throws when called from a Server Component, which cannot
            // write cookies. `middleware.ts` performs the refresh on navigation,
            // so the failure here is safe to ignore.
          }
        },
      },
    }
  );
}
