import { useCallback, useEffect, useState } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import PsySidebar from '@/components/PsySidebar';
import { ApiError, getPsyProfile, signOut } from '@/lib/api';
import { psySecondaryItems } from '@/content/siteContent';
import type { SessionUser } from '@/types/session';

export type PsyOutletContext = {
  session: SessionUser;
  displayName: string;
  isApproved: boolean;
  loggingOut: boolean;
  logout: () => Promise<void>;
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  refreshProfile: () => Promise<void>;
};

type PsyLayoutProps = {
  session: SessionUser;
};

function PsyLayout({ session }: PsyLayoutProps) {
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isApproved, setIsApproved] = useState<boolean | null>(null);
  const [accessError, setAccessError] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState(
    session.profile?.firstName?.trim() || session.email
  );

  const refreshProfile = useCallback(async () => {
    try {
      const result = await getPsyProfile();
      setIsApproved(result.profile.isApproved);
      setDisplayName(result.profile.name || session.email);
      setAccessError(null);
    } catch (error) {
      if (error instanceof ApiError && error.code === 'PSY_NOT_APPROVED') {
        setIsApproved(false);
        setAccessError(error.message);
        return;
      }

      if (error instanceof ApiError && error.code === 'ACCOUNT_SUSPENDED') {
        setAccessError(error.message);
        return;
      }

      setAccessError(error instanceof Error ? error.message : 'Error cargando el perfil');
    }
  }, [session.email]);

  useEffect(() => {
    void refreshProfile();
  }, [refreshProfile]);

  async function handleLogout() {
    setLoggingOut(true);

    try {
      await signOut();
    } finally {
      navigate('/login', { replace: true });
      setLoggingOut(false);
    }
  }

  const suspended = accessError !== null && isApproved === null;

  return (
    <div className="dashboard-layout">
      <PsySidebar
        session={session}
        displayName={displayName}
        onLogout={handleLogout}
        loggingOut={loggingOut}
        sidebarCollapsed={sidebarCollapsed}
        toggleSidebar={() => setSidebarCollapsed((prev) => !prev)}
      />

      <main className="dashboard-main">
        <header className="inicio-header">
          <div>
            <span className="eyebrow">Panel del psicólogo</span>
            <h1>¡Hola, {displayName}!</h1>
            <p>Gestiona tus pacientes, sesiones, talleres y recursos desde aquí.</p>
          </div>

          <div className="dashboard-header-actions">
            <Link to="/psy/notificaciones" className="notif-bell-wrapper" aria-label="Notificaciones">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 3 0 0 1-3.46 0" />
              </svg>
            </Link>

            <div className="dashboard-chip">
              <strong>Psicólogo</strong>
              <span>
                {isApproved === null
                  ? 'Verificando...'
                  : isApproved
                    ? 'Perfil aprobado'
                    : 'Pendiente de aprobación'}
              </span>
            </div>
          </div>
        </header>

        <nav className="psy-subnav" aria-label="Secciones del psicólogo">
          {psySecondaryItems.map((item) => (
            <Link key={item.label} to={item.to} className="psy-subnav-link">
              {item.label}
            </Link>
          ))}
        </nav>

        {suspended ? (
          <div className="psy-blocked" role="alert">
            <h2>Acceso restringido</h2>
            <p>{accessError}</p>
          </div>
        ) : isApproved === false ? (
          <div className="psy-blocked" role="status">
            <h2>Tu perfil está pendiente de aprobación</h2>
            <p>
              {accessError ??
                'Un administrador debe aprobar tu perfil profesional antes de que puedas atender pacientes.'}
            </p>
            <p>
              Mientras tanto puedes completar tu <Link to="/psy/configuracion">información profesional</Link> y
              publicar talleres y recursos, que quedarán en estado pendiente de revisión.
            </p>
          </div>
        ) : null}

        <Outlet
          context={
            {
              session,
              displayName,
              isApproved: isApproved ?? false,
              loggingOut,
              logout: handleLogout,
              sidebarCollapsed,
              toggleSidebar: () => setSidebarCollapsed((prev) => !prev),
              refreshProfile,
            } satisfies PsyOutletContext
          }
        />
      </main>
    </div>
  );
}

export default PsyLayout;
