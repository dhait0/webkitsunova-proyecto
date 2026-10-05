import Icon from './Icon';
import type { AdminPaginationMeta } from './types';

type AdminPaginationProps = {
  pagination: AdminPaginationMeta | null;
  onPageChange: (page: number) => void;
  noun: string;
};

function getWindow(page: number, totalPages: number): number[] {
  const start = Math.max(1, Math.min(page - 1, totalPages - 2));
  const end = Math.min(totalPages, start + 2);
  const pages: number[] = [];
  for (let i = start; i <= end; i += 1) pages.push(i);
  return pages;
}

export function AdminPagination({ pagination, onPageChange, noun }: AdminPaginationProps) {
  if (!pagination || pagination.totalPages <= 1) return null;

  const { page, totalPages, total } = pagination;
  const first = (page - 1) * pagination.limit + 1;
  const last = Math.min(page * pagination.limit, total);
  const pages = getWindow(page, totalPages);

  return (
    <nav className="admin-pagination" aria-label="Paginación">
      <span className="admin-pagination-info">
        Mostrando {first}-{last} de {total} {noun}
      </span>

      <div className="admin-pagination-controls">
        <button
          type="button"
          className="admin-btn admin-btn-ghost"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
        >
          <Icon name="chevronLeft" size={12} />
          Anterior
        </button>

        {pages.map((p) => (
          <button
            key={p}
            type="button"
            className={`admin-pagination-btn${p === page ? ' active' : ''}`}
            onClick={() => onPageChange(p)}
            aria-current={p === page ? 'page' : undefined}
            aria-label={`Ir a la página ${p}`}
          >
            {p}
          </button>
        ))}

        <button
          type="button"
          className="admin-btn admin-btn-ghost"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
        >
          Siguiente
          <Icon name="chevronRight" size={12} />
        </button>
      </div>
    </nav>
  );
}

export default AdminPagination;
