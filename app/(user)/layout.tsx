import { requireUser } from '@/lib/auth/guard';
import DashboardLayout from '@/features/DashboardLayout';

export default async function UserLayout({ children }: { children: React.ReactNode }) {
  const session = await requireUser();

  return <DashboardLayout session={session}>{children}</DashboardLayout>;
}
