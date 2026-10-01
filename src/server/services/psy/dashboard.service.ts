import { prisma } from '../../lib/prisma.js';
import {
  buildPagination,
  endOfTodayUtc,
  ensurePsychologistProfile,
  fullName,
  minutesToHHmm,
  parsePagination,
  startOfTodayUtc,
  toIso,
} from './shared.js';

export type DashboardResponse = {
  success: true;
  profile: {
    name: string;
    email: string;
    country: string | null;
    phone: string | null;
    birthDate: string | null;
    bio: string | null;
    specialties: string[];
    sessionPrice: number | null;
    currency: string;
    isApproved: boolean;
    isVerified: boolean;
    isAcceptingNew: boolean;
    availability: Array<{ weekday: number; start: string; end: string }>;
  };
  stats: {
    activePatients: number;
    pendingMessages: number;
    sessionsToday: number;
    upcomingSessions: number;
    workshops: number;
    resources: number;
  };
  nextAppointment: {
    id: string;
    patientName: string;
    startsAt: string;
    status: string;
    reason: string | null;
  } | null;
  todayAppointments: Array<{
    id: string;
    patientName: string;
    startsAt: string;
    status: string;
    reason: string | null;
  }>;
  recentPatients: Array<{
    userId: string;
    name: string;
    email: string;
    avatarUrl: string | null;
    country: string | null;
    linkStatus: string;
    lastSessionAt: string | null;
    nextSessionAt: string | null;
    lastActivityAt: string | null;
    mood: 'ESTABLE' | 'ATENCION' | 'CRITICO' | 'SIN_DATOS';
  }>;
};

/**
 * Mockup Psy 0/1 "Panel de seguimiento emocional".
 *
 * `mood` stays `SIN_DATOS` until the user area ships `MoodEntry`. The column is
 * already part of the contract so the UI does not need to change later.
 */
export async function getDashboard(userId: string): Promise<DashboardResponse> {
  const { profile, psychologistProfile } = await ensurePsychologistProfile(userId);
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });
  const now = new Date();
  const todayStart = startOfTodayUtc();
  const todayEnd = endOfTodayUtc();

  const [availability, activePatients, pendingMessages, sessionsToday, upcomingSessions, workshops, resources, nextAppointment, todayAppointments, links] =
    await Promise.all([
      prisma.availabilitySlot.findMany({
        where: { profileId: profile.id },
        orderBy: [{ weekday: 'asc' }, { startMinutes: 'asc' }],
      }),
      prisma.psyPatient.count({ where: { psychologistId: userId, status: 'ACTIVE' } }),
      prisma.conversationMember.count({
        where: { userId, lastReadAt: null },
      }),
      prisma.appointment.count({
        where: {
          psychologistId: userId,
          startsAt: { gte: todayStart, lt: todayEnd },
          status: { in: ['PENDING', 'CONFIRMED'] },
        },
      }),
      prisma.appointment.count({
        where: {
          psychologistId: userId,
          startsAt: { gte: now },
          status: { in: ['PENDING', 'CONFIRMED'] },
        },
      }),
      prisma.workshop.count({ where: { authorId: userId } }),
      prisma.resource.count({ where: { authorId: userId } }),
      prisma.appointment.findFirst({
        where: {
          psychologistId: userId,
          startsAt: { gte: now },
          status: { in: ['PENDING', 'CONFIRMED'] },
        },
        orderBy: { startsAt: 'asc' },
        include: { patient: { include: { profile: true } } },
      }),
      prisma.appointment.findMany({
        where: {
          psychologistId: userId,
          startsAt: { gte: todayStart, lt: todayEnd },
          status: { in: ['PENDING', 'CONFIRMED'] },
        },
        orderBy: { startsAt: 'asc' },
        include: { patient: { include: { profile: true } } },
      }),
      prisma.psyPatient.findMany({
        where: { psychologistId: userId, status: { in: ['ACTIVE', 'PAUSED'] } },
        orderBy: { startedAt: 'desc' },
        take: 8,
        include: { patient: { include: { profile: true } } },
      }),
    ]);

  const patientIds = links.map((link) => link.patientUserId);

  const [lastAppointments, nextAppointments] = await Promise.all([
    patientIds.length
      ? prisma.appointment.findMany({
          where: { patientUserId: { in: patientIds }, status: 'COMPLETED' },
          orderBy: { startsAt: 'desc' },
          select: { patientUserId: true, startsAt: true, status: true },
        })
      : Promise.resolve([]),
    patientIds.length
      ? prisma.appointment.findMany({
          where: {
            patientUserId: { in: patientIds },
            startsAt: { gte: now },
            status: { in: ['PENDING', 'CONFIRMED'] },
          },
          orderBy: { startsAt: 'asc' },
          select: { patientUserId: true, startsAt: true },
        })
      : Promise.resolve([]),
  ]);

  const lastByPatient = new Map<string, Date>();
  for (const appointment of lastAppointments) {
    if (!lastByPatient.has(appointment.patientUserId)) {
      lastByPatient.set(appointment.patientUserId, appointment.startsAt);
    }
  }

  const nextByPatient = new Map<string, Date>();
  for (const appointment of nextAppointments) {
    if (!nextByPatient.has(appointment.patientUserId)) {
      nextByPatient.set(appointment.patientUserId, appointment.startsAt);
    }
  }

  const mapAppointment = (appointment: {
    id: string;
    startsAt: Date;
    status: string;
    reason: string | null;
    patient: { profile: Parameters<typeof fullName>[0] };
  }) => ({
    id: appointment.id,
    patientName: fullName(appointment.patient.profile) || 'Paciente',
    startsAt: appointment.startsAt.toISOString(),
    status: appointment.status,
    reason: appointment.reason,
  });

  const recentPatients = links.map((link) => {
    const lastSessionAt = lastByPatient.get(link.patientUserId) ?? null;
    const nextSessionAt = nextByPatient.get(link.patientUserId) ?? null;
    const lastActivityAt = [lastSessionAt, nextSessionAt, link.startedAt]
      .filter((value): value is Date => value !== null)
      .sort((a, b) => b.getTime() - a.getTime())[0] ?? null;

    return {
      userId: link.patientUserId,
      name: fullName(link.patient.profile) || 'Paciente',
      email: link.patient.email,
      avatarUrl: link.patient.profile?.avatarUrl ?? null,
      country: link.patient.profile?.country ?? null,
      linkStatus: link.status,
      lastSessionAt: toIso(lastSessionAt),
      nextSessionAt: toIso(nextSessionAt),
      lastActivityAt: toIso(lastActivityAt),
      mood: 'SIN_DATOS' as const,
    };
  });

  return {
    success: true,
    profile: {
      name: fullName(profile) || userId,
      email: user?.email ?? '',
      country: profile.country,
      phone: profile.phone,
      birthDate: toIso(profile.birthDate),
      bio: profile.bio,
      specialties: psychologistProfile.specialties,
      sessionPrice: psychologistProfile.sessionPrice,
      currency: psychologistProfile.currency,
      isApproved: psychologistProfile.isApproved,
      isVerified: psychologistProfile.isVerified,
      isAcceptingNew: psychologistProfile.isAcceptingNew,
      availability: availability.map((slot) => ({
        weekday: slot.weekday,
        start: minutesToHHmm(slot.startMinutes),
        end: minutesToHHmm(slot.endMinutes),
      })),
    },
    stats: {
      activePatients,
      pendingMessages,
      sessionsToday,
      upcomingSessions,
      workshops,
      resources,
    },
    nextAppointment: nextAppointment ? mapAppointment(nextAppointment) : null,
    todayAppointments: todayAppointments.map(mapAppointment),
    recentPatients,
  };
}

export async function listPatients(
  psychologistId: string,
  query: Record<string, unknown>,
) {
  const { page, limit, skip } = parsePagination(query);
  const search = typeof query.search === 'string' ? query.search.trim() : '';
  const status = typeof query.status === 'string' ? query.status : '';

  const where = {
    psychologistId,
    status: (['ACTIVE', 'PAUSED', 'ENDED'].includes(status) ? status : { in: ['ACTIVE', 'PAUSED'] }) as
      | 'ACTIVE'
      | 'PAUSED'
      | 'ENDED'
      | { in: Array<'ACTIVE' | 'PAUSED'> },
    patient: {
      role: 'USER' as const,
      ...(search
        ? {
            OR: [
              { email: { contains: search, mode: 'insensitive' as const } },
              { profile: { firstName: { contains: search, mode: 'insensitive' as const } } },
              { profile: { lastName: { contains: search, mode: 'insensitive' as const } } },
            ],
          }
        : {}),
    },
  };

  const [links, total] = await Promise.all([
    prisma.psyPatient.findMany({
      where,
      skip,
      take: limit,
      orderBy: { startedAt: 'desc' },
      include: { patient: { include: { profile: true } } },
    }),
    prisma.psyPatient.count({ where }),
  ]);

  const patientIds = links.map((link) => link.patientUserId);
  const now = new Date();

  const [lastSessions, nextSessions, sessionCounts] = await Promise.all([
    patientIds.length
      ? prisma.appointment.findMany({
          where: { patientUserId: { in: patientIds }, status: 'COMPLETED' },
          orderBy: { startsAt: 'desc' },
          select: { patientUserId: true, startsAt: true },
        })
      : Promise.resolve([]),
    patientIds.length
      ? prisma.appointment.findMany({
          where: {
            patientUserId: { in: patientIds },
            startsAt: { gte: now },
            status: { in: ['PENDING', 'CONFIRMED'] },
          },
          orderBy: { startsAt: 'asc' },
          select: { patientUserId: true, startsAt: true },
        })
      : Promise.resolve([]),
    patientIds.length
      ? prisma.appointment.groupBy({
          by: ['patientUserId'],
          where: { patientUserId: { in: patientIds }, status: 'COMPLETED' },
          _count: { _all: true },
        })
      : Promise.resolve([]),
  ]);

  const lastByPatient = new Map<string, Date>();
  for (const appointment of lastSessions) {
    if (!lastByPatient.has(appointment.patientUserId)) {
      lastByPatient.set(appointment.patientUserId, appointment.startsAt);
    }
  }

  const nextByPatient = new Map<string, Date>();
  for (const appointment of nextSessions) {
    if (!nextByPatient.has(appointment.patientUserId)) {
      nextByPatient.set(appointment.patientUserId, appointment.startsAt);
    }
  }

  const countByPatient = new Map(sessionCounts.map((row) => [row.patientUserId, row._count._all]));

  return {
    success: true as const,
    patients: links.map((link) => ({
      userId: link.patientUserId,
      name: fullName(link.patient.profile) || 'Paciente',
      email: link.patient.email,
      avatarUrl: link.patient.profile?.avatarUrl ?? null,
      country: link.patient.profile?.country ?? null,
      status: link.status,
      startedAt: link.startedAt.toISOString(),
      endedAt: toIso(link.endedAt),
      lastSessionAt: toIso(lastByPatient.get(link.patientUserId) ?? null),
      nextSessionAt: toIso(nextByPatient.get(link.patientUserId) ?? null),
      completedSessions: countByPatient.get(link.patientUserId) ?? 0,
      mood: 'SIN_DATOS' as const,
    })),
    pagination: buildPagination(page, limit, total),
  };
}

export async function getPatientDetail(psychologistId: string, patientUserId: string) {
  const link = await prisma.psyPatient.findFirst({
    where: { psychologistId, patientUserId },
    include: { patient: { include: { profile: true } } },
  });

  if (!link) {
    return null;
  }

  const [appointments, reports] = await Promise.all([
    prisma.appointment.findMany({
      where: { psychologistId, patientUserId },
      orderBy: { startsAt: 'desc' },
      take: 50,
    }),
    prisma.patientReport.findMany({
      where: { psychologistId, patientUserId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
  ]);

  return {
    success: true as const,
    patient: {
      userId: link.patientUserId,
      name: fullName(link.patient.profile) || 'Paciente',
      email: link.patient.email,
      avatarUrl: link.patient.profile?.avatarUrl ?? null,
      country: link.patient.profile?.country ?? null,
      phone: link.patient.profile?.phone ?? null,
      birthDate: toIso(link.patient.profile?.birthDate),
      bio: link.patient.profile?.bio ?? null,
      status: link.status,
      startedAt: link.startedAt.toISOString(),
      endedAt: toIso(link.endedAt),
      mood: 'SIN_DATOS' as const,
    },
    appointments: appointments.map((appointment) => ({
      id: appointment.id,
      startsAt: appointment.startsAt.toISOString(),
      endsAt: appointment.endsAt.toISOString(),
      type: appointment.type,
      status: appointment.status,
      reason: appointment.reason,
      patientNote: appointment.patientNote,
      psyNote: appointment.psyNote,
    })),
    reports: reports.map((report) => ({
      id: report.id,
      appointmentId: report.appointmentId,
      summary: report.summary,
      moodScore: report.moodScore,
      createdAt: report.createdAt.toISOString(),
    })),
  };
}
