'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { dashboardSidebarItems } from '@/content/siteContent';
import type { SessionUser } from '@/lib/auth/types';

type DashboardSidebarProps = {
  onLogout: () => void;
  loggingOut: boolean;
  session: SessionUser;
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
};

function DashboardSidebar({
  onLogout,
  loggingOut,
  session,
  sidebarCollapsed,
  toggleSidebar
}: DashboardSidebarProps) {
  const pathname = usePathname();
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

  return (
    <aside className={`sidebar${sidebarCollapsed ? ' collapsed' : ''}`}>
      <button
        type="button"
        className="sidebar-toggle"
        onClick={toggleSidebar}
        aria-label={sidebarCollapsed ? 'Expandir menú' : 'Colapsar menú'}
        title={sidebarCollapsed ? 'Expandir menú' : 'Colapsar menú'}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {sidebarCollapsed ? (
            <path d="M4 6h16M4 12h16M4 18h16" />
          ) : (
            <path d="M6 18L18 6M18 18L6 6" />
          )}
        </svg>
      </button>

      <div className="sidebar-header">
        <Link href="/" className="sidebar-logo" aria-label="Volver al inicio">
          <img src="/brand/isotipo.png" alt="Kitsunova" />
        </Link>
        <div className="sidebar-brand">
          <strong>Kitsunova</strong>
          <span>Plataforma de hábitos</span>
        </div>
      </div>

      <div className="sidebar-user">
        <div className="sidebar-avatar">{displayName.slice(0, 1).toUpperCase()}</div>
        <div>
          <strong>{displayName}</strong>
          <span>{roleLabel}</span>
        </div>
      </div>

      <nav className="sidebar-menu" aria-label="Navegación lateral">
        <ul>
          {dashboardSidebarItems.map((item) => {
            const end = 'end' in item ? item.end : false;
            const isActive = end ? pathname === item.to : pathname.startsWith(item.to);

            return (
              <li key={item.label}>
                <Link
                  href={item.to}
                  aria-current={isActive ? 'page' : undefined}
                  className={`sidebar-link${isActive ? ' active' : ''}`}
                >
                  <span className="menu-icon">{item.code}</span>
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <button className="help-btn" type="button" onClick={onLogout} disabled={loggingOut}>
        <span>{loggingOut ? 'Cerrando...' : 'Cerrar sesión'}</span>
      </button>
    </aside>
  );
}

export default DashboardSidebar;
