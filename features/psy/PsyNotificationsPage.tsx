'use client';

import { useState } from 'react';
import Link from 'next/link';
import { getNotificationsAction, markAllNotificationsReadAction } from '@/app/(psychologist)/psy/notificaciones/actions';
import { useAsync } from '@/hooks/useAsync';
import { EmptyState, ErrorBlock, LoadingBlock, Panel } from '@/components/psy/PsyUi';
import { formatRelative } from '@/lib/utils/format';
import type { PsyNotification } from '@/lib/api';

const tabs = [
  { value: 'all', label: 'Todas' },
  { value: 'unread', label: 'No leídas' },
  { value: 'general', label: 'General' }
];

type Props = {
  initialData: { notifications: PsyNotification[]; unread: number };
};

function PsyNotificationsPage({ initialData }: Props) {
  const [filter, setFilter] = useState('all');
  const { data, loading, error, reload } = useAsync(
    () => getNotificationsAction({ filter, limit: 50 }),
    [filter]
  );

  const [busy, setBusy] = useState(false);

  async function handleMarkAll() {
    setBusy(true);
    try {
      await markAllNotificationsReadAction();
      await reload();
    } finally {
      setBusy(false);
    }
  }

  const notifications = data?.notifications ?? initialData.notifications;
  const unread = data?.unread ?? initialData.unread;

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
        {unread} sin leer
      </p>

      {loading && !data ? <LoadingBlock label="Cargando notificaciones..." /> : null}
      {error ? <ErrorBlock message={error} /> : null}

      {!loading && !error && notifications.length === 0 ? (
        <EmptyState title="Sin notificaciones" text="No hay nada nuevo por ahora." />
      ) : null}

      {notifications.length > 0 ? (
        <ul className="psy-notification-list">
          {notifications.map((notification) => (
            <li key={notification.id} className={notification.read ? 'is-read' : ''}>
              <div>
                <strong>{notification.title}</strong>
                <p>{notification.body}</p>
                <small>{formatRelative(notification.createdAt)}</small>
              </div>
              {notification.link ? (
                <Link href={notification.link} className="psy-table-link">
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
