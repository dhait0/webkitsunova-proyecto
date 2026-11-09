import { requireUser } from '@/lib/auth/guard';
import { getUserSettings } from '@/services/user/settings.service';
import SettingsPage from '@/features/user/SettingsPage';

export default async function ConfiguracionRoute() {
  const session = await requireUser();
  const settings = await getUserSettings(session.id, session.email);

  return <SettingsPage initialValues={settings} />;
}
