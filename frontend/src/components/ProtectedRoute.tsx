import { useEffect, useState, type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { apiFetch } from '@/lib/api';
import type { SessionUser } from '@/types/session';

type ProtectedRouteProps = {
  children: ReactNode | ((session: SessionUser) => ReactNode);
};

type MeResponse = {
  user: SessionUser;
};

function ProtectedRoute({ children }: ProtectedRouteProps) {
  const location = useLocation();
  const [checking, setChecking] = useState(true);
  const [isAllowed, setIsAllowed] = useState(false);
  const [session, setSession] = useState<SessionUser | null>(null);

  useEffect(() => {
    let isMounted = true;

    apiFetch<MeResponse>('/auth/me')
      .then((data) => {
        if (isMounted) {
          setSession(data.user);
          setIsAllowed(true);
        }
      })
      .catch(() => {
        if (isMounted) {
          setIsAllowed(false);
        }
      })
      .finally(() => {
        if (isMounted) {
          setChecking(false);
        }
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
