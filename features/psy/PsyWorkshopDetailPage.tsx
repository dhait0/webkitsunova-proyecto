'use client';

import Link from 'next/link';
import { EmptyState, ErrorBlock, Panel, PsyBadge } from '@/components/psy/PsyUi';
import { formatDateTime, formatMoney, formatShortDate } from '@/lib/utils/format';
import { psyContentStatusLabels, psyFocusAreaLabels } from '@/content/siteContent';
import type { PsyWorkshop } from '@/lib/api';

type Props = {
  workshop: PsyWorkshop | null;
  attendees: {
    total: number;
    attendees: Array<{ userId: string; name: string; email: string; enrolledAt: string | null }>;
  };
};

function PsyWorkshopDetailPage({ workshop, attendees }: Props) {
  if (!workshop) {
    return <ErrorBlock message="Taller no encontrado" />;
  }

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
          <Link href="/psy/talleres" className="secondary-btn">
            Volver a talleres
          </Link>
          <Link href={`/psy/talleres/${workshop.id}/inscriptos`} className="primary-btn">
            Ver inscriptos
          </Link>
        </div>
      </Panel>

      <Panel eyebrow="Participantes" title="Resumen de inscripción">
        <p>
          <strong>{workshop.title}</strong> — Total: {attendees.total} inscritos
        </p>

        {attendees.attendees.length === 0 ? (
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
                {attendees.attendees.map((attendee) => (
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
          <Link href={`/psy/talleres/${workshop.id}`} className="secondary-btn">
            Volver al taller
          </Link>
        </div>
      </Panel>
    </>
  );
}

export default PsyWorkshopDetailPage;
