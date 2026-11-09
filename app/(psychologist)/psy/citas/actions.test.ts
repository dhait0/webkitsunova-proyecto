import { beforeEach, describe, expect, it, vi } from 'vitest';

const authorize = vi.hoisted(() => vi.fn());
const updateAppointmentStatus = vi.hoisted(() => vi.fn());

vi.mock('@/lib/auth/guard', () => ({ authorize }));
vi.mock('@/services/psy/appointments.service', () => ({
  AppointmentConflictError: class AppointmentConflictError extends Error {},
  listAppointments: vi.fn(),
  updateAppointmentStatus,
}));

import { AppointmentConflictError } from '@/services/psy/appointments.service';
import { updateAppointmentStatusAction } from './actions';

beforeEach(() => {
  vi.resetAllMocks();
  authorize.mockResolvedValue({ id: 'psy-1', role: 'PSYCHOLOGIST', status: 'ACTIVE' });
});

describe('updateAppointmentStatusAction', () => {
  it('exige un psicólogo autorizado', async () => {
    authorize.mockResolvedValue(null);
    await expect(updateAppointmentStatusAction('a1', 'CONFIRMED')).rejects.toThrow('No autorizado');
    expect(updateAppointmentStatus).not.toHaveBeenCalled();
  });

  it('usa la identidad de la sesión y devuelve ok', async () => {
    updateAppointmentStatus.mockResolvedValue({ id: 'a1' });
    expect(await updateAppointmentStatusAction('a1', 'CONFIRMED')).toEqual({ ok: true });
    expect(updateAppointmentStatus).toHaveBeenCalledWith('psy-1', 'a1', 'CONFIRMED', null);
  });

  it('devuelve el motivo de negocio en lugar de lanzar (producción oculta los errores lanzados)', async () => {
    updateAppointmentStatus.mockRejectedValue(new AppointmentConflictError('La sesión aún no ha comenzado'));
    expect(await updateAppointmentStatusAction('a1', 'COMPLETED')).toEqual({
      ok: false,
      error: 'La sesión aún no ha comenzado',
    });
  });

  it('informa de una cita que no pertenece al psicólogo', async () => {
    updateAppointmentStatus.mockResolvedValue(null);
    expect(await updateAppointmentStatusAction('ajena', 'CANCELLED')).toEqual({ ok: false, error: 'Sesión no encontrada' });
  });

  it('valida estado y longitud del motivo', async () => {
    expect(await updateAppointmentStatusAction('a1', 'OTRO' as never)).toEqual({ ok: false, error: 'Datos no válidos' });
    expect((await updateAppointmentStatusAction('a1', 'CANCELLED', 'x'.repeat(301))).ok).toBe(false);
    expect(updateAppointmentStatus).not.toHaveBeenCalled();
  });
});
