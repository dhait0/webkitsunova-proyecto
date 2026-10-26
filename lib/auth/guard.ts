import 'server-only';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/db/prisma';
import { homeForRole, toAppRole, type AppRole } from './roles';
import type { SessionUser } from './types';

/**
 * The single authorization boundary. Every layout that guards an area calls
 * this, so the check runs in the Node runtime and verifies the session against
 * Supabase rather than trusting a claim.
 *
 * `middleware.ts` is a UX optimization in front of this, not a replacement.
 */

export async function getSessionUser(): Promise<SessionUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { status: true },
  });

  if (!dbUser) return null;

  return {
    id: user.id,
    email: user.email ?? '',
    role: toAppRole(user.app_metadata?.role as string | undefined),
    status: dbUser.status,
    profile: {
      firstName: (user.user_metadata?.first_name as string | undefined) ?? null,
      lastName: (user.user_metadata?.last_name as string | undefined) ?? null,
      username: (user.user_metadata?.username as string | undefined) ?? null,
    },
  };
}

/**
 * Requires any authenticated session, regardless of role. Returns it for the
 * layout to pass down to the tree.
 */
export async function requireUser(): Promise<SessionUser> {
  const session = await getSessionUser();

  if (!session) {
    redirect('/login');
  }

  return session;
}

/**
 * Guards an area by its role. `ADMIN` is admitted everywhere so it can inspect
 * each area; the data layer still refuses non-psychologists.
 */
export async function requireRole(role: AppRole): Promise<SessionUser> {
  const session = await getSessionUser();

  if (!session) {
    redirect('/login');
  }

  const actual = toAppRole(session.role);

  if (actual !== role && actual !== 'ADMIN') {
    redirect(homeForRole(actual));
  }

  return session;
}

/**
 * Server-side authorization for data access. Returns `null` instead of
 * redirecting, for use inside Server Components and Server Actions where a
 * thrown redirect would be wrong.
 */
export async function authorize(roles?: readonly AppRole[]): Promise<SessionUser | null> {
  const session = await getSessionUser();

  if (!session) return null;
  if (session.status !== 'ACTIVE') return null;
  if (!roles) return session;
  if (roles.includes(toAppRole(session.role))) return session;

  return null;
}
