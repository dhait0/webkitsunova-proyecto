export default function HabitsLoading() {
  return (
    <section className="user-page" role="status" aria-label="Cargando hábitos...">
      <div className="user-page-head">
        <div className="user-page-head-copy">
          <span className="user-eyebrow">Hábitos</span>
          <h2 className="user-headline">Tus hábitos</h2>
        </div>
      </div>
      <div className="user-grid" aria-busy="true">
        {[1, 2, 3].map((i) => (
          <article key={i} className="user-card user-card-stack user-raise" aria-busy="true">
            <div className="user-panel-head">
              <span className="user-eyebrow" aria-hidden="true">
                Hábito
              </span>
              <h2 className="user-title" aria-hidden="true">
                Cargando hábito...
              </h2>
            </div>
            <p aria-hidden="true">Cargando descripción...</p>
            <div className="user-bar" role="progressbar" aria-busy="true" aria-hidden="true">
              <div className="user-bar-fill" style={{ width: '50%' }} />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
