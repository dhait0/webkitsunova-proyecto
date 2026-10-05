'use client';

import { useCallback, useState } from 'react';
import {
  getAdminUsers,
  updateUserStatus,
  deleteUser,
  updateUserRole,
  updateUserProfile,
  resetUserPassword,
  approveUser,
  resendConfirmationEmail,
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
import AdminModal from '@/components/admin/AdminModal';
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
  { value: 'PENDING', label: 'Pendiente' },
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
  const [editTarget, setEditTarget] = useState<AdminUser | null>(null);
  const [editForm, setEditForm] = useState({ email: '', username: '', firstName: '', lastName: '' });

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

  function openEdit(user: AdminUser) {
    setEditTarget(user);
    setEditForm({
      email: user.email,
      username: user.username ?? '',
      firstName: user.firstName ?? '',
      lastName: user.lastName ?? '',
    });
  }

  async function handleEditSave() {
    if (!editTarget) return;
    setPendingUserId(editTarget.id);
    try {
      const res = await updateUserProfile(editTarget.id, {
        email: editForm.email || undefined,
        username: editForm.username || undefined,
        firstName: editForm.firstName || undefined,
        lastName: editForm.lastName || undefined,
      });
      if (res.success) {
        updateRow(editTarget.id, {
          email: editForm.email,
          username: editForm.username || null,
          firstName: editForm.firstName || null,
          lastName: editForm.lastName || null,
        });
        toasts.success('Usuario actualizado');
        setEditTarget(null);
      } else {
        toasts.error(res.message);
      }
    } catch (err) {
      toasts.error((err as Error).message || 'Error al actualizar usuario');
    } finally {
      setPendingUserId(null);
    }
  }

  async function handleResetPassword(userId: string) {
    setPendingUserId(userId);
    try {
      const res = await resetUserPassword(userId);
      if (res.success) {
        toasts.success('Correo de restablecimiento enviado');
      } else {
        toasts.error(res.message);
      }
    } catch (err) {
      toasts.error((err as Error).message || 'Error al restablecer contraseña');
    } finally {
      setPendingUserId(null);
    }
  }

  async function handleApprove(userId: string) {
    setPendingUserId(userId);
    try {
      const res = await approveUser(userId);
      if (res.success) {
        updateRow(userId, { status: 'ACTIVE' });
        toasts.success('Usuario aprobado');
      } else {
        toasts.error(res.message);
      }
    } catch (err) {
      toasts.error((err as Error).message || 'Error al aprobar usuario');
    } finally {
      setPendingUserId(null);
    }
  }

  async function handleResendConfirmation(userId: string) {
    setPendingUserId(userId);
    try {
      const res = await resendConfirmationEmail(userId);
      if (res.success) {
        toasts.success('Correo de confirmación reenviado');
      } else {
        toasts.error(res.message);
      }
    } catch (err) {
      toasts.error((err as Error).message || 'Error al reenviar confirmación');
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
        const isPending = user.status === 'PENDING';
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
            {isPending ? (
              <>
                <button
                  type="button"
                  className="admin-btn admin-btn-primary"
                  onClick={() => handleApprove(user.id)}
                  disabled={busy}
                >
                  <Icon name="check" size={12} />
                  Aprobar
                </button>
                <button
                  type="button"
                  className="admin-btn admin-btn-ghost"
                  onClick={() => handleResendConfirmation(user.id)}
                  disabled={busy}
                >
                  <Icon name="mail" size={12} />
                  Reenviar confirmación
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="admin-btn admin-btn-ghost"
                  onClick={() => openEdit(user)}
                  disabled={busy}
                >
                  <Icon name="pencil" size={12} />
                  Editar
                </button>
                <button
                  type="button"
                  className="admin-btn admin-btn-ghost"
                  onClick={() => handleResetPassword(user.id)}
                  disabled={busy}
                >
                  <Icon name="lock" size={12} />
                  Reset
                </button>
              </>
            )}
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

      <AdminModal
        open={editTarget !== null}
        title="Editar usuario"
        onClose={() => setEditTarget(null)}
      >
        {editTarget ? (
          <div className="admin-form">
            <label className="field">
              <span>Email</span>
              <input
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
              />
            </label>
            <label className="field">
              <span>Nombre de usuario</span>
              <input
                type="text"
                value={editForm.username}
                onChange={(e) => setEditForm((f) => ({ ...f, username: e.target.value }))}
              />
            </label>
            <label className="field">
              <span>Nombre</span>
              <input
                type="text"
                value={editForm.firstName}
                onChange={(e) => setEditForm((f) => ({ ...f, firstName: e.target.value }))}
              />
            </label>
            <label className="field">
              <span>Apellido</span>
              <input
                type="text"
                value={editForm.lastName}
                onChange={(e) => setEditForm((f) => ({ ...f, lastName: e.target.value }))}
              />
            </label>
            <div className="admin-modal-actions">
              <button type="button" className="admin-btn admin-btn-ghost" onClick={() => setEditTarget(null)}>
                Cancelar
              </button>
              <button
                type="button"
                className="admin-btn admin-btn-primary"
                onClick={handleEditSave}
                disabled={pendingUserId === editTarget.id}
              >
                Guardar cambios
              </button>
            </div>
          </div>
        ) : null}
      </AdminModal>

      <AdminToaster {...toasts} />
    </div>
  );
}

export default AdminUserPage;
