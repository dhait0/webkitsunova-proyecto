import AppointmentListPage from './AppointmentListPage';

export function PsyTodaySessionsPage() {
  return (
    <AppointmentListPage
      scope="today"
      title="Sesiones de hoy"
      emptyTitle="Sin sesiones para hoy"
      emptyText="No tienes sesiones programadas para la fecha de hoy."
    />
  );
}

export function PsyUpcomingSessionsPage() {
  return (
    <AppointmentListPage
      scope="upcoming"
      title="Próximas sesiones"
      emptyTitle="Sin sesiones próximas"
      emptyText="No hay sesiones confirmadas o pendientes en los próximos días."
    />
  );
}

export default PsyTodaySessionsPage;
