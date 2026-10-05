import { requireRole } from '@/lib/auth/guard';
import { getPsychologists } from '@/app/(admin)/admin/actions';
import AdminPsychologistsPage from '@/features/admin/AdminPsychologistsPage';

export default async function AdminPsychologists() {
  const session = await requireRole('ADMIN');
  const initialData = await getPsychologists({ page: 1, limit: 10 });

  return <AdminPsychologistsPage initialData={initialData} />;
}
