'use client';

import Link from 'next/link';
import {
  dashboardActivityItems,
  dashboardFocusItems,
  dashboardQuickActions,
  dashboardStatusItems
} from '@/content/siteContent';
import type { SessionUser } from '@/lib/auth/types';

type DashboardHomePageProps = {
  session: SessionUser;
};

function DashboardHomePage({ session }: DashboardHomePageProps) {
  const displayName =
    (session.profile?.firstName?.trim() ||
      session.profile?.username?.trim() ||
      session.email) ??
    '';

  function handleScrollToStatus() {
    document.getElementById('status-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <>
      <section className="dashboard-banner">
        <div>
          <span className="eyebrow">Resumen del día</span>
          <h2>Tu acompañamiento está listo para seguir el ritmo de hoy.</h2>
          <p>
            Desde aquí puedes revisar hábitos, retomar chats con psicólogos y mover citas sin
            perder el contexto del proceso.
          </p>
        </div>

        <div className="dashboard-actions">
          <button className="primary-btn" type="button" onClick={handleScrollToStatus}>
            Ver progreso
          </button>
          <button className="secondary-btn" type="button" disabled title="Próximamente">
            Salir
          </button>
        </div>

        <div className="dashboard-side-stack">
          <article className="dashboard-side-card">
            <span>Cuenta</span>
            <strong>{session.email}</strong>
            <p>Sesión activa para {displayName}.</p>
          </article>
          <article className="dashboard-side-card">
            <span>Siguiente paso</span>
            <strong>Revisar hábitos</strong>
            <p>Marca lo completado antes de escalar a chat o cita.</p>
          </article>
        </div>
      </section>

      <section className="inicio-grid">
        <article className="perfil-card">
          <h3>Perfil</h3>
          <div className="perfil-content">
            <div className="perfil-avatar">{displayName.slice(0, 1).toUpperCase()}</div>
            <h4>{displayName}</h4>
            <p>{session.role}</p>
            <button className="perfil-btn" type="button" disabled title="Próximamente">
              Editar perfil (próximamente)
            </button>
          </div>
        </article>

        <article className="mascota-card">
          <div className="mascota-left">
            <img src="/brand/zorro-c.png" alt="Mascota de Kitsunova" />
          </div>

          <div className="mascota-right">
            <div className="mascota-top">
              <h3>Seguimiento inteligente</h3>
              <span className="edit-icon">IA</span>
            </div>
            <div className="nivel">
              <span>Ritmo estable</span>
            </div>
            <div className="xp-bar">
              <div className="xp-fill" />
            </div>
            <small>
              La automatización acompaña tus hábitos y avisa cuándo conviene pedir ayuda humana.
            </small>
            <button className="pet-btn" type="button" onClick={handleScrollToStatus}>
              Ver seguimiento
            </button>
          </div>
        </article>
      </section>

      <section className="dashboard-quick-grid">
        {dashboardQuickActions.map((action) => (
          <article key={action.title} className="panel-card dashboard-quick-card">
            <span className="eyebrow">{action.title}</span>
            <p>{action.text}</p>
            <Link href={action.to} className="secondary-btn">
              Abrir sección
            </Link>
          </article>
        ))}
      </section>

      <section className="stats-grid">
        <article className="stat-card">
          <span>Hábitos</span>
          <h3>Seguimiento diario</h3>
          <p>Rutinas y objetivos</p>
        </article>
        <article className="stat-card">
          <span>Chats</span>
          <h3>Mensajes con psicólogos</h3>
          <p>Apoyo cuando lo necesites</p>
        </article>
        <article className="stat-card">
          <span>Citas</span>
          <h3>Agenda disponible</h3>
          <p>Atención profesional</p>
        </article>
        <article className="stat-card">
          <span>Psicólogos</span>
          <h3>Red especializada</h3>
          <p>Perfiles y roles</p>
        </article>
        <article className="stat-card">
          <span>Progreso</span>
          <h3>Visión clara</h3>
          <p>Todo en un solo lugar</p>
        </article>
      </section>

      <section className="dashboard-panels">
        <article className="panel-card panel-card-wide">
          <div className="panel-head">
            <span className="eyebrow">Actividad</span>
            <h2>Movimientos recientes</h2>
          </div>

          <div className="activity-list">
            {dashboardActivityItems.map((item) => (
              <article key={item.title} className="activity-item">
                <strong>{item.title}</strong>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </article>

        <article className="panel-card">
          <div className="panel-head">
            <span className="eyebrow">Foco</span>
            <h2>Qué conviene hacer ahora</h2>
          </div>

          <div className="focus-list">
            {dashboardFocusItems.map((item) => (
              <article key={item.title} className="focus-item">
                <strong>{item.title}</strong>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </article>
      </section>

      <section className="status-panel" id="status-panel">
        <h2 className="status-title">Estado de acompañamiento</h2>
        <div className="status-grid">
          {dashboardStatusItems.map((item) => (
            <article key={item.label} className="status">
              <div className="status-topline">
                <strong>{item.label}</strong>
                <span>{item.value}</span>
              </div>
              <div className="bar">
                <div style={{ width: `${item.progress}%` }} />
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}

export default DashboardHomePage;
