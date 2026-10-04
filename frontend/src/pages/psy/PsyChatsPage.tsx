import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  blockPsyConversation,
  getPsyConversations,
  getPsyMessages,
  sendPsyMessage,
  type PsyConversation
} from '@/lib/api';
import { useAsync } from '@/hooks/useAsync';
import { EmptyState, ErrorBlock, LoadingBlock, Panel } from '@/components/psy/PsyUi';
import { formatRelative } from '@/utils/format';

const filters = [
  { value: 'all', label: 'Todos' },
  { value: 'unread', label: 'No leídos' },
  { value: 'groups', label: 'Grupos' }
];

export function PsyChatsPage() {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const { data, loading, error, reload } = useAsync<{
    conversations: PsyConversation[];
    unreadTotal: number;
  }>(() => getPsyConversations({ filter, search }), [filter, search]);

  return (
    <Panel eyebrow="Mensajería" title="Panel de Mensajes">
      <div className="psy-filters">
        {filters.map((item) => (
          <button
            key={item.value}
            type="button"
            className={filter === item.value ? 'psy-filter-chip is-active' : 'psy-filter-chip'}
            onClick={() => setFilter(item.value)}
          >
            {item.label}
          </button>
        ))}

        <input
          type="search"
          placeholder="Buscar conversaciones..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          aria-label="Buscar conversaciones"
        />
      </div>

      <p className="psy-hint">
        {data?.unreadTotal ? `${data.unreadTotal} sin leer` : 'No tienes mensajes sin leer'}
      </p>

      {loading ? <LoadingBlock label="Cargando conversaciones..." /> : null}
      {error ? <ErrorBlock message={error} /> : null}

      {!loading && !error && (data?.conversations.length ?? 0) === 0 ? (
        <EmptyState
          title="Sin conversaciones"
          text="Selecciona un paciente para comenzar a conversar."
        />
      ) : null}

      {data && data.conversations.length > 0 ? (
        <ul className="psy-conversation-list">
          {data.conversations.map((conversation) => (
            <li key={conversation.id}>
              <Link to={`/psy/mensajes/${conversation.id}`} className="psy-conversation-item">
                <div className="psy-conversation-avatar">
                  {conversation.title.slice(0, 1).toUpperCase()}
                </div>
                <div>
                  <strong>{conversation.title}</strong>
                  <span>{conversation.lastMessage?.body ?? 'Sin mensajes'}</span>
                </div>
                <small>{formatRelative(conversation.lastMessageAt)}</small>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="psy-panel-actions">
        <button type="button" className="secondary-btn" onClick={() => void reload()}>
          Actualizar
        </button>
      </div>
    </Panel>
  );
}

type MessagesResponse = {
  conversation: PsyConversation;
  messages: Array<{
    id: string;
    senderId: string;
    senderName: string;
    body: string;
    createdAt: string;
  }>;
};

export function PsyChatDetailPage({ conversationId }: { conversationId: string }) {
  const { data, loading, error, reload } = useAsync<MessagesResponse>(
    () => getPsyMessages(conversationId),
    [conversationId]
  );
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [blocked, setBlocked] = useState(false);

  async function handleSend(event: FormEvent) {
    event.preventDefault();
    setSending(true);
    setSendError(null);

    try {
      await sendPsyMessage(conversationId, draft.trim());
      setDraft('');
      await reload();
    } catch (caught) {
      setSendError(caught instanceof Error ? caught.message : 'No se pudo enviar el mensaje');
    } finally {
      setSending(false);
    }
  }

  async function handleBlock() {
    await blockPsyConversation(conversationId);
    setBlocked(true);
    await reload();
  }

  if (loading) return <LoadingBlock label="Cargando conversación..." />;
  if (error) return <ErrorBlock message={error} />;
  if (!data) return <ErrorBlock message="Conversación no encontrada" />;

  const isBlocked = blocked || data.conversation.blocked;

  return (
    <Panel eyebrow="Mensajería" title={data.conversation.title}>
      {sendError ? <ErrorBlock message={sendError} /> : null}

      {data.messages.length === 0 ? (
        <EmptyState
          title="Sin mensajes"
          text="Escribe el primer mensaje de esta conversación."
        />
      ) : (
        <ul className="psy-message-list">
          {data.messages.map((message) => (
            <li key={message.id} className="psy-message">
              <span className="psy-message-author">{message.senderName}</span>
              <p>{message.body}</p>
              <small>{formatRelative(message.createdAt)}</small>
            </li>
          ))}
        </ul>
      )}

      <form className="psy-form" onSubmit={handleSend}>
        <label className="field">
          <span>Mensaje</span>
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            rows={3}
            maxLength={4000}
            required
            disabled={isBlocked}
            placeholder="Escribe tu mensaje..."
          />
        </label>

        <div className="psy-panel-actions">
          <button type="submit" className="primary-btn" disabled={sending || isBlocked}>
            {sending ? 'Enviando...' : 'Enviar'}
          </button>
          <button type="button" className="secondary-btn" onClick={() => void handleBlock()}>
            Bloquear
          </button>
          <Link to="/psy/mensajes" className="secondary-btn">
            Volver
          </Link>
        </div>

        {isBlocked ? <p className="psy-hint">Esta conversación está bloqueada.</p> : null}
      </form>
    </Panel>
  );
}
