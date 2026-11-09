import type { ReactNode } from 'react';
import type { BadgeTone } from './types';

export const USER_STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Activo',
  SUSPENDED: 'Suspendido',
  PENDING: 'Pendiente',
};

export const PSY_STATUS_LABELS: Record<string, string> = {
  activo: 'Activo',
  revision: 'En revisión',
  pendiente: 'Pendiente',
  rechazado: 'Rechazado',
  suspendido: 'Suspendido',
};

export function userStatusTone(status: string): BadgeTone {
  if (status === 'ACTIVE') return 'success';
  if (status === 'SUSPENDED') return 'danger';
  return 'warning';
}

export function psyStatusTone(status: string): BadgeTone {
  if (status === 'activo') return 'success';
  if (status === 'suspendido' || status === 'rechazado') return 'danger';
  if (status === 'revision' || status === 'pendiente') return 'warning';
  return 'neutral';
}

type StatusBadgeProps = {
  tone: BadgeTone;
  children: ReactNode;
};

export function StatusBadge({ tone, children }: StatusBadgeProps) {
  return <span className={`status-badge status-badge--${tone}`}>{children}</span>;
}

export default StatusBadge;
