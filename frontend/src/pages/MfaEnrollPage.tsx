import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

type EnrollState = 'idle' | 'enrolled' | 'verified' | 'error';

function MfaEnrollPage() {
  const navigate = useNavigate();
  const [state, setState] = useState<EnrollState>('idle');
  const [secret, setSecret] = useState('');
  const [qrUrl, setQrUrl] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) navigate('/login', { replace: true });
    });
  }, [navigate]);

  async function handleEnroll(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSecret('');
    setQrUrl('');
    setState('idle');

    const { data, error: err } = await supabase.auth.mfa.enroll({ factorType: 'totp' });

    if (err || !data) {
      setError(err?.message ?? 'Error al activar MFA');
      setState('error');
      setLoading(false);
      return;
    }

    if ((data as unknown as { qr_code?: { url?: string } }).qr_code?.url) setQrUrl((data as unknown as { qr_code?: { url: string } }).qr_code!.url!);
    if ((data as unknown as { factor?: { totp?: { secret?: string } } }).factor?.totp?.secret) setSecret((data as unknown as { factor: { totp: { secret: string } } }).factor.totp.secret);
    setState('enrolled');
    setLoading(false);
  }

  async function handleVerify(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const factorsResp = await supabase.auth.mfa.listFactors();
    const totpFactor = factorsResp.data?.totp?.find((f) => f.factor_type === 'totp');

    if (!totpFactor) {
      setError('No se encontró el factor TOTP');
      setState('error');
      setLoading(false);
      return;
    }

    const { data, error: verifyErr } = await supabase.auth.mfa.verify({
      code,
      factorId: totpFactor.id,
    } as any);

    if (verifyErr || !data) {
      setError(verifyErr?.message ?? 'Código incorrecto');
      setState('error');
      setLoading(false);
      return;
    }

    setState('verified');
    setLoading(false);
  }

  if (state === 'verified') {
    return (
      <div className="route-guard">
        <p>Autenticación de dos factores activada correctamente.</p>
        <Link to="/dashboard/mfa/settings">Ir a configuración de seguridad</Link>
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
            <h1>Autenticación de dos factores</h1>
            <p className="section-copy">
              Añade una capa extra de seguridad a tu cuenta mediante una aplicación autenticadora.
            </p>

            {error && <p className="feedback">{error}</p>}

            {state === 'idle' && (
              <form onSubmit={handleEnroll}>
                <button className="login-submit" type="submit" disabled={loading}>
                  {loading ? 'Generando...' : 'Activar autenticación de dos factores'}
                </button>
              </form>
            )}

            {state === 'enrolled' && (
              <form onSubmit={handleVerify}>
                {qrUrl && (
                  <div className="mfa-qr">
                    <img src={qrUrl} alt="Código QR para autenticador" />
                  </div>
                )}

                {secret && (
                  <div className="mfa-secret">
                    <label className="field">
                      <span>Clave secreta (alternativa)</span>
                      <input value={secret} readOnly type="text" aria-label="Clave secreta TOTP" />
                    </label>
                    <p className="hint">
                      Introduce esta clave en tu aplicación autenticadora si no puedes escanear el código QR.
                    </p>
                  </div>
                )}

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
                  {loading ? 'Verificando...' : 'Verificar código'}
                </button>
              </form>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

export default MfaEnrollPage;
