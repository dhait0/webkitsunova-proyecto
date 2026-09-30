import { NavLink, Link } from 'react-router-dom';
import { psySidebarItems } from '@/content/siteContent';
import type { SessionUser } from '@/types/session';

type PsySidebarProps = {
  session: SessionUser;
  displayName: string;
  onLogout: () => void;
  loggingOut: boolean;
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  badges?: { mensajes?: number; talleres?: number; recursos?: number };
};

function PsySidebar({
  session,
  displayName,
  onLogout,
  loggingOut,
  sidebarCollapsed,
  toggleSidebar,
  badges = {}
}: PsySidebarProps) {
  const badgeFor = (to: string) => {
    if (to === '/psy/mensajes') return badges.mensajes;
    if (to === '/psy/talleres') return badges.talleres;
    if (to === '/psy/recursos') return badges.recursos;
    return undefined;
  };

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
        <Link to="/" className="sidebar-logo" aria-label="Volver al inicio">
          <img src="/brand/isotipo.png" alt="Kitsunova" />
        </Link>
        <div className="sidebar-brand">
          <strong>Kitsunova</strong>
          <span>Panel de psicólogo</span>
        </div>
      </div>

      <div className="sidebar-user">
        <div className="sidebar-avatar">{displayName.slice(0, 1).toUpperCase()}</div>
        <div>
          <strong>{displayName}</strong>
          <span>Psicólogo</span>
        </div>
      </div>

      <nav className="sidebar-menu" aria-label="Navegación del psicólogo">
        <ul>
          {psySidebarItems.map((item) => {
            const badge = badgeFor(item.to);

            return (
              <li key={item.label}>
                <NavLink
                  to={item.to}
                  end={'end' in item ? item.end : undefined}
                  className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
                >
                  <span className="menu-icon">{item.code}</span>
                  <span>{item.label}</span>
                  {badge ? <span className="sidebar-badge">{badge}</span> : null}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="sidebar-footer-meta">
        <span>Sesión de {session.email}</span>
      </div>

      <button className="help-btn" type="button" onClick={onLogout} disabled={loggingOut}>
        <span>{loggingOut ? 'Cerrando...' : 'Cerrar sesión'}</span>
      </button>
    </aside>
  );
}

export default PsySidebar;
