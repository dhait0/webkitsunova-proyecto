import { requireRole } from '@/lib/auth/guard';
import { getWorkshop, listWorkshopEnrollments } from '@/services/psy/workshops.service';
import PsyWorkshopDetailPage from '@/features/psy/PsyWorkshopDetailPage';

export default async function PsyWorkshopDetail({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole('PSYCHOLOGIST');
  const { id } = await params;
  const [workshopResult, attendeesResult] = await Promise.all([
    getWorkshop(session.id, id),
    listWorkshopEnrollments(session.id, id),
  ]);

  return (
    <PsyWorkshopDetailPage
      workshop={workshopResult?.workshop ?? null}
      attendees={attendeesResult ?? { total: 0, attendees: [] }}
    />
  );
}
