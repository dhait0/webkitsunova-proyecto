import { useEffect, useState, type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import type { SessionUser } from '@/types/session';

function getRoleFromUser(user: { app_metadata?: Record<string, unknown> } | null | undefined): string {
  const appMetadata = user?.app_metadata;
  if (appMetadata?.role && typeof appMetadata.role === 'string') {
    return appMetadata.role;
  }
  return 'USER';
}

type ProtectedRouteProps = {
  children: ReactNode | ((session: SessionUser) => ReactNode);
};

function ProtectedRoute({ children }: ProtectedRouteProps) {
  const location = useLocation();
  const [checking, setChecking] = useState(true);
  const [isAllowed, setIsAllowed] = useState(false);
  const [session, setSession] = useState<SessionUser | null>(null);

  useEffect(() => {
    let isMounted = true;

    supabase.auth.getSession().then(({ data: { session: supabaseSession } }) => {
      if (!isMounted) return;

      if (supabaseSession) {
        const user = supabaseSession.user;
        const profile = (user.user_metadata as { first_name?: string; last_name?: string; username?: string }) ?? {};
        const role = getRoleFromUser(user);
        setSession({
          id: user.id,
          email: user.email ?? '',
          role,
          status: 'ACTIVE',
          profile: {
            firstName: profile.first_name ?? null,
            lastName: profile.last_name ?? null,
            username: profile.username ?? null,
          },
        });
        setIsAllowed(true);
      } else {
        setIsAllowed(false);
      }
      setChecking(false);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  if (checking) {
    return (
      <div className="route-guard">
        <p>Verificando sesión...</p>
      </div>
    );
  }

  if (!isAllowed) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!session) {
    return (
      <div className="route-guard">
        <p>Preparando sesión...</p>
      </div>
    );
  }

  if (typeof children === 'function') {
    return children(session);
  }

  return children;
}

export default ProtectedRoute;
