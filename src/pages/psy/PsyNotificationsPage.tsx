import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  getPsyNotifications,
  markAllPsyNotificationsRead,
  type PsyNotification
} from '@/lib/api';
import { useAsync } from '@/hooks/useAsync';
import { EmptyState, ErrorBlock, LoadingBlock, Panel } from '@/components/psy/PsyUi';
import { formatRelative } from '@/utils/format';

const tabs = [
  { value: 'all', label: 'Todas' },
  { value: 'unread', label: 'No leídas' },
  { value: 'general', label: 'General' }
];

function PsyNotificationsPage() {
  const [filter, setFilter] = useState('all');
  const { data, loading, error, reload } = useAsync<{
    notifications: PsyNotification[];
    unread: number;
  }>(() => getPsyNotifications({ filter, limit: 50 }), [filter]);

  const [busy, setBusy] = useState(false);

  async function handleMarkAll() {
    setBusy(true);
    try {
      await markAllPsyNotificationsRead();
      await reload();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Panel eyebrow="Notificaciones" title="Notificaciones">
      <div className="psy-filters">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            className={filter === tab.value ? 'psy-filter-chip is-active' : 'psy-filter-chip'}
            onClick={() => setFilter(tab.value)}
          >
            {tab.label}
          </button>
        ))}

        <button
          type="button"
          className="secondary-btn"
          onClick={() => void handleMarkAll()}
          disabled={busy}
        >
          Marcar todas como leídas
        </button>
      </div>

      <p className="psy-hint">
        {data ? `${data.unread} sin leer` : 'Cargando notificaciones...'}
      </p>

      {loading ? <LoadingBlock label="Cargando notificaciones..." /> : null}
      {error ? <ErrorBlock message={error} /> : null}

      {!loading && !error && (data?.notifications.length ?? 0) === 0 ? (
        <EmptyState title="Sin notificaciones" text="No hay nada nuevo por ahora." />
      ) : null}

      {data && data.notifications.length > 0 ? (
        <ul className="psy-notification-list">
          {data.notifications.map((notification) => (
            <li key={notification.id} className={notification.read ? 'is-read' : ''}>
              <div>
                <strong>{notification.title}</strong>
                <p>{notification.body}</p>
                <small>{formatRelative(notification.createdAt)}</small>
              </div>
              {notification.link ? (
                <Link to={notification.link} className="psy-table-link">
                  Ver
                </Link>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </Panel>
  );
}

export default PsyNotificationsPage;
