import { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import type { AdminOutletContext } from '@/layouts/AdminLayout';
import { getAdminUserStats, getAdminPsyStats } from '@/lib/api';

type UserStats = {
  total: number;
  active: number;
  suspended: number;
  pending: number;
};

type PsyStats = {
  total: number;
  approved: number;
  pending: number;
  suspended: number;
};

function StatCard({ label, value, icon }: { label: string; value: number; icon: string }) {
  return (
    <div className="admin-stat-card">
      <div className="admin-stat-icon">{icon}</div>
      <div className="admin-stat-content">
        <div className="admin-stat-value">{value}</div>
        <div className="admin-stat-label">{label}</div>
      </div>
    </div>
  );
}

function AdminDashboardPage() {
  const { roleLabel, displayName } = useOutletContext<AdminOutletContext>();
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [psyStats, setPsyStats] = useState<PsyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
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
    loadStats();
  }, [loadStats]);

  if (error) {
    return (
      <div className="admin-content-block">
        <div className="admin-error">{error}</div>
      </div>
    );
  }

  return (
    <div className="admin-content-block">
      <div className="admin-page-header">
        <h1>Panel de control</h1>
        <p>
          Bienvenido, <strong>{displayName}</strong> — {roleLabel}
        </p>
      </div>

      {loading ? (
        <div className="admin-loading">
          <div className="admin-spinner" />
          <p>Cargando estadísticas...</p>
        </div>
      ) : (
        <>
          <div className="admin-section">
            <h2>Usuarios</h2>
            <div className="admin-stats-grid">
              {userStats && (
                <>
                  <StatCard label="Total" value={userStats.total} icon="👥" />
                  <StatCard label="Activos" value={userStats.active} icon="✅" />
                  <StatCard label="Suspendidos" value={userStats.suspended} icon="⛔" />
                  <StatCard label="Pendientes" value={userStats.pending} icon="⏳" />
                </>
              )}
            </div>
          </div>

          <div className="admin-section">
            <h2>Psicólogos</h2>
            <div className="admin-stats-grid">
              {psyStats && (
                <>
                  <StatCard label="Total" value={psyStats.total} icon="🧠" />
                  <StatCard label="Aprobados" value={psyStats.approved} icon="✅" />
                  <StatCard label="En revisión" value={psyStats.pending} icon="⏳" />
                  <StatCard label="Suspendidos" value={psyStats.suspended} icon="⛔" />
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default AdminDashboardPage;
