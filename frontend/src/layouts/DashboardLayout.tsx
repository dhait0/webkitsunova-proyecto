import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import DashboardSidebar from '@/components/DashboardSidebar';
import type { SessionUser } from '@/types/session';

export type DashboardOutletContext = {
  session: SessionUser;
  displayName: string;
  roleLabel: string;
  loggingOut: boolean;
  logout: () => Promise<void>;
};

type DashboardLayoutProps = {
  session: SessionUser;
};

function DashboardLayout({ session }: DashboardLayoutProps) {
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);

  const displayName =
    session.profile?.firstName?.trim() ||
    session.profile?.username?.trim() ||
    session.email;

  const roleLabel =
    session.role === 'ADMIN'
      ? 'Administrador'
      : session.role === 'PSYCHOLOGIST'
        ? 'Psicólogo'
        : 'Usuario activo';

  async function handleLogout() {
    setLoggingOut(true);

    try {
      await supabase.auth.signOut();
      navigate('/login');
    } catch {
      navigate('/login');
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <div className="dashboard-layout">
      <DashboardSidebar session={session} onLogout={handleLogout} loggingOut={loggingOut} />

      <main className="dashboard-main">
        <header className="inicio-header">
          <div>
            <span className="eyebrow">Panel privado</span>
            <h1>Bienvenido de vuelta, {displayName}.</h1>
            <p>
              Esta es tu central de hábitos, chats con psicólogos y citas de seguimiento.
            </p>
          </div>

          <div className="dashboard-chip">
            <strong>{roleLabel}</strong>
            <span>{session.status ?? 'Cuenta activa'}</span>
          </div>
        </header>

        <Outlet
          context={{
            session,
            displayName,
            roleLabel,
            loggingOut,
            logout: handleLogout
          }}
        />
      </main>
    </div>
  );
}

export default DashboardLayout;
