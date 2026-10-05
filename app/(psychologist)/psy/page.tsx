import { requireRole } from '@/lib/auth/guard';
import { getDashboard } from '@/services/psy/dashboard.service';
import PsyDashboardClient from '@/features/psy/PsyDashboardClient';

export default async function PsyHome() {
  const session = await requireRole('PSYCHOLOGIST');
  const data = await getDashboard(session.id);

  return <PsyDashboardClient initialData={data} session={session} />;
}
