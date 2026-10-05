import { requireRole } from '@/lib/auth/guard';
import { listResources } from '@/services/psy/resources.service';
import PsyResourcesPage from '@/features/psy/PsyResourcesPage';

export default async function PsyResources({ searchParams }: { searchParams: Promise<{ search?: string; type?: string; status?: string }> }) {
  const session = await requireRole('PSYCHOLOGIST');
  const params = await searchParams;
  const initialData = await listResources(session.id, {
    search: params.search ?? '',
    type: params.type ?? '',
    status: params.status ?? '',
    page: 1,
    limit: 50,
  });

  return <PsyResourcesPage initialData={initialData} />;
}
