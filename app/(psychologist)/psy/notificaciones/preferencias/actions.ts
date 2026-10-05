'use server';

import { getSessionUser } from '@/lib/auth/guard';
import { getPreferences, updatePreferences } from '@/services/psy/notifications.service';

export async function getPreferencesAction() {
  const session = await getSessionUser();
  if (!session) throw new Error('No autenticado');
  return getPreferences(session.id);
}

export async function updatePreferencesAction(input: {
  newAppointments?: boolean;
  newMessages?: boolean;
  patientReports?: boolean;
  moodAlerts?: boolean;
  platformNews?: boolean;
}) {
  const session = await getSessionUser();
  if (!session) throw new Error('No autenticado');
  return updatePreferences(session.id, input);
}
