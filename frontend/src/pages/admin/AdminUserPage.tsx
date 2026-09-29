import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getAdminUsers,
  updateUserStatus,
  deleteUser,
  type AdminUser,
  type AdminUsersResponse,
} from '@/lib/api';

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Activo',
  SUSPENDED: 'Suspendido',
};

const STATUS_OPTIONS = [
  { value: 'all', label: 'Todos' },
  { value: 'ACTIVE', label: 'Activo' },
  { value: 'SUSPENDED', label: 'Suspendido' },
];

function AdminUserPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [pagination, setPagination] = useState<AdminUsersResponse['pagination'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  const limit = 10;

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params: { search?: string; status?: string; page: number; limit: number } = {
        page: currentPage,
        limit,
      };
      if (searchTerm.trim()) params.search = searchTerm.trim();
      if (statusFilter !== 'all') params.status = statusFilter;

      const res = await getAdminUsers(params);
      setUsers(res.users);
      setPagination(res.pagination);
    } catch (err) {
      setError((err as Error).message || 'Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, statusFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

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

  async function handleStatusChange(userId: string, newStatus: 'ACTIVE' | 'SUSPENDED') {
    setUpdatingUserId(userId);
    try {
      const res = await updateUserStatus(userId, newStatus, 'Acción de administrador');
      if (res.success) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, status: newStatus } : u))
        );
      }
    } catch (err) {
      setError((err as Error).message || 'Error al actualizar estado');
    } finally {
      setUpdatingUserId(null);
    }
  }

  async function handleDelete(userId: string) {
    if (!confirm('¿Estás seguro de eliminar este usuario? Esta acción no se puede deshacer.')) {
      return;
    }
    setDeletingUserId(userId);
    try {
      const res = await deleteUser(userId);
      if (res.success) {
        setUsers((prev) => prev.filter((u) => u.id !== userId));
      }
    } catch (err) {
      setError((err as Error).message || 'Error al eliminar usuario');
    } finally {
      setDeletingUserId(null);
    }
  }

  const totalPages = pagination?.totalPages ?? 0;

  return (
    <div className="admin-content-block">
      <div className="admin-page-header">
        <h1>Usuarios</h1>
        <p>Gestiona los usuarios registrados en la plataforma.</p>
      </div>

      <div className="admin-filters-bar">
        <div className="admin-search-box">
          <i className="fa-solid fa-magnifying-glass" />
          <input
            type="text"
            placeholder="Buscar por nombre, email o username..."
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
          <p>Cargando usuarios...</p>
        </div>
      ) : (
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Email</th>
                <th>Estado</th>
                <th>MFA</th>
                <th>Creado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="admin-empty-state">
                    No se encontraron usuarios
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div className="admin-user-cell">
                        <span className="admin-user-avatar">
                          {(user.firstName?.[0] ?? user.email?.[0] ?? '?').toUpperCase()}
                        </span>
                        <span className="admin-user-name">
                          {user.firstName
                            ? `${user.firstName} ${user.lastName ?? ''}`.trim()
                            : user.username ?? '-'}
                        </span>
                      </div>
                    </td>
                    <td>{user.email}</td>
                    <td>
                      <span className={`status-badge status-${user.status.toLowerCase()}`}>
                        {STATUS_LABELS[user.status] ?? user.status}
                      </span>
                    </td>
                    <td>
                      {user.twoFactorEnabled ? (
                        <span className="verified-badge verified">
                          <i className="fa-solid fa-shield-check" /> Activado
                        </span>
                      ) : (
                        <span className="verified-badge">Sin MFA</span>
                      )}
                    </td>
                    <td>{new Date(user.createdAt).toLocaleDateString('es-ES')}</td>
                    <td>
                      <div className="admin-actions">
                        {user.status === 'ACTIVE' ? (
                          <button
                            type="button"
                            className="admin-btn admin-btn-sm admin-btn-outline"
                            onClick={() => handleStatusChange(user.id, 'SUSPENDED')}
                            disabled={updatingUserId === user.id}
                          >
                            {updatingUserId === user.id ? '...' : 'Suspender'}
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="admin-btn admin-btn-sm admin-btn-outline"
                            onClick={() => handleStatusChange(user.id, 'ACTIVE')}
                            disabled={updatingUserId === user.id}
                          >
                            {updatingUserId === user.id ? '...' : 'Activar'}
                          </button>
                        )}
                        <button
                          type="button"
                          className="admin-btn admin-btn-sm admin-btn-danger"
                          onClick={() => handleDelete(user.id)}
                          disabled={deletingUserId === user.id}
                        >
                          {deletingUserId === user.id ? '...' : 'Eliminar'}
                        </button>
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

function StatusBadge({ status }: { status: string }) {
  return <span className={`status-badge status-${status}`}>{status}</span>;
}

export default AdminUserPage;
