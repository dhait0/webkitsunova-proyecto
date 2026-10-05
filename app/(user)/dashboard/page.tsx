import DashboardHomePage from '@/features/user/DashboardHomePage';
import { requireUser } from '@/lib/auth/guard';

export default async function UserHome() {
  const session = await requireUser();
  return <DashboardHomePage session={session} />;
}
