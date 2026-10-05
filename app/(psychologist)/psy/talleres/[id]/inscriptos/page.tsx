import { requireRole } from '@/lib/auth/guard';
import { listWorkshopEnrollments } from '@/services/psy/workshops.service';
import { EmptyState, Panel, ErrorBlock } from '@/components/psy/PsyUi';
import { formatShortDate } from '@/lib/utils/format';
import Link from 'next/link';

export default async function PsyWorkshopAttendees({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole('PSYCHOLOGIST');
  const { id } = await params;
  const result = await listWorkshopEnrollments(session.id, id);

  if (!result) {
    return <ErrorBlock message="Taller no encontrado" />;
  }

  const { workshop, total, attendees } = result;

  return (
    <Panel eyebrow="Taller" title="Inscriptos al taller">
      <p>
        <strong>{workshop.title}</strong> — Total: {total} inscritos
      </p>

      {attendees.length === 0 ? (
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
              {attendees.map((attendee) => (
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
        <Link href={`/psy/talleres/${id}`} className="secondary-btn">
          Volver al taller
        </Link>
      </div>
    </Panel>
  );
}
