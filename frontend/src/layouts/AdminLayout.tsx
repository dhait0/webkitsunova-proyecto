import { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { signOut } from '@/lib/api';
import type { SessionUser } from '@/types/session';
import { ADMIN_NAV_SECTIONS, getAdminPageMeta } from '@/components/admin/adminNav';
import Icon from '@/components/admin/Icon';

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
  const location = useLocation();
  const [loggingOut, setLoggingOut] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const pageMeta = getAdminPageMeta(location.pathname);

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
            <Icon name={sidebarCollapsed ? 'menu' : 'close'} size={14} />
          </button>
        </div>

        <nav className="admin-nav" aria-label="Navegación de administrador">
          {ADMIN_NAV_SECTIONS.map((section, index) => (
            <div className="admin-nav-group" key={section.label}>
              {index > 0 ? <div className="admin-nav-divider" /> : null}
              <div className="admin-nav-section">
                <span className="admin-nav-label">{section.label}</span>
                <ul className="admin-nav-list">
                  {section.items.map((item) =>
                    item.comingSoon ? (
                      <li key={item.to}>
                        <span
                          className="admin-nav-item admin-nav-item--disabled"
                          aria-disabled="true"
                          title={`${item.label}: módulo en construcción`}
                        >
                          <Icon name={item.icon} className="admin-nav-icon" />
                          <span>{item.label}</span>
                          <em className="admin-nav-soon">Pronto</em>
                        </span>
                      </li>
                    ) : (
                      <li key={item.to}>
                        <NavLink to={item.to} end={item.end} className="admin-nav-item">
                          <Icon name={item.icon} className="admin-nav-icon" />
                          <span>{item.label}</span>
                        </NavLink>
                      </li>
                    )
                  )}
                </ul>
              </div>
            </div>
          ))}
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
            <Icon name="logout" size={15} />
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
            <span className="admin-page-title">
              <Icon name={pageMeta.icon} size={13} />
              {pageMeta.title}
            </span>
          </div>

          <div className="admin-topbar-right">
            <button
              type="button"
              className="admin-topbar-toggle"
              onClick={toggleSidebar}
              aria-label={sidebarCollapsed ? 'Expandir barra lateral' : 'Colapsar barra lateral'}
              title={sidebarCollapsed ? 'Expandir barra lateral' : 'Colapsar barra lateral'}
            >
              <Icon name="menu" size={15} />
            </button>
            <div className="system-status">
              <span className="system-status-dot" aria-hidden="true" />
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
