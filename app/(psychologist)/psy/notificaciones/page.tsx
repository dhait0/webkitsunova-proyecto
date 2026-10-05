import { requireRole } from '@/lib/auth/guard';
import { listNotifications } from '@/services/psy/notifications.service';
import PsyNotificationsPage from '@/features/psy/PsyNotificationsPage';

export default async function PsyNotifications({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const session = await requireRole('PSYCHOLOGIST');
  const params = await searchParams;
  const filter = typeof params.filter === 'string' ? params.filter : 'all';
  const initialData = await listNotifications(session.id, { filter, limit: 50 });

  return <PsyNotificationsPage initialData={{ notifications: initialData.notifications, unread: initialData.unread }} />;
}
