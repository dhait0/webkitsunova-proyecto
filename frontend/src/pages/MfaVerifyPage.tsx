import { FormEvent, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { homeForRole, roleFromSupabaseUser } from '@/lib/roles';

function MfaVerifyPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const mode = searchParams.get('mode') ?? 'login';
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [checking, setChecking] = useState(true);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [sessionHome, setSessionHome] = useState<string | null>(null);

  const requestedHome = (location.state as { from?: string } | null)?.from;

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!active) return;

      if (!session) {
        navigate('/login', { replace: true });
        return;
      }

      setSessionHome(homeForRole(roleFromSupabaseUser(session.user)));

      supabase.auth.mfa.getAuthenticatorAssuranceLevel().then(({ data: aalData }) => {
        if (!active) return;

        const currentLevel = aalData?.currentLevel ?? 'aal1';
        const nextLevel = aalData?.nextLevel ?? null;

        if (currentLevel === 'aal1' && nextLevel === 'aal2') {
          supabase.auth.mfa.listFactors().then(({ data: factorsData }) => {
            if (!active) return;
            const totpFactor = factorsData?.totp?.[0];
            if (totpFactor) {
              setFactorId(totpFactor.id);
            }
            setChecking(false);
          });
        } else {
          navigate(homeForRole(roleFromSupabaseUser(session.user)), { replace: true });
        }
      });
    });

    return () => {
      active = false;
    };
  }, [navigate]);

  async function handleVerify(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!factorId) {
      setError('No se encontró el factor TOTP');
      setLoading(false);
      return;
    }

    const { data, error: verifyErr } = await supabase.auth.mfa.challengeAndVerify({
      factorId,
      code,
    });

    if (verifyErr || !data) {
      setError(verifyErr?.message ?? 'Código incorrecto');
      setLoading(false);
      return;
    }

    setCode('');
    setLoading(false);
    navigate(requestedHome ?? sessionHome ?? '/dashboard', { replace: true });
  }

  async function handleRecovery(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setInfo('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.email) {
        setError('No se pudo recuperar el correo del usuario');
        setLoading(false);
        return;
      }

      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(
        session.user.email,
        {
          redirectTo: `${window.location.origin}/login`,
        }
      );

      if (resetErr) {
        setError(resetErr.message);
      } else {
        setInfo('Te enviamos un correo para restablecer tu contraseña. Al restablecerla, tu MFA se desactivará.');
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
      <Link to={mode === 'login' ? '/dashboard' : '/mfa/verify?mode=login'} className="back-btn" aria-label="Volver">
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
                onClick={() => setSearchParams({ mode: 'recovery' })}
              >
                ¿No tienes tu autenticador? Recuperar acceso
              </button>
            )}

            {mode === 'recovery' && (
              <button
                className="forgot-password"
                type="button"
                onClick={() => setSearchParams({ mode: 'login' })}
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

export default MfaVerifyPage;
