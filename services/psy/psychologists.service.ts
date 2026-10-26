import { prisma } from '@/lib/db/prisma';
import { buildPagination, fullName, parsePagination } from './shared';

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
