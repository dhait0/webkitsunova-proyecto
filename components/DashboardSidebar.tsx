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
    <aside className={`user-sidebar${sidebarCollapsed ? ' collapsed' : ''}`}>
      <div className="user-sidebar-brand">
        <Link href="/" className="user-brand-mark" aria-label="Volver al inicio">
          <img src="/brand/isotipo.png" alt="Kitsunova" />
        </Link>
        <div className="user-brand-text">
          <span className="user-brand-name">Kitsunova</span>
          <span className="user-brand-tag">Plataforma de hábitos</span>
        </div>
        <button
          type="button"
          className="user-sidebar-toggle"
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
            aria-hidden="true"
          >
            {sidebarCollapsed ? (
              <path d="M4 6h16M4 12h16M4 18h16" />
            ) : (
              <path d="M6 18L18 6M18 18L6 6" />
            )}
          </svg>
        </button>
      </div>

      <div className="user-sidebar-user">
        <div className="user-avatar" aria-hidden="true">
          {displayName.slice(0, 1).toUpperCase()}
        </div>
        <div>
          <strong>{displayName}</strong>
          <span>{roleLabel}</span>
        </div>
      </div>

      <nav className="user-nav" aria-label="Navegación lateral">
        {dashboardSidebarItems.map((item) => {
          const end = 'end' in item ? item.end : false;
          const isActive = end ? pathname === item.to : pathname.startsWith(item.to);

          return (
            <Link
              key={item.label}
              href={item.to}
              aria-current={isActive ? 'page' : undefined}
              className={`user-nav-link${isActive ? ' active' : ''}`}
            >
              <span className="user-nav-code" aria-hidden="true">
                {item.code}
              </span>
              <span className="user-nav-label">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="user-sidebar-footer">
        <button className="user-logout" type="button" onClick={onLogout} disabled={loggingOut}>
          <span>{loggingOut ? 'Cerrando...' : 'Cerrar sesión'}</span>
        </button>
      </div>
    </aside>
  );
}

export default DashboardSidebar;
