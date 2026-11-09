'use server';

import { authorize } from '@/lib/auth/guard';
import { getPreferences, updatePreferences } from '@/services/psy/notifications.service';

export async function getPreferencesAction() {
  const session = await authorize(['PSYCHOLOGIST']);
  if (!session) throw new Error('No autorizado');
  return getPreferences(session.id);
}

export async function updatePreferencesAction(input: {
  newAppointments?: boolean;
  newMessages?: boolean;
  patientReports?: boolean;
  moodAlerts?: boolean;
  platformNews?: boolean;
}) {
  const session = await authorize(['PSYCHOLOGIST']);
  if (!session) throw new Error('No autorizado');
  return updatePreferences(session.id, input);
}
