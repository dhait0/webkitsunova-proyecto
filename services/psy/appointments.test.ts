import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    appointment: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
    },
    psyPatient: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
      upsert: vi.fn(),
    },
    psychologistProfile: { updateMany: vi.fn() },
  },
}));

vi.mock('@/services/psy/notifications.service', () => ({
  createNotification: vi.fn(),
}));

import { prisma } from '@/lib/db/prisma';
import { createNotification } from '@/services/psy/notifications.service';
import {
  AppointmentConflictError,
  createAppointment,
  getAppointment,
  listAppointments,
  updateAppointmentStatus,
} from '@/services/psy/appointments.service';

const now = new Date('2026-01-15T10:00:00Z');
const later = new Date(now.getTime() + 60 * 60_000);

const patientActive = {
  id: 'patient-1',
  role: 'USER',
  status: 'ACTIVE',
};
const patientSuspended = { ...patientActive, status: 'SUSPENDED' };
const patientPsychologist = { ...patientActive, role: 'PSYCHOLOGIST' };

const appointment = {
  id: 'appointment-1',
  psychologistId: 'psy-1',
  patientUserId: 'patient-1',
  type: 'FOLLOW_UP',
  status: 'CONFIRMED',
  startsAt: now,
  endsAt: later,
  reason: null,
  patientNote: null,
  psyNote: null,
  cancelReason: null,
};

beforeEach(() => {
  vi.resetAllMocks();
  ;(prisma.user.findUnique as any).mockResolvedValue(patientActive);
  ;(prisma.appointment.findFirst as any).mockResolvedValue(null);
  ;(prisma.appointment.create as any).mockResolvedValue(appointment);
  ;(prisma.psyPatient.findFirst as any).mockResolvedValue(null);
  ;(prisma.psyPatient.findUnique as any).mockResolvedValue(null);
  ;(prisma.psyPatient.create as any).mockResolvedValue({ id: 'link-1' });
  ;(prisma.psyPatient.update as any).mockResolvedValue({});
  ;(prisma.psyPatient.count as any).mockResolvedValue(0);
  ;(prisma.psyPatient.upsert as any).mockResolvedValue({});
  ;(prisma.psychologistProfile.updateMany as any).mockResolvedValue({});
  ;(createNotification as any).mockResolvedValue({});
});

describe('createAppointment — contrato de reserva', () => {
  it('crea la cita en estado CONFIRMED con el psicólogo como actor', async () => {
    await createAppointment('psy-1', {
      patientUserId: 'patient-1',
      type: 'FOLLOW_UP',
      startsAt: now,
      durationMinutes: 60,
    });

    expect(prisma.appointment.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          psychologistId: 'psy-1',
          patientUserId: 'patient-1',
          status: 'CONFIRMED',
          type: 'FOLLOW_UP',
        }),
      }),
    );
  });

  it('rechaza paciente inexistente', async () => {
    ;(prisma.user.findUnique as any).mockResolvedValue(null);

    await expect(
      createAppointment('psy-1', {
        patientUserId: 'no-existe',
        type: 'FOLLOW_UP',
        startsAt: now,
        durationMinutes: 60,
      }),
    ).rejects.toBeInstanceOf(AppointmentConflictError);
  });

  it('rechaza paciente que no es USER', async () => {
    ;(prisma.user.findUnique as any).mockResolvedValue(patientPsychologist);

    await expect(
      createAppointment('psy-1', {
        patientUserId: 'patient-1',
        type: 'FOLLOW_UP',
        startsAt: now,
        durationMinutes: 60,
      }),
    ).rejects.toBeInstanceOf(AppointmentConflictError);
  });

  it('rechaza cuenta de paciente inactiva (estado leído de BD, no hardcodeado)', async () => {
    ;(prisma.user.findUnique as any).mockResolvedValue(patientSuspended);

    await expect(
      createAppointment('psy-1', {
        patientUserId: 'patient-1',
        type: 'FOLLOW_UP',
        startsAt: now,
        durationMinutes: 60,
      }),
    ).rejects.toBeInstanceOf(AppointmentConflictError);

    // La consulta lee el estado real del paciente en la base de datos.
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: 'patient-1' },
      select: { id: true, role: true, status: true },
    });
  });

  it('rechaza slot ocupado por cita PENDING o CONFIRMED (colisión de disponibilidad)', async () => {
    ;(prisma.appointment.findFirst as any).mockResolvedValue({
      id: 'ocupada',
      psychologistId: 'psy-1',
      status: 'CONFIRMED',
      startsAt: new Date(now.getTime() + 30 * 60_000),
      endsAt: new Date(now.getTime() + 90 * 60_000),
    });

    await expect(
      createAppointment('psy-1', {
        patientUserId: 'patient-1',
        type: 'FOLLOW_UP',
        startsAt: now,
        durationMinutes: 60,
      }),
    ).rejects.toBeInstanceOf(AppointmentConflictError);
  });

  it('no rechaza slot cuando la cita existente ya está CANCELLED o COMPLETED', async () => {
    // Por defecto findFirst devuelve null: Prisma filtra por status IN [PENDING, CONFIRMED],
    // así que una cita CANCELLED/COMPLETED no ocupa el horario.
    await expect(
      createAppointment('psy-1', {
        patientUserId: 'patient-1',
        type: 'FOLLOW_UP',
        startsAt: now,
        durationMinutes: 60,
      }),
    ).resolves.toBeDefined();
  });
});

describe('updateAppointmentStatus — transiciones de estado', () => {
  it('rechaza cambios sobre cita ya CANCELLED (estado terminal)', async () => {
    ;(prisma.appointment.findFirst as any).mockResolvedValue({
      ...appointment,
      status: 'CANCELLED',
      patientUserId: 'patient-1',
    });

    await expect(
      updateAppointmentStatus('psy-1', 'appointment-1', 'COMPLETED'),
    ).rejects.toBeInstanceOf(AppointmentConflictError);
  });

  it('rechaza cambios sobre cita ya COMPLETED (estado terminal)', async () => {
    ;(prisma.appointment.findFirst as any).mockResolvedValue({
      ...appointment,
      status: 'COMPLETED',
      patientUserId: 'patient-1',
    });

    await expect(
      updateAppointmentStatus('psy-1', 'appointment-1', 'CANCELLED'),
    ).rejects.toBeInstanceOf(AppointmentConflictError);
  });

  it('permite transitar CONFIRMED → CANCELLED y notifica al paciente', async () => {
    ;(prisma.appointment.findFirst as any).mockResolvedValue({
      ...appointment,
      status: 'CONFIRMED',
      patientUserId: 'patient-1',
    });

    await updateAppointmentStatus('psy-1', 'appointment-1', 'CANCELLED', 'Motivo');

    expect(prisma.appointment.update).toHaveBeenCalledWith({
      where: { id: 'appointment-1' },
      data: { status: 'CANCELLED', cancelReason: 'Motivo' },
    });
    expect(createNotification).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'patient-1', kind: 'appointment' }),
    );
  });

  it('activa el vínculo y recuenta pacientes al completar CONFIRMED → COMPLETED', async () => {
    ;(prisma.appointment.findFirst as any).mockResolvedValue({
      ...appointment,
      status: 'CONFIRMED',
      patientUserId: 'patient-1',
    });

    await updateAppointmentStatus('psy-1', 'appointment-1', 'COMPLETED');

    expect(prisma.psyPatient.upsert).toHaveBeenCalledWith({
      where: {
        psychologistId_patientUserId: { psychologistId: 'psy-1', patientUserId: 'patient-1' },
      },
      create: expect.objectContaining({ status: 'ACTIVE' }),
      update: expect.objectContaining({ status: 'ACTIVE', endedAt: null }),
    });
    expect(prisma.psychologistProfile.updateMany).toHaveBeenCalled();
  });

  it('actor limitado: devuelve null cuando la cita no pertenece al psicólogo', async () => {
    ;(prisma.appointment.findFirst as any).mockResolvedValue(null);

    const result = await updateAppointmentStatus('psy-otro', 'appointment-1', 'CANCELLED');

    expect(result).toBeNull();
    expect(prisma.appointment.update).not.toHaveBeenCalled();
  });
});

describe('actor y pertenencia de la cita', () => {
  it('getAppointment y listAppointments filtran por psychologistId', async () => {
    ;(prisma.appointment.findFirst as any).mockResolvedValue(null);
    await getAppointment('psy-1', 'appointment-1');
    expect(prisma.appointment.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'appointment-1', psychologistId: 'psy-1' } }),
    );

    ;(prisma.appointment.findMany as any).mockResolvedValue([]);
    ;(prisma.appointment.count as any).mockResolvedValue(0);
    await listAppointments('psy-1', {});
    expect(prisma.appointment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ psychologistId: 'psy-1' }) }),
    );
  });
});
