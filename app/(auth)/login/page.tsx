import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth/guard';
import { homeForRole } from '@/lib/auth/roles';
import LoginForm from '@/features/auth/LoginForm';

export default async function LoginPage() {
  const session = await getSessionUser();

  if (session) {
    redirect(homeForRole(session.role));
  }

  return <LoginForm />;
}
