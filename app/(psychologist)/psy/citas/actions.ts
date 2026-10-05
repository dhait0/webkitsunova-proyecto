'use server';

import { getSessionUser } from '@/lib/auth/guard';
import { listAppointments, updateAppointmentStatus } from '@/services/psy/appointments.service';

export async function getAppointmentsAction(query: Record<string, unknown>) {
  const session = await getSessionUser();
  if (!session) throw new Error('No autenticado');
  return listAppointments(session.id, query);
}

export async function updateAppointmentStatusAction(
  id: string,
  status: 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW',
  cancelReason?: string | null
) {
  const session = await getSessionUser();
  if (!session) throw new Error('No autenticado');
  return updateAppointmentStatus(session.id, id, status, cancelReason);
}
