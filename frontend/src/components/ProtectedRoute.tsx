import { useEffect, useState, type ReactNode } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { sessionUserFromSupabaseUser } from '@/lib/roles';
import type { SessionUser } from '@/types/session';

type ProtectedRouteProps = {
  children: ReactNode | ((session: SessionUser) => ReactNode);
};

function ProtectedRoute({ children }: ProtectedRouteProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [isAllowed, setIsAllowed] = useState(false);
  const [session, setSession] = useState<SessionUser | null>(null);

  useEffect(() => {
    let isMounted = true;

    supabase.auth.getSession().then(({ data: { session: supabaseSession } }) => {
      if (!isMounted) return;

      if (supabaseSession) {
        setSession(sessionUserFromSupabaseUser(supabaseSession.user));
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

  useEffect(() => {
    if (!isAllowed || !session) return;

    let isMounted = true;

    supabase.auth.mfa
      .getAuthenticatorAssuranceLevel()
      .then(({ data: aalData }) => {
        if (!isMounted) return;

        const currentLevel = aalData?.currentLevel ?? 'aal1';
        const nextLevel = aalData?.nextLevel ?? null;

        if (currentLevel === 'aal1' && nextLevel === 'aal2') {
          navigate('/mfa/verify', { replace: true });
        }
      })
      .catch(() => {
        if (!isMounted) return;
      });

    return () => {
      isMounted = false;
    };
  }, [isAllowed, session, navigate]);

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
