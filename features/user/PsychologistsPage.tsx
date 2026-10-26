import Link from 'next/link';
import type { ListEligiblePsychologistsResult } from '@/services/psy/psychologists.service';

type Props = {
  data: ListEligiblePsychologistsResult;
  error: string | null;
};

export default function PsychologistsPage({ data, error }: Props) {
  const { psychologists, pagination } = data;

  if (error) {
    return (
      <section className="user-page">
        <div className="user-page-head">
          <div className="user-page-head-copy">
            <span className="user-eyebrow">Psicólogos</span>
            <h2 className="user-headline">Red clínica visible para elegir apoyo con criterio.</h2>
          </div>
        </div>
        <div className="user-card user-raise" role="alert">
          <p>{error}</p>
          <div>
            <Link
              href="/dashboard/psicologos"
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

  if (psychologists.length === 0) {
    return (
      <section className="user-page">
        <div className="user-page-head">
          <div className="user-page-head-copy">
            <span className="user-eyebrow">Psicólogos</span>
            <h2 className="user-headline">Red clínica visible para elegir apoyo con criterio.</h2>
          </div>
        </div>
        <div className="user-card user-raise">
          <p>
            No se encontraron psicólogos disponibles en este momento. Inténtalo de nuevo más tarde.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="user-page">
      <div className="user-page-head">
        <div className="user-page-head-copy">
          <span className="user-eyebrow">Psicólogos</span>
          <h2 className="user-headline">Red clínica visible para elegir apoyo con criterio.</h2>
          <p className="user-lede">
            Profesionales disponibles para acompañamiento cuando el proceso lo requiera.
          </p>
        </div>
      </div>

      <div className="user-grid">
        {psychologists.map((psychologist) => (
          <article key={psychologist.id} className="user-card user-card-stack user-raise">
            <div className="user-panel-head">
              {psychologist.specialties.length > 0 ? (
                <span className="user-eyebrow">{psychologist.specialties.join(', ')}</span>
              ) : null}
              <h2 className="user-title">{psychologist.name}</h2>
            </div>
            {psychologist.bio ? <p>{psychologist.bio}</p> : null}
            {psychologist.sessionPrice != null ? (
              <span className="user-pill">
                {psychologist.sessionPrice.toLocaleString('es-CO')} {psychologist.currency} / sesión
              </span>
            ) : null}
            {psychologist.isVerified ? (
              <span className="user-pill user-pill--ok">Verificado</span>
            ) : null}
            {psychologist.isAcceptingNew ? (
              <span className="user-pill user-pill--ok">Aceptando pacientes</span>
            ) : null}
            <div>
              <button className="user-btn user-btn--quiet" type="button">
                Ver perfil
              </button>
            </div>
          </article>
        ))}
      </div>

      {pagination.totalPages > 1 && (
        <nav className="user-pagination" aria-label="Paginación de psicólogos">
          <span className="user-pagination-info">
            Mostrando página {pagination.page} de {pagination.totalPages} ({pagination.total} profesionales)
          </span>
          <div className="user-pagination-controls">
            {pagination.page > 1 && (
              <Link
                href={`/dashboard/psicologos?page=${pagination.page - 1}&limit=${pagination.limit}`}
                className="user-btn user-btn--quiet"
                aria-label="Página anterior"
              >
                Anterior
              </Link>
            )}
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
              <Link
                key={p}
                href={`/dashboard/psicologos?page=${p}&limit=${pagination.limit}`}
                className={`user-pagination-btn${p === pagination.page ? ' user-pagination-btn--active' : ''}`}
                aria-current={p === pagination.page ? 'page' : undefined}
                aria-label={`Ir a la página ${p}`}
              >
                {p}
              </Link>
            ))}
            {pagination.page < pagination.totalPages && (
              <Link
                href={`/dashboard/psicologos?page=${pagination.page + 1}&limit=${pagination.limit}`}
                className="user-btn user-btn--quiet"
                aria-label="Página siguiente"
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
