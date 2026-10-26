import { prisma } from '@/lib/db/prisma';
import { buildPagination, fullName, minutesToHHmm, parsePagination } from './shared';

export type PublicPsychologist = {
  id: string;
  name: string;
  username: string | null;
  avatarUrl: string | null;
  bio: string | null;
  specialties: string[];
  sessionPrice: number | null;
  currency: string;
  isVerified: boolean;
  isAcceptingNew: boolean;
  rating: number;
  reviewsCount: number;
  patientsCount: number;
};

export type ListEligiblePsychologistsResult = {
  psychologists: PublicPsychologist[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

/**
 * Consulta pública de psicólogos elegibles.
 *
 * Elegibilidad (del esquema real, sin inventar estados):
 * - User.role = 'PSYCHOLOGIST'
 * - User.status = 'ACTIVE' (excluye PENDING y SUSPENDED)
 * - PsychologistProfile.isApproved = true
 *
 * Solo campos públicos. Nunca expone email, phone, passwordHash,
 * twoFactorEnabled, twoFactorSecret ni datos de autenticación.
 */
export async function listEligiblePsychologists(
  query: Record<string, unknown>,
): Promise<ListEligiblePsychologistsResult> {
  const { page, limit, skip } = parsePagination(query);

  const where = {
    role: 'PSYCHOLOGIST' as const,
    status: 'ACTIVE' as const,
    profile: {
      psychologistProfile: {
        isApproved: true,
      },
    },
  };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        profile: {
          select: {
            firstName: true,
            lastName: true,
            username: true,
            avatarUrl: true,
            bio: true,
            psychologistProfile: {
              select: {
                specialties: true,
                sessionPrice: true,
                currency: true,
                isVerified: true,
                isAcceptingNew: true,
                rating: true,
                reviewsCount: true,
                patientsCount: true,
              },
            },
          },
        },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    psychologists: users.map((user) => {
      const profile = user.profile;
      const psyProfile = profile?.psychologistProfile;
      return {
        id: user.id,
        name: fullName(profile) || 'Psicólogo',
        username: profile?.username ?? null,
        avatarUrl: profile?.avatarUrl ?? null,
        bio: profile?.bio ?? null,
        specialties: psyProfile?.specialties ?? [],
        sessionPrice: psyProfile?.sessionPrice ?? null,
        currency: psyProfile?.currency ?? 'COP',
        isVerified: psyProfile?.isVerified ?? false,
        isAcceptingNew: psyProfile?.isAcceptingNew ?? true,
        rating: psyProfile?.rating ?? 0,
        reviewsCount: psyProfile?.reviewsCount ?? 0,
        patientsCount: psyProfile?.patientsCount ?? 0,
      };
    }),
    pagination: buildPagination(page, limit, total),
  };
}

export type PsychologistAvailability = {
  weekday: number;
  weekdayLabel: string;
  start: string;
  end: string;
};

export type PsychologistProfilePublic = PublicPsychologist & {
  availability: PsychologistAvailability[];
};

const WEEKDAY_LABELS: Record<number, string> = {
  1: 'Lunes',
  2: 'Martes',
  3: 'Miércoles',
  4: 'Jueves',
  5: 'Viernes',
  6: 'Sábado',
  7: 'Domingo',
};

/**
 * Perfil público y disponibilidad de un psicólogo por id de usuario.
 *
 * Solo devuelve psicólogos elegibles (rol PSYCHOLOGIST, status ACTIVE,
 * psychologistProfile.isApproved = true). Nunca expone campos privados:
 * email, phone, passwordHash, twoFactorEnabled, twoFactorSecret.
 */
export async function getPsychologistProfile(
  userId: string,
): Promise<PsychologistProfilePublic | null> {
  const user = await prisma.user.findFirst({
    where: {
      id: userId,
      role: 'PSYCHOLOGIST',
      status: 'ACTIVE',
      profile: {
        psychologistProfile: {
          isApproved: true,
        },
      },
    },
    select: {
      id: true,
      profile: {
        select: {
          firstName: true,
          lastName: true,
          username: true,
          avatarUrl: true,
          bio: true,
          psychologistProfile: {
            select: {
              specialties: true,
              sessionPrice: true,
              currency: true,
              isVerified: true,
              isAcceptingNew: true,
              rating: true,
              reviewsCount: true,
              patientsCount: true,
            },
          },
          availabilitySlots: {
            select: {
              weekday: true,
              startMinutes: true,
              endMinutes: true,
            },
            orderBy: [{ weekday: 'asc' }, { startMinutes: 'asc' }],
          },
        },
      },
    },
  });

  if (!user) {
    return null;
  }

  const profile = user.profile;
  const psyProfile = profile?.psychologistProfile;

  return {
    id: user.id,
    name: fullName(profile) || 'Psicólogo',
    username: profile?.username ?? null,
    avatarUrl: profile?.avatarUrl ?? null,
    bio: profile?.bio ?? null,
    specialties: psyProfile?.specialties ?? [],
    sessionPrice: psyProfile?.sessionPrice ?? null,
    currency: psyProfile?.currency ?? 'COP',
    isVerified: psyProfile?.isVerified ?? false,
    isAcceptingNew: psyProfile?.isAcceptingNew ?? true,
    rating: psyProfile?.rating ?? 0,
    reviewsCount: psyProfile?.reviewsCount ?? 0,
    patientsCount: psyProfile?.patientsCount ?? 0,
    availability: (profile?.availabilitySlots ?? [])
      .slice()
      .sort((a, b) => a.weekday - b.weekday || a.startMinutes - b.startMinutes)
      .map((slot) => ({
        weekday: slot.weekday,
        weekdayLabel: WEEKDAY_LABELS[slot.weekday] ?? String(slot.weekday),
        start: minutesToHHmm(slot.startMinutes),
        end: minutesToHHmm(slot.endMinutes),
      })),
  };
}
