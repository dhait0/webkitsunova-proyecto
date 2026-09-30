import { render, screen } from '@testing-library/react';
import StatusBadge, {
  PSY_STATUS_LABELS,
  USER_STATUS_LABELS,
  psyStatusTone,
  userStatusTone,
} from './StatusBadge';

describe('StatusBadge', () => {
  it('applies the tone modifier class', () => {
    render(<StatusBadge tone="warning">En revisión</StatusBadge>);

    expect(screen.getByText('En revisión')).toHaveClass('status-badge--warning');
  });

  it('maps user statuses to labels and tones', () => {
    expect(USER_STATUS_LABELS.ACTIVE).toBe('Activo');
    expect(USER_STATUS_LABELS.SUSPENDED).toBe('Suspendido');
    expect(USER_STATUS_LABELS.PENDING).toBe('Pendiente');
    expect(userStatusTone('ACTIVE')).toBe('success');
    expect(userStatusTone('SUSPENDED')).toBe('danger');
    expect(userStatusTone('PENDING')).toBe('warning');
    expect(userStatusTone('UNKNOWN')).toBe('warning');
  });

  it('maps psychologist statuses to labels and tones', () => {
    expect(PSY_STATUS_LABELS.activo).toBe('Activo');
    expect(PSY_STATUS_LABELS.revision).toBe('En revisión');
    expect(PSY_STATUS_LABELS.suspendido).toBe('Suspendido');
    expect(psyStatusTone('activo')).toBe('success');
    expect(psyStatusTone('revision')).toBe('warning');
    expect(psyStatusTone('suspendido')).toBe('danger');
    expect(psyStatusTone('otro')).toBe('neutral');
  });
});
