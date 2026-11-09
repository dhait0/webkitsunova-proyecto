import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth/guard';
import { homeForRole } from '@/lib/auth/roles';
import LoginForm from '@/features/auth/LoginForm';

const NOTICES: Record<string, string> = {
  sin_perfil:
    'Tu cuenta no está habilitada en la plataforma. Si te registraste hace tiempo, vuelve a crear tu cuenta o contacta a soporte.',
  inactiva: 'Tu cuenta no está activa. Si fue suspendida o está pendiente de aprobación, contacta a soporte.',
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ cuenta?: string }>;
}) {
  const session = await getSessionUser();
  const { cuenta } = await searchParams;

  // A suspended or pending session must not bounce between /login and its home.
  if (session && session.status === 'ACTIVE') {
    redirect(homeForRole(session.role));
  }

  const notice = cuenta ? NOTICES[cuenta] : undefined;

  return (
    <>
      {notice ? (
        <p className="kb-note kb-note--error" role="alert" style={{ margin: '1rem auto', maxWidth: '40rem' }}>
          {notice}
        </p>
      ) : null}
      <LoginForm />
    </>
  );
}
