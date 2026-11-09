'use server';

import { authorize } from '@/lib/auth/guard';
import { listNotifications, markAllRead } from '@/services/psy/notifications.service';

export async function getNotificationsAction(query: Record<string, unknown>) {
  const session = await authorize(['PSYCHOLOGIST']);
  if (!session) throw new Error('No autorizado');
  return listNotifications(session.id, query);
}

export async function markAllNotificationsReadAction() {
  const session = await authorize(['PSYCHOLOGIST']);
  if (!session) throw new Error('No autorizado');
  return markAllRead(session.id);
}
