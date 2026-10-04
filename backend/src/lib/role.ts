import type { User } from '@supabase/supabase-js';

export function getRole(user: User): string {
  const appMetadata = user.app_metadata as Record<string, unknown> | undefined;
  if (appMetadata?.role && typeof appMetadata.role === 'string') {
    return appMetadata.role;
  }
  return 'USER';
}
