import { useOutletContext } from 'react-router-dom';
import { dashboardChatThreads } from '@/content/siteContent';
import type { DashboardOutletContext } from '@/layouts/DashboardLayout';

function ChatsPage() {
  const { displayName } = useOutletContext<DashboardOutletContext>();

  return (
    <section className="dashboard-page-stack">
      <div className="page-hero">
        <div>
          <span className="eyebrow">Chats</span>
          <h2>Conversaciones con contexto clínico y seguimiento automatizado.</h2>
          <p>
            Aquí puedes retomar mensajes pendientes, hablar con psicólogos y ver qué conversaciones
            requieren continuidad.
          </p>
        </div>

        <div className="page-hero-chip">
          <strong>{dashboardChatThreads.length} hilos</strong>
          <span>Activos para {displayName}</span>
        </div>
      </div>

      <div className="dashboard-page-grid">
        {dashboardChatThreads.map((thread) => (
          <article key={thread.name} className="panel-card dashboard-page-card">
            <div className="panel-head">
              <span className="eyebrow">{thread.status}</span>
              <h2>{thread.name}</h2>
            </div>
            <p className="dashboard-card-subtitle">{thread.role}</p>
            <p>{thread.lastMessage}</p>
            <button className="secondary-btn" type="button">
              Continuar chat
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}

export default ChatsPage;
