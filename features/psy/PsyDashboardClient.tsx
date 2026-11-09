'use client';

import { useCallback, useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { PsyDashboard } from '@/lib/api';
import { EmptyState, Panel, StatCard, PsyBadge } from '@/components/psy/PsyUi';
import { formatRelative, formatTime, formatDateTime, moodLabels } from '@/lib/utils/format';
import { psyAppointmentStatusLabels } from '@/content/siteContent';
import type { SessionUser } from '@/lib/auth/types';
import { updateAppointmentStatusAction } from '@/app/(psychologist)/psy/citas/actions';

type Props = {
  initialData: PsyDashboard;
  session: SessionUser;
};

function PsyDashboardClient({ initialData }: Props) {
  const router = useRouter();
  const [data, setData] = useState(initialData);

  useEffect(() => {
    setData(initialData);
  }, [initialData]);

  const reload = useCallback(() => {
    router.refresh();
  }, [router]);

  const { profile, stats, nextAppointment, todayAppointments, recentPatients } = data;
  const pendingRequests = data.pendingRequests ?? [];
  const [isPending, startTransition] = useTransition();
  const [requestError, setRequestError] = useState<string | null>(null);

  function answerRequest(id: string, status: 'CONFIRMED' | 'CANCELLED') {
    setRequestError(null);
    startTransition(async () => {
      try {
        const result = await updateAppointmentStatusAction(
          id,
          status,
          status === 'CANCELLED' ? 'El psicólogo no pudo aceptar la solicitud.' : undefined,
        );
        if (result.ok) {
          router.refresh();
        } else {
          setRequestError(result.error);
        }
      } catch (caught) {
        setRequestError(caught instanceof Error ? caught.message : 'No se pudo responder la solicitud');
      }
    });
  }

  return (
    <>
      <section className="psy-stats-grid">
        <StatCard variant="psy" label="Pacientes activos" value={stats.activePatients} hint="Vínculos activos" />
        <StatCard variant="psy" label="Solicitudes de cita" value={stats.pendingRequests ?? 0} hint="Esperan tu respuesta" />
        <StatCard variant="psy" label="Mensajes pendientes" value={stats.pendingMessages} hint="Conversaciones sin leer" />
        <StatCard variant="psy" label="Sesiones de hoy" value={stats.sessionsToday} hint="Pendientes y confirmadas" />
        <StatCard variant="psy" label="Próximas sesiones" value={stats.upcomingSessions} hint="Agenda futura" />
        <StatCard variant="psy" label="Talleres" value={stats.workshops} hint="Creados por ti" />
        <StatCard variant="psy" label="Recursos" value={stats.resources} hint="Creados por ti" />
      </section>

      {pendingRequests.length > 0 ? (
        <Panel
          variant="psy"
          eyebrow="Solicitudes"
          title="Citas por responder"
          actions={
            <Link href="/psy/sesiones" className="secondary-btn">
              Ver agenda
            </Link>
          }
        >
          {requestError ? <p role="alert">{requestError}</p> : null}
          <ul className="psy-session-list">
            {pendingRequests.map((request) => (
              <li key={request.id} className="psy-session-item">
                <div className="psy-session-when">
                  <strong>{formatTime(request.startsAt)}</strong>
                  <span>{formatDateTime(request.startsAt)}</span>
                </div>
                <div className="psy-session-who">
                  <strong>{request.patientName}</strong>
                  <span>Motivo: {request.reason ?? 'Sin motivo especificado'}</span>
                </div>
                <div className="psy-session-actions">
                  <button
                    type="button"
                    className="primary-btn"
                    disabled={isPending}
                    onClick={() => answerRequest(request.id, 'CONFIRMED')}
                    aria-label={`Confirmar solicitud de ${request.patientName}`}
                  >
                    Confirmar
                  </button>
                  <button
                    type="button"
                    className="secondary-btn"
                    disabled={isPending}
                    onClick={() => answerRequest(request.id, 'CANCELLED')}
                    aria-label={`Rechazar solicitud de ${request.patientName}`}
                  >
                    Rechazar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      ) : null}

      <section className="psy-dashboard-panels">
        <Panel
          variant="psy"
          eyebrow="Agenda"
          title="Próxima sesión"
          actions={
            <Link href="/psy/sesiones" className="secondary-btn">
              Ver agenda
            </Link>
          }
        >
          {nextAppointment ? (
            <article className="psy-next-appointment">
              <div>
                <strong>{nextAppointment.patientName}</strong>
                <p>{formatDateTime(nextAppointment.startsAt)}</p>
                <small>Motivo: {nextAppointment.reason ?? 'Sin motivo especificado'}</small>
              </div>
              <PsyBadge
                status={nextAppointment.status}
                label={psyAppointmentStatusLabels[nextAppointment.status] ?? nextAppointment.status}
              />
            </article>
          ) : (
            <EmptyState title="Sin programar" text="No tienes sesiones próximas agendadas." />
          )}
        </Panel>

        <Panel
          variant="psy"
          eyebrow="Perfil"
          title="Perfil profesional"
          actions={
            <Link href="/psy/perfil" className="secondary-btn">
              Ver mi perfil
            </Link>
          }
        >
          <div className="psy-profile-summary">
            <p>
              <strong>{profile.name}</strong>
            </p>
            <p>Ubicación: {profile.country ?? 'Sin definir'}</p>
            <p>
              Especialidades: {profile.specialties.length ? profile.specialties.join(', ') : 'Sin definir'}
            </p>
            <p>
              Estado:{' '}
              <PsyBadge
                status={profile.isAcceptingNew ? 'ACTIVE' : 'SUSPENDED'}
                label={profile.isAcceptingNew ? 'Disponible para nuevas citas' : 'No disponible'}
              />
            </p>
          </div>
        </Panel>
      </section>

      <Panel variant="psy" eyebrow="Seguimiento" title="Pacientes recientes">
        {recentPatients.length === 0 ? (
          <EmptyState
            title="Aún no tienes pacientes activos"
            text="Cuando confirmes una sesión, el paciente aparecerá aquí."
          />
        ) : (
          <div className="psy-table-wrapper">
            <table className="psy-table">
              <thead>
                <tr>
                  <th>Paciente</th>
                  <th>Estado emocional</th>
                  <th>Última actividad</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {recentPatients.map((patient) => (
                  <tr key={patient.userId}>
                    <td>{patient.name}</td>
                    <td>
                      <PsyBadge
                        status={patient.mood}
                        label={moodLabels[patient.mood] ?? patient.mood}
                      />
                    </td>
                    <td>{formatRelative(patient.lastActivityAt)}</td>
                    <td>
                      <Link href={`/psy/pacientes/${patient.userId}`} className="psy-table-link">
                        Ver perfil
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {data.todayAppointments.length > 0 ? (
        <Panel variant="psy" eyebrow="Hoy" title="Sesiones programadas">
          <ul className="psy-list">
            {data.todayAppointments.map((appointment) => (
              <li key={appointment.id}>
                <span>{formatTime(appointment.startsAt)}</span>
                <strong>{appointment.patientName}</strong>
                <PsyBadge
                  status={appointment.status}
                  label={psyAppointmentStatusLabels[appointment.status] ?? appointment.status}
                />
              </li>
            ))}
          </ul>
        </Panel>
      ) : null}

      <div className="psy-panel-actions">
        <button type="button" className="secondary-btn" onClick={() => void reload()}>
          Actualizar
        </button>
      </div>
    </>
  );
}

export default PsyDashboardClient;
