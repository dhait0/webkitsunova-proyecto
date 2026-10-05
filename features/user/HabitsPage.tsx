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
    <section className="dashboard-page-stack">
      <div className="page-hero">
        <div>
          <span className="eyebrow">Hábitos</span>
          <h2>Seguimiento claro para no perder el ritmo.</h2>
          <p>
            {displayName}, esta vista resume rutinas, avances y señales de atención para que la
            automatización sea útil y no invasiva.
          </p>
        </div>

        <div className="page-hero-chip">
          <strong>3 hábitos activos</strong>
          <span>1 pendiente de revisión</span>
        </div>
      </div>

      <div className="dashboard-page-grid">
        {dashboardHabitRows.map((habit) => (
          <article key={habit.label} className="panel-card dashboard-page-card">
            <div className="panel-head">
              <span className="eyebrow">{habit.label}</span>
              <h2>{habit.status}</h2>
            </div>
            <p>{habit.detail}</p>
            <div className="bar">
              <div style={{ width: `${habit.progress}%` }} />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
