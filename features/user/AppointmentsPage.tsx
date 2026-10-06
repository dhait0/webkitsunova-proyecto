import { requireUser } from '@/lib/auth/guard';
import { dashboardAppointmentCards } from '@/content/siteContent';

export default async function Appointments() {
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
            <span className="user-eyebrow">Citas</span>
            <span className="user-example-stamp">Ejemplo</span>
          </div>
          <h2 className="user-headline">
            Agenda profesional para escalar cuando el proceso lo necesite.
          </h2>
          <p className="user-lede">
            {displayName}, esta sección centraliza la reserva y el seguimiento
            de sesiones con psicólogos sin romper el flujo de hábitos.
          </p>
        </div>

        <div className="user-page-head-meta">
          <div className="user-chip">
            <strong>Atención guiada</strong>
            <span>Sesiones presenciales y online</span>
          </div>
        </div>
      </div>

      <div className="user-grid user-grid--duo">
        {dashboardAppointmentCards.map((appointment) => (
          <article key={appointment.title} className="user-card user-card-stack user-raise">
            <div className="user-panel-head">
              <span className="user-eyebrow">{appointment.label}</span>
              <h2 className="user-title">{appointment.title}</h2>
            </div>
            <p>{appointment.text}</p>
            <span className="user-pill user-pill--ok">{appointment.status}</span>
          </article>
        ))}

        <article className="user-card user-card--accent user-card-stack user-raise">
          <div className="user-panel-head">
            <span className="user-eyebrow">Siguiente paso</span>
            <h2 className="user-title">
              Agenda una cita si el seguimiento automatizado no es suficiente.
            </h2>
          </div>
          <p>
            El sistema puede sugerir una sesión cuando detecta que un hábito
            necesita revisión humana.
          </p>
          <div>
            <button className="user-btn user-btn--primary" type="button">
              Reservar cita
            </button>
          </div>
        </article>
      </div>

      <p className="user-example-note">
        Esta vista muestra datos ilustrativos mientras el módulo de usuario
        conecta con su API.
      </p>
    </section>
  );
}
