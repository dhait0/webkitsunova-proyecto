'use client';

import { useState } from 'react';
import type { PsyPreferences } from '@/lib/api';
import { updatePreferencesAction } from '@/app/(psychologist)/psy/notificaciones/preferencias/actions';
import { ErrorBlock, Panel, SuccessBlock } from '@/components/psy/PsyUi';

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
  initialPreferences: PsyPreferences;
};

export function PsyNotificationPreferencesPage({ initialPreferences }: Props) {
  const [preferences, setPreferences] = useState<PsyPreferences>(initialPreferences);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleToggle(key: keyof PsyPreferences, value: boolean) {
    const previous = preferences;

    setSaving(true);
    setError(null);
    setMessage(null);
    setPreferences({ ...preferences, [key]: value });

    try {
      const result = await updatePreferencesAction({ [key]: value });
      if (result && 'preferences' in result) {
        setPreferences(result.preferences);
      }
      setMessage('Preferencias guardadas');
    } catch (caught) {
      setPreferences(previous);
      setError(caught instanceof Error ? caught.message : 'No se pudieron guardar');
    } finally {
      setSaving(false);
    }
  }

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
