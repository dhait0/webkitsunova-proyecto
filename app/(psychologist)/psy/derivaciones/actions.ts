'use server';

import { authorize } from '@/lib/auth/guard';
import { listReferrals, createReferral, respondToReferral, listColleagues } from '@/services/psy/referrals.service';
import { listPatients } from '@/services/psy/dashboard.service';

export async function getReferralsAction(query: Record<string, unknown>) {
  const session = await authorize(['PSYCHOLOGIST']);
  if (!session) throw new Error('No autorizado');
  return listReferrals(session.id, query);
}

export async function createReferralAction(input: {
  toPsychologistId: string;
  patientUserId: string;
  note?: string | null;
}) {
  const session = await authorize(['PSYCHOLOGIST']);
  if (!session) throw new Error('No autorizado');
  return createReferral(session.id, input);
}

export async function respondToReferralAction(referralId: string, status: 'ACCEPTED' | 'DECLINED') {
  const session = await authorize(['PSYCHOLOGIST']);
  if (!session) throw new Error('No autorizado');
  return respondToReferral(session.id, referralId, status);
}

export async function getColleaguesAction() {
  const session = await authorize(['PSYCHOLOGIST']);
  if (!session) throw new Error('No autorizado');
  return listColleagues(session.id);
}

export async function getPatientsForReferralAction(query: Record<string, unknown>) {
  const session = await authorize(['PSYCHOLOGIST']);
  if (!session) throw new Error('No autorizado');
  return listPatients(session.id, query);
}
