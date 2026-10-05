import type { ReactNode } from 'react';

export type PsyBadgeTone = 'ok' | 'warn' | 'danger' | 'neutral';

const toneByStatus: Record<string, PsyBadgeTone> = {
  ACTIVE: 'ok',
  APPROVED: 'ok',
  COMPLETED: 'ok',
  ESTABLE: 'ok',
  ACCEPTED: 'ok',
  CONFIRMED: 'warn',
  PENDING: 'warn',
  PAUSED: 'warn',
  ATENCION: 'warn',
  REJECTED: 'danger',
  CANCELLED: 'danger',
  SUSPENDED: 'danger',
  CRITICO: 'danger',
  NO_SHOW: 'danger',
  DECLINED: 'danger',
  ENDED: 'neutral',
  SIN_DATOS: 'neutral',
  DRAFT: 'neutral'
};
export function PsyBadge({ status, label }: { status: string; label: string }) {
  const tone = toneByStatus[status.toUpperCase()] ?? 'neutral';

  return <span className={`psy-badge psy-badge-${tone}`}>{label}</span>;
}

export function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <div className="psy-empty">
      <strong>{title}</strong>
      <p>{text}</p>
    </div>
  );
}

export function LoadingBlock({ label = 'Cargando...' }: { label?: string }) {
  return (
    <div className="psy-loading" role="status">
      {label}
    </div>
  );
}

export function ErrorBlock({ message }: { message: string }) {
  return (
    <div className="psy-error" role="alert">
      {message}
    </div>
  );
}

export function SuccessBlock({ message }: { message: string }) {
  return (
    <div className="psy-success" role="status">
      {message}
    </div>
  );
}

export function StatCard({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <article className="stat-card">
      <span>{label}</span>
      <h3>{value}</h3>
      {hint ? <p>{hint}</p> : null}
    </article>
  );
}

export function StatsGrid({ children }: { children: ReactNode }) {
  return <div className="psy-stats-grid">{children}</div>;
}

export function Panel({
  title,
  eyebrow,
  actions,
  children
}: {
  title: string;
  eyebrow?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="panel-card">
      <div className="panel-head">
        <div>
          {eyebrow ? <span className="eyebrow">{eyebrow}</span> : null}
          <h2>{title}</h2>
        </div>
        {actions}
      </div>
      {children}
    </section>
  );
}
