'use server';

import { getSessionUser } from '@/lib/auth/guard';
import { getPatientDetail } from '@/services/psy/dashboard.service';
import { createPatientReport } from '@/services/psy/appointments.service';

export async function getPatientDetailAction(patientUserId: string) {
  const session = await getSessionUser();
  if (!session) throw new Error('No autenticado');
  return getPatientDetail(session.id, patientUserId);
}

export async function createPatientReportAction(input: {
  patientUserId: string;
  appointmentId?: string | null;
  summary: string;
  moodScore?: number | null;
}) {
  const session = await getSessionUser();
  if (!session) throw new Error('No autenticado');
  return createPatientReport(session.id, input);
}
