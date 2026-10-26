import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import {
  buildPagination,
  endOfTodayUtc,
  fullName,
  parsePagination,
  startOfTodayUtc,
} from './shared';
import { createNotification } from './notifications.service';
import { recalculatePatientsCount } from './shared';

export type AppointmentScope = 'today' | 'upcoming' | 'past' | 'all';

export type AppointmentInput = {
  patientUserId: string;
  type: 'FIRST_SESSION' | 'FOLLOW_UP' | 'URGENT';
  startsAt: Date;
  durationMinutes: number;
  reason?: string | null;
  patientNote?: string | null;
};

export class AppointmentConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AppointmentConflictError';
  }
}

function endsAt(startsAt: Date, durationMinutes: number): Date {
  return new Date(startsAt.getTime() + durationMinutes * 60_000);
}

/**
 * Decision D2: a user may only have one ACTIVE psychologist at a time.
 * Returns the link that must be closed, or null when the slot is free.
 */
async function findActiveLinkElsewhere(
  psychologistId: string,
  patientUserId: string,
): Promise<string | null> {
  const active = await prisma.psyPatient.findFirst({
    where: {
      patientUserId,
      status: { in: ['ACTIVE', 'PAUSED'] },
      NOT: { psychologistId },
    },
    orderBy: { startedAt: 'desc' },
    select: { id: true },
  });

  return active?.id ?? null;
}

/** Opens or re-activates the therapist/patient link (decision D1). */
async function ensurePatientLink(psychologistId: string, patientUserId: string) {
  const existing = await prisma.psyPatient.findUnique({
    where: { psychologistId_patientUserId: { psychologistId, patientUserId } },
  });

  if (existing) {
    if (existing.status === 'ENDED') {
      return prisma.psyPatient.update({
        where: { id: existing.id },
        data: { status: 'ACTIVE', endedAt: null, startedAt: new Date() },
      });
    }

    if (existing.status === 'PAUSED') {
      return prisma.psyPatient.update({
        where: { id: existing.id },
        data: { status: 'ACTIVE' },
      });
    }

    return existing;
  }

  return prisma.psyPatient.create({
    data: { psychologistId, patientUserId, status: 'ACTIVE' },
  });
}

async function closeOtherActiveLinks(psychologistId: string, patientUserId: string) {
  const otherLinkId = await findActiveLinkElsewhere(psychologistId, patientUserId);

  if (!otherLinkId) {
    return;
  }

  await prisma.psyPatient.update({
    where: { id: otherLinkId },
    data: { status: 'ENDED', endedAt: new Date() },
  });
}

export async function listAppointments(psychologistId: string, query: Record<string, unknown>) {
  const { page, limit, skip } = parsePagination(query);
  const scope = (typeof query.scope === 'string' ? query.scope : 'upcoming') as AppointmentScope;
  const status = typeof query.status === 'string' ? query.status : '';
  const now = new Date();

  const nowBounds: Prisma.AppointmentWhereInput = {
    ...(scope === 'today'
      ? { startsAt: { gte: startOfTodayUtc(), lt: endOfTodayUtc() } }
      : scope === 'upcoming'
        ? { startsAt: { gte: now } }
        : scope === 'past'
          ? { startsAt: { lt: now } }
          : {}),
  };

  const where: Prisma.AppointmentWhereInput = {
    psychologistId,
    ...nowBounds,
    ...(['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(status)
      ? { status: status as 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW' }
      : {}),
  };

  const orderBy: Prisma.AppointmentOrderByWithRelationInput =
    scope === 'past' ? { startsAt: 'desc' } : { startsAt: 'asc' };

  const [appointments, total] = await Promise.all([
    prisma.appointment.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: { patient: { include: { profile: true } } },
    }),
    prisma.appointment.count({ where }),
  ]);

  return {
    success: true as const,
    appointments: appointments.map((appointment) => ({
      id: appointment.id,
      patientUserId: appointment.patientUserId,
      patientName: fullName(appointment.patient.profile) || 'Paciente',
      startsAt: appointment.startsAt.toISOString(),
      endsAt: appointment.endsAt.toISOString(),
      type: appointment.type,
      status: appointment.status,
      reason: appointment.reason ?? 'Sin motivo especificado',
      patientNote: appointment.patientNote,
      psyNote: appointment.psyNote,
    })),
    pagination: buildPagination(page, limit, total),
  };
}

/**
 * Consulta las citas propias de un paciente (usuario), aisladas por titular.
 * Reutiliza la misma paginación, alcances y filtros de estado que
 * `listAppointments`, pero filtra por `patientUserId` en vez de
 * `psychologistId`. Solo expone campos públicos; nunca datos privados.
 */
export async function listPatientAppointments(
  patientUserId: string,
  query: Record<string, unknown>,
) {
  const { page, limit, skip } = parsePagination(query);
  const scope = (typeof query.scope === 'string' ? query.scope : 'upcoming') as AppointmentScope;
  const status = typeof query.status === 'string' ? query.status : '';
  const now = new Date();

  const nowBounds: Prisma.AppointmentWhereInput = {
    ...(scope === 'today'
      ? { startsAt: { gte: startOfTodayUtc(), lt: endOfTodayUtc() } }
      : scope === 'upcoming'
        ? { startsAt: { gte: now } }
        : scope === 'past'
          ? { startsAt: { lt: now } }
          : {}),
  };

  const where: Prisma.AppointmentWhereInput = {
    patientUserId,
    ...nowBounds,
    ...(['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(status)
      ? { status: status as 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW' }
      : {}),
  };

  const orderBy: Prisma.AppointmentOrderByWithRelationInput =
    scope === 'past' ? { startsAt: 'desc' } : { startsAt: 'asc' };

  const [appointments, total] = await Promise.all([
    prisma.appointment.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: { psychologist: { include: { profile: true } } },
    }),
    prisma.appointment.count({ where }),
  ]);

  return {
    success: true as const,
    appointments: appointments.map((appointment) => ({
      id: appointment.id,
      psychologistUserId: appointment.psychologistId,
      psychologistName: fullName(appointment.psychologist.profile) || 'Psicólogo',
      startsAt: appointment.startsAt.toISOString(),
      endsAt: appointment.endsAt.toISOString(),
      type: appointment.type,
      status: appointment.status,
      reason: appointment.reason ?? 'Sin motivo especificado',
    })),
    pagination: buildPagination(page, limit, total),
  };
}

export async function getAppointment(psychologistId: string, id: string) {
  const appointment = await prisma.appointment.findFirst({
    where: { id, psychologistId },
    include: { patient: { include: { profile: true } } },
  });

  if (!appointment) {
    return null;
  }

  return {
    success: true as const,
    appointment: {
      id: appointment.id,
      patientUserId: appointment.patientUserId,
      patientName: fullName(appointment.patient.profile) || 'Paciente',
      startsAt: appointment.startsAt.toISOString(),
      endsAt: appointment.endsAt.toISOString(),
      type: appointment.type,
      status: appointment.status,
      reason: appointment.reason,
      patientNote: appointment.patientNote,
      psyNote: appointment.psyNote,
    },
  };
}

export async function createAppointment(psychologistId: string, input: AppointmentInput) {
  const patient = await prisma.user.findUnique({
    where: { id: input.patientUserId },
    select: { id: true, role: true, status: true },
  });

  if (!patient || patient.role !== 'USER') {
    throw new AppointmentConflictError('El paciente no existe');
  }

  if (patient.status !== 'ACTIVE') {
    throw new AppointmentConflictError('La cuenta del paciente no está activa');
  }

  const conflict = await prisma.appointment.findFirst({
    where: {
      psychologistId,
      status: { in: ['PENDING', 'CONFIRMED'] },
      startsAt: { lt: endsAt(input.startsAt, input.durationMinutes) },
      endsAt: { gt: input.startsAt },
    },
    select: { id: true },
  });

  if (conflict) {
    throw new AppointmentConflictError('El horario ya está ocupado');
  }

  const appointment = await prisma.appointment.create({
    data: {
      psychologistId,
      patientUserId: input.patientUserId,
      type: input.type,
      status: 'CONFIRMED',
      startsAt: input.startsAt,
      endsAt: endsAt(input.startsAt, input.durationMinutes),
      reason: input.reason ?? null,
      patientNote: input.patientNote ?? null,
    },
  });

  // Decision D2: the previous psychologist's link is closed before the new one
  // opens, so a user never holds two ACTIVE links.
  await closeOtherActiveLinks(psychologistId, input.patientUserId);
  await ensurePatientLink(psychologistId, input.patientUserId);
  await recalculatePatientsCount(psychologistId);

  await createNotification({
    userId: input.patientUserId,
    kind: 'appointment',
    title: 'Sesión confirmada',
    body: `Tu sesión quedó confirmada para el ${appointment.startsAt.toISOString()}.`,
    link: '/dashboard/citas',
  });

  return appointment;
}

export async function updateAppointmentStatus(
  psychologistId: string,
  id: string,
  status: 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW',
  cancelReason?: string | null,
) {
  const appointment = await prisma.appointment.findFirst({
    where: { id, psychologistId },
  });

  if (!appointment) {
    return null;
  }

  if (appointment.status === 'CANCELLED' || appointment.status === 'COMPLETED') {
    throw new AppointmentConflictError('La sesión ya no admite cambios de estado');
  }

  const updated = await prisma.appointment.update({
    where: { id },
    data: {
      status,
      cancelReason: status === 'CANCELLED' ? cancelReason ?? null : null,
    },
  });

  if (status === 'CANCELLED') {
    await createNotification({
      userId: appointment.patientUserId,
      kind: 'appointment',
      title: 'Sesión cancelada',
      body: cancelReason ?? 'Tu psicólogo canceló la sesión.',
      link: '/dashboard/citas',
    });
  }

  if (status === 'COMPLETED') {
    await prisma.psyPatient.upsert({
      where: {
        psychologistId_patientUserId: {
          psychologistId,
          patientUserId: appointment.patientUserId,
        },
      },
      create: { psychologistId, patientUserId: appointment.patientUserId, status: 'ACTIVE' },
      update: { status: 'ACTIVE', endedAt: null },
    });
    await recalculatePatientsCount(psychologistId);
  }

  return updated;
}

export async function saveAppointmentNote(psychologistId: string, id: string, psyNote: string) {
  const appointment = await prisma.appointment.findFirst({
    where: { id, psychologistId },
    select: { id: true },
  });

  if (!appointment) {
    return null;
  }

  const updated = await prisma.appointment.update({
    where: { id },
    data: { psyNote },
  });

  return updated;
}

export async function createPatientReport(
  psychologistId: string,
  input: { patientUserId: string; appointmentId?: string | null; summary: string; moodScore?: number | null },
) {
  const link = await prisma.psyPatient.findFirst({
    where: { psychologistId, patientUserId: input.patientUserId, status: { in: ['ACTIVE', 'PAUSED'] } },
    select: { id: true },
  });

  if (!link) {
    throw new AppointmentConflictError('No existe un vínculo activo con ese paciente');
  }

  const report = await prisma.patientReport.create({
    data: {
      psychologistId,
      patientUserId: input.patientUserId,
      appointmentId: input.appointmentId ?? null,
      summary: input.summary,
      moodScore: input.moodScore ?? null,
    },
  });

  await createNotification({
    userId: input.patientUserId,
    kind: 'patient-report',
    title: 'Tu psicólogo publicó un reporte',
    body: 'Hay un nuevo reporte de seguimiento disponible en tu panel.',
    link: '/dashboard',
  });

  return report;
}
