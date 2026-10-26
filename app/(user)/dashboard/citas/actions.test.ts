import { describe, expect, it, vi, beforeEach } from 'vitest';

const requireUser = vi.hoisted(() => vi.fn());
const getPsychologistProfile = vi.hoisted(() => vi.fn());
const createAppointment = vi.hoisted(() => vi.fn());

vi.mock('@/lib/auth/guard', () => ({
  requireUser: () => requireUser(),
}));

vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    user: { findUnique: vi.fn() },
  },
}));

vi.mock('@/services/psy/psychologists.service', () => ({
  getPsychologistProfile: () => getPsychologistProfile(),
}));

vi.mock('@/services/psy/appointments.service', () => ({
  AppointmentConflictError: class AppointmentConflictError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'AppointmentConflictError';
    }
  },
  createAppointment,
}));

import { prisma } from '@/lib/db/prisma';
import { AppointmentConflictError } from '@/services/psy/appointments.service';
import { createAppointmentAction } from './actions';

const sessionUser = {
  id: 'patient-1',
  email: 'user@example.com',
  role: 'USER',
  status: 'ACTIVE',
  profile: { firstName: 'User', lastName: 'One', username: 'user' },
};

const psychologistEligible = {
  id: 'psy-1',
  name: 'Dra. Laura Gómez',
  isAcceptingNew: true,
};

const startsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

const baseInput = {
  psychologistId: 'psy-1',
  startsAt,
  durationMinutes: 60,
  type: 'FOLLOW_UP' as const,
};

beforeEach(() => {
  vi.resetAllMocks();
  ;(requireUser as any).mockResolvedValue(sessionUser);
  ;(getPsychologistProfile as any).mockResolvedValue(psychologistEligible);
  ;(prisma.user.findUnique as any).mockResolvedValue({
    id: 'patient-1',
    role: 'USER',
    status: 'ACTIVE',
  });
  ;(createAppointment as any).mockResolvedValue({
    id: 'appointment-1',
    status: 'CONFIRMED',
    startsAt,
  });
});

describe('createAppointmentAction — autorización y sesión', () => {
  it('rechaza cuando no hay sesión autenticada', async () => {
    ;(requireUser as any).mockRejectedValue(new Error('redirect'));

    const result = await createAppointmentAction(baseInput);

    expect(result).toEqual({ ok: false, error: 'No autenticado' });
  });

  it('identifica al paciente exclusivamente desde la sesión, sin patientId del cliente', async () => {
    const inputWithoutPatientId = { ...baseInput };

    await createAppointmentAction(inputWithoutPatientId);

    expect(createAppointment).toHaveBeenCalledWith(
      'psy-1',
      expect.objectContaining({ patientUserId: 'patient-1' }),
    );
    expect((createAppointment as any).mock.calls[0][1].patientUserId).not.toContain(
      'patientId',
    );
  });

  it('no acepta patientId provisto por el cliente (el input no lo declara)', async () => {
    const keys = Object.keys(baseInput);
    expect(keys).not.toContain('patientId');
    expect(keys).not.toContain('patientUserId');
  });
});

describe('createAppointmentAction — validación de psicólogo y paciente', () => {
  it('rechaza psicólogo no elegible (no activo, no aprobado o no psicólogo)', async () => {
    ;(getPsychologistProfile as any).mockResolvedValue(null);

    const result = await createAppointmentAction(baseInput);

    expect(result).toEqual({
      ok: false,
      error: 'El psicólogo no está disponible para reservas.',
    });
    expect(createAppointment).not.toHaveBeenCalled();
  });

  it('rechaza paciente inactivo (estado leído de BD, no hardcodeado)', async () => {
    ;(prisma.user.findUnique as any).mockResolvedValue({
      id: 'patient-1',
      role: 'USER',
      status: 'SUSPENDED',
    });

    const result = await createAppointmentAction(baseInput);

    expect(result).toEqual({
      ok: false,
      error: 'La cuenta del paciente no está activa.',
    });
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: 'patient-1' },
      select: { id: true, role: true, status: true },
    });
  });

  it('rechaza paciente con rol distinto a USER', async () => {
    ;(prisma.user.findUnique as any).mockResolvedValue({
      id: 'patient-1',
      role: 'PSYCHOLOGIST',
      status: 'ACTIVE',
    });

    const result = await createAppointmentAction(baseInput);

    expect(result).toEqual({ ok: false, error: 'Cuenta de paciente no válida.' });
  });
});

describe('createAppointmentAction — horario y colisión', () => {
  it('rechaza horario en el pasado (slot no válido)', async () => {
    const pastInput = { ...baseInput, startsAt: new Date('2020-01-01T10:00:00Z') };

    const result = await createAppointmentAction(pastInput);

    expect(result).toEqual({ ok: false, error: 'El horario solicitado no es válido.' });
    expect(createAppointment).not.toHaveBeenCalled();
  });

  it('rechaza colisión de horario (cita PENDING/CONFIRMED existente)', async () => {
    const conflictError = new AppointmentConflictError('El horario ya está ocupado');
    ;(createAppointment as any).mockRejectedValue(conflictError);

    const result = await createAppointmentAction(baseInput);

    expect(result).toEqual({
      ok: false,
      error: 'El horario ya está ocupado',
    });
  });

  it('crea la cita con el paciente de la sesión y devuelve solo campos públicos', async () => {
    const result = await createAppointmentAction(baseInput);

    expect(result).toEqual({
      ok: true,
      appointment: {
        id: 'appointment-1',
        status: 'CONFIRMED',
        startsAt: startsAt.toISOString(),
      },
    });

    expect(createAppointment).toHaveBeenCalledWith('psy-1', {
      patientUserId: 'patient-1',
      type: 'FOLLOW_UP',
      startsAt,
      durationMinutes: 60,
      reason: null,
    });
  });
});
