import { requireRole } from '@/lib/auth/guard';
import { getProfessionalProfile } from '@/services/psy/profile.service';
import PsySettingsPage from '@/features/psy/PsySettingsPage';

export default async function PsySettings() {
  const session = await requireRole('PSYCHOLOGIST');
  const initialData = await getProfessionalProfile(session.id);

  return <PsySettingsPage initialData={initialData} />;
}
