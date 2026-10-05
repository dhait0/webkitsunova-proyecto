'use client';

import { useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import DashboardSidebar from '@/components/DashboardSidebar';
import RoleSwitcher from '@/components/RoleSwitcher';
import { signOut } from '@/lib/auth/actions';
import type { SessionUser } from '@/lib/auth/types';
import { DashboardProvider, type DashboardOutletContext } from '@/features/user/context';

export type { DashboardOutletContext };

type DashboardLayoutProps = {
  session: SessionUser;
  children: ReactNode;
};

function DashboardLayout({ session, children }: DashboardLayoutProps) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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
      await signOut();
      router.replace('/login');
    } catch {
      router.replace('/login');
    } finally {
      setLoggingOut(false);
    }
  }

  function toggleSidebar() {
    setSidebarCollapsed((prev) => !prev);
  }

  return (
    <div className="dashboard-layout">
      <DashboardSidebar
        session={session}
        onLogout={handleLogout}
        loggingOut={loggingOut}
        sidebarCollapsed={sidebarCollapsed}
        toggleSidebar={toggleSidebar}
      />

      <main className="dashboard-main">
        <header className="inicio-header">
          <div>
            <span className="eyebrow">Panel privado</span>
            <h1>Bienvenido de vuelta, {displayName}.</h1>
            <p>
              Esta es tu central de hábitos, chats con psicólogos y citas de seguimiento.
            </p>
          </div>

          <div className="dashboard-header-actions">
            <RoleSwitcher session={session} />

            <button
              type="button"
              className="notif-bell-wrapper"
              aria-label="Notificaciones"
              title="Próximamente"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              <span className="notif-badge hidden" aria-hidden="true">
                0
              </span>
            </button>

            <div className="dashboard-chip">
              <strong>{roleLabel}</strong>
              <span>{session.status ?? 'Cuenta activa'}</span>
            </div>
          </div>
        </header>

        <DashboardProvider
          value={{
            session,
            displayName,
            roleLabel,
            loggingOut,
            logout: handleLogout,
            sidebarCollapsed,
            toggleSidebar,
          }}
        >
          {children}
        </DashboardProvider>
      </main>
    </div>
  );
}

export default DashboardLayout;
