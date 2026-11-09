import Link from 'next/link';
import { requireUser } from '@/lib/auth/guard';
import { getUserDashboardSummary } from '@/services/user/dashboard.service';
import {
  dashboardActivityItems,
  dashboardFocusItems,
  dashboardQuickActions,
  dashboardStatusItems,
} from '@/content/siteContent';

function formatMemberSince(date: Date): string {
  return new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' }).format(date);
}

function formatAppointmentDate(date: Date): string {
  return new Intl.DateTimeFormat('es-ES', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export default async function DashboardHomePage() {
  const session = await requireUser();
  const summary = await getUserDashboardSummary(session.id);
  const displayName =
    session.profile?.firstName?.trim() ||
    session.profile?.username?.trim() ||
    session.email;

  const stats = [
    {
      label: 'Hábitos activos',
      value: String(summary.activeHabits),
      caption:
        summary.activeHabits === 0
          ? 'Crea tu primer hábito para empezar'
          : `${summary.activeHabits} en seguimiento`,
    },
    {
      label: 'Progreso promedio',
      value: `${summary.averageProgress}%`,
      caption:
        summary.activeHabits === 0
          ? 'Sin hábitos activos'
          : 'Promedio de tus hábitos activos',
    },
    {
      label: 'Citas pendientes',
      value: String(summary.pendingAppointments),
      caption:
        summary.pendingAppointments === 0
          ? 'No tienes citas pendientes'
          : 'Pendientes de atención',
    },
    {
      label: 'Próxima cita',
      value: summary.nextAppointment ? formatAppointmentDate(summary.nextAppointment.startsAt) : 'Sin citas',
      caption: summary.nextAppointment
        ? `Con ${summary.nextAppointment.psychologistName}`
        : 'Agenda cuando lo necesites',
    },
  ];

  return (
    <section className="user-page">
      <div className="user-card user-banner user-raise">
        <div className="user-banner-copy">
          <div className="user-example">
            <span className="user-eyebrow">Panel privado</span>
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
            <Link className="user-btn user-btn--quiet" href="/dashboard/citas">
              Ver citas
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
            {summary.nextHabit ? (
              <strong>{summary.nextHabit.title}</strong>
            ) : (
              <Link className="user-btn user-btn--quiet" href="/dashboard/habitos">
                Crea tu primer hábito
              </Link>
            )}
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
              <strong>{formatMemberSince(summary.memberSince)}</strong>
            </div>
            <div className="user-profile-row">
              <span className="user-eyebrow">Plan</span>
              <strong>Acompañamiento</strong>
            </div>
          </div>
        </article>

        <article className="user-card user-raise">
          <div className="user-panel-head">
            <span className="user-eyebrow">Próxima cita</span>
            <h2 className="user-title">Tu agenda</h2>
          </div>
          {summary.nextAppointment ? (
            <div className="user-profile-rows">
              <div className="user-profile-row">
                <span className="user-eyebrow">Cuándo</span>
                <strong>{formatAppointmentDate(summary.nextAppointment.startsAt)}</strong>
              </div>
              <div className="user-profile-row">
                <span className="user-eyebrow">Profesional</span>
                <strong>{summary.nextAppointment.psychologistName}</strong>
              </div>
              <div className="user-banner-actions">
                <Link className="user-btn user-btn--primary" href="/dashboard/citas">
                  Ver citas
                </Link>
              </div>
            </div>
          ) : (
            <div className="user-profile-rows">
              <p>Sin citas próximas.</p>
              <div className="user-banner-actions">
                <Link className="user-btn user-btn--primary" href="/dashboard/citas">
                  Ir a citas
                </Link>
              </div>
            </div>
          )}
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
          <h2 className="user-title">Resumen real</h2>
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
    </section>
  );
}
