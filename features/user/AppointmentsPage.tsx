import Link from 'next/link';
import CancelAppointmentButton from './CancelAppointmentButton';

export type PatientAppointment = {
  id: string;
  psychologistUserId: string;
  psychologistName: string;
  startsAt: string;
  endsAt: string;
  type: string;
  status: string;
  reason: string;
};

type AppointmentsData = {
  appointments: PatientAppointment[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

const TYPE_LABELS: Record<string, string> = {
  FIRST_SESSION: 'Primera sesión',
  FOLLOW_UP: 'Seguimiento',
  URGENT: 'Urgente',
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendiente',
  CONFIRMED: 'Confirmada',
  CANCELLED: 'Cancelada',
  COMPLETED: 'Completada',
};

type Props = {
  data: AppointmentsData;
  error: string | null;
  scope?: 'upcoming' | 'past';
};

const STATUS_NOTES: Record<string, string> = {
  PENDING: 'Esperando la respuesta de tu psicólogo.',
  CANCELLED: 'Esta cita fue cancelada.',
  NO_SHOW: 'No se registró asistencia.',
};

function ScopeTabs({ scope }: { scope: 'upcoming' | 'past' }) {
  return (
    <nav className="user-scope-tabs" aria-label="Filtrar citas">
      <Link
        href="/dashboard/citas?scope=upcoming"
        className={`user-pagination-btn${scope === 'upcoming' ? ' user-pagination-btn--active' : ''}`}
        aria-current={scope === 'upcoming' ? 'page' : undefined}
        prefetch={false}
      >
        Próximas
      </Link>
      <Link
        href="/dashboard/citas?scope=past"
        className={`user-pagination-btn${scope === 'past' ? ' user-pagination-btn--active' : ''}`}
        aria-current={scope === 'past' ? 'page' : undefined}
        prefetch={false}
      >
        Historial
      </Link>
    </nav>
  );
}

export default function AppointmentsPage({ data, error, scope = 'upcoming' }: Props) {
  const { appointments, pagination } = data;

  if (error) {
    return (
      <section className="user-page">
        <div className="user-page-head">
          <div className="user-page-head-copy">
            <span className="user-eyebrow">Citas</span>
            <h2 className="user-headline">Tus sesiones con psicólogos</h2>
          </div>
        </div>
        <div className="user-card user-raise" role="alert">
          <p>{error}</p>
          <div>
            <Link
              href="/dashboard/citas"
              className="user-btn user-btn--primary"
              type="button"
              prefetch={false}
            >
              Reintentar
            </Link>
          </div>
        </div>
      </section>
    );
  }

  if (appointments.length === 0) {
    return (
      <section className="user-page">
        <div className="user-page-head">
          <div className="user-page-head-copy">
            <span className="user-eyebrow">Citas</span>
            <h2 className="user-headline">Tus sesiones con psicólogos</h2>
          </div>
        </div>
        <ScopeTabs scope={scope} />
        <div className="user-card user-raise">
          <p>
            {scope === 'past'
              ? 'Todavía no tienes citas pasadas.'
              : 'No tienes citas próximas. Elige un psicólogo y solicita una sesión.'}
          </p>
          {scope === 'upcoming' ? (
            <div>
              <Link className="user-btn user-btn--primary" href="/dashboard/psicologos" prefetch={false}>
                Ver psicólogos
              </Link>
            </div>
          ) : null}
        </div>
      </section>
    );
  }

  return (
    <section className="user-page">
      <div className="user-page-head">
        <div className="user-page-head-copy">
          <span className="user-eyebrow">Citas</span>
          <h2 className="user-headline">Tus sesiones con psicólogos</h2>
          <p className="user-lede">
            Tus solicitudes y sesiones con psicólogos. Una solicitud queda pendiente hasta que tu psicólogo la confirme.
          </p>
        </div>
      </div>

      <ScopeTabs scope={scope} />

      <div className="user-list user-list--cards">
        {appointments.map((appointment) => {
          const startsAt = new Date(appointment.startsAt).toLocaleString('es-CO', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          });

          return (
            <article key={appointment.id} className="user-card user-raise">
              <div className="user-panel-head">
                <span className="user-eyebrow">{TYPE_LABELS[appointment.type] ?? appointment.type}</span>
                <h2 className="user-title">{appointment.psychologistName}</h2>
              </div>
              <div className="user-profile-rows" style={{ marginTop: 16 }}>
                <div className="user-profile-row">
                  <span className="user-eyebrow">Fecha y hora</span>
                  <strong>{startsAt}</strong>
                </div>
                <div className="user-profile-row">
                  <span className="user-eyebrow">Estado</span>
                  <span
                    className={`user-pill ${
                      appointment.status === 'CONFIRMED' || appointment.status === 'COMPLETED'
                        ? 'user-pill--ok'
                        : appointment.status === 'PENDING' || appointment.status === 'CANCELLED'
                          ? 'user-pill--warn'
                          : ''
                    }`}
                  >
                    {STATUS_LABELS[appointment.status] ?? appointment.status}
                  </span>
                </div>
                {appointment.reason &&
                  appointment.reason !== 'Sin motivo especificado' && (
                    <div className="user-profile-row">
                      <span className="user-eyebrow">Motivo</span>
                      <strong>{appointment.reason}</strong>
                    </div>
                  )}
              </div>
              {STATUS_NOTES[appointment.status] ? (
                <p className="user-habit-note">{STATUS_NOTES[appointment.status]}</p>
              ) : null}
              {(appointment.status === 'PENDING' || appointment.status === 'CONFIRMED') &&
              new Date(appointment.startsAt).getTime() > Date.now() ? (
                <div className="user-appointment-actions">
                  <CancelAppointmentButton
                    appointmentId={appointment.id}
                    psychologistName={appointment.psychologistName}
                    pending={appointment.status === 'PENDING'}
                  />
                </div>
              ) : null}
            </article>
          );
        })}
      </div>

      {pagination.totalPages > 1 && (
        <nav className="user-pagination" aria-label="Paginación de citas">
          <span className="user-pagination-info">
            Mostrando página {pagination.page} de {pagination.totalPages} (
            {pagination.total} citas)
          </span>
          <div className="user-pagination-controls">
            {pagination.page > 1 && (
              <Link
                href={`/dashboard/citas?scope=${scope}&page=${pagination.page - 1}&limit=${pagination.limit}`}
                className="user-btn user-btn--quiet"
                type="button"
                aria-label="Página anterior"
                prefetch={false}
              >
                Anterior
              </Link>
            )}
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
              <Link
                key={p}
                href={`/dashboard/citas?scope=${scope}&page=${p}&limit=${pagination.limit}`}
                className={`user-pagination-btn${p === pagination.page ? ' user-pagination-btn--active' : ''}`}
                type="button"
                aria-current={p === pagination.page ? 'page' : undefined}
                aria-label={`Ir a la página ${p}`}
                prefetch={false}
              >
                {p}
              </Link>
            ))}
            {pagination.page < pagination.totalPages && (
              <Link
                href={`/dashboard/citas?scope=${scope}&page=${pagination.page + 1}&limit=${pagination.limit}`}
                className="user-btn user-btn--quiet"
                type="button"
                aria-label="Página siguiente"
                prefetch={false}
              >
                Siguiente
              </Link>
            )}
          </div>
        </nav>
      )}
    </section>
  );
}
