import { requireUser } from '@/lib/auth/guard';
import { dashboardPsychologistCards } from '@/content/siteContent';

export default async function Psychologists() {
  const session = await requireUser();

  return (
    <section className="dashboard-page-stack">
      <div className="page-hero">
        <div>
          <span className="eyebrow">Psicólogos</span>
          <h2>Red clínica visible para elegir apoyo con criterio.</h2>
          <p>
            Tu cuenta tiene acceso a profesionales que pueden tomar el relevo cuando el proceso
            necesite acompañamiento humano.
          </p>
        </div>

        <div className="page-hero-chip">
          <strong>{session.role}</strong>
          <span>Acceso a red especializada</span>
        </div>
      </div>

      <div className="dashboard-page-grid">
        {dashboardPsychologistCards.map((psychologist) => (
          <article key={psychologist.name} className="panel-card dashboard-page-card">
            <div className="panel-head">
              <span className="eyebrow">{psychologist.specialty}</span>
              <h2>{psychologist.name}</h2>
            </div>
            <p className="dashboard-card-subtitle">{psychologist.mode}</p>
            <p>{psychologist.availability}</p>
            <button className="secondary-btn" type="button">
              Ver perfil
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
