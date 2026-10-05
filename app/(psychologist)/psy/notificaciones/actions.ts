'use server';

import { getSessionUser } from '@/lib/auth/guard';
import { listNotifications, markAllRead } from '@/services/psy/notifications.service';

export async function getNotificationsAction(query: Record<string, unknown>) {
  const session = await getSessionUser();
  if (!session) throw new Error('No autenticado');
  return listNotifications(session.id, query);
}

export async function markAllNotificationsReadAction() {
  const session = await getSessionUser();
  if (!session) throw new Error('No autenticado');
  return markAllRead(session.id);
}
