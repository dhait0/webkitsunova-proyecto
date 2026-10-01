import { prisma } from '../../lib/prisma.js';
import { buildPagination, parsePagination, toIso } from './shared.js';

export type NotificationInput = {
  userId: string;
  kind: string;
  title: string;
  body: string;
  link?: string | null;
  dedupeKey?: string | null;
};

export async function createNotification(input: NotificationInput) {
  if (input.dedupeKey) {
    const existing = await prisma.notification.findFirst({
      where: { userId: input.userId, kind: input.kind, link: input.dedupeKey },
      select: { id: true },
    });

    if (existing) {
      return existing;
    }
  }

  return prisma.notification.create({
    data: {
      userId: input.userId,
      kind: input.kind,
      title: input.title,
      body: input.body,
      link: input.link ?? null,
    },
  });
}

export async function listNotifications(userId: string, query: Record<string, unknown>) {
  const { page, limit, skip } = parsePagination({ ...query, limit: query.limit ?? 20 });
  const filter = typeof query.filter === 'string' ? query.filter : 'all';

  const where = {
    userId,
    ...(filter === 'unread' ? { readAt: null } : {}),
    ...(filter === 'general' ? { kind: 'general' } : {}),
  };

  const [notifications, total, unread] = await Promise.all([
    prisma.notification.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({ where: { userId, readAt: null } }),
  ]);

  return {
    success: true as const,
    notifications: notifications.map((notification) => ({
      id: notification.id,
      kind: notification.kind,
      title: notification.title,
      body: notification.body,
      link: notification.link,
      read: notification.readAt !== null,
      createdAt: notification.createdAt.toISOString(),
    })),
    unread,
    pagination: buildPagination(page, limit, total),
  };
}

export async function markAllRead(userId: string) {
  const { count } = await prisma.notification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() },
  });

  return { success: true as const, updated: count, message: 'Notificaciones marcadas como leídas' };
}

export async function markRead(userId: string, id: string) {
  const result = await prisma.notification.updateMany({
    where: { id, userId, readAt: null },
    data: { readAt: new Date() },
  });

  return result.count > 0;
}

export async function getPreferences(userId: string) {
  const preferences = await prisma.notificationPreference.upsert({
    where: { userId },
    create: { userId },
    update: {},
  });

  return {
    success: true as const,
    preferences: {
      newAppointments: preferences.newAppointments,
      newMessages: preferences.newMessages,
      patientReports: preferences.patientReports,
      moodAlerts: preferences.moodAlerts,
      platformNews: preferences.platformNews,
    },
  };
}

export async function updatePreferences(
  userId: string,
  input: {
    newAppointments?: boolean;
    newMessages?: boolean;
    patientReports?: boolean;
    moodAlerts?: boolean;
    platformNews?: boolean;
  },
) {
  await prisma.notificationPreference.upsert({
    where: { userId },
    create: { userId, ...input },
    update: input,
  });

  return getPreferences(userId);
}

export { toIso };
