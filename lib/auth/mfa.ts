import 'server-only';

import { createClient } from '@/lib/supabase/server';

export type MfaStatus = {
  mfaEnabled: boolean;
  mfaType: 'totp' | null;
  factorId: string | null;
};

/**
 * Reads the MFA state straight from Supabase Auth.
 *
 * This replaces the old `GET /api/auth/mfa/status`: a Server Component calls it
 * directly instead of making the browser fetch it over HTTP.
 */
export async function getMfaStatus(): Promise<MfaStatus> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.mfa.listFactors();

  if (error) {
    return { mfaEnabled: false, mfaType: null, factorId: null };
  }

  const totp = data?.totp?.[0] ?? null;

  return {
    mfaEnabled: totp !== null,
    mfaType: totp ? 'totp' : null,
    factorId: totp?.id ?? null,
  };
}
