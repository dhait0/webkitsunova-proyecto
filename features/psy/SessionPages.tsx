import AppointmentListPage from './AppointmentListPage';
import type { PsyAppointment } from '@/lib/api';

type SessionPageProps = {
  initialAppointments: { appointments: PsyAppointment[] };
};

export function PsyTodaySessionsPage({ initialAppointments }: SessionPageProps) {
  return (
    <AppointmentListPage
      scope="today"
      title="Sesiones de hoy"
      emptyTitle="Sin sesiones para hoy"
      emptyText="No tienes sesiones programadas para la fecha de hoy."
      initialData={initialAppointments}
    />
  );
}

export function PsyUpcomingSessionsPage({ initialAppointments }: SessionPageProps) {
  return (
    <AppointmentListPage
      scope="upcoming"
      title="Próximas sesiones"
      emptyTitle="Sin sesiones próximas"
      emptyText="No hay sesiones confirmadas o pendientes en los próximos días."
      initialData={initialAppointments}
    />
  );
}

export default PsyTodaySessionsPage;
