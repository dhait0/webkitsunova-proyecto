import Link from 'next/link';
import { requireUser } from '@/lib/auth/guard';
import { getUserDashboardSummary } from '@/services/user/dashboard.service';
import { dashboardQuickActions } from '@/content/siteContent';

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

  const { habits, summary: habitSummary } = summary.habits;
  const activeHabits = habits.filter((h) => h.status === 'active');
  const pendingHabit = activeHabits.find((h) => !h.stats.loggedToday) ?? null;
  const streak = habitSummary.bestCurrentStreak;

  const stats = [
    {
      label: 'Hábitos de hoy',
      value: habitSummary.active === 0 ? '—' : `${habitSummary.doneToday}/${habitSummary.active}`,
      caption:
        habitSummary.active === 0
          ? 'Crea tu primer hábito para empezar'
          : habitSummary.pendingToday === 0
            ? 'Todo registrado hoy'
            : `${habitSummary.pendingToday} por registrar`,
    },
    {
      label: 'Racha actual',
      value: streak ? String(streak.value) : '0',
      caption: streak
        ? streak.unit === 'days'
          ? 'días seguidos en tu mejor hábito'
          : 'semanas cumpliendo la meta'
        : 'Aún sin racha',
    },
    {
      label: 'Últimos 7 días',
      value: habitSummary.averageProgress === null ? '—' : `${habitSummary.averageProgress}%`,
      caption:
        habitSummary.averageProgress === null
          ? 'Sin hábitos activos'
          : 'Cumplimiento medio de tus metas',
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
            {pendingHabit ? (
              <Link className="user-btn user-btn--quiet" href="/dashboard/habitos">
                Marcar «{pendingHabit.title}»
              </Link>
            ) : activeHabits.length > 0 ? (
              <strong>Todo al día por hoy</strong>
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
            <span className="user-eyebrow">Hoy</span>
            <h2 className="user-title">Tus hábitos de hoy</h2>
          </div>
          {activeHabits.length === 0 ? (
            <p>No tienes hábitos activos. Crea uno para empezar tu seguimiento.</p>
          ) : (
            <div className="user-list">
              {activeHabits.map((habit) => (
                <div key={habit.id} className="user-list-item">
                  <div>
                    <strong>{habit.title}</strong>
                    <p>
                      {habit.stats.loggedToday
                        ? 'Registrado hoy'
                        : habit.stats.lastLoggedOn
                          ? 'Pendiente de hoy'
                          : 'Aún sin registros'}
                    </p>
                  </div>
                  <span className={`user-pill ${habit.stats.loggedToday ? 'user-pill--ok' : 'user-pill--warn'}`}>
                    {habit.stats.loggedToday ? 'Hecho' : 'Pendiente'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </article>

        <article className="user-card user-panel-card user-raise">
          <div className="user-panel-head">
            <span className="user-eyebrow">Constancia</span>
            <h2 className="user-title">Últimas 4 semanas</h2>
          </div>
          {activeHabits.length === 0 ? (
            <p>Aquí verás tu constancia cuando registres tus primeros días.</p>
          ) : (
            <div className="user-status-list">
              {activeHabits.map((habit) => (
                <div key={habit.id} className="user-status-item">
                  <div className="user-status-topline">
                    <strong>{habit.title}</strong>
                    <span className="user-numeral">{habit.stats.consistency4w}%</span>
                  </div>
                  <div
                    className="user-bar"
                    role="progressbar"
                    aria-label={`Constancia de ${habit.title}`}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={habit.stats.consistency4w}
                  >
                    <div className="user-bar-fill" style={{ width: `${habit.stats.consistency4w}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </article>
      </div>
    </section>
  );
}
