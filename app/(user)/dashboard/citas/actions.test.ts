import { describe, expect, it, vi, beforeEach } from 'vitest';

const requireUser = vi.fn();
const getSessionUser = vi.fn();
const requestAppointmentByUser = vi.fn();
const listPatientAppointments = vi.fn();

vi.mock('@/lib/auth/guard', () => ({
  requireUser: (...args: unknown[]) => requireUser(...args),
  getSessionUser: (...args: unknown[]) => getSessionUser(...args),
}));

vi.mock('@/services/psy/appointments.service', () => ({
  listPatientAppointments: (...args: unknown[]) => listPatientAppointments(...args),
  requestAppointmentByUser: (...args: unknown[]) => requestAppointmentByUser(...args),
  AppointmentConflictError: class AppointmentConflictError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'AppointmentConflictError';
    }
  },
}));

describe('user citas actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getMyAppointmentsAction rechaza si no autenticado', async () => {
    getSessionUser.mockResolvedValue(null);
    const { getMyAppointmentsAction } = await import('./actions');
    await expect(getMyAppointmentsAction({})).rejects.toThrow('No autenticado');
  });

  it('getMyAppointmentsAction rechaza si no es USER', async () => {
    getSessionUser.mockResolvedValue({ id: 'u1', role: 'PSYCHOLOGIST', status: 'ACTIVE' });
    const { getMyAppointmentsAction } = await import('./actions');
    await expect(getMyAppointmentsAction({})).rejects.toThrow('No autorizado');
  });

  it('getMyAppointmentsAction rechaza si no está ACTIVE', async () => {
    getSessionUser.mockResolvedValue({ id: 'u1', role: 'USER', status: 'PENDING' });
    const { getMyAppointmentsAction } = await import('./actions');
    await expect(getMyAppointmentsAction({})).rejects.toThrow('Cuenta no activa');
  });

  it('requestAppointmentAction rechaza si rol no es USER', async () => {
    requireUser.mockResolvedValue({ id: 'u1', role: 'ADMIN', status: 'ACTIVE' });
    const { requestAppointmentAction } = await import('./actions');
    const fd = new FormData();
    fd.append('psychologistId', 'p1');
    fd.append('startsAt', new Date(Date.now() + 3600000).toISOString());
    fd.append('durationMinutes', '60');
    const res = await requestAppointmentAction(fd);
    expect(res.success).toBe(false);
    expect(res.message).toBe('No autorizado');
  });

  it('requestAppointmentAction crea cita con estado PENDING vía servicio', async () => {
    requireUser.mockResolvedValue({ id: 'u1', role: 'USER', status: 'ACTIVE' });
    requestAppointmentByUser.mockResolvedValue({ id: 'a1' });
    const { requestAppointmentAction } = await import('./actions');
    const fd = new FormData();
    fd.append('psychologistId', 'p1');
    fd.append('startsAt', new Date(Date.now() + 3600000).toISOString());
    fd.append('durationMinutes', '60');
    fd.append('type', 'FIRST_SESSION');
    fd.append('reason', 'Ansiedad');
    const res = await requestAppointmentAction(fd);
    expect(res.success).toBe(true);
    expect(requestAppointmentByUser).toHaveBeenCalledWith('u1', expect.objectContaining({
      psychologistId: 'p1',
      durationMinutes: 60,
      type: 'FIRST_SESSION',
    }));
  });
});
