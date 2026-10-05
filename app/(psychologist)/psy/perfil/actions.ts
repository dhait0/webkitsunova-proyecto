'use server';

import { getSessionUser } from '@/lib/auth/guard';
import { prisma } from '@/lib/db/prisma';
import { getProfessionalProfile, updateProfessionalProfile, replaceAvailability } from '@/services/psy/profile.service';
import { minutesToHHmm } from '@/services/psy/shared';

export async function getProfileAction() {
  const session = await getSessionUser();
  if (!session) throw new Error('No autenticado');
  return getProfessionalProfile(session.id);
}

export async function updateProfileAction(input: {
  firstName?: string;
  lastName?: string;
  phone?: string | null;
  country?: string | null;
  birthDate?: Date | null;
  bio?: string | null;
  specialties?: string[];
  sessionPrice?: number | null;
  isAcceptingNew?: boolean;
}) {
  const session = await getSessionUser();
  if (!session) throw new Error('No autenticado');
  return updateProfessionalProfile(session.id, input);
}

export async function updateAvailabilityAction(slots: Array<{
  weekday: number;
  start: string;
  end: string;
  enabled: boolean;
}>) {
  const session = await getSessionUser();
  if (!session) throw new Error('No autenticado');

  const profile = await prisma.profile.findUnique({
    where: { userId: session.id },
    select: { id: true },
  });

  if (!profile) {
    throw new Error('Perfil no encontrado');
  }

  const parsed = slots
    .filter((slot) => slot.enabled)
    .map((slot) => ({
      weekday: slot.weekday,
      startMinutes: parseInt(slot.start.replace(':', ''), 10),
      endMinutes: parseInt(slot.end.replace(':', ''), 10),
      enabled: slot.enabled,
    }));

  return replaceAvailability(profile.id, parsed);
}
