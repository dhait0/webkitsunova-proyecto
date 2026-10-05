import { requireRole } from '@/lib/auth/guard';
import { getAdminUserStats, getAdminPsyStats } from '@/app/(admin)/admin/actions';
import AdminDashboardPage from '@/features/admin/AdminDashboardPage';

export default async function AdminHome() {
  const session = await requireRole('ADMIN');
  const [userStats, psyStats] = await Promise.all([
    getAdminUserStats(),
    getAdminPsyStats(),
  ]);

  return (
    <AdminDashboardPage
      initialUserStats={userStats.stats}
      initialPsyStats={psyStats.stats}
    />
  );
}
