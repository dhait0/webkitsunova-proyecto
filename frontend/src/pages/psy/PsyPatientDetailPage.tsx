import { FormEvent, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  createPsyPatientReport,
  getPsyPatient,
  type PsyAppointment,
  type PsyPatientDetail
} from '@/lib/api';
import { useAsync } from '@/hooks/useAsync';
import { EmptyState, ErrorBlock, LoadingBlock, Panel, PsyBadge, SuccessBlock } from '@/components/psy/PsyUi';
import { formatDate, formatDateTime, moodLabels } from '@/utils/format';
import { psyAppointmentStatusLabels } from '@/content/siteContent';

type PatientDetailResponse = {
  patient: PsyPatientDetail;
  appointments: PsyAppointment[];
  reports: Array<{ id: string; appointmentId: string | null; summary: string; moodScore: number | null; createdAt: string }>;
};

function PsyPatientDetailPage() {
  const { userId = '' } = useParams();
  const { data, loading, error, reload } = useAsync<PatientDetailResponse>(
    () => getPsyPatient(userId),
    [userId]
  );

  const [summary, setSummary] = useState('');
  const [moodScore, setMoodScore] = useState('');
  const [appointmentId, setAppointmentId] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  async function handleReport(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setSaveError(null);
    setSaveMessage(null);

    try {
      await createPsyPatientReport({
        patientUserId: userId,
        appointmentId: appointmentId || null,
        summary: summary.trim(),
        moodScore: moodScore ? Number(moodScore) : null
      });
      setSummary('');
      setMoodScore('');
      setAppointmentId('');
      setSaveMessage('Reporte guardado');
      await reload();
    } catch (caught) {
      setSaveError(caught instanceof Error ? caught.message : 'No se pudo guardar el reporte');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingBlock label="Cargando ficha..." />;
  if (error) return <ErrorBlock message={error} />;
  if (!data) return <ErrorBlock message="Paciente no encontrado" />;

  const { patient, appointments, reports } = data;

  return (
    <>
      <Panel eyebrow="Ficha" title={patient.name}>
        <dl className="psy-detail-list">
          <div>
            <dt>Correo electrónico</dt>
            <dd>{patient.email}</dd>
          </div>
          <div>
            <dt>Teléfono</dt>
            <dd>{patient.phone ?? 'Sin registrar'}</dd>
          </div>
          <div>
            <dt>País</dt>
            <dd>{patient.country ?? 'Sin registrar'}</dd>
          </div>
          <div>
            <dt>Fecha de nacimiento</dt>
            <dd>{patient.birthDate ? formatDate(patient.birthDate) : 'Sin registrar'}</dd>
          </div>
          <div>
            <dt>Estado emocional</dt>
            <dd>
              <PsyBadge status={patient.mood} label={moodLabels[patient.mood] ?? patient.mood} />
            </dd>
          </div>
          <div>
            <dt>Inicio del vínculo</dt>
            <dd>{formatDate(patient.startedAt)}</dd>
          </div>
        </dl>

        {patient.bio ? <p className="psy-bio">{patient.bio}</p> : null}

        <div className="psy-panel-actions">
          <Link to="/psy/derivaciones" className="secondary-btn">
            Derivar a un colega
          </Link>
        </div>
      </Panel>

      <Panel eyebrow="Historial" title="Sesiones">
        {appointments.length === 0 ? (
          <EmptyState title="Sin sesiones" text="Este paciente aún no tiene sesiones registradas." />
        ) : (
          <div className="psy-table-wrapper">
            <table className="psy-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Tipo</th>
                  <th>Estado</th>
                  <th>Motivo</th>
                  <th>Nota privada</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((appointment) => (
                  <tr key={appointment.id}>
                    <td>{formatDateTime(appointment.startsAt)}</td>
                    <td>{appointment.type}</td>
                    <td>
                      <PsyBadge
                        status={appointment.status}
                        label={psyAppointmentStatusLabels[appointment.status] ?? appointment.status}
                      />
                    </td>
                    <td>{appointment.reason ?? 'Sin motivo especificado'}</td>
                    <td>{appointment.psyNote ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Panel eyebrow="Notas" title="Reportes de seguimiento">
        {saveError ? <ErrorBlock message={saveError} /> : null}
        {saveMessage ? <SuccessBlock message={saveMessage} /> : null}

        <form className="psy-form" onSubmit={handleReport}>
          <label className="field">
            <span>Sesión asociada</span>
            <select value={appointmentId} onChange={(event) => setAppointmentId(event.target.value)}>
            <option value="">Sin sesión específica</option>
            {appointments.map((appointment) => (
            <option key={appointment.id} value={appointment.id}>
            {formatDateTime(appointment.startsAt)}
            </option>
            ))}
            </select>
          </label>

          <label className="field">
            <span>Resumen</span>
            <textarea
              value={summary}
              onChange={(event) => setSummary(event.target.value)}
              placeholder="Describe el avance, la evolución y los acuerdos de la sesión."
              rows={4}
              required
              minLength={3}
              maxLength={4000}
            />
          </label>

          <label className="field">
            <span>Estado de ánimo (1 a 10)</span>
            <input
              type="number"
              min={1}
              max={10}
              value={moodScore}
              onChange={(event) => setMoodScore(event.target.value)}
            />
          </label>

          <button type="submit" className="primary-btn" disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar reporte'}
          </button>
        </form>

        {reports.length > 0 ? (
          <ul className="psy-list">
            {reports.map((report) => (
              <li key={report.id}>
                <span>{formatDateTime(report.createdAt)}</span>
                <strong>{report.summary}</strong>
                {report.moodScore ? <span>Ánimo: {report.moodScore}/10</span> : null}
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title="Sin reportes" text="Registra el primer reporte de seguimiento." />
        )}
      </Panel>
    </>
  );
}

export default PsyPatientDetailPage;
