import { requireRole } from '@/lib/auth/guard';
import { listReferrals, listColleagues } from '@/services/psy/referrals.service';
import { listPatients } from '@/services/psy/dashboard.service';
import PsyReferralsPage from '@/features/psy/PsyReferralsPage';

export default async function PsyReferrals({
  searchParams,
}: {
  searchParams: Promise<{ box?: string }>;
}) {
  const session = await requireRole('PSYCHOLOGIST');
  const params = await searchParams;
  const box = typeof params.box === 'string' ? params.box : 'received';

  const [referrals, patients, colleagues] = await Promise.all([
    listReferrals(session.id, { box, limit: 50 }),
    listPatients(session.id, { status: 'ACTIVE', limit: 100 }),
    listColleagues(session.id),
  ]);

  return (
    <PsyReferralsPage
      initialReferrals={{ referrals: referrals.referrals }}
      initialPatients={{ patients: patients.patients }}
      initialColleagues={{ colleagues: colleagues.colleagues }}
    />
  );
}
