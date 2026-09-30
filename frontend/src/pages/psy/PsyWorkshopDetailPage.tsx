import { Link, useParams } from 'react-router-dom';
import {
  getPsyWorkshop,
  getPsyWorkshopEnrollments,
  type PsyWorkshop
} from '@/lib/api';
import { useAsync } from '@/hooks/useAsync';
import { EmptyState, ErrorBlock, LoadingBlock, Panel, PsyBadge } from '@/components/psy/PsyUi';
import { formatDateTime, formatMoney, formatShortDate } from '@/utils/format';
import { psyContentStatusLabels, psyFocusAreaLabels } from '@/content/siteContent';

function PsyWorkshopDetailPage() {
  const { id = '' } = useParams();

  const { data, loading, error } = useAsync<{ workshop: PsyWorkshop }>(
    () => getPsyWorkshop(id),
    [id]
  );

  const attendees = useAsync<{
    total: number;
    attendees: Array<{ userId: string; name: string; email: string; enrolledAt: string | null }>;
  }>(() => getPsyWorkshopEnrollments(id), [id]);

  if (loading) return <LoadingBlock label="Cargando taller..." />;
  if (error) return <ErrorBlock message={error} />;
  if (!data) return <ErrorBlock message="Taller no encontrado" />;

  const { workshop } = data;

  return (
    <>
      <Panel eyebrow="Taller" title={workshop.title}>
        <PsyBadge
          status={workshop.status}
          label={psyContentStatusLabels[workshop.status] ?? workshop.status}
        />

        {workshop.status === 'REJECTED' && workshop.rejectReason ? (
          <ErrorBlock message={`Motivo del rechazo: ${workshop.rejectReason}`} />
        ) : null}

        <p>{workshop.description}</p>

        <dl className="psy-detail-list">
          <div>
            <dt>Fecha y hora</dt>
            <dd>{formatDateTime(workshop.startsAt)}</dd>
          </div>
          <div>
            <dt>Duración</dt>
            <dd>{workshop.durationHours} horas</dd>
          </div>
          <div>
            <dt>Área de enfoque</dt>
            <dd>{psyFocusAreaLabels[workshop.focusArea] ?? workshop.focusArea}</dd>
          </div>
          <div>
            <dt>Cupos</dt>
            <dd>
              {workshop.enrolled}/{workshop.capacity}
            </dd>
          </div>
          <div>
            <dt>Precio</dt>
            <dd>
              {workshop.priceCents === 0
                ? 'Gratis'
                : formatMoney(workshop.priceCents, workshop.currency)}
            </dd>
          </div>
          <div>
            <dt>Autor</dt>
            <dd>{workshop.authorName}</dd>
          </div>
        </dl>

        <div className="psy-panel-actions">
          <Link to="/psy/talleres" className="secondary-btn">
            Volver a talleres
          </Link>
          <Link to={`/psy/talleres/${workshop.id}/inscriptos`} className="primary-btn">
            Ver inscriptos
          </Link>
        </div>
      </Panel>

      <Panel eyebrow="Participantes" title="Resumen de inscripción">
        {attendees.loading ? <LoadingBlock /> : null}
        {attendees.error ? <ErrorBlock message={attendees.error} /> : null}
        {attendees.data ? (
          <p>Total: {attendees.data.total} inscritos</p>
        ) : null}
      </Panel>
    </>
  );
}

function PsyWorkshopAttendeesPage() {
  const { id = '' } = useParams();

  const { data, loading, error } = useAsync<{
    workshop: { id: string; title: string };
    total: number;
    attendees: Array<{ userId: string; name: string; email: string; enrolledAt: string | null }>;
  }>(() => getPsyWorkshopEnrollments(id), [id]);

  if (loading) return <LoadingBlock label="Cargando inscriptos..." />;
  if (error) return <ErrorBlock message={error} />;
  if (!data) return <ErrorBlock message="Taller no encontrado" />;

  return (
    <Panel eyebrow="Taller" title="Inscriptos al taller">
      <p>
        <strong>{data.workshop.title}</strong> — Total: {data.total} inscritos
      </p>

      {data.attendees.length === 0 ? (
        <EmptyState
          title="Sin inscriptos"
          text="El taller todavía no tiene participantes inscritos."
        />
      ) : (
        <div className="psy-table-wrapper">
          <table className="psy-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Correo electrónico</th>
                <th>Inscripción</th>
              </tr>
            </thead>
            <tbody>
              {data.attendees.map((attendee) => (
                <tr key={attendee.userId}>
                  <td>{attendee.name}</td>
                  <td>{attendee.email}</td>
                  <td>{attendee.enrolledAt ? formatShortDate(attendee.enrolledAt) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="psy-panel-actions">
        <Link to={`/psy/talleres/${id}`} className="secondary-btn">
          Volver al taller
        </Link>
      </div>
    </Panel>
  );
}

export { PsyWorkshopAttendeesPage };
export default PsyWorkshopDetailPage;
