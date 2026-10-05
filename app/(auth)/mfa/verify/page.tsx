import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth/guard';
import { homeForRole } from '@/lib/auth/roles';
import MfaVerifyForm from '@/features/auth/MfaVerifyForm';

export default async function MfaVerifyPage() {
  const session = await getSessionUser();

  // Reachable only mid-login: the session exists but is not yet at aal2.
  if (!session) {
    redirect('/login');
  }

  return <MfaVerifyForm sessionHome={homeForRole(session.role)} />;
}
