import Link from 'next/link';

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

type Props = {
  data: AppointmentsData;
  error: string | null;
};

export default function AppointmentsPage({ data, error }: Props) {
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
        <div className="user-card user-raise">
          <p>No tienes citas agendadas en este momento.</p>
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
            Lista de tus sesiones reservadas con psicólogos.
          </p>
        </div>
      </div>

      <div className="user-list">
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
                <span className="user-eyebrow">{appointment.type}</span>
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
                      appointment.status === 'CONFIRMED'
                        ? 'user-pill--ok'
                        : appointment.status === 'CANCELLED'
                          ? 'user-pill--warn'
                          : ''
                    }`}
                  >
                    {appointment.status}
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
                href={`/dashboard/citas?page=${pagination.page - 1}&limit=${pagination.limit}`}
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
                href={`/dashboard/citas?page=${p}&limit=${pagination.limit}`}
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
                href={`/dashboard/citas?page=${pagination.page + 1}&limit=${pagination.limit}`}
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
