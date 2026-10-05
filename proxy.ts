import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { homeForRole } from '@/lib/auth/roles';

/**
 * Optimistic gate only. It reads the role out of the request's session without
 * re-verifying it, purely to avoid rendering a page that will redirect. Real
 * authorization happens in `lib/auth/guard.ts`, which runs in the Node runtime
 * and calls `supabase.auth.getUser()`.
 *
 * Next.js 16 renamed this file convention from `middleware` to `proxy`; the
 * rename exists to stop the file being confused with Express middleware.
 */

const AREAS: Record<string, string> = {
  '/dashboard': 'USER',
  '/psy': 'PSYCHOLOGIST',
  '/admin': 'ADMIN',
};

/** Routes reachable without a session. `/mfa/verify` needs one, but not aal2. */
const PUBLIC_PATHS = new Set(['/']);

function areaOf(pathname: string): string | null {
  for (const area of Object.keys(AREAS)) {
    if (pathname === area || pathname.startsWith(`${area}/`)) {
      return area;
    }
  }
  return null;
}

function isPublic(pathname: string): boolean {
  if (PUBLIC_PATHS.has(pathname)) return true;
  return pathname === '/mfa/verify';
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    }
  );

  // Refreshes a stale access token. This is the only place that writes cookies
  // during an ordinary navigation.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const area = areaOf(pathname);

  if (area === null || isPublic(pathname)) {
    return response;
  }

  if (!user) {
    const login = new URL('/login', request.url);
    login.searchParams.set('next', `${pathname}${search}`);
    return NextResponse.redirect(login);
  }

  const role = typeof user.app_metadata?.role === 'string' ? user.app_metadata.role : 'USER';

  // An administrator may inspect every area; other roles only reach their own.
  if (role !== 'ADMIN' && AREAS[area] !== role) {
    return NextResponse.redirect(new URL(homeForRole(role), request.url));
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|brand/|.*\\.(?:svg|png|jpg|jpeg|webp|woff2?)$).*)',
  ],
};
