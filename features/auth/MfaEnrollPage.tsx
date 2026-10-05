'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/browser';

type EnrollState = 'idle' | 'enrolled' | 'verified' | 'error';

type EnrollData = {
  factor?: { id?: string };
  qr_code?: { url?: string };
  secret?: string;
};

export default function MfaEnrollPage({ roleHome }: { roleHome: string }) {
  const router = useRouter();
  const [state, setState] = useState<EnrollState>('idle');
  const [factorId, setFactorId] = useState('');
  const [secret, setSecret] = useState('');
  const [qrUrl, setQrUrl] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleEnroll(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSecret('');
    setQrUrl('');
    setFactorId('');
    setState('idle');

    const { data, error: err } = await createClient().auth.mfa.enroll({ factorType: 'totp' });

    if (err || !data) {
      setError(err?.message ?? 'Error al activar MFA');
      setState('error');
      setLoading(false);
      return;
    }

    const enrollData = data as unknown as EnrollData;

    if (enrollData.qr_code?.url) setQrUrl(enrollData.qr_code.url);
    if (enrollData.factor?.id) setFactorId(enrollData.factor.id);
    if (enrollData.secret) setSecret(enrollData.secret);

    setState('enrolled');
    setLoading(false);
  }

  async function handleVerify(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!factorId) {
      setError('No se encontró el factor TOTP');
      setState('error');
      setLoading(false);
      return;
    }

    const { data, error: verifyErr } = await createClient().auth.mfa.challengeAndVerify({
      factorId,
      code,
    });

    if (verifyErr || !data) {
      setError(verifyErr?.message ?? 'Código incorrecto');
      setState('error');
      setLoading(false);
      return;
    }

    setState('verified');
    setLoading(false);
  }

  function handleBackToSettings() {
    router.push('/mfa/settings');
  }

  if (state === 'verified') {
    return (
      <div className="route-guard">
        <p>Autenticación de dos factores activada correctamente.</p>
        <button className="secondary-btn" type="button" onClick={handleBackToSettings}>
          Ir a configuración de seguridad
        </button>
      </div>
    );
  }

  return (
    <div className="login-page">
      <Link href={roleHome} className="back-btn" aria-label="Volver">
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
                      Introduce esta clave en tu aplicación autenticadora si no puedes escanear el
                      código QR.
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

