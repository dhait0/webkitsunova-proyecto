'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/browser';
import type { MfaStatus } from '@/lib/auth/mfa';

export default function MfaSettings({
  status,
  roleHome,
}: {
  status: MfaStatus;
  roleHome: string;
}) {
  const router = useRouter();
  const [mfaEnabled, setMfaEnabled] = useState(status.mfaEnabled);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmDisable, setConfirmDisable] = useState(false);

  async function handleDisable() {
    if (!confirmDisable) {
      setConfirmDisable(true);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const supabase = createClient();
      const { data } = await supabase.auth.mfa.listFactors();
      const totpFactor = data?.totp?.[0];

      if (totpFactor) {
        const { error: unenrollErr } = await supabase.auth.mfa.unenroll({
          factorId: totpFactor.id,
        });

        if (unenrollErr) {
          setError(unenrollErr.message);
          setLoading(false);
          setConfirmDisable(false);
          return;
        }
      }

      setMfaEnabled(false);
      setConfirmDisable(false);
      router.refresh();
    } catch {
      setError('Error al desactivar MFA');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="settings-page">
      <h1>Seguridad</h1>

      {error && <p className="feedback">{error}</p>}

      <div className="setting-item">
        <div>
          <h2>Autenticación de dos factores</h2>
          <p>Protege tu cuenta con verificación mediante aplicación autenticadora.</p>
        </div>
        <div className="setting-actions">
          {mfaEnabled ? (
            <>
              <span className="badge badge-ok">Activo</span>
              <button className="btn-danger" onClick={handleDisable} disabled={loading}>
                {confirmDisable ? 'Confirmar desactivación' : 'Desactivar'}
              </button>
              {confirmDisable && (
                <p className="hint">
                  Confirma haciendo clic de nuevo en &quot;Confirmar desactivación&quot;.
                </p>
              )}
            </>
          ) : (
            <button
              className="btn-primary"
              onClick={() => router.push('/mfa/enroll')}
              disabled={loading}
            >
              Activar
            </button>
          )}
        </div>
      </div>

      <div className="setting-item">
        <div>
          <h2>Sesiones activas</h2>
          <p>Gestiona tus sesiones abiertas.</p>
        </div>
        <div className="setting-actions">
          <span className="badge">Próximamente</span>
        </div>
      </div>

      <p>
        <Link href={roleHome}>← Volver a mi panel</Link>
      </p>
    </div>
  );
}
