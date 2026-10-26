export default function ChatsLoading() {
  return (
    <section className="user-page" role="status" aria-label="Cargando conversaciones...">
      <div className="user-page-head">
        <div className="user-page-head-copy">
          <span className="user-eyebrow">Chats</span>
          <h2 className="user-headline">Tus conversaciones</h2>
        </div>
      </div>
      <div className="user-list" aria-busy="true">
        {[1, 2, 3].map((i) => (
          <article key={i} className="user-card user-card-stack user-raise" aria-busy="true">
            <div className="user-panel-head">
              <span className="user-eyebrow" aria-hidden="true">
                Conversación
              </span>
              <h2 className="user-title" aria-hidden="true">
                Cargando conversación...
              </h2>
            </div>
            <p aria-hidden="true">Cargando mensajes...</p>
          </article>
        ))}
      </div>
    </section>
  );
}
