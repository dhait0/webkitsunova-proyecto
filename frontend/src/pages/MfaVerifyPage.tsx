import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

type VerifyMode = 'login' | 'recovery';

function MfaVerifyPage({ mode }: { mode: VerifyMode }) {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate('/login', { replace: true });
        return;
      }
      const currentLevel = (session as unknown as { aal?: { level?: string; next_level?: string } }).aal?.level;
      const nextLevel = (session as unknown as { aal?: { level?: string; next_level?: string } }).aal?.next_level;
      if (currentLevel === 'aal1' && nextLevel === 'aal2') {
        setChecking(false);
      } else if (currentLevel === 'aal2') {
        navigate('/dashboard', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    });
  }, [navigate]);

  async function handleVerify(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const factorsResp = await supabase.auth.mfa.listFactors();
    const totpFactor = factorsResp.data?.totp?.[0];

    if (!totpFactor) {
      setError('No hay factor TOTP configurado');
      setLoading(false);
      return;
    }

    const { data, error: verifyErr } = await supabase.auth.mfa.verify({
      code,
      factorId: totpFactor.id,
    } as any);

    if (verifyErr || !data) {
      setError(verifyErr?.message ?? 'Código incorrecto');
      setLoading(false);
      return;
    }

    navigate('/dashboard', { replace: true });
  }

  async function handleRecovery(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error: mfaErr } = await supabase.auth.mfa.challenge({
        factorId: '',
      } as { factorId: string });
      if (mfaErr) {
        setError(mfaErr.message);
        setLoading(false);
        return;
      }
      navigate('/dashboard', { replace: true });
    } catch {
      setError('Error en recuperación de MFA');
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
      <Link to="/dashboard" className="back-btn" aria-label="Volver al dashboard">
        ←
      </Link>

      <div className="login-layout">
        <section className="login-column">
          <div className="login-box">
            <span className="eyebrow">Seguridad</span>
            <h1>Verificación de dos factores</h1>
            <p className="section-copy">
              Introduce el código de tu aplicación autenticadora para completar el acceso.
            </p>

            {error && <p className="feedback">{error}</p>}

            <form onSubmit={mode === 'recovery' ? handleRecovery : handleVerify}>
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
                {loading ? 'Verificando...' : mode === 'recovery' ? 'Iniciar recuperación' : 'Verificar'}
              </button>
            </form>

            {mode === 'login' && (
              <button
                className="forgot-password"
                type="button"
                onClick={() => navigate('/mfa/verify?mode=recovery')}
              >
                ¿No tienes tu autenticador? Recuperar acceso
              </button>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

export default MfaVerifyPage;
