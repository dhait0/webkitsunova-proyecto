import { requireUser } from '@/lib/auth/guard';
import { listEligiblePsychologists } from '@/services/psy/psychologists.service';
import PsychologistsPage from '@/features/user/PsychologistsPage';

export default async function PsychologistsRoute({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; limit?: string }>;
}) {
  const session = await requireUser();
  const params = await searchParams;

  let data;
  let error: string | null = null;

  try {
    data = await listEligiblePsychologists({
      page: params.page ?? '1',
      limit: params.limit ?? '10',
    });
  } catch (caught) {
    error = caught instanceof Error ? caught.message : 'No se pudieron cargar los psicólogos';
    data = {
      psychologists: [],
      pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
    };
  }

  return <PsychologistsPage data={data} error={error} />;
}
