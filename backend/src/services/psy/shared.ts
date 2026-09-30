import { prisma } from '../../lib/prisma.js';

export const MINUTE_MS = 60_000;

/** 1 = lunes ... 7 = domingo, matching `AvailabilitySlot.weekday`. */
export function isoWeekday(date: Date): number {
  const day = date.getUTCDay();
  return day === 0 ? 7 : day;
}

export function minutesToHHmm(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function parsePagination(query: Record<string, unknown>): {
  page: number;
  limit: number;
  skip: number;
} {
  const rawPage = Number.parseInt(String(query.page ?? '1'), 10);
  const rawLimit = Number.parseInt(String(query.limit ?? '10'), 10);
  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
  const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, 50) : 10;
  return { page, limit, skip: (page - 1) * limit };
}

export function buildPagination(page: number, limit: number, total: number) {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
}

export function toIso(value: Date | null | undefined): string | null {
  return value ? value.toISOString() : null;
}

export function fullName(profile: {
  firstName?: string | null;
  lastName?: string | null;
  username?: string | null;
} | null | undefined): string {
  const name = `${profile?.firstName ?? ''} ${profile?.lastName ?? ''}`.trim();
  return name || profile?.username || '';
}

/** Start/end of the current day in UTC. */
export function startOfTodayUtc(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

export function endOfTodayUtc(): Date {
  return new Date(startOfTodayUtc().getTime() + 24 * 60 * MINUTE_MS);
}

export async function ensureProfile(userId: string) {
  const existing = await prisma.profile.findUnique({ where: { userId } });

  if (existing) {
    return existing;
  }

  return prisma.profile.create({ data: { userId } });
}

export async function ensurePsychologistProfile(userId: string) {
  const profile = await ensureProfile(userId);
  const existing = await prisma.psychologistProfile.findUnique({
    where: { profileId: profile.id },
  });

  if (existing) {
    return { profile, psychologistProfile: existing };
  }

  const psychologistProfile = await prisma.psychologistProfile.create({
    data: { profileId: profile.id },
  });

  return { profile, psychologistProfile };
}

export async function recalculatePsychologistRating(psyId: string): Promise<void> {
  const agg = await prisma.review.aggregate({
    where: { psyId },
    _avg: { rating: true },
    _count: { rating: true },
  });

  await prisma.psychologistProfile.updateMany({
    where: { profile: { userId: psyId } },
    data: {
      rating: agg._avg.rating ?? 0,
      reviewsCount: agg._count.rating,
    },
  });
}

export async function recalculatePatientsCount(psyId: string): Promise<void> {
  const patientsCount = await prisma.psyPatient.count({
    where: { psychologistId: psyId, status: 'ACTIVE' },
  });

  await prisma.psychologistProfile.updateMany({
    where: { profile: { userId: psyId } },
    data: { patientsCount },
  });
}
