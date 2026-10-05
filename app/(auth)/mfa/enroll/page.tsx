import { requireUser } from '@/lib/auth/guard';
import { homeForRole } from '@/lib/auth/roles';
import MfaEnrollPage from '@/features/auth/MfaEnrollPage';

export default async function MfaEnrollRoute() {
  const session = await requireUser();
  return <MfaEnrollPage roleHome={homeForRole(session.role)} />;
}
