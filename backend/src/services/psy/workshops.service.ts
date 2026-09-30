import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { buildPagination, parsePagination, toIso } from './shared.js';

export type WorkshopInput = {
  title: string;
  description: string;
  coverUrl?: string | null;
  focusArea:
    | 'ANXIETY'
    | 'DEPRESSION'
    | 'STRESS'
    | 'PRODUCTIVITY'
    | 'MINDFULNESS'
    | 'SELF_ESTEEM'
    | 'TRAUMA_PTSD'
    | 'COUPLES'
    | 'FAMILY'
    | 'EATING_DISORDERS'
    | 'ADDICTION'
    | 'SLEEP'
    | 'OTHER';
  startsAt: Date;
  durationHours: number;
  capacity: number;
  priceCents: number;
  currency?: string;
};

export const FOCUS_AREAS = [
  'ANXIETY',
  'DEPRESSION',
  'STRESS',
  'PRODUCTIVITY',
  'MINDFULNESS',
  'SELF_ESTEEM',
  'TRAUMA_PTSD',
  'COUPLES',
  'FAMILY',
  'EATING_DISORDERS',
  'ADDICTION',
  'SLEEP',
  'OTHER',
] as const;

const WORKSHOP_INCLUDE = {
  enrollments: {
    include: { user: { include: { profile: true } } },
  },
  author: { include: { profile: true } },
} satisfies Prisma.WorkshopInclude;

function mapWorkshop(workshop: Prisma.WorkshopGetPayload<{ include: typeof WORKSHOP_INCLUDE }>) {
  return {
    id: workshop.id,
    title: workshop.title,
    description: workshop.description,
    coverUrl: workshop.coverUrl,
    focusArea: workshop.focusArea,
    startsAt: workshop.startsAt.toISOString(),
    durationHours: workshop.durationHours,
    capacity: workshop.capacity,
    priceCents: workshop.priceCents,
    currency: workshop.currency,
    status: workshop.status,
    rejectReason: workshop.rejectReason,
    authorId: workshop.authorId,
    authorName:
      `${workshop.author.profile?.firstName ?? ''} ${workshop.author.profile?.lastName ?? ''}`.trim() ||
      workshop.author.email,
    enrolled: workshop.enrollments.length,
    occupancyRate:
      workshop.capacity > 0
        ? Math.round((workshop.enrollments.length / workshop.capacity) * 100)
        : 0,
    createdAt: workshop.createdAt.toISOString(),
  };
}

export async function listWorkshops(authorId: string, query: Record<string, unknown>) {
  const { page, limit, skip } = parsePagination(query);
  const search = typeof query.search === 'string' ? query.search.trim() : '';
  const status = typeof query.status === 'string' ? query.status : '';
  const focusArea = typeof query.focusArea === 'string' ? query.focusArea : '';

  const where: Prisma.WorkshopWhereInput = {
    authorId,
    ...(['DRAFT', 'PENDING', 'APPROVED', 'REJECTED'].includes(status)
      ? { status: status as 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' }
      : {}),
    ...(FOCUS_AREAS.includes(focusArea as (typeof FOCUS_AREAS)[number])
      ? { focusArea: focusArea as (typeof FOCUS_AREAS)[number] }
      : {}),
    ...(search ? { title: { contains: search, mode: 'insensitive' } } : {}),
  };

  const [workshops, total, totalCount, totalEnrollments] = await Promise.all([
    prisma.workshop.findMany({
      where,
      skip,
      take: limit,
      orderBy: { startsAt: 'desc' },
      include: WORKSHOP_INCLUDE,
    }),
    prisma.workshop.count({ where }),
    prisma.workshop.count({ where: { authorId } }),
    prisma.workshopEnrollment.count({ where: { workshop: { authorId } } }),
  ]);

  const all = await prisma.workshop.findMany({
    where: { authorId },
    select: { capacity: true, startsAt: true, enrollments: { select: { id: true } } },
  });

  const totalCapacity = all.reduce((acc, item) => acc + item.capacity, 0);
  const now = new Date();

  return {
    success: true as const,
    workshops: workshops.map(mapWorkshop),
    stats: {
      total: totalCount,
      enrollments: totalEnrollments,
      occupancyRate: totalCapacity > 0 ? Math.round((totalEnrollments / totalCapacity) * 100) : 0,
      upcoming: all.filter((item) => item.startsAt >= now).length,
    },
    pagination: buildPagination(page, limit, total),
  };
}

export async function getWorkshop(authorId: string, id: string) {
  const workshop = await prisma.workshop.findFirst({
    where: { id, authorId },
    include: WORKSHOP_INCLUDE,
  });

  if (!workshop) {
    return null;
  }

  return { success: true as const, workshop: mapWorkshop(workshop) };
}

export async function createWorkshop(authorId: string, input: WorkshopInput) {
  const workshop = await prisma.workshop.create({
    data: {
      authorId,
      title: input.title,
      description: input.description,
      coverUrl: input.coverUrl ?? null,
      focusArea: input.focusArea,
      startsAt: input.startsAt,
      durationHours: input.durationHours,
      capacity: input.capacity,
      priceCents: input.priceCents,
      currency: input.currency ?? 'COP',
      // Mockup Psy 6/11: content is created as PENDING and only becomes
      // visible to users after administrator approval.
      status: 'PENDING',
    },
    include: WORKSHOP_INCLUDE,
  });

  return { success: true as const, workshop: mapWorkshop(workshop) };
}

export async function updateWorkshop(
  authorId: string,
  id: string,
  input: Partial<WorkshopInput>,
) {
  const existing = await prisma.workshop.findFirst({ where: { id, authorId } });

  if (!existing) {
    return null;
  }

  if (existing.status === 'APPROVED' && (input.title || input.description || input.startsAt)) {
    // Editing published content sends it back for moderation.
    await prisma.workshop.update({
      where: { id },
      data: { status: 'PENDING', rejectReason: null, reviewedAt: null, reviewedById: null },
    });
  }

  const workshop = await prisma.workshop.update({
    where: { id },
    data: {
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.coverUrl !== undefined ? { coverUrl: input.coverUrl } : {}),
      ...(input.focusArea !== undefined ? { focusArea: input.focusArea } : {}),
      ...(input.startsAt !== undefined ? { startsAt: input.startsAt } : {}),
      ...(input.durationHours !== undefined ? { durationHours: input.durationHours } : {}),
      ...(input.capacity !== undefined ? { capacity: input.capacity } : {}),
      ...(input.priceCents !== undefined ? { priceCents: input.priceCents } : {}),
      ...(input.currency !== undefined ? { currency: input.currency } : {}),
    },
    include: WORKSHOP_INCLUDE,
  });

  return { success: true as const, workshop: mapWorkshop(workshop) };
}

export async function listWorkshopEnrollments(authorId: string, id: string) {
  const workshop = await prisma.workshop.findFirst({
    where: { id, authorId },
    select: {
      id: true,
      title: true,
      enrollments: {
        orderBy: { createdAt: 'desc' },
        include: { user: { include: { profile: true } } },
      },
    },
  });

  if (!workshop) {
    return null;
  }

  return {
    success: true as const,
    workshop: { id: workshop.id, title: workshop.title },
    total: workshop.enrollments.length,
    attendees: workshop.enrollments.map((enrollment) => ({
      userId: enrollment.userId,
      name:
        `${enrollment.user.profile?.firstName ?? ''} ${enrollment.user.profile?.lastName ?? ''}`.trim() ||
        'Usuario',
      email: enrollment.user.email,
      enrolledAt: toIso(enrollment.createdAt),
    })),
  };
}

export async function deleteWorkshop(authorId: string, id: string) {
  const existing = await prisma.workshop.findFirst({ where: { id, authorId }, select: { id: true } });

  if (!existing) {
    return false;
  }

  await prisma.workshop.delete({ where: { id } });
  return true;
}
