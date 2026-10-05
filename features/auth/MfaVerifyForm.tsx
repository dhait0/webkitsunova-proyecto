'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/browser';
import { homeForRole, roleFromSupabaseUser } from '@/lib/auth/roles';

function MfaVerifyForm({ sessionHome }: { sessionHome: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode') ?? 'login';
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [checking, setChecking] = useState(true);
  const [factorId, setFactorId] = useState<string | null>(null);

  const requestedHome = searchParams.get('from');

  useEffect(() => {
    let active = true;
    const supabase = createClient();

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!active) return;

      if (!session) {
        router.replace('/login');
        return;
      }

      const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (!active) return;

      const currentLevel = aalData?.currentLevel ?? 'aal1';
      const nextLevel = aalData?.nextLevel ?? null;

      if (currentLevel !== 'aal1' || nextLevel !== 'aal2') {
        router.replace(homeForRole(roleFromSupabaseUser(session.user)));
        return;
      }

      const { data: factorsData } = await supabase.auth.mfa.listFactors();
      if (!active) return;

      setFactorId(factorsData?.totp?.[0]?.id ?? null);
      setChecking(false);
    });

    return () => {
      active = false;
    };
  }, [router]);

  async function handleVerify(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!factorId) {
      setError('No se encontró el factor TOTP');
      setLoading(false);
      return;
    }

    const { error: verifyErr } = await createClient().auth.mfa.challengeAndVerify({
      factorId,
      code,
    });

    if (verifyErr) {
      setError(verifyErr.message);
      setLoading(false);
      return;
    }

    setCode('');
    setLoading(false);
    router.refresh();
    router.replace(requestedHome ?? sessionHome ?? '/dashboard');
  }

  async function handleRecovery(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setInfo('');

    try {
      const {
        data: { session },
      } = await createClient().auth.getSession();

      if (!session?.user?.email) {
        setError('No se pudo recuperar el correo del usuario');
        setLoading(false);
        return;
      }

      const { error: resetErr } = await createClient().auth.resetPasswordForEmail(
        session.user.email,
        { redirectTo: `${window.location.origin}/login` }
      );

      if (resetErr) {
        setError(resetErr.message);
      } else {
        setInfo(
          'Te enviamos un correo para restablecer tu contraseña. Al restablecerla, tu MFA se desactivará.'
        );
      }
    } catch {
      setError('Error al procesar la recuperación');
    } finally {
      setLoading(false);
    }
  }

  if (checking) {
    return (
      <div className="route-guard">
        <p>Verificando sesión...</p>
      </div>
    );
  }

  return (
    <div className="login-page">
      <Link href={sessionHome} className="back-btn" aria-label="Volver">
        ←
      </Link>

      <div className="login-layout">
        <section className="login-column">
          <div className="login-box">
            <span className="eyebrow">Seguridad</span>
            <h1>
              {mode === 'login' ? 'Verificación de dos factores' : 'Recuperar acceso MFA'}
            </h1>
            <p className="section-copy">
              {mode === 'login'
                ? 'Introduce el código de tu aplicación autenticadora para completar el acceso.'
                : 'Si no tienes acceso a tu autenticador, restablece tu contraseña y se desactivará el MFA.'}
            </p>

            {error && <p className="feedback">{error}</p>}
            {info && <p className="hint">{info}</p>}

            {mode === 'login' && (
              <form onSubmit={handleVerify}>
                <label className="field">
                  <span>Código de 6 dígitos</span>
                  <input
                    value={code}
                    onChange={(event) => setCode(event.target.value)}
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="000000"
                    required
                  />
                </label>

                <button className="login-submit" type="submit" disabled={loading}>
                  {loading ? 'Verificando...' : 'Verificar'}
                </button>
              </form>
            )}

            {mode === 'recovery' && (
              <form onSubmit={handleRecovery}>
                <button className="login-submit" type="submit" disabled={loading}>
                  {loading ? 'Enviando...' : 'Enviar enlace de recuperación'}
                </button>
              </form>
            )}

            {mode === 'login' && (
              <button
                className="forgot-password"
                type="button"
                onClick={() => router.push('/mfa/verify?mode=recovery')}
              >
                ¿No tienes tu autenticador? Recuperar acceso
              </button>
            )}

            {mode === 'recovery' && (
              <button
                className="forgot-password"
                type="button"
                onClick={() => router.push('/mfa/verify?mode=login')}
              >
                ← Volver a verificación con código
              </button>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

export default function MfaVerifyPage({
  sessionHome,
}: {
  sessionHome: string;
}) {
  return <MfaVerifyForm sessionHome={sessionHome} />;
}
