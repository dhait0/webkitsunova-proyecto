import { requireUser } from '@/lib/auth/guard';
import DashboardLayout from '@/features/DashboardLayout';
import '@/styles/user.css';

export default async function UserLayout({ children }: { children: React.ReactNode }) {
  const session = await requireUser();

  return (
    <div className="user-root">
      <DashboardLayout session={session}>{children}</DashboardLayout>
    </div>
  );
}
