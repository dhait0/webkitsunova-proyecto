'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAdmin } from '@/features/layout-context';
import type { AdminOutletContext } from '@/features/AdminLayout';
import { getAdminUserStats, getAdminPsyStats, type AdminUserStats, type AdminPsyStats } from '@/app/(admin)/admin/actions';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AdminStatCard from '@/components/admin/AdminStatCard';
import Icon from '@/components/admin/Icon';
import { AdminLoading, AdminErrorState } from '@/components/admin/AdminStates';
import { getAdminPageHeading } from '@/components/admin/adminNav';
import type { StatTone } from '@/components/admin/types';

type StatCard = { label: string; value: number; icon: string; tone: StatTone };

const USER_TONES: Record<'active' | 'suspended' | 'pending', StatTone> = {
  active: 'green',
  suspended: 'orange',
  pending: 'yellow',
};

const PSY_TONES: Record<'approved' | 'pending' | 'suspended', StatTone> = {
  approved: 'green',
  pending: 'yellow',
  suspended: 'orange',
};

type AdminDashboardPageProps = {
  initialUserStats?: AdminUserStats['stats'];
  initialPsyStats?: AdminPsyStats['stats'];
};

function AdminDashboardPage({ initialUserStats, initialPsyStats }: AdminDashboardPageProps = {}) {
  const router = useRouter();
  const { roleLabel, displayName } = useAdmin();
  const { heading, subtitle } = getAdminPageHeading('/admin');

  const [userStats, setUserStats] = useState<AdminUserStats['stats'] | null>(initialUserStats ?? null);
  const [psyStats, setPsyStats] = useState<AdminPsyStats['stats'] | null>(initialPsyStats ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [usersRes, psyRes] = await Promise.all([getAdminUserStats(), getAdminPsyStats()]);
      setUserStats(usersRes.stats);
      setPsyStats(psyRes.stats);
    } catch (err) {
      setError((err as Error).message || 'Error al cargar estadísticas');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (userStats === null && psyStats === null) {
      void loadStats();
    }
  }, [loadStats, userStats, psyStats]);

  const canShowLoading = userStats === null && psyStats === null;

  const userCards: StatCard[] = userStats
    ? [
        { label: 'Total', value: userStats.total, icon: '👥', tone: 'cyan' },
        { label: 'Activos', value: userStats.active, icon: '✅', tone: USER_TONES.active },
        {
          label: 'Suspendidos',
          value: userStats.suspended,
          icon: '⛔',
          tone: USER_TONES.suspended,
        },
        {
          label: 'Pendientes',
          value: userStats.pending,
          icon: '⏳',
          tone: USER_TONES.pending,
        },
      ]
    : [];

  const psyCards: StatCard[] = psyStats
    ? [
        { label: 'Total', value: psyStats.total, icon: '🧠', tone: 'purple' },
        { label: 'Aprobados', value: psyStats.approved, icon: '✅', tone: PSY_TONES.approved },
        {
          label: 'En revisión',
          value: psyStats.pending,
          icon: '⏳',
          tone: PSY_TONES.pending,
        },
        {
          label: 'Suspendidos',
          value: psyStats.suspended,
          icon: '⛔',
          tone: PSY_TONES.suspended,
        },
      ]
    : [];

  return (
    <div className="admin-page">
      <AdminPageHeader
        title={heading}
        subtitle={`${subtitle} Bienvenido, ${displayName} — ${roleLabel}.`}
      />

      {error ? (
        <AdminErrorState message={error} onRetry={loadStats} />
      ) : canShowLoading ? (
        <AdminLoading label="Cargando estadísticas..." />
      ) : (
        <>
          <section className="admin-section">
            <div className="admin-section-header">
              <h2>Usuarios</h2>
              <button
                type="button"
                className="admin-btn admin-btn-ghost"
                onClick={() => router.push('/admin/users')}
              >
                Gestionar
                <Icon name="arrowRight" size={12} />
              </button>
            </div>
            <div className="admin-stats-grid">
              {userCards.map((card) => (
                <AdminStatCard
                  key={card.label}
                  label={card.label}
                  value={card.value}
                  icon={card.icon}
                  tone={card.tone}
                  onClick={() => router.push('/admin/users')}
                />
              ))}
            </div>
          </section>

          <section className="admin-section">
            <div className="admin-section-header">
              <h2>Psicólogos</h2>
              <button
                type="button"
                className="admin-btn admin-btn-ghost"
                onClick={() => router.push('/admin/psychologists')}
              >
                Gestionar
                <Icon name="arrowRight" size={12} />
              </button>
            </div>
            <div className="admin-stats-grid">
              {psyCards.map((card) => (
                <AdminStatCard
                  key={card.label}
                  value={card.value}
                  label={card.label}
                  icon={card.icon}
                  tone={card.tone}
                  onClick={() => router.push('/admin/psychologists')}
                />
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

export default AdminDashboardPage;
