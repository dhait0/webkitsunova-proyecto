import { FormEvent, useState } from 'react';
import {
  createPsyReferral,
  getPsyColleagues,
  getPsyPatients,
  getPsyReferrals,
  respondToPsyReferral,
  type PsyPatientSummary,
  type PsyReferral
} from '@/lib/api';
import { useAsync } from '@/hooks/useAsync';
import { EmptyState, ErrorBlock, LoadingBlock, Panel, PsyBadge, SuccessBlock } from '@/components/psy/PsyUi';
import { formatDateTime } from '@/utils/format';

const statusLabels: Record<string, string> = {
  PENDING: 'Pendiente',
  ACCEPTED: 'Aceptada',
  DECLINED: 'Rechazada',
  CANCELLED: 'Cancelada'
};

export default function PsyReferralsPage() {
  const [box, setBox] = useState('received');
  const { data, loading, error, reload } = useAsync<{ referrals: PsyReferral[] }>(
    () => getPsyReferrals({ box, limit: 50 }),
    [box]
  );

  const patients = useAsync<{ patients: PsyPatientSummary[] }>(() =>
    getPsyPatients({ status: 'ACTIVE', limit: 100 })
  );
  const colleagues = useAsync<{
    colleagues: Array<{ id: string; name: string; specialties: string[]; rating: number }>;
  }>(getPsyColleagues);

  const [patientUserId, setPatientUserId] = useState('');
  const [toPsychologistId, setToPsychologistId] = useState('');
  const [note, setNote] = useState('');
  const [sending, setSending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    setSending(true);
    setFormError(null);
    setMessage(null);

    try {
      const result = await createPsyReferral({
        toPsychologistId,
        patientUserId,
        note: note.trim() || null
      });
      setMessage(result.message);
      setNote('');
      await reload();
    } catch (caught) {
      setFormError(caught instanceof Error ? caught.message : 'No se pudo crear la derivación');
    } finally {
      setSending(false);
    }
  }

  async function handleRespond(id: string, status: 'ACCEPTED' | 'DECLINED') {
    setFormError(null);
    setMessage(null);

    try {
      await respondToPsyReferral(id, status);
      setMessage(status === 'ACCEPTED' ? 'Derivación aceptada' : 'Derivación rechazada');
      await reload();
    } catch (caught) {
      setFormError(caught instanceof Error ? caught.message : 'No se pudo responder');
    }
  }

  const referrals = data?.referrals ?? [];

  return (
    <>
      <Panel eyebrow="Entre colegas" title="Derivaciones">
        <p className="psy-hint">
          Cuando una especialidad no cubre el caso, puedes derivar el paciente a un colega. El
          paciente debe aceptar la derivación antes de que se abra el vínculo.
        </p>

        {formError ? <ErrorBlock message={formError} /> : null}
        {message ? <SuccessBlock message={message} /> : null}

        <form className="psy-form" onSubmit={handleCreate}>
          <label className="field">
            <span>Paciente</span>
            <select
              value={patientUserId}
              onChange={(event) => setPatientUserId(event.target.value)}
              required
              >
            <option value="">Selecciona un paciente</option>
            {patients.data?.patients.map((patient) => (
            <option key={patient.userId} value={patient.userId}>
            {patient.name}
            </option>
            ))}
            </select>
          </label>

          <label className="field">
            <span>Psicólogo destino</span>
            <select
              value={toPsychologistId}
              onChange={(event) => setToPsychologistId(event.target.value)}
              required
              >
            <option value="">Selecciona un colega</option>
            {colleagues.data?.colleagues.map((colleague) => (
            <option key={colleague.id} value={colleague.id}>
            {colleague.name}
            {colleague.specialties.length ? ` — ${colleague.specialties.join(', ')}` : ''}
            </option>
            ))}
            </select>
          </label>

          <label className="field">
            <span>Nota para el colega</span>
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              rows={3}
              maxLength={1000}
              placeholder="Motivo de la derivación (opcional)"
            />
          </label>

          <button
            type="submit"
            className="primary-btn"
            disabled={sending || patients.loading || colleagues.loading}
          >
            {sending ? 'Enviando...' : 'Enviar derivación'}
          </button>
        </form>
      </Panel>

      <Panel eyebrow="Seguimiento" title="Derivaciones">
        <div className="psy-filters">
          {[
            { value: 'received', label: 'Recibidas' },
            { value: 'sent', label: 'Enviadas' },
            { value: 'all', label: 'Todas' }
          ].map((item) => (
            <button
              key={item.value}
              type="button"
              className={box === item.value ? 'psy-filter-chip is-active' : 'psy-filter-chip'}
              onClick={() => setBox(item.value)}
            >
              {item.label}
            </button>
          ))}
        </div>

        {loading ? <LoadingBlock label="Cargando derivaciones..." /> : null}
        {error ? <ErrorBlock message={error} /> : null}

        {!loading && !error && referrals.length === 0 ? (
          <EmptyState title="Sin derivaciones" text="Todavía no hay derivaciones registradas." />
        ) : null}

        {referrals.length > 0 ? (
          <div className="psy-table-wrapper">
            <table className="psy-table">
              <thead>
                <tr>
                  <th>Origen</th>
                  <th>Destino</th>
                  <th>Estado</th>
                  <th>Fecha</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {referrals.map((referral) => (
                  <tr key={referral.id}>
                    <td>{referral.fromPsychologistName}</td>
                    <td>{referral.toPsychologistName}</td>
                    <td>
                      <PsyBadge
                        status={referral.status}
                        label={statusLabels[referral.status] ?? referral.status}
                      />
                      {referral.note ? <small>{referral.note}</small> : null}
                    </td>
                    <td>{formatDateTime(referral.createdAt)}</td>
                    <td>
                      {referral.status === 'PENDING' && box === 'received' ? (
                        <div className="psy-inline-form">
                          <button
                            type="button"
                            className="primary-btn"
                            onClick={() => void handleRespond(referral.id, 'ACCEPTED')}
                          >
                            Aceptar
                          </button>
                          <button
                            type="button"
                            className="secondary-btn"
                            onClick={() => void handleRespond(referral.id, 'DECLINED')}
                          >
                            Rechazar
                          </button>
                        </div>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </Panel>
    </>
  );
}
