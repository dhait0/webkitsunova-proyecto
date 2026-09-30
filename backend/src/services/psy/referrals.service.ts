import { prisma } from '../../lib/prisma.js';
import { fullName, parsePagination, buildPagination } from './shared.js';
import { createNotification } from './notifications.service.js';
import { recalculatePatientsCount } from './shared.js';

/**
 * Decision D3: a psychologist may refer a patient to a colleague, but the
 * patient must accept before any link is opened. The receiving psychologist
 * gains no access to the patient's data until the acceptance happens.
 */

export async function createReferral(
  fromPsychologistId: string,
  input: { toPsychologistId: string; patientUserId: string; note?: string | null },
) {
  if (fromPsychologistId === input.toPsychologistId) {
    throw new Error('No puedes derivar a ti mismo');
  }

  const [link, target, patient] = await Promise.all([
    prisma.psyPatient.findFirst({
      where: {
        psychologistId: fromPsychologistId,
        patientUserId: input.patientUserId,
        status: { in: ['ACTIVE', 'PAUSED'] },
      },
      select: { id: true },
    }),
    prisma.user.findFirst({
      where: {
        id: input.toPsychologistId,
        role: 'PSYCHOLOGIST',
        status: 'ACTIVE',
        profile: { psychologistProfile: { isApproved: true } },
      },
      select: { id: true },
    }),
    prisma.user.findFirst({
      where: { id: input.patientUserId, role: 'USER', status: 'ACTIVE' },
      select: { id: true },
    }),
  ]);

  if (!link) {
    throw new Error('Solo puedes derivar a un paciente que tengas vinculado');
  }

  if (!target) {
    throw new Error('El psicólogo destino no está disponible');
  }

  if (!patient) {
    throw new Error('El paciente no está disponible');
  }

  const pending = await prisma.psyReferral.findFirst({
    where: {
      fromPsychologistId,
      toPsychologistId: input.toPsychologistId,
      patientUserId: input.patientUserId,
      status: 'PENDING',
    },
    select: { id: true },
  });

  if (pending) {
    return { duplicate: true as const, id: pending.id };
  }

  const referral = await prisma.psyReferral.create({
    data: {
      fromPsychologistId,
      toPsychologistId: input.toPsychologistId,
      patientUserId: input.patientUserId,
      note: input.note ?? null,
    },
  });

  await createNotification({
    userId: input.patientUserId,
    kind: 'referral',
    title: 'Te refute un psicólogo',
    body: 'Un psicólogo ha solicitado derivarte a un colega. Revisa la solicitud en tu panel.',
    link: '/dashboard',
  });

  await createNotification({
    userId: input.toPsychologistId,
    kind: 'referral',
    title: 'Nueva derivación recibida',
    body: 'Un colega te ha referido a un paciente.',
    link: '/psy/derivaciones',
  });

  return { duplicate: false as const, referral };
}

export async function listReferrals(psychologistId: string, query: Record<string, unknown>) {
  const { page, limit, skip } = parsePagination(query);
  const box = typeof query.box === 'string' ? query.box : 'received';

  const where =
    box === 'sent'
      ? { fromPsychologistId: psychologistId }
      : box === 'all'
        ? {
            OR: [{ fromPsychologistId: psychologistId }, { toPsychologistId: psychologistId }],
          }
        : { toPsychologistId: psychologistId };

  const [referrals, total] = await Promise.all([
    prisma.psyReferral.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        fromPsychologist: { include: { profile: true } },
        toPsychologist: { include: { profile: true } },
      },
    }),
    prisma.psyReferral.count({ where }),
  ]);

  return {
    success: true as const,
    referrals: referrals.map((referral) => ({
      id: referral.id,
      status: referral.status,
      note: referral.note,
      patientUserId: referral.patientUserId,
      fromPsychologistId: referral.fromPsychologistId,
      fromPsychologistName:
        fullName(referral.fromPsychologist.profile) || referral.fromPsychologist.email,
      toPsychologistId: referral.toPsychologistId,
      toPsychologistName:
        fullName(referral.toPsychologist.profile) || referral.toPsychologist.email,
      createdAt: referral.createdAt.toISOString(),
      respondedAt: referral.respondedAt?.toISOString() ?? null,
    })),
    pagination: buildPagination(page, limit, total),
  };
}

export async function respondToReferral(
  toPsychologistId: string,
  referralId: string,
  status: 'ACCEPTED' | 'DECLINED',
) {
  const referral = await prisma.psyReferral.findFirst({
    where: { id: referralId, toPsychologistId },
  });

  if (!referral) {
    return null;
  }

  if (referral.status !== 'PENDING') {
    throw new Error('La derivación ya fue respondida');
  }

  const updated = await prisma.psyReferral.update({
    where: { id: referralId },
    data: { status, respondedAt: new Date() },
  });

  await createNotification({
    userId: referral.fromPsychologistId,
    kind: 'referral',
    title: status === 'ACCEPTED' ? 'Derivación aceptada' : 'Derivación rechazada',
    body:
      status === 'ACCEPTED'
        ? 'El colega aceptó recibir a tu paciente.'
        : 'El colega no pudo recibir a tu paciente.',
    link: '/psy/derivaciones',
  });

  return updated;
}

/**
 * Patient-side acceptance. Runs under the user role: closing the current
 * psychologist link and opening the new one is the same rule used when an
 * appointment is confirmed (decision D1).
 */
export async function acceptReferralAsPatient(patientUserId: string, referralId: string) {
  const referral = await prisma.psyReferral.findFirst({
    where: { id: referralId, patientUserId, status: 'PENDING' },
  });

  if (!referral) {
    return null;
  }

  if (referral.fromPsychologistId === referral.toPsychologistId) {
    throw new Error('La derivación no es válida');
  }

  const target = await prisma.user.findFirst({
    where: {
      id: referral.toPsychologistId,
      role: 'PSYCHOLOGIST',
      status: 'ACTIVE',
      profile: { psychologistProfile: { isApproved: true } },
    },
    select: { id: true },
  });

  if (!target) {
    throw new Error('El psicólogo destino ya no está disponible');
  }

  await prisma.psyPatient.updateMany({
    where: { patientUserId, status: { in: ['ACTIVE', 'PAUSED'] }, NOT: { psychologistId: referral.toPsychologistId } },
    data: { status: 'ENDED', endedAt: new Date() },
  });

  const existing = await prisma.psyPatient.findUnique({
    where: {
      psychologistId_patientUserId: {
        psychologistId: referral.toPsychologistId,
        patientUserId,
      },
    },
  });

  if (existing) {
    await prisma.psyPatient.update({
      where: { id: existing.id },
      data: { status: 'ACTIVE', endedAt: null },
    });
  } else {
    await prisma.psyPatient.create({
      data: { psychologistId: referral.toPsychologistId, patientUserId, status: 'ACTIVE' },
    });
  }

  await prisma.psyReferral.update({
    where: { id: referralId },
    data: { status: 'ACCEPTED', respondedAt: new Date() },
  });

  await recalculatePatientsCount(referral.toPsychologistId);

  await createNotification({
    userId: referral.toPsychologistId,
    kind: 'referral',
    title: 'Derivación aceptada por el paciente',
    body: 'El paciente aceptó la derivación y ya aparece en tu lista.',
    link: '/psy/pacientes',
  });

  return { success: true as const };
}

/** Directories psychologists can pick from when referring a patient. */
export async function listColleagues(psychologistId: string) {
  const colleagues = await prisma.user.findMany({
    where: {
      id: { not: psychologistId },
      role: 'PSYCHOLOGIST',
      status: 'ACTIVE',
      profile: { psychologistProfile: { isApproved: true } },
    },
    include: { profile: { include: { psychologistProfile: true } } },
    orderBy: { profile: { psychologistProfile: { rating: 'desc' } } },
    take: 50,
  });

  return {
    success: true as const,
    colleagues: colleagues.map((colleague) => ({
      id: colleague.id,
      name: fullName(colleague.profile) || 'Psicólogo',
      specialties: colleague.profile?.psychologistProfile?.specialties ?? [],
      rating: colleague.profile?.psychologistProfile?.rating ?? 0,
    })),
  };
}
