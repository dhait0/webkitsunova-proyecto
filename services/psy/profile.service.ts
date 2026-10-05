import { prisma } from '@/lib/db/prisma';
import { fullName, minutesToHHmm, toIso } from './shared';

export type SpecialtyCatalogEntry = {
  value: string;
  label: string;
};

/** Mockup Psy 24 — predefined specialties plus the free-text "Agregar" option. */
export const SPECIALTY_CATALOG: SpecialtyCatalogEntry[] = [
  { value: 'Ansiedad', label: 'Ansiedad' },
  { value: 'Depresión', label: 'Depresión' },
  { value: 'Estrés', label: 'Estrés' },
  { value: 'Trauma y PTSD', label: 'Trauma y PTSD' },
  { value: 'Terapia de pareja', label: 'Terapia de pareja' },
  { value: 'Terapia familiar', label: 'Terapia familiar' },
  { value: 'Trastornos alimentarios', label: 'Trastornos alimentarios' },
  { value: 'Adicciones', label: 'Adicciones' },
  { value: 'Autoestima', label: 'Autoestima' },
  { value: 'Productividad', label: 'Productividad' },
  { value: 'Mindfulness', label: 'Mindfulness' },
  { value: 'Sueño', label: 'Sueño' },
];

const WEEKDAY_LABELS = ['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

export async function getProfessionalProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      email: true,
      status: true,
      profile: {
        include: {
          psychologistProfile: true,
          availabilitySlots: { orderBy: [{ weekday: 'asc' }, { startMinutes: 'asc' }] },
        },
      },
    },
  });

  const profile = user?.profile ?? null;
  const psychologistProfile = profile?.psychologistProfile ?? null;

  return {
    success: true as const,
    profile: {
      name: fullName(profile) || 'Psicólogo',
      email: user?.email ?? '',
      accountStatus: user?.status ?? 'PENDING',
      firstName: profile?.firstName ?? null,
      lastName: profile?.lastName ?? null,
      phone: profile?.phone ?? null,
      country: profile?.country ?? null,
      birthDate: toIso(profile?.birthDate),
      bio: profile?.bio ?? null,
      avatarUrl: profile?.avatarUrl ?? null,
      specialties: psychologistProfile?.specialties ?? [],
      sessionPrice: psychologistProfile?.sessionPrice ?? null,
      currency: psychologistProfile?.currency ?? 'COP',
      isApproved: psychologistProfile?.isApproved ?? false,
      isVerified: psychologistProfile?.isVerified ?? false,
      isAcceptingNew: psychologistProfile?.isAcceptingNew ?? true,
      rating: psychologistProfile?.rating ?? 0,
      reviewsCount: psychologistProfile?.reviewsCount ?? 0,
      patientsCount: psychologistProfile?.patientsCount ?? 0,
    },
    availability: (profile?.availabilitySlots ?? []).map((slot) => ({
      id: slot.id,
      weekday: slot.weekday,
      weekdayLabel: WEEKDAY_LABELS[slot.weekday] ?? '',
      start: minutesToHHmm(slot.startMinutes),
      end: minutesToHHmm(slot.endMinutes),
    })),
    specialtyCatalog: SPECIALTY_CATALOG,
  };
}

export async function updateProfessionalProfile(
  userId: string,
  input: {
    firstName?: string;
    lastName?: string;
    phone?: string | null;
    country?: string | null;
    birthDate?: Date | null;
    bio?: string | null;
    avatarUrl?: string | null;
    specialties?: string[];
    sessionPrice?: number | null;
    currency?: string;
    isAcceptingNew?: boolean;
  },
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { profile: { select: { id: true, psychologistProfile: { select: { id: true } } } } },
  });

  const profile = user?.profile;

  if (!profile) {
    return null;
  }

  await prisma.profile.update({
    where: { id: profile.id },
    data: {
      ...(input.firstName !== undefined ? { firstName: input.firstName } : {}),
      ...(input.lastName !== undefined ? { lastName: input.lastName } : {}),
      ...(input.phone !== undefined ? { phone: input.phone } : {}),
      ...(input.country !== undefined ? { country: input.country } : {}),
      ...(input.birthDate !== undefined ? { birthDate: input.birthDate } : {}),
      ...(input.bio !== undefined ? { bio: input.bio } : {}),
      ...(input.avatarUrl !== undefined ? { avatarUrl: input.avatarUrl } : {}),
    },
  });

  if (profile.psychologistProfile) {
    await prisma.psychologistProfile.update({
      where: { id: profile.psychologistProfile.id },
      data: {
        ...(input.specialties !== undefined ? { specialties: input.specialties } : {}),
        ...(input.sessionPrice !== undefined ? { sessionPrice: input.sessionPrice } : {}),
        ...(input.currency !== undefined ? { currency: input.currency } : {}),
        ...(input.isAcceptingNew !== undefined ? { isAcceptingNew: input.isAcceptingNew } : {}),
      },
    });
  }

  return getProfessionalProfile(userId);
}

export type AvailabilityInput = Array<{
  weekday: number;
  startMinutes: number;
  endMinutes: number;
  enabled: boolean;
}>;

/** Mockup Psy 26 — replaces the whole weekly schedule in one request. */
export async function replaceAvailability(profileId: string, slots: AvailabilityInput) {
  const valid = slots.filter((slot) => slot.enabled && slot.endMinutes > slot.startMinutes);

  for (const slot of valid) {
    if (slot.weekday < 1 || slot.weekday > 7) {
      throw new Error('Día de la semana inválido');
    }

    if (slot.startMinutes < 0 || slot.endMinutes > 24 * 60) {
      throw new Error('Horario fuera del rango permitido');
    }
  }

  await prisma.$transaction([
    prisma.availabilitySlot.deleteMany({ where: { profileId } }),
    prisma.availabilitySlot.createMany({
      data: valid.map((slot) => ({
        profileId,
        weekday: slot.weekday,
        startMinutes: slot.startMinutes,
        endMinutes: slot.endMinutes,
      })),
    }),
  ]);

  return valid;
}

export { WEEKDAY_LABELS };
