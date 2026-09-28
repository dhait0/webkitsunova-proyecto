import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { getMfaStatus } from '@/lib/api';

function MfaSettingsPage() {
  const navigate = useNavigate();
  const [mfaEnabled, setMfaEnabled] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirmDisable, setConfirmDisable] = useState(false);

  useEffect(() => {
    loadStatus();
  }, []);

  async function loadStatus() {
    setLoading(true);
    setError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login', { replace: true });
        return;
      }

      const status = await getMfaStatus();
      setMfaEnabled(status.mfaEnabled);
    } catch {
      setError('Error al cargar estado de MFA');
    } finally {
      setLoading(false);
    }
  }

  async function handleDisable() {
    if (!confirmDisable) {
      setConfirmDisable(true);
      return;
    }

    setLoading(true);
    setError('');

    try {
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
    } catch {
      setError('Error al desactivar MFA');
      setLoading(false);
      setConfirmDisable(false);
    }
  }

  if (loading && !mfaEnabled) {
    return (
      <div className="route-guard">
        <p>Cargando configuración de seguridad...</p>
      </div>
    );
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
              <button
                className="btn-danger"
                onClick={handleDisable}
                disabled={loading}
              >
                {confirmDisable ? 'Confirmar desactivación' : 'Desactivar'}
              </button>
              {confirmDisable && (
                <p className="hint">
                  Confirma haciendo clic de nuevo en "Confirmar desactivación".
                </p>
              )}
            </>
          ) : (
            <button
              className="btn-primary"
              onClick={() => navigate('/mfa/enroll')}
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
        <Link to="/dashboard">← Volver al dashboard</Link>
      </p>
    </div>
  );
}

export default MfaSettingsPage;
