import { requireRole } from '@/lib/auth/guard';
import { getAdminUsers } from '@/app/(admin)/admin/actions';
import AdminUserPage from '@/features/admin/AdminUserPage';

export default async function AdminUsers() {
  const session = await requireRole('ADMIN');
  const initialData = await getAdminUsers({ page: 1, limit: 10 });

  return <AdminUserPage initialData={initialData} />;
}
