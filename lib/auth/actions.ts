'use server';

import { createClient } from '@/lib/supabase/server';

export async function signOut(): Promise<void> {
  const client = await createClient();
  await client.auth.signOut();
}
