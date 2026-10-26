'use server';

import { getSessionUser } from '@/lib/auth/guard';
import { prisma } from '@/lib/db/prisma';

export async function getAvailablePsychologistsAction() {
  const session = await getSessionUser();
  if (!session) throw new Error('No autenticado');
  if (session.role !== 'USER') throw new Error('No autorizado');

  const psychologists = await prisma.user.findMany({
    where: {
      role: 'PSYCHOLOGIST',
      status: 'ACTIVE',
      profile: {
        psychologistProfile: {
          isApproved: true,
          isVerified: true,
          isAcceptingNew: true,
        },
      },
    },
    include: {
      profile: {
        include: {
          psychologistProfile: true,
          availabilitySlots: { orderBy: [{ weekday: 'asc' }, { startMinutes: 'asc' }] },
        },
      },
    },
  });

  return psychologists.map((p) => ({
    id: p.id,
    name: p.profile?.firstName && p.profile?.lastName
      ? `${p.profile.firstName} ${p.profile.lastName}`
      : p.email,
    firstName: p.profile?.firstName ?? null,
    lastName: p.profile?.lastName ?? null,
    email: p.email,
    bio: p.profile?.bio ?? null,
    specialties: p.profile?.psychologistProfile?.specialties ?? [],
    sessionPrice: p.profile?.psychologistProfile?.sessionPrice ?? null,
    currency: p.profile?.psychologistProfile?.currency ?? 'COP',
    availability: (p.profile?.availabilitySlots ?? []).map((slot) => ({
      id: slot.id,
      weekday: slot.weekday,
      startMinutes: slot.startMinutes,
      endMinutes: slot.endMinutes,
    })),
  }));
}
