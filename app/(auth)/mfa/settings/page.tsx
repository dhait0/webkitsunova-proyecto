import { requireUser } from '@/lib/auth/guard';
import { getMfaStatus } from '@/lib/auth/mfa';
import { homeForRole } from '@/lib/auth/roles';
import MfaSettings from '@/features/auth/MfaSettingsPage';

export default async function MfaSettingsRoute() {
  const session = await requireUser();
  const status = await getMfaStatus();

  return <MfaSettings status={status} roleHome={homeForRole(session.role)} />;
}
