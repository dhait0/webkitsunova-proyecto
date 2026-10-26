import type { SessionUser } from './types';

export type AppRole = 'USER' | 'PSYCHOLOGIST' | 'ADMIN';

export const APP_ROLES: readonly AppRole[] = ['USER', 'PSYCHOLOGIST', 'ADMIN'];

/** Home path for each role, used by login redirects and route guards. */
export const roleHome: Record<AppRole, string> = {
  USER: '/dashboard',
  PSYCHOLOGIST: '/psy',
  ADMIN: '/admin',
};

export function toAppRole(role: string | undefined | null): AppRole {
  if (role === 'ADMIN' || role === 'PSYCHOLOGIST' || role === 'USER') {
    return role;
  }

  return 'USER';
}

/**
 * Reads the role off a Supabase user, defaulting to `USER`.
 *
 * `app_metadata` is the only source of truth (see agents.md §22): `user.role`
 * holds Supabase's own auth role ('authenticated', 'anon') and must never grant
 * an area.
 */
export function getRole(user: { app_metadata?: Record<string, unknown> }): AppRole {
  return roleFromSupabaseUser(user);
}

export function homeForRole(role: string | undefined | null): string {
  return roleHome[toAppRole(role)];
}

export type AppView = {
  to: string;
  label: string;
  role: AppRole;
};

/**
 * Every view a role may reach through the switcher.
 *
 * A `USER` has a single home, so the list is empty and the switcher is not
 * rendered at all. `ADMIN` is admitted to `/psy` so an administrator can inspect
 * the psychologist experience; the psy data layer stays behind
 * `requireRole('PSYCHOLOGIST')`.
 */
const VIEWS_BY_ROLE: Record<AppRole, AppView[]> = {
  ADMIN: [
    { to: roleHome.ADMIN, label: 'Administración', role: 'ADMIN' },
    { to: roleHome.PSYCHOLOGIST, label: 'Psicólogo', role: 'PSYCHOLOGIST' },
    { to: roleHome.USER, label: 'Usuario', role: 'USER' },
  ],
  PSYCHOLOGIST: [
    { to: roleHome.PSYCHOLOGIST, label: 'Psicólogo', role: 'PSYCHOLOGIST' },
    { to: roleHome.USER, label: 'Usuario', role: 'USER' },
  ],
  USER: [],
};

export function availableViews(role: string | undefined | null): AppView[] {
  return VIEWS_BY_ROLE[toAppRole(role)];
}

/**
 * Reads the role from a Supabase user. `app_metadata.role` is the only source of
 * truth (see agents.md §22); `user.role` holds the Supabase auth role and must be
 * ignored.
 */
export function roleFromSupabaseUser(
  user: { app_metadata?: Record<string, unknown> } | null | undefined,
): AppRole {
  return toAppRole(user?.app_metadata?.role as string | undefined);
}

export function sessionUserFromSupabaseUser(
  user: {
    id: string;
    email?: string | null;
    app_metadata?: Record<string, unknown>;
    user_metadata?: Record<string, unknown> | null;
  } | null
  | undefined,
  status: string = 'ACTIVE',
): SessionUser | null {
  if (!user) {
    return null;
  }

  const metadata = (user.user_metadata ?? {}) as {
    first_name?: string;
    last_name?: string;
    username?: string;
  };

  return {
    id: user.id,
    email: user.email ?? '',
    role: roleFromSupabaseUser(user),
    status,
    profile: {
      firstName: metadata.first_name ?? null,
      lastName: metadata.last_name ?? null,
      username: metadata.username ?? null,
    },
  };
}
