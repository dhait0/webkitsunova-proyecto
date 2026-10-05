'use client';

import { useCallback, useState } from 'react';
import {
  getPsychologists,
  approvePsychologist,
  type AdminPsychologist,
  type AdminPsychologistsResponse,
} from '@/app/(admin)/admin/actions';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AdminTable from '@/components/admin/AdminTable';
import type { AdminColumn } from '@/components/admin/AdminTable';
import AdminToolbar from '@/components/admin/AdminToolbar';
import AdminPagination from '@/components/admin/AdminPagination';
import AdminEntityCell from '@/components/admin/AdminEntityCell';
import StatusBadge, { PSY_STATUS_LABELS, psyStatusTone } from '@/components/admin/StatusBadge';
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
  { value: 'active', label: 'Activo' },
  { value: 'revision', label: 'En revisión' },
  { value: 'suspendido', label: 'Suspendido' },
];

function fullName(psy: AdminPsychologist) {
  return psy.name?.trim() || psy.email;
}

type AdminPsychologistsPageProps = {
  initialData?: AdminPsychologistsResponse;
};

function AdminPsychologistsPage({ initialData }: AdminPsychologistsPageProps = {}) {
  const toasts = useToasts();
  const { heading, subtitle } = getAdminPageHeading('/admin/psychologists');

  const [pendingId, setPendingId] = useState<string | null>(null);
  const [detailTarget, setDetailTarget] = useState<AdminPsychologist | null>(null);

  const fetchPsychologists = useCallback(
    (query: { search: string; status: string; page: number; limit: number }) =>
      getPsychologists({
        page: query.page,
        limit: query.limit,
        search: query.search || undefined,
        status: query.status !== 'all' ? query.status : undefined,
      }),
    []
  );

  const selectRows = useCallback((payload: AdminPsychologistsResponse) => payload.psychologists, []);

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
    clearFilters,
  } = useAdminList<AdminPsychologist, AdminPsychologistsResponse>({
    fetcher: fetchPsychologists,
    selectRows,
    idOf: (psy) => psy.id,
    limit: 10,
    errorMessage: 'Error al cargar psicólogos',
  });

  async function handleApprove(psy: AdminPsychologist) {
    setPendingId(psy.id);
    try {
      const res = await approvePsychologist(psy.id);
      if (res.success) {
        updateRow(psy.id, { verified: true, status: 'activo' });
        toasts.success(psy.verified ? 'Verificación renovada' : 'Psicólogo aprobado correctamente');
      }
    } catch (err) {
      toasts.error((err as Error).message || 'Error al aprobar psicólogo');
    } finally {
      setPendingId(null);
    }
  }

  const columns: AdminColumn<AdminPsychologist>[] = [
    {
      key: 'psy',
      header: 'Psicólogo',
      render: (psy) => (
        <AdminEntityCell
          initials={(psy.name?.[0] ?? psy.email?.[0] ?? '?').toUpperCase()}
          name={fullName(psy)}
          meta={psy.email}
        />
      ),
    },
    {
      key: 'specialty',
      header: 'Especialidad',
      render: (psy) => psy.specialty || psy.specialties?.[0] || '—',
    },
    {
      key: 'status',
      header: 'Estado',
      render: (psy) => (
        <StatusBadge tone={psyStatusTone(psy.status)}>
          {PSY_STATUS_LABELS[psy.status] ?? psy.status}
        </StatusBadge>
      ),
    },
    {
      key: 'verified',
      header: 'Verificación',
      render: (psy) =>
        psy.verified ? (
          <span className="verified-badge verificado">
            <Icon name="shieldCheck" size={12} />
            Verificado
          </span>
        ) : (
          <span className="verified-badge pendiente">Pendiente</span>
        ),
    },
    { key: 'patients', header: 'Pacientes', render: (psy) => psy.patients },
    {
      key: 'rating',
      header: 'Rating',
      render: (psy) =>
        psy.rating > 0 ? (
          <div className="rating">
            <Icon name="star" size={12} className="rating-stars" />
            <span className="rating-value">
              {psy.rating.toFixed(1)} ({psy.reviews})
            </span>
          </div>
        ) : (
          <span className="admin-muted">—</span>
        ),
    },
    {
      key: 'actions',
      header: 'Acciones',
      className: 'admin-table-actions-cell',
      render: (psy) => {
        const busy = pendingId === psy.id;
        return (
          <div className="admin-actions">
            <button
              type="button"
              className="admin-btn admin-btn-ghost"
              onClick={() => setDetailTarget(psy)}
            >
              <Icon name="eye" size={12} />
              Ver
            </button>
            {psy.status !== 'suspendido' ? (
              <button
                type="button"
                className="admin-btn admin-btn-primary"
                onClick={() => handleApprove(psy)}
                disabled={busy}
              >
                {busy ? <span className="admin-btn-spinner" /> : <Icon name="check" size={12} />}
                {psy.verified ? 'Re-verificar' : 'Aprobar'}
              </button>
            ) : null}
          </div>
        );
      },
    },
  ];

  const specialties = detailTarget?.specialties ?? [];

  return (
    <div className="admin-page">
      <AdminPageHeader title={heading} subtitle={subtitle} />

      <AdminToolbar
        searchValue={searchInput}
        onSearchChange={setSearchInput}
        searchLabel="Buscar psicólogos"
        searchPlaceholder="Buscar por nombre, especialidad o email..."
        filterValue={statusFilter}
        onFilterChange={setStatusFilter}
        filterLabel="Estado"
        filterOptions={STATUS_OPTIONS}
        onClear={clearFilters}
        resultCount={loading ? undefined : pagination?.total}
        resultNoun="psicólogos"
      />

      {error ? <AdminErrorState message={error} onRetry={reload} /> : null}

      {loading ? (
        <AdminLoading label="Cargando psicólogos..." />
      ) : (
        <AdminTable
          columns={columns}
          rows={rows}
          rowKey={(psy) => psy.id}
          empty={
            <AdminEmptyState
              icon="🧠"
              message="No se encontraron psicólogos"
              hint={searchInput || statusFilter !== 'all' ? 'Prueba a cambiar los filtros.' : undefined}
            />
          }
        />
      )}

      <AdminPagination pagination={pagination} onPageChange={setPage} noun="psicólogos" />

      <AdminModal
        open={detailTarget !== null}
        title="Perfil del psicólogo"
        onClose={() => setDetailTarget(null)}
      >
        {detailTarget ? (
          <>
            <div className="admin-detail-identity">
              <span className="admin-entity-avatar" aria-hidden="true">
                {(detailTarget.name?.[0] ?? '?').toUpperCase()}
              </span>
              <div>
                <strong>{fullName(detailTarget)}</strong>
                <span>{detailTarget.email}</span>
              </div>
            </div>

            <div className="admin-detail-grid">
              <div className="admin-detail-item">
                <span className="admin-detail-label">Estado</span>
                <span className="admin-detail-value">
                  <StatusBadge tone={psyStatusTone(detailTarget.status)}>
                    {PSY_STATUS_LABELS[detailTarget.status] ?? detailTarget.status}
                  </StatusBadge>
                </span>
              </div>
              <div className="admin-detail-item">
                <span className="admin-detail-label">Verificación</span>
                <span className="admin-detail-value">
                  {detailTarget.verified ? 'Verificado' : 'Pendiente'}
                </span>
              </div>
              <div className="admin-detail-item">
                <span className="admin-detail-label">País</span>
                <span className="admin-detail-value">{detailTarget.country || '—'}</span>
              </div>
              <div className="admin-detail-item">
                <span className="admin-detail-label">Teléfono</span>
                <span className="admin-detail-value">{detailTarget.phone || '—'}</span>
              </div>
              <div className="admin-detail-item">
                <span className="admin-detail-label">Tarifa por sesión</span>
                <span className="admin-detail-value">
                  {detailTarget.sessionPrice != null
                    ? `${detailTarget.sessionPrice.toLocaleString('es-ES')} COP`
                    : '—'}
                </span>
              </div>
              <div className="admin-detail-item">
                <span className="admin-detail-label">Rating</span>
                <span className="admin-detail-value">
                  {detailTarget.rating > 0
                    ? `${detailTarget.rating.toFixed(1)} (${detailTarget.reviews} reseñas)`
                    : 'Sin valoraciones'}
                </span>
              </div>
            </div>

            <div className="admin-detail-item admin-detail-item--full">
              <span className="admin-detail-label">Especialidades</span>
              <span className="admin-detail-value">
                {specialties.length > 0 ? (
                  <span className="admin-tag-list">
                    {specialties.map((specialty) => (
                      <span className="admin-tag" key={specialty}>
                        {specialty}
                      </span>
                    ))}
                  </span>
                ) : (
                  detailTarget.specialty || '—'
                )}
              </span>
            </div>

            <div className="admin-detail-item admin-detail-item--full">
              <span className="admin-detail-label">Biografía</span>
              <span className="admin-detail-value admin-detail-value--multiline">
                {detailTarget.bio || 'Sin biografía registrada.'}
              </span>
            </div>
          </>
        ) : null}
      </AdminModal>

      <AdminToaster {...toasts} />
    </div>
  );
}

export default AdminPsychologistsPage;
