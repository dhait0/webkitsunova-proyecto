import { Navigate, useLocation } from 'react-router-dom';
import { type ReactNode } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { homeForRole } from '@/lib/roles';
import type { SessionUser } from '@/types/session';

type PsyRouteProps = {
  children: (session: SessionUser) => ReactNode;
};

/**
 * Gate for the psychologist area. Requires `PSYCHOLOGIST`; every other role is
 * sent to its own home. `ADMIN` is also admitted so the view switcher can send
 * an administrator here to inspect the psychologist experience — the psy API
 * stays behind `requireRole('PSYCHOLOGIST')` in the backend, so this only
 * affects what the frontend renders. Approval status is not checked here — the
 * backend returns `PSY_NOT_APPROVED` and `PsyLayout` renders the pending screen,
 * so a psychologist can still finish their profile while waiting.
 */
function PsyRoute({ children }: PsyRouteProps) {
  const location = useLocation();

  return (
    <ProtectedRoute>
      {(session) => {
        if (session.role !== 'PSYCHOLOGIST' && session.role !== 'ADMIN') {
          return <Navigate to={homeForRole(session.role)} replace state={{ from: location }} />;
        }

        return children(session);
      }}
    </ProtectedRoute>
  );
}

export default PsyRoute;
