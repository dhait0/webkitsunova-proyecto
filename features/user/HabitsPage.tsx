import { requireUser } from '@/lib/auth/guard';
import { dashboardHabitRows } from '@/content/siteContent';

export default async function Habits() {
  const session = await requireUser();
  const displayName =
    (session.profile?.firstName?.trim() ||
      session.profile?.username?.trim() ||
      session.email) ??
    '';

  return (
    <section className="user-page">
      <div className="user-page-head">
        <div className="user-page-head-copy">
          <div className="user-example">
            <span className="user-eyebrow">Hábitos</span>
            <span className="user-example-stamp">Ejemplo</span>
          </div>
          <h2 className="user-headline">Seguimiento claro para no perder el ritmo.</h2>
          <p className="user-lede">
            {displayName}, esta vista resume rutinas, avances y señales de
            atención para que la automatización sea útil y no invasiva.
          </p>
        </div>

        <div className="user-page-head-meta">
          <div className="user-chip">
            <strong>3 hábitos activos</strong>
            <span>1 pendiente de revisión</span>
          </div>
        </div>
      </div>

      <div className="user-grid">
        {dashboardHabitRows.map((habit) => (
          <article key={habit.label} className="user-card user-card-stack user-raise">
            <div className="user-panel-head">
              <span className="user-eyebrow">{habit.label}</span>
              <h2 className="user-title">{habit.status}</h2>
            </div>
            <p>{habit.detail}</p>
            <div
              className="user-bar"
              role="progressbar"
              aria-valuenow={habit.progress}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Progreso de ${habit.label}`}
            >
              <div className="user-bar-fill" style={{ width: `${habit.progress}%` }} />
            </div>
          </article>
        ))}
      </div>

      <p className="user-example-note">
        Esta vista muestra datos ilustrativos mientras el módulo de usuario
        conecta con su API.
      </p>
    </section>
  );
}
