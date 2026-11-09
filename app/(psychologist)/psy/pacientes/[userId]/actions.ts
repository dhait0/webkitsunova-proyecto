'use server';

import { authorize } from '@/lib/auth/guard';
import { getPatientDetail } from '@/services/psy/dashboard.service';
import { createPatientReport } from '@/services/psy/appointments.service';

export async function getPatientDetailAction(patientUserId: string) {
  const session = await authorize(['PSYCHOLOGIST']);
  if (!session) throw new Error('No autorizado');
  return getPatientDetail(session.id, patientUserId);
}

export async function createPatientReportAction(input: {
  patientUserId: string;
  appointmentId?: string | null;
  summary: string;
  moodScore?: number | null;
}) {
  const session = await authorize(['PSYCHOLOGIST']);
  if (!session) throw new Error('No autorizado');
  return createPatientReport(session.id, input);
}
