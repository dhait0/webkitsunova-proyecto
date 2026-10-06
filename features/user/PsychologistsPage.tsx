import { requireUser } from '@/lib/auth/guard';
import { dashboardPsychologistCards } from '@/content/siteContent';

export default async function Psychologists() {
  const session = await requireUser();

  return (
    <section className="user-page">
      <div className="user-page-head">
        <div className="user-page-head-copy">
          <div className="user-example">
            <span className="user-eyebrow">Psicólogos</span>
            <span className="user-example-stamp">Ejemplo</span>
          </div>
          <h2 className="user-headline">Red clínica visible para elegir apoyo con criterio.</h2>
          <p className="user-lede">
            Tu cuenta tiene acceso a profesionales que pueden tomar el relevo
            cuando el proceso necesite acompañamiento humano.
          </p>
        </div>

        <div className="user-page-head-meta">
          <div className="user-chip">
            <strong>{session.role}</strong>
            <span>Acceso a red especializada</span>
          </div>
        </div>
      </div>

      <div className="user-grid">
        {dashboardPsychologistCards.map((psychologist) => (
          <article key={psychologist.name} className="user-card user-card-stack user-raise">
            <div className="user-panel-head">
              <span className="user-eyebrow">{psychologist.specialty}</span>
              <h2 className="user-title">{psychologist.name}</h2>
            </div>
            <span className="user-pill">{psychologist.mode}</span>
            <p>{psychologist.availability}</p>
            <div>
              <button className="user-btn user-btn--quiet" type="button">
                Ver perfil
              </button>
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
