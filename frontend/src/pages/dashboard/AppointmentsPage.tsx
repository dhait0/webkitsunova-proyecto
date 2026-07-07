import { useOutletContext } from 'react-router-dom';
import { dashboardAppointmentCards } from '@/content/siteContent';
import type { DashboardOutletContext } from '@/layouts/DashboardLayout';

function AppointmentsPage() {
  const { displayName } = useOutletContext<DashboardOutletContext>();

  return (
    <section className="dashboard-page-stack">
      <div className="page-hero">
        <div>
          <span className="eyebrow">Citas</span>
          <h2>Agenda profesional para escalar cuando el proceso lo necesite.</h2>
          <p>
            {displayName}, esta sección centraliza la reserva y el seguimiento de sesiones con
            psicólogos sin romper el flujo de hábitos.
          </p>
        </div>

        <div className="page-hero-chip">
          <strong>Atención guiada</strong>
          <span>Sesiones presenciales y online</span>
        </div>
      </div>

      <div className="dashboard-page-grid dashboard-page-grid--two">
        {dashboardAppointmentCards.map((appointment) => (
          <article key={appointment.title} className="panel-card dashboard-page-card">
            <div className="panel-head">
              <span className="eyebrow">{appointment.label}</span>
              <h2>{appointment.title}</h2>
            </div>
            <p>{appointment.text}</p>
            <div className="dashboard-pill">{appointment.status}</div>
          </article>
        ))}

        <article className="panel-card dashboard-page-card dashboard-page-card--accent">
          <span className="eyebrow">Siguiente paso</span>
          <h2>Agenda una cita si el seguimiento automatizado no es suficiente.</h2>
          <p>
            El sistema puede sugerir una sesión cuando detecta que un hábito necesita revisión
            humana.
          </p>
          <button className="primary-btn" type="button">
            Reservar cita
          </button>
        </article>
      </div>
    </section>
  );
}

export default AppointmentsPage;
