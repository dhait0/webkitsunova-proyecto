import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { signOut, getMe } from '@/lib/api';
import type { SessionUser } from '@/types/session';

export type AdminOutletContext = {
  session: SessionUser;
  displayName: string;
  roleLabel: string;
  loggingOut: boolean;
  logout: () => Promise<void>;
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
};

type AdminLayoutProps = {
  session: SessionUser;
};

function AdminLayout({ session }: AdminLayoutProps) {
  const navigate = useNavigate();
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
      navigate('/login', { replace: true });
    } catch {
      navigate('/login', { replace: true });
    } finally {
      setLoggingOut(false);
    }
  }

  function toggleSidebar() {
    setSidebarCollapsed((prev) => !prev);
  }

  return (
    <div className="admin-layout">
      <aside className={`admin-sidebar${sidebarCollapsed ? ' collapsed' : ''}`}>
        <div className="admin-sidebar-header">
          <img className="admin-brand-logo" src="/brand/isotipo.png" alt="Kitsunova" />
          <div className="admin-brand-text">
            <span className="admin-brand-name">Kitsunova</span>
            <span className="admin-brand-badge">Admin Panel</span>
          </div>
          <button
            type="button"
            className="admin-sidebar-toggle"
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
        </div>

        <nav className="admin-nav" aria-label="Navegación de administrador">
          <div className="admin-nav-section">
            <span className="admin-nav-label">General</span>
            <ul className="admin-nav-list">
              <li>
                <NavLink to="/admin" end className="admin-nav-item">
                  <i className="fa-solid fa-house" />
                  <span>Inicio</span>
                </NavLink>
              </li>
            </ul>
          </div>

          <div className="admin-nav-divider" />

          <div className="admin-nav-section">
            <span className="admin-nav-label">Personas</span>
            <ul className="admin-nav-list">
              <li>
                <NavLink to="/admin/users" className="admin-nav-item">
                  <i className="fa-solid fa-user" />
                  <span>Usuarios</span>
                </NavLink>
              </li>
              <li>
                <NavLink to="/admin/psychologists" className="admin-nav-item">
                  <i className="fa-solid fa-brain" />
                  <span>Psicólogos</span>
                </NavLink>
              </li>
            </ul>
          </div>

          <div className="admin-nav-divider" />

          <div className="admin-nav-section">
            <span className="admin-nav-label">Comunidad</span>
            <ul className="admin-nav-list">
              <li>
                <NavLink to="/admin/forum" className="admin-nav-item">
                  <i className="fa-solid fa-people-group" />
                  <span>Foro</span>
                </NavLink>
              </li>
              <li>
                <NavLink to="/admin/messages" className="admin-nav-item">
                  <i className="fa-solid fa-envelope" />
                  <span>Mensajes</span>
                </NavLink>
              </li>
              <li>
                <NavLink to="/admin/workshops" className="admin-nav-item">
                  <i className="fa-solid fa-chalkboard-user" />
                  <span>Talleres</span>
                </NavLink>
              </li>
              <li>
                <NavLink to="/admin/resources" className="admin-nav-item">
                  <i className="fa-solid fa-book-open" />
                  <span>Recursos</span>
                </NavLink>
              </li>
            </ul>
          </div>

          <div className="admin-nav-divider" />

          <div className="admin-nav-section">
            <span className="admin-nav-label">Sistema</span>
            <ul className="admin-nav-list">
              <li>
                <NavLink to="/admin/reports" className="admin-nav-item">
                  <i className="fa-solid fa-flag" />
                  <span>Reportes</span>
                </NavLink>
              </li>
              <li>
                <NavLink to="/admin/settings" className="admin-nav-item">
                  <i className="fa-solid fa-sliders" />
                  <span>Configuración</span>
                </NavLink>
              </li>
            </ul>
          </div>
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-user-avatar">{displayName.slice(0, 1).toUpperCase()}</div>
          <div className="admin-user-info">
            <div className="admin-user-name">{displayName}</div>
            <div className="admin-user-role">{roleLabel}</div>
          </div>
          <button
            className="admin-sidebar-logout"
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            aria-label={loggingOut ? 'Cerrando sesión...' : 'Cerrar sesión'}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="15 11L9 15L9 7" />
              <line x1="19" y1="12" x2="5" y2="12" />
            </svg>
          </button>
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <div className="admin-topbar-left">
            <span className="admin-page-path">
              <span>Admin</span> / <span>{roleLabel}</span>
            </span>
            <span className="admin-topbar-sep" />
            <span className="admin-page-title">{roleLabel} Dashboard</span>
          </div>

          <div className="admin-topbar-right">
            <div className="system-status">
              <span className="system-status-dot" />
              Sistema activo
            </div>
          </div>
        </header>

        <main className="admin-content">
          <Outlet
            context={{
              session,
              displayName,
              roleLabel,
              loggingOut,
              logout: handleLogout,
              sidebarCollapsed,
              toggleSidebar,
            }}
          />
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
