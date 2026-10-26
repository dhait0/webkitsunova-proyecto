export default function AppointmentsLoading() {
  return (
    <section className="user-page" role="status" aria-label="Cargando citas...">
      <div className="user-page-head">
        <div className="user-page-head-copy">
          <span className="user-eyebrow">Citas</span>
          <h2 className="user-headline">Tus sesiones con psicólogos</h2>
        </div>
      </div>
      <div className="user-list" aria-busy="true">
        {[1, 2, 3].map((i) => (
          <article key={i} className="user-card user-card-stack user-raise" aria-busy="true">
            <div className="user-panel-head">
              <span className="user-eyebrow" aria-hidden="true">
                Tipo de sesión
              </span>
              <h2 className="user-title" aria-hidden="true">
                Cargando cita...
              </h2>
            </div>
            <div className="user-profile-rows" style={{ marginTop: 16 }} aria-hidden="true">
              <div className="user-profile-row">
                <span className="user-eyebrow">Psicólogo</span>
                <strong>Cargando profesional...</strong>
              </div>
              <div className="user-profile-row">
                <span className="user-eyebrow">Fecha y hora</span>
                <strong>Cargando horario...</strong>
              </div>
              <div className="user-profile-row">
                <span className="user-eyebrow">Estado</span>
                <strong>Cargando...</strong>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
