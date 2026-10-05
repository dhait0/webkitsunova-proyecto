'use client';

import { useState } from 'react';
import { getAppointmentsAction, updateAppointmentStatusAction } from '@/app/(psychologist)/psy/citas/actions';
import { useAsync } from '@/hooks/useAsync';
import { EmptyState, ErrorBlock, LoadingBlock, Panel, PsyBadge } from '@/components/psy/PsyUi';
import { formatDateTime, formatTime } from '@/lib/utils/format';
import { psyAppointmentStatusLabels } from '@/content/siteContent';
import type { PsyAppointment } from '@/lib/api';

type AppointmentListProps = {
  scope: 'today' | 'upcoming' | 'past';
  title: string;
  emptyTitle: string;
  emptyText: string;
  initialData: { appointments: PsyAppointment[] };
};

const allowedTransitions: Record<string, Array<'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW'>> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['COMPLETED', 'CANCELLED', 'NO_SHOW'],
  COMPLETED: [],
  CANCELLED: [],
  NO_SHOW: []
};

function AppointmentList({ scope, title, emptyTitle, emptyText, initialData }: AppointmentListProps) {
  const { data, loading, error, reload } = useAsync(
    () => getAppointmentsAction({ scope, limit: 50 }),
    [scope]
  );
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  async function handleStatusChange(id: string, status: 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW') {
    setBusyId(id);
    setActionError(null);

    try {
      const reason =
        status === 'CANCELLED'
          ? window.prompt('Motivo de la cancelación (opcional)') ?? undefined
          : undefined;
      await updateAppointmentStatusAction(id, status, reason);
      await reload();
    } catch (caught) {
      setActionError(caught instanceof Error ? caught.message : 'No se pudo actualizar la sesión');
    } finally {
      setBusyId(null);
    }
  }

  const appointments = data?.appointments ?? initialData.appointments;

  return (
    <Panel eyebrow="Agenda" title={title}>
      {actionError ? <ErrorBlock message={actionError} /> : null}

      {appointments.length === 0 ? (
        <EmptyState title={emptyTitle} text={emptyText} />
      ) : (
        <ul className="psy-session-list">
          {appointments.map((appointment) => (
            <li key={appointment.id} className="psy-session-item">
              <div className="psy-session-when">
                <strong>{formatTime(appointment.startsAt)}</strong>
                <span>{formatDateTime(appointment.startsAt)}</span>
              </div>

              <div className="psy-session-who">
                <strong>{appointment.patientName}</strong>
                <span>Motivo: {appointment.reason ?? 'Sin motivo especificado'}</span>
              </div>

              <PsyBadge
                status={appointment.status}
                label={psyAppointmentStatusLabels[appointment.status] ?? appointment.status}
              />

              <div className="psy-session-actions">
                {allowedTransitions[appointment.status]?.map((status) => (
                  <button
                    key={status}
                    type="button"
                    className="secondary-btn"
                    disabled={busyId === appointment.id}
                    onClick={() => void handleStatusChange(appointment.id, status)}
                  >
                    {psyAppointmentStatusLabels[status]}
                  </button>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

export default AppointmentList;
