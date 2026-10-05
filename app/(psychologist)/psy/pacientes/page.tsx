import { requireRole } from '@/lib/auth/guard';
import { listPatients } from '@/services/psy/dashboard.service';
import PsyPatientsPage from '@/features/psy/PsyPatientsPage';

export default async function PsyPatients({ searchParams }: { searchParams: Promise<{ search?: string; status?: string }> }) {
  const session = await requireRole('PSYCHOLOGIST');
  const params = await searchParams;
  const initialData = await listPatients(session.id, {
    search: params.search ?? '',
    status: params.status ?? '',
    page: 1,
    limit: 50,
  });

  return <PsyPatientsPage initialData={initialData} />;
}
