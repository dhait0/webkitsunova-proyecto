import { Navigate } from 'react-router-dom';
import { type ReactNode } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import type { SessionUser } from '@/types/session';

type AdminRouteProps = {
  children: (session: SessionUser) => ReactNode;
};

function AdminRoute({ children }: AdminRouteProps) {
  return (
    <ProtectedRoute>
      {(session) => {
        if (session.role !== 'ADMIN') {
          return <Navigate to="/dashboard" replace />;
        }
        return children(session);
      }}
    </ProtectedRoute>
  );
}

export default AdminRoute;
