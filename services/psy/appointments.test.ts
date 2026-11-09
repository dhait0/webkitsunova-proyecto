import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    $transaction: vi.fn(),
    user: { findUnique: vi.fn(), findFirst: vi.fn() },
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
  cancelAppointmentByUser,
  getAppointment,
  listAppointments,
  listPatientAppointments,
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

// 2026-01-15 es jueves; 10:00Z son las 05:00 en Bogotá (UTC-5).
const psychologistRow = {
  profile: {
    timezone: 'America/Bogota',
    availabilitySlots: [{ weekday: 4, startMinutes: 5 * 60, endMinutes: 12 * 60 }],
  },
};

beforeEach(() => {
  vi.resetAllMocks();
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-01-10T00:00:00Z'));
  ;(prisma.$transaction as any).mockImplementation((fn: any) => fn(prisma));
  ;(prisma.user.findFirst as any).mockResolvedValue(psychologistRow);
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

afterEach(() => {
  vi.useRealTimers();
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

describe('createAppointment — validación de disponibilidad en el servidor', () => {
  const book = (overrides: Partial<{ startsAt: Date; durationMinutes: number }> = {}) =>
    createAppointment('psy-1', {
      patientUserId: 'patient-1',
      type: 'FOLLOW_UP',
      startsAt: now,
      durationMinutes: 60,
      ...overrides,
    });

  it('rechaza si el psicólogo no está aprobado o activo', async () => {
    ;(prisma.user.findFirst as any).mockResolvedValue(null);

    await expect(book()).rejects.toThrow('no está disponible');
    expect(prisma.appointment.create).not.toHaveBeenCalled();
  });

  it('consulta solo psicólogos con rol, cuenta activa y perfil aprobado', async () => {
    await book();

    expect(prisma.user.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: 'psy-1',
          role: 'PSYCHOLOGIST',
          status: 'ACTIVE',
          profile: { psychologistProfile: { isApproved: true } },
        }),
      }),
    );
  });

  it('rechaza horarios en el pasado', async () => {
    vi.setSystemTime(new Date('2026-01-16T00:00:00Z'));

    await expect(book()).rejects.toThrow('ya pasó');
    expect(prisma.appointment.create).not.toHaveBeenCalled();
  });

  it('rechaza un día sin franja de disponibilidad', async () => {
    // 2026-01-16 15:00Z = viernes 10:00 en Bogotá; solo hay franja el jueves.
    await expect(book({ startsAt: new Date('2026-01-16T15:00:00Z') })).rejects.toThrow(
      'fuera de la disponibilidad',
    );
    expect(prisma.appointment.create).not.toHaveBeenCalled();
  });

  it('rechaza una hora antes de la franja', async () => {
    // 09:00Z = 04:00 en Bogotá; la franja empieza a las 05:00.
    await expect(book({ startsAt: new Date('2026-01-15T09:00:00Z') })).rejects.toThrow(
      'fuera de la disponibilidad',
    );
  });

  it('rechaza una sesión que termina después de la franja', async () => {
    // 16:30Z = 11:30 en Bogotá + 60 min excede el cierre de las 12:00.
    await expect(
      book({ startsAt: new Date('2026-01-15T16:30:00Z'), durationMinutes: 60 }),
    ).rejects.toThrow('fuera de la disponibilidad');
  });

  it('acepta una sesión que termina justo al cierre de la franja', async () => {
    await expect(
      book({ startsAt: new Date('2026-01-15T16:00:00Z'), durationMinutes: 60 }),
    ).resolves.toBeDefined();
  });

  it('rechaza si el psicólogo no tiene ninguna franja', async () => {
    ;(prisma.user.findFirst as any).mockResolvedValue({
      profile: { timezone: null, availabilitySlots: [] },
    });

    await expect(book()).rejects.toThrow('fuera de la disponibilidad');
  });

  it('ejecuta la comprobación y la escritura en una transacción serializable', async () => {
    await book();

    expect(prisma.$transaction).toHaveBeenCalledWith(expect.any(Function), {
      isolationLevel: 'Serializable',
    });
  });

  it('traduce el fallo de serialización (P2034) a conflicto de horario', async () => {
    ;(prisma.$transaction as any).mockRejectedValue({ code: 'P2034' });

    await expect(book()).rejects.toBeInstanceOf(AppointmentConflictError);
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
    vi.setSystemTime(new Date('2026-01-16T00:00:00Z'));
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

  it('no deja completar ni marcar ausencia en una sesión que aún no empezó', async () => {
    ;(prisma.appointment.findFirst as any).mockResolvedValue({ ...appointment, status: 'CONFIRMED' });

    await expect(updateAppointmentStatus('psy-1', 'appointment-1', 'COMPLETED')).rejects.toThrow('aún no ha comenzado');
    await expect(updateAppointmentStatus('psy-1', 'appointment-1', 'NO_SHOW')).rejects.toThrow('aún no ha comenzado');
    expect(prisma.appointment.update).not.toHaveBeenCalled();
  });

  it('solo admite las transiciones válidas (PENDING no pasa directo a COMPLETED)', async () => {
    vi.setSystemTime(new Date('2026-01-16T00:00:00Z'));
    ;(prisma.appointment.findFirst as any).mockResolvedValue({ ...appointment, status: 'PENDING' });

    await expect(updateAppointmentStatus('psy-1', 'appointment-1', 'COMPLETED')).rejects.toThrow('no admite ese cambio');
    await expect(updateAppointmentStatus('psy-1', 'appointment-1', 'NO_SHOW')).rejects.toThrow('no admite ese cambio');
    expect(prisma.appointment.update).not.toHaveBeenCalled();
  });

  it('confirmar una solicitud abre el vínculo, recuenta pacientes y avisa al paciente', async () => {
    ;(prisma.appointment.findFirst as any).mockResolvedValue({ ...appointment, status: 'PENDING' });

    await updateAppointmentStatus('psy-1', 'appointment-1', 'CONFIRMED');

    expect(prisma.appointment.update).toHaveBeenCalledWith({
      where: { id: 'appointment-1' },
      data: { status: 'CONFIRMED', cancelReason: null },
    });
    expect(prisma.psyPatient.create).toHaveBeenCalled();
    expect(prisma.psychologistProfile.updateMany).toHaveBeenCalled();
    expect(createNotification).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'patient-1', title: 'Solicitud confirmada' }),
    );
  });

  it('rechazar una solicitud pendiente lo comunica como rechazo, no como cancelación', async () => {
    ;(prisma.appointment.findFirst as any).mockResolvedValue({ ...appointment, status: 'PENDING' });

    await updateAppointmentStatus('psy-1', 'appointment-1', 'CANCELLED');

    expect(createNotification).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'patient-1', title: 'Solicitud rechazada' }),
    );
  });

  it('actor limitado: devuelve null cuando la cita no pertenece al psicólogo', async () => {
    ;(prisma.appointment.findFirst as any).mockResolvedValue(null);

    const result = await updateAppointmentStatus('psy-otro', 'appointment-1', 'CANCELLED');

    expect(result).toBeNull();
    expect(prisma.appointment.update).not.toHaveBeenCalled();
  });
});

describe('listPatientAppointments — próximas e historial', () => {
  beforeEach(() => {
    ;(prisma.appointment.findMany as any).mockResolvedValue([]);
    ;(prisma.appointment.count as any).mockResolvedValue(0);
  });

  it('próximas: solo pendientes o confirmadas que aún no empiezan', async () => {
    await listPatientAppointments('patient-1', { scope: 'upcoming' });
    expect(prisma.appointment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          patientUserId: 'patient-1',
          startsAt: { gte: expect.any(Date) },
          status: { in: ['PENDING', 'CONFIRMED'] },
        },
      }),
    );
  });

  it('historial: lo ya empezado o cerrado, incluso una cita futura cancelada', async () => {
    await listPatientAppointments('patient-1', { scope: 'past' });
    expect(prisma.appointment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          patientUserId: 'patient-1',
          OR: [
            { startsAt: { lt: expect.any(Date) } },
            { status: { in: ['CANCELLED', 'COMPLETED', 'NO_SHOW'] } },
          ],
        },
        orderBy: { startsAt: 'desc' },
      }),
    );
  });
});

describe('cancelAppointmentByUser', () => {
  const future = new Date('2026-02-01T10:00:00Z');

  it('cancela una cita propia futura y avisa al psicólogo', async () => {
    ;(prisma.appointment.findFirst as any).mockResolvedValue({ ...appointment, status: 'CONFIRMED', startsAt: future });

    await cancelAppointmentByUser('patient-1', 'appointment-1', '  Surgió un imprevisto  ');

    expect(prisma.appointment.findFirst).toHaveBeenCalledWith({ where: { id: 'appointment-1', patientUserId: 'patient-1' } });
    expect(prisma.appointment.update).toHaveBeenCalledWith({
      where: { id: 'appointment-1' },
      data: { status: 'CANCELLED', cancelReason: 'Surgió un imprevisto' },
    });
    expect(createNotification).toHaveBeenCalledWith(expect.objectContaining({ userId: 'psy-1', kind: 'appointment' }));
  });

  it('no encuentra citas de otro paciente', async () => {
    ;(prisma.appointment.findFirst as any).mockResolvedValue(null);
    await expect(cancelAppointmentByUser('otro', 'appointment-1')).rejects.toThrow('Cita no encontrada');
    expect(prisma.appointment.update).not.toHaveBeenCalled();
  });

  it('rechaza citas ya canceladas, completadas o que ya empezaron', async () => {
    ;(prisma.appointment.findFirst as any).mockResolvedValue({ ...appointment, status: 'COMPLETED', startsAt: future });
    await expect(cancelAppointmentByUser('patient-1', 'appointment-1')).rejects.toThrow('ya no se puede cancelar');

    ;(prisma.appointment.findFirst as any).mockResolvedValue({ ...appointment, status: 'CONFIRMED', startsAt: new Date('2026-01-09T10:00:00Z') });
    await expect(cancelAppointmentByUser('patient-1', 'appointment-1')).rejects.toThrow('ya comenzó');
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

describe('listPatientAppointments — lista aislada por titular', () => {
  const patientAppointments = [
    {
      id: 'ap-1',
      psychologistId: 'psy-1',
      patientUserId: 'patient-1',
      type: 'FOLLOW_UP',
      status: 'CONFIRMED',
      startsAt: new Date('2026-02-10T10:00:00Z'),
      endsAt: new Date('2026-02-10T11:00:00Z'),
      reason: 'Ansiedad',
      psychologist: {
        profile: { firstName: 'Dra. Laura', lastName: 'Gómez', username: 'laura' },
      },
    },
    {
      id: 'ap-2',
      psychologistId: 'psy-2',
      patientUserId: 'patient-1',
      type: 'FIRST_SESSION',
      status: 'PENDING',
      startsAt: new Date('2026-02-12T14:00:00Z'),
      endsAt: new Date('2026-02-12T15:00:00Z'),
      reason: null,
      psychologist: {
        profile: { firstName: 'Dr. Andrés', lastName: 'Prieto', username: null },
      },
    },
  ];

  beforeEach(() => {
    ;(prisma.appointment.findMany as any).mockResolvedValue(patientAppointments);
    ;(prisma.appointment.count as any).mockResolvedValue(patientAppointments.length);
  });

  it('filtra por patientUserId del titular, no por psychologistId', async () => {
    await listPatientAppointments('patient-1', {});

    expect(prisma.appointment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ patientUserId: 'patient-1' }),
      }),
    );
    const where = (prisma.appointment.findMany as any).mock.calls[0][0].where;
    expect(where.psychologistId).toBeUndefined();
  });

  it('incluye el perfil del psicólogo para resolver el nombre público', async () => {
    await listPatientAppointments('patient-1', {});

    expect(prisma.appointment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        include: expect.objectContaining({
          psychologist: expect.objectContaining({ include: { profile: true } }),
        }),
      }),
    );
  });

  it('devuelve solo campos públicos de la cita y del psicólogo', async () => {
    const result = await listPatientAppointments('patient-1', {});

    expect(result.appointments).toEqual([
      {
        id: 'ap-1',
        psychologistUserId: 'psy-1',
        psychologistName: 'Dra. Laura Gómez',
        startsAt: '2026-02-10T10:00:00.000Z',
        endsAt: '2026-02-10T11:00:00.000Z',
        type: 'FOLLOW_UP',
        status: 'CONFIRMED',
        reason: 'Ansiedad',
      },
      {
        id: 'ap-2',
        psychologistUserId: 'psy-2',
        psychologistName: 'Dr. Andrés Prieto',
        startsAt: '2026-02-12T14:00:00.000Z',
        endsAt: '2026-02-12T15:00:00.000Z',
        type: 'FIRST_SESSION',
        status: 'PENDING',
        reason: 'Sin motivo especificado',
      },
    ]);
  });

  it('no expone datos privados del psicólogo ni del paciente', async () => {
    const result = await listPatientAppointments('patient-1', {});

    result.appointments.forEach((appointment) => {
      expect(appointment).not.toHaveProperty('email');
      expect(appointment).not.toHaveProperty('phone');
      expect(appointment).not.toHaveProperty('passwordHash');
      expect(appointment).not.toHaveProperty('twoFactorEnabled');
      expect(appointment).not.toHaveProperty('patientNote');
      expect(appointment).not.toHaveProperty('psyNote');
    });
  });

  it('aplica paginación con page y limit', async () => {
    await listPatientAppointments('patient-1', { page: 2, limit: 5 });

    expect(prisma.appointment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 5, take: 5 }),
    );
  });

  it('devuelve lista vacía cuando el titular no tiene citas', async () => {
    ;(prisma.appointment.findMany as any).mockResolvedValue([]);
    ;(prisma.appointment.count as any).mockResolvedValue(0);

    const result = await listPatientAppointments('patient-1', {});

    expect(result.appointments).toEqual([]);
    expect(result.pagination.total).toBe(0);
    expect(result.pagination.totalPages).toBe(0);
  });
});
