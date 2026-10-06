import { requireUser } from '@/lib/auth/guard';
import { dashboardChatThreads } from '@/content/siteContent';

export default async function Chats() {
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
            <span className="user-eyebrow">Chats</span>
            <span className="user-example-stamp">Ejemplo</span>
          </div>
          <h2 className="user-headline">
            Conversaciones con contexto clínico y seguimiento automatizado.
          </h2>
          <p className="user-lede">
            Aquí puedes retomar mensajes pendientes, hablar con psicólogos y
            ver qué conversaciones requieren continuidad.
          </p>
        </div>

        <div className="user-page-head-meta">
          <div className="user-chip">
            <strong>{dashboardChatThreads.length} hilos</strong>
            <span>Activos para {displayName}</span>
          </div>
        </div>
      </div>

      <div className="user-grid">
        {dashboardChatThreads.map((thread) => (
          <article key={thread.name} className="user-card user-card-stack user-raise">
            <div className="user-panel-head">
              <span className="user-eyebrow">{thread.status}</span>
              <h2 className="user-title">{thread.name}</h2>
            </div>
            <span className="user-pill">{thread.role}</span>
            <p>{thread.lastMessage}</p>
            <div>
              <button className="user-btn user-btn--quiet" type="button">
                Continuar chat
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
