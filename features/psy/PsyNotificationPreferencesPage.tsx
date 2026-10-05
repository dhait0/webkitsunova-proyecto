'use client';

import { useEffect, useState } from 'react';
import { getPsyPreferences, updatePsyPreferences, type PsyPreferences } from '@/lib/api';
import { ErrorBlock, LoadingBlock, Panel, SuccessBlock } from '@/components/psy/PsyUi';

const preferenceLabels: Array<{ key: keyof PsyPreferences; label: string; hint: string }> = [
  {
    key: 'newAppointments',
    label: 'Nuevas citas agendadas',
    hint: 'Recibe un aviso cuando un paciente agenda o cambia una sesión.'
  },
  {
    key: 'newMessages',
    label: 'Mensajes nuevos',
    hint: 'Notificaciones de nuevos mensajes.'
  },
  {
    key: 'patientReports',
    label: 'Reportes de pacientes',
    hint: 'Alertas cuando publicas un reporte de seguimiento.'
  },
  {
    key: 'moodAlerts',
    label: 'Cambios emocionales',
    hint: 'Alertas de cambios emocionales relevantes en tus pacientes.'
  },
  {
    key: 'platformNews',
    label: 'Novedades de la plataforma',
    hint: 'Actualizaciones y recursos nuevos.'
  }
];

type Props = {
  initialPreferences?: PsyPreferences;
};

export function PsyNotificationPreferencesPage({ initialPreferences }: Props) {
  const [preferences, setPreferences] = useState<PsyPreferences | null>(initialPreferences ?? null);
  const [loading, setLoading] = useState(!initialPreferences);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initialPreferences) return;

    let active = true;

    getPsyPreferences()
      .then((result) => {
        if (active) setPreferences(result.preferences);
      })
      .catch((caught: unknown) => {
        if (active) setError(caught instanceof Error ? caught.message : 'Error cargando preferencias');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [initialPreferences]);

  async function handleToggle(key: keyof PsyPreferences, value: boolean) {
    if (!preferences) return;

    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const result = await updatePsyPreferences({ [key]: value });
      setPreferences(result.preferences);
      setMessage('Preferencias guardadas');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No se pudieron guardar');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingBlock label="Cargando preferencias..." />;
  if (error && !preferences) return <ErrorBlock message={error} />;
  if (!preferences) return <ErrorBlock message="No hay preferencias disponibles" />;

  return (
    <Panel eyebrow="Notificaciones" title="Preferencias de notificación">
      <p>Elige qué notificaciones quieres recibir.</p>

      {error ? <ErrorBlock message={error} /> : null}
      {message ? <SuccessBlock message={message} /> : null}

      <ul className="psy-preference-list">
        {preferenceLabels.map((item) => (
          <li key={item.key}>
            <label className="psy-switch">
              <input
                type="checkbox"
                checked={preferences[item.key]}
                disabled={saving}
                onChange={(event) => void handleToggle(item.key, event.target.checked)}
              />
              {item.label}
            </label>
            <small>{item.hint}</small>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

export default PsyNotificationPreferencesPage;
