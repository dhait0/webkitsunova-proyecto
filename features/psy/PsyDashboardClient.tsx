'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { getPsyDashboard, type PsyDashboard } from '@/lib/api';
import { EmptyState, ErrorBlock, Panel, StatCard, PsyBadge } from '@/components/psy/PsyUi';
import { formatRelative, formatTime, formatDateTime, moodLabels } from '@/lib/utils/format';
import { psyAppointmentStatusLabels } from '@/content/siteContent';
import type { SessionUser } from '@/lib/auth/types';

type Props = {
  initialData: PsyDashboard;
  session: SessionUser;
};

function PsyDashboardClient({ initialData }: Props) {
  const [data, setData] = useState(initialData);
  const [reloadToken, setReloadToken] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setReloadToken((n) => n + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    getPsyDashboard()
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((caught) => {
        if (!cancelled) setError(caught instanceof Error ? caught.message : 'Error inesperado');
      });
    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  if (error) return <ErrorBlock message={error} />;

  const { profile, stats, nextAppointment, todayAppointments, recentPatients } = data;

  return (
    <>
      <section className="psy-stats-grid">
        <StatCard label="Pacientes activos" value={stats.activePatients} hint="Vínculos activos" />
        <StatCard label="Mensajes pendientes" value={stats.pendingMessages} hint="Conversaciones sin leer" />
        <StatCard label="Sesiones de hoy" value={stats.sessionsToday} hint="Pendientes y confirmadas" />
        <StatCard label="Próximas sesiones" value={stats.upcomingSessions} hint="Agenda futura" />
        <StatCard label="Talleres" value={stats.workshops} hint="Creados por ti" />
        <StatCard label="Recursos" value={stats.resources} hint="Creados por ti" />
      </section>

      <section className="psy-dashboard-panels">
        <Panel
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

      <Panel eyebrow="Seguimiento" title="Pacientes recientes">
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
        <Panel eyebrow="Hoy" title="Sesiones programadas">
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
