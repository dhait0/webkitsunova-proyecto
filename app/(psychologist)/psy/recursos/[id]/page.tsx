import { requireRole } from '@/lib/auth/guard';
import { getResource } from '@/services/psy/resources.service';
import PsyResourceDetailPage from '@/features/psy/PsyResourceDetailPage';

export default async function PsyResourceDetail({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole('PSYCHOLOGIST');
  const { id } = await params;
  const result = await getResource(session.id, id);

  return <PsyResourceDetailPage resource={result?.resource ?? null} />;
}
