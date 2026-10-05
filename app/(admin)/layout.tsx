import { requireRole } from '@/lib/auth/guard';
import AdminLayout from '@/features/AdminLayout';

export default async function AdminLayoutRoute({ children }: { children: React.ReactNode }) {
  const session = await requireRole('ADMIN');

  return <AdminLayout session={session}>{children}</AdminLayout>;
}
