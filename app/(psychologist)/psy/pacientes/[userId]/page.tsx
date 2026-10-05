import { requireRole } from '@/lib/auth/guard';
import { getPatientDetail } from '@/services/psy/dashboard.service';
import PsyPatientDetailPage from '@/features/psy/PsyPatientDetailPage';

export default async function PsyPatientDetail({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const session = await requireRole('PSYCHOLOGIST');
  const { userId } = await params;
  const initialData = await getPatientDetail(session.id, userId);

  if (!initialData) {
    return null;
  }

  return <PsyPatientDetailPage initialData={initialData} />;
}
