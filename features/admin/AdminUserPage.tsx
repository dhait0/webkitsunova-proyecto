'use client';

import { useCallback, useState } from 'react';
import {
  getAdminUsers,
  updateUserStatus,
  deleteUser,
  updateUserRole,
  type AdminUser,
  type AdminUsersResponse,
} from '@/app/(admin)/admin/actions';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AdminTable from '@/components/admin/AdminTable';
import type { AdminColumn } from '@/components/admin/AdminTable';
import AdminToolbar from '@/components/admin/AdminToolbar';
import AdminPagination from '@/components/admin/AdminPagination';
import AdminEntityCell from '@/components/admin/AdminEntityCell';
import StatusBadge, { USER_STATUS_LABELS, userStatusTone } from '@/components/admin/StatusBadge';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import AdminToaster from '@/components/admin/AdminToaster';
import Icon from '@/components/admin/Icon';
import { AdminLoading, AdminEmptyState, AdminErrorState } from '@/components/admin/AdminStates';
import { getAdminPageHeading } from '@/components/admin/adminNav';
import type { FilterOption } from '@/components/admin/types';
import { useAdminList } from '@/hooks/useAdminList';
import { useToasts } from '@/hooks/useToasts';

const STATUS_OPTIONS: FilterOption[] = [
  { value: 'all', label: 'Todos los estados' },
  { value: 'ACTIVE', label: 'Activo' },
  { value: 'SUSPENDED', label: 'Suspendido' },
];

const ROLE_OPTIONS: FilterOption[] = [
  { value: 'all', label: 'Todos los roles' },
  { value: 'USER', label: 'Usuario' },
  { value: 'PSYCHOLOGIST', label: 'Psicólogo' },
  { value: 'ADMIN', label: 'Administrador' },
];

function formatDate(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
}

function fullName(user: AdminUser) {
  if (user.firstName) return `${user.firstName} ${user.lastName ?? ''}`.trim();
  return user.username ?? '—';
}

type AdminUserPageProps = {
  initialData?: AdminUsersResponse;
};

function AdminUserPage({ initialData }: AdminUserPageProps = {}) {
  const toasts = useToasts();
  const { heading, subtitle } = getAdminPageHeading('/admin/users');

  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const [roleFilter, setRoleFilter] = useState<string>('all');

  const fetchUsers = useCallback(
    (query: { search: string; status: string; page: number; limit: number }) =>
      getAdminUsers({
        page: query.page,
        limit: query.limit,
        search: query.search || undefined,
        status: query.status !== 'all' ? query.status : undefined,
        role: roleFilter !== 'all' ? roleFilter : undefined,
      }),
    [roleFilter]
  );

  const selectRows = useCallback((payload: AdminUsersResponse) => payload.users, []);

  const {
    rows,
    pagination,
    loading,
    error,
    searchInput,
    statusFilter,
    setSearchInput,
    setStatusFilter,
    setPage,
    reload,
    updateRow,
    removeRow,
    clearFilters,
  } = useAdminList<AdminUser, AdminUsersResponse>({
    fetcher: fetchUsers,
    selectRows,
    idOf: (user) => user.id,
    limit: 10,
    errorMessage: 'Error al cargar usuarios',
  });

  async function handleStatusChange(userId: string, status: 'ACTIVE' | 'SUSPENDED') {
    setPendingUserId(userId);
    try {
      const res = await updateUserStatus(userId, status, 'Acción de administrador');
      if (res.success) {
        updateRow(userId, { status });
        toasts.success(status === 'ACTIVE' ? 'Usuario reactivado' : 'Usuario suspendido');
      }
    } catch (err) {
      toasts.error((err as Error).message || 'Error al actualizar estado');
    } finally {
      setPendingUserId(null);
    }
  }

  async function handleRoleChange(userId: string, role: 'USER' | 'PSYCHOLOGIST' | 'ADMIN') {
    setPendingUserId(userId);
    try {
      const res = await updateUserRole(userId, role);
      if (res.success) {
        updateRow(userId, { role });
        toasts.success('Rol actualizado');
      }
    } catch (err) {
      toasts.error((err as Error).message || 'Error al actualizar rol');
    } finally {
      setPendingUserId(null);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    const userId = deleteTarget.id;
    setPendingUserId(userId);
    try {
      const res = await deleteUser(userId);
      if (res.success) {
        removeRow(userId);
        toasts.success('Usuario eliminado');
        setDeleteTarget(null);
      }
    } catch (err) {
      toasts.error((err as Error).message || 'Error al eliminar usuario');
    } finally {
      setPendingUserId(null);
    }
  }

  const columns: AdminColumn<AdminUser>[] = [
    {
      key: 'user',
      header: 'Usuario',
      render: (user) => (
        <AdminEntityCell
          initials={(user.firstName?.[0] ?? user.email?.[0] ?? '?').toUpperCase()}
          name={fullName(user)}
        />
      ),
    },
    { key: 'email', header: 'Email', render: (user) => user.email },
    {
      key: 'role',
      header: 'Rol',
      render: (user) => (
        <span className="admin-badge admin-badge-role">{user.role}</span>
      ),
    },
    {
      key: 'status',
      header: 'Estado',
      render: (user) => (
        <StatusBadge tone={userStatusTone(user.status)}>
          {USER_STATUS_LABELS[user.status] ?? user.status}
        </StatusBadge>
      ),
    },
    {
      key: 'mfa',
      header: 'MFA',
      render: (user) =>
        user.twoFactorEnabled ? (
          <span className="verified-badge verificado">
            <Icon name="shieldCheck" size={12} />
            Activado
          </span>
        ) : (
          <span className="verified-badge pendiente">Sin MFA</span>
        ),
    },
    { key: 'createdAt', header: 'Creado', render: (user) => formatDate(user.createdAt) },
    {
      key: 'actions',
      header: 'Acciones',
      className: 'admin-table-actions-cell',
      render: (user) => {
        const busy = pendingUserId === user.id;
        const isActive = user.status === 'ACTIVE';
        return (
          <div className="admin-actions">
            <select
              value={user.role}
              onChange={(e) => handleRoleChange(user.id, e.target.value as 'USER' | 'PSYCHOLOGIST' | 'ADMIN')}
              disabled={busy}
              className="admin-select"
            >
              <option value="USER">Usuario</option>
              <option value="PSYCHOLOGIST">Psicólogo</option>
              <option value="ADMIN">Admin</option>
            </select>
            <button
              type="button"
              className="admin-btn admin-btn-ghost"
              onClick={() => handleStatusChange(user.id, isActive ? 'SUSPENDED' : 'ACTIVE')}
              disabled={busy}
            >
              {busy ? <span className="admin-btn-spinner" /> : <Icon name={isActive ? 'ban' : 'check'} size={12} />}
              {isActive ? 'Suspender' : 'Activar'}
            </button>
            <button
              type="button"
              className="admin-btn admin-btn-danger"
              onClick={() => setDeleteTarget(user)}
              disabled={busy}
              aria-label={`Eliminar a ${fullName(user)}`}
            >
              <Icon name="trash" size={12} />
              Eliminar
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="admin-page">
      <AdminPageHeader title={heading} subtitle={subtitle} />

      <AdminToolbar
        searchValue={searchInput}
        onSearchChange={setSearchInput}
        searchLabel="Buscar usuarios"
        searchPlaceholder="Buscar por nombre, email o username..."
        filterValue={statusFilter}
        onFilterChange={setStatusFilter}
        filterLabel="Estado"
        filterOptions={STATUS_OPTIONS}
        onClear={clearFilters}
        resultCount={loading ? undefined : pagination?.total}
        resultNoun="usuarios"
      />
      <select
        value={roleFilter}
        onChange={(e) => setRoleFilter(e.target.value)}
        className="admin-toolbar-select"
      >
        {ROLE_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>

      {error ? <AdminErrorState message={error} onRetry={reload} /> : null}

      {loading ? (
        <AdminLoading label="Cargando usuarios..." />
      ) : (
        <AdminTable
          columns={columns}
          rows={rows}
          rowKey={(user) => user.id}
          empty={
            <AdminEmptyState
              icon="👤"
              message="No se encontraron usuarios"
              hint={searchInput || statusFilter !== 'all' ? 'Prueba a cambiar los filtros.' : undefined}
            />
          }
        />
      )}

      <AdminPagination pagination={pagination} onPageChange={setPage} noun="usuarios" />

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Eliminar usuario"
        danger
        busy={pendingUserId === deleteTarget?.id}
        message={
          <>
            Vas a eliminar a <strong>{deleteTarget ? fullName(deleteTarget) : ''}</strong> (
            {deleteTarget?.email}). Esta acción no se puede deshacer y eliminará también su perfil.
          </>
        }
        confirmLabel="Eliminar definitivamente"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />

      <AdminToaster {...toasts} />
    </div>
  );
}

export default AdminUserPage;
