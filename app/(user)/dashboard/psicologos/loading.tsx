export default function PsychologistsLoading() {
  return (
    <section className="user-page" role="status" aria-label="Cargando catálogo de psicólogos...">
      <div className="user-page-head">
        <div className="user-page-head-copy">
          <span className="user-eyebrow">Psicólogos</span>
          <h2 className="user-headline">Red clínica visible para elegir apoyo con criterio.</h2>
        </div>
      </div>
      <div className="user-grid" aria-busy="true">
        {[1, 2, 3].map((i) => (
          <article key={i} className="user-card user-card-stack user-raise" aria-busy="true">
            <div className="user-panel-head">
              <span className="user-eyebrow" aria-hidden="true">
                Especialidad
              </span>
              <h2 className="user-title" aria-hidden="true">
                Cargando perfil...
              </h2>
            </div>
            <span className="user-pill" aria-hidden="true">
              Disponible
            </span>
            <p aria-hidden="true">
              Se está cargando la información del profesional.
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
