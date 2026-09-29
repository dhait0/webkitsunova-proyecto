import { useState, useEffect, useCallback } from 'react';
import {
  getPsychologists,
  approvePsychologist,
  type AdminPsychologist,
  type AdminPsychologistsResponse,
} from '@/lib/api';

const STATUS_MAP: Record<string, string> = {
  activo: 'Activo',
  revision: 'En revisión',
  suspendido: 'Suspendido',
};

const STATUS_OPTIONS = [
  { value: 'all', label: 'Todos' },
  { value: 'active', label: 'Activo' },
  { value: 'revision', label: 'En revisión' },
  { value: 'suspendido', label: 'Suspendido' },
];

function AdminPsychologistsPage() {
  const [psychologists, setPsychologists] = useState<AdminPsychologist[]>([]);
  const [pagination, setPagination] = useState<AdminPsychologistsResponse['pagination'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const limit = 10;

  const fetchPsychologists = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params: { search?: string; status?: string; page: number; limit: number } = {
        page: currentPage,
        limit,
      };
      if (searchTerm.trim()) params.search = searchTerm.trim();
      if (statusFilter !== 'all') params.status = statusFilter;

      const res = await getPsychologists(params);
      setPsychologists(res.psychologists);
      setPagination(res.pagination);
    } catch (err) {
      setError((err as Error).message || 'Error al cargar psicólogos');
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, statusFilter]);

  useEffect(() => {
    fetchPsychologists();
  }, [fetchPsychologists]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleStatusFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  async function handleApprove(psyId: string) {
    setApprovingId(psyId);
    try {
      const res = await approvePsychologist(psyId);
      if (res.success) {
        setPsychologists((prev) =>
          prev.map((p) =>
            p.id === psyId ? { ...p, status: 'activo', verified: true } : p
          )
        );
      }
    } catch (err) {
      setError((err as Error).message || 'Error al aprobar psicólogo');
    } finally {
      setApprovingId(null);
    }
  }

  const totalPages = pagination?.totalPages ?? 0;

  return (
    <div className="admin-content-block">
      <div className="admin-page-header">
        <h1>Psicólogos</h1>
        <p>Administra las solicitudes y perfiles de psicólogos.</p>
      </div>

      <div className="admin-filters-bar">
        <div className="admin-search-box">
          <i className="fa-solid fa-magnifying-glass" />
          <input
            type="text"
            placeholder="Buscar por nombre, especialidad o email..."
            value={searchTerm}
            onChange={handleSearch}
          />
        </div>
        <select value={statusFilter} onChange={handleStatusFilter} className="admin-select">
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {error && <div className="admin-error">{error}</div>}

      {loading ? (
        <div className="admin-loading">
          <div className="admin-spinner" />
          <p>Cargando psicólogos...</p>
        </div>
      ) : (
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Psicólogo</th>
                <th>Especialidad</th>
                <th>Estado</th>
                <th>Pacientes</th>
                <th>Rating</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {psychologists.length === 0 ? (
                <tr>
                  <td colSpan={6} className="admin-empty-state">
                    No se encontraron psicólogos
                  </td>
                </tr>
              ) : (
                psychologists.map((psy) => (
                  <tr key={psy.id}>
                    <td>
                      <div className="admin-user-cell">
                        <span className="admin-user-avatar">
                          {(psy.name?.[0] ?? psy.email?.[0] ?? '?').toUpperCase()}
                        </span>
                        <div className="admin-user-info">
                          <span className="admin-user-name">{psy.name || '-'}</span>
                          <span className="admin-user-email">{psy.email}</span>
                        </div>
                      </div>
                    </td>
                    <td>{psy.specialty || (psy.specialties?.[0] ?? '-')}</td>
                    <td>
                      <span className={`status-badge status-${psy.status}`}>
                        {STATUS_MAP[psy.status] ?? psy.status}
                      </span>
                    </td>
                    <td>{psy.patients}</td>
                    <td>
                      {psy.rating > 0 ? (
                        <div className="rating">
                          <span className="rating-value">{psy.rating.toFixed(1)}</span>
                          <i className="fa-solid fa-star" />
                          <span className="rating-reviews">({psy.reviews})</span>
                        </div>
                      ) : (
                        <span className="muted">—</span>
                      )}
                    </td>
                    <td>
                      <div className="admin-actions">
                        {psy.status === 'revision' && (
                          <button
                            type="button"
                            className="admin-btn admin-btn-sm admin-btn-primary"
                            onClick={() => handleApprove(psy.id)}
                            disabled={approvingId === psy.id}
                          >
                            {approvingId === psy.id ? '...' : 'Aprobar'}
                          </button>
                        )}
                        {!psy.verified && psy.status === 'activo' && (
                          <span className="verified-badge">Pendiente verificación</span>
                        )}
                        {psy.status === 'activo' && (
                          <button
                            type="button"
                            className="admin-btn admin-btn-sm admin-btn-outline"
                            onClick={() => handleApprove(psy.id)}
                            disabled={approvingId === psy.id}
                          >
                            {approvingId === psy.id ? '...' : 'Re-verificar'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {pagination && totalPages > 1 && (
        <div className="admin-pagination">
          <button
            type="button"
            className="admin-btn admin-btn-sm admin-btn-outline"
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page <= 1}
          >
            Anterior
          </button>
          <span className="admin-pagination-info">
            Página {pagination.page} de {pagination.totalPages}
          </span>
          <button
            type="button"
            className="admin-btn admin-btn-sm admin-btn-outline"
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page >= totalPages}
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  );
}

export default AdminPsychologistsPage;
