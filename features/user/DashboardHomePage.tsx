import Link from 'next/link';
import { requireUser } from '@/lib/auth/guard';
import {
  dashboardActivityItems,
  dashboardFocusItems,
  dashboardQuickActions,
  dashboardStatusItems
} from '@/content/siteContent';

const stats = [
  {
    label: 'Racha actual',
    value: '12 días',
    caption: 'Tu mejor racha: 21 días'
  },
  {
    label: 'Hábitos activos',
    value: '3',
    caption: '1 necesita revisión'
  },
  {
    label: 'Acciones esta semana',
    value: '18',
    caption: '4 hoy'
  },
  {
    label: 'Sesiones',
    value: '2',
    caption: 'Próxima: jueves 16:00'
  },
  {
    label: 'Nivel de la mascota',
    value: '7',
    caption: 'Faltan 300 XP para el nivel 8'
  }
] as const;

export default async function DashboardHomePage() {
  const session = await requireUser();
  const displayName =
    session.profile?.firstName?.trim() ||
    session.profile?.username?.trim() ||
    session.email;

  return (
    <section className="user-page">
      <div className="user-card user-banner user-raise">
        <div className="user-banner-copy">
          <div className="user-example">
            <span className="user-eyebrow">Panel privado</span>
            <span className="user-example-stamp">Ejemplo</span>
          </div>
          <h2 className="user-headline">Tu progreso, en un solo lugar.</h2>
          <p className="user-lede">
            Sigue tus hábitos, retoma conversaciones con psicólogos y escala a
            una cita cuando el acompañamiento automatizado no sea suficiente.
          </p>
          <div className="user-banner-actions">
            <Link className="user-btn user-btn--primary" href="/dashboard/habitos">
              Revisar hábitos
            </Link>
            <Link className="user-btn user-btn--quiet" href="/dashboard/chats">
              Abrir chat
            </Link>
          </div>
        </div>

        <div className="user-banner-side">
          <div className="user-side-card">
            <span className="user-eyebrow">Cuenta</span>
            <strong>Activa</strong>
          </div>
          <div className="user-side-card">
            <span className="user-eyebrow">Siguiente paso</span>
            <strong>Completa Respiración</strong>
          </div>
        </div>
      </div>

      <div className="user-duo">
        <article className="user-card user-raise">
          <div className="user-panel-head">
            <span className="user-eyebrow">Perfil</span>
            <h2 className="user-title">Tu ficha de acompañamiento</h2>
          </div>
          <div className="user-profile-rows">
            <div className="user-profile-row">
              <span className="user-eyebrow">Nombre</span>
              <strong>{displayName}</strong>
            </div>
            <div className="user-profile-row">
              <span className="user-eyebrow">Correo</span>
              <strong>{session.email}</strong>
            </div>
            <div className="user-profile-row">
              <span className="user-eyebrow">Miembro desde</span>
              <strong>Marzo 2026</strong>
            </div>
            <div className="user-profile-row">
              <span className="user-eyebrow">Plan</span>
              <strong>Acompañamiento</strong>
            </div>
          </div>
        </article>

        <article className="user-card user-raise">
          <div className="user-panel-head">
            <span className="user-eyebrow">Compañera</span>
            <h2 className="user-title">Kitsune te acompaña</h2>
          </div>
          <div className="user-mascot">
            <div className="user-mascot-fox">
              <img
                src="/brand/zorro-c.png"
                alt="Kitsune, tu compañera de acompañamiento"
              />
            </div>
            <div className="user-mascot-body">
              <div className="user-mascot-top">
                <span className="user-mascot-tag">Asistente IA</span>
                <span className="user-mascot-level">Nivel 7 · Ritmo estable</span>
              </div>
              <div
                className="user-bar"
                role="progressbar"
                aria-valuenow={68}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Progreso hacia el nivel 8"
              >
                <div className="user-bar-fill" style={{ width: '68%' }} />
              </div>
              <p className="user-mascot-note">
                Cada hábito completado la acerca a su siguiente cola. Llevas
                680 de 1000 XP.
              </p>
              <div>
                <Link
                  className="user-btn user-btn--primary"
                  href="/dashboard/habitos"
                >
                  Ver tu progreso
                </Link>
              </div>
            </div>
          </div>
        </article>
      </div>

      <div className="user-grid">
        {dashboardQuickActions.map((action) => (
          <Link
            key={action.title}
            href={action.to}
            className="user-card user-quick-card user-raise"
          >
            <h3 className="user-title">{action.title}</h3>
            <p>{action.text}</p>
            <span className="user-quick-go">
              Ir a la sección
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </span>
          </Link>
        ))}
      </div>

      <article className="user-card user-raise">
        <div className="user-panel-head">
          <span className="user-eyebrow">Progreso</span>
          <h2 className="user-title">Señales de la última semana</h2>
        </div>
        <div className="user-stat-grid">
          {stats.map((stat) => (
            <div key={stat.label} className="user-stat-card">
              <span className="user-eyebrow">{stat.label}</span>
              <span className="user-numeral">{stat.value}</span>
              <p>{stat.caption}</p>
            </div>
          ))}
        </div>
      </article>

      <div className="user-panels">
        <article className="user-card user-panel-card user-raise">
          <div className="user-panel-head">
            <span className="user-eyebrow">Actividad</span>
            <h2 className="user-title">Lo último en tu proceso</h2>
          </div>
          <div className="user-list">
            {dashboardActivityItems.map((item) => (
              <div key={item.title} className="user-list-item">
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.text}</p>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="user-card user-panel-card user-raise">
          <div className="user-panel-head">
            <span className="user-eyebrow">Enfoque</span>
            <h2 className="user-title">Prioridad del día</h2>
          </div>
          <div className="user-list">
            {dashboardFocusItems.map((item) => (
              <div key={item.title} className="user-list-item">
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.text}</p>
                </div>
              </div>
            ))}
          </div>
        </article>
      </div>

      <article className="user-card user-raise">
        <div className="user-panel-head">
          <span className="user-eyebrow">Estado</span>
          <h2 className="user-title">Dónde estás hoy</h2>
        </div>
        <div className="user-status-grid">
          {dashboardStatusItems.map((item) => (
            <div key={item.label} className="user-status-item">
              <div className="user-status-topline">
                <strong>{item.label}</strong>
                <span className="user-numeral">{item.value}</span>
              </div>
              <div
                className="user-bar"
                role="progressbar"
                aria-valuenow={item.progress}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${item.label}: ${item.value}`}
              >
                <div className="user-bar-fill" style={{ width: `${item.progress}%` }} />
              </div>
            </div>
          ))}
        </div>
      </article>

      <p className="user-example-note">
        Esta vista muestra datos ilustrativos mientras el módulo de usuario
        conecta con su API.
      </p>
    </section>
  );
}
