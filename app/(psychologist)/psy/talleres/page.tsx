import { requireRole } from '@/lib/auth/guard';
import { listWorkshops } from '@/services/psy/workshops.service';
import PsyWorkshopsPage from '@/features/psy/PsyWorkshopsPage';

export default async function PsyWorkshops({ searchParams }: { searchParams: Promise<{ search?: string; focusArea?: string; status?: string }> }) {
  const session = await requireRole('PSYCHOLOGIST');
  const params = await searchParams;
  const initialData = await listWorkshops(session.id, {
    search: params.search ?? '',
    focusArea: params.focusArea ?? '',
    status: params.status ?? '',
    page: 1,
    limit: 50,
  });

  return <PsyWorkshopsPage initialData={initialData} />;
}
