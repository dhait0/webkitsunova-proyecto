import { NavLink, Link } from 'react-router-dom';
import { dashboardSidebarItems } from '@/content/siteContent';
import type { SessionUser } from '@/types/session';

type DashboardSidebarProps = {
  onLogout: () => void;
  loggingOut: boolean;
  session: SessionUser;
};

function DashboardSidebar({ onLogout, loggingOut, session }: DashboardSidebarProps) {
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
    <aside className="sidebar">
      <div className="sidebar-header">
        <Link to="/" className="sidebar-logo" aria-label="Volver al inicio">
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
          {dashboardSidebarItems.map((item) => (
            <li key={item.label}>
              <NavLink
                to={item.to}
                end={'end' in item ? item.end : undefined}
                className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
              >
                <span className="menu-icon">{item.code}</span>
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <button className="help-btn" type="button" onClick={onLogout} disabled={loggingOut}>
        <span>{loggingOut ? 'Cerrando...' : 'Cerrar sesión'}</span>
      </button>
    </aside>
  );
}

export default DashboardSidebar;
