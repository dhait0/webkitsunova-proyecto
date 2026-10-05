import { requireRole } from '@/lib/auth/guard';
import { getPreferences } from '@/services/psy/notifications.service';
import PsyNotificationPreferencesPage from '@/features/psy/PsyNotificationPreferencesPage';

export default async function PsyNotificationPreferences() {
  const session = await requireRole('PSYCHOLOGIST');
  const initialData = await getPreferences(session.id);

  return <PsyNotificationPreferencesPage initialPreferences={initialData.preferences} />;
}
