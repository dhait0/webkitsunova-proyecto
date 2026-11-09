import { requireRole } from '@/lib/auth/guard';
import { getUserSettings } from '@/services/user/settings.service';
import AdminSettingsPage from '@/features/admin/AdminSettingsPage';

export default async function AdminSettingsRoute() {
  const session = await requireRole('ADMIN');
  const settings = await getUserSettings(session.id, session.email);

  return <AdminSettingsPage initialValues={settings} />;
}
