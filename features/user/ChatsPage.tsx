'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { sendMessageAction } from '@/app/(user)/dashboard/mensajes/actions';

type Conversation = {
  id: string;
  title: string;
  participants: Array<{
    userId: string;
    name: string | null;
    role: string;
    avatarUrl: string | null;
  }>;
  lastMessage?: { body: string; senderId: string; createdAt: string } | null;
  unread: number;
  blocked: boolean;
};

type Message = {
  id: string;
  senderId: string;
  senderName: string;
  body: string;
  createdAt: string;
};

type ConversationsData = {
  success: boolean;
  conversations: Conversation[];
  unreadTotal: number;
  error?: string;
};

type MessagesData = {
  success: boolean;
  conversation: {
    id: string;
    title: string;
    participants: Array<{ userId: string; name: string | null; role: string }>;
    blocked: boolean;
  };
  messages: Message[];
} | null;

type Props = {
  conversations: ConversationsData;
  messages: MessagesData;
  error: string | null;
  conversationId?: string;
};

export default function ChatsPage({
  conversations,
  messages,
  error,
  conversationId,
}: Props) {
  const router = useRouter();
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ ok: boolean; error?: string } | null>(null);
  const [body, setBody] = useState('');

  const activeConversation = messages?.conversation;
  const activeMessages = messages?.messages ?? [];

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!conversationId || !activeConversation) return;
    if (!body.trim()) return;

    setSending(true);
    setSendResult(null);

    const result = await sendMessageAction({
      conversationId,
      body,
    });

    setSending(false);
    setSendResult(result);

    if (result.ok) {
      setTimeout(() => setBody(''), 0);
      router.refresh();
    }
  };

  if (error) {
    return (
      <section className="user-page">
        <div className="user-page-head">
          <div className="user-page-head-copy">
            <span className="user-eyebrow">Chats</span>
            <h2 className="user-headline">Tus conversaciones</h2>
          </div>
        </div>
        <div className="user-card user-raise" role="alert">
          <p>{error}</p>
        </div>
      </section>
    );
  }

  if (conversationId && !activeConversation) {
    return (
      <section className="user-page">
        <div className="user-page-head">
          <div className="user-page-head-copy">
            <span className="user-eyebrow">Chats</span>
            <h2 className="user-headline">Tus conversaciones</h2>
          </div>
        </div>
        <div className="user-card user-raise" role="alert">
          <p>No tienes acceso a esta conversación.</p>
        </div>
      </section>
    );
  }

  if (conversations.conversations.length === 0) {
    return (
      <section className="user-page">
        <div className="user-page-head">
          <div className="user-page-head-copy">
            <span className="user-eyebrow">Chats</span>
            <h2 className="user-headline">Tus conversaciones</h2>
            <p className="user-lede">
              No tienes conversaciones activas en este momento.
            </p>
          </div>
        </div>
        <div className="user-card user-raise">
          <p>No hay conversaciones disponibles.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="user-page">
      <div className="user-page-head">
        <div className="user-page-head-copy">
          <span className="user-eyebrow">Chats</span>
          <h2 className="user-headline">Tus conversaciones</h2>
          <p className="user-lede">
            Aquí puedes retomar mensajes pendientes y hablar con tus psicólogos.
          </p>
        </div>
      </div>

      <div className="user-panels">
        <div className="user-panel-card">
          <div className="user-panel-head">
            <span className="user-eyebrow">Conversaciones</span>
            <h2 className="user-title">Selecciona una conversación</h2>
          </div>
          <div className="user-list">
            {conversations.conversations.map((conv) => {
              const isSelected = conv.id === conversationId;
              return (
                <Link
                  key={conv.id}
                  href={`?conversationId=${conv.id}`}
                  className={`user-list-item${isSelected ? ' user-card--accent' : ''}`}
                  aria-current={isSelected ? 'true' : undefined}
                >
                  <div>
                    <strong>{conv.title}</strong>
                    <p>
                      {conv.participants.map((p) => p.name ?? 'Participante').join(', ')} ·
                      {conv.blocked
                        ? 'Bloqueada'
                        : conv.unread > 0
                          ? `${conv.unread} no leído`
                          : 'Sin mensajes nuevos'}
                    </p>
                  </div>
                  {conv.blocked && (
                    <span className="user-pill user-pill--warn">Bloqueada</span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        {conversationId && activeConversation && (
          <div className="user-panel-card">
            <div className="user-panel-head">
              <span className="user-eyebrow">Conversación</span>
              <h2 className="user-title">{activeConversation.title}</h2>
            </div>

            {activeConversation.blocked && (
              <div className="user-card user-raise" role="alert">
                <p>Esta conversación está bloqueada y no se pueden enviar mensajes nuevos.</p>
              </div>
            )}

            <div className="user-list">
              {activeMessages.length === 0 ? (
                <div className="user-list-item">
                  <p>No hay mensajes en esta conversación todavía.</p>
                </div>
              ) : (
                activeMessages.map((msg) => (
                  <div key={msg.id} className="user-list-item">
                    <div>
                      <strong>{msg.senderName}</strong>
                      <p>{msg.body}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {!activeConversation.blocked && (
              <form onSubmit={handleSend} className="user-card user-raise">
                <div
                  className="user-profile-rows"
                  style={{
                    borderTop: '1px solid var(--user-hairline)',
                    paddingTop: 16,
                  }}
                >
                  <div className="user-profile-row">
                    <label
                      htmlFor="message-body"
                      className="user-eyebrow"
                      style={{ display: 'block', marginBottom: 6 }}
                    >
                      Escribir mensaje
                    </label>
                    <textarea
                      id="message-body"
                      name="body"
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      rows={3}
                      disabled={sending}
                      placeholder="Escribe tu mensaje..."
                      style={{
                        width: '100%',
                        minHeight: 80,
                        padding: 10,
                        borderRadius: 'var(--user-r-control)',
                        border: '1px solid var(--user-hairline)',
                        background: 'var(--user-ground-2)',
                        color: 'var(--user-text)',
                        fontFamily: 'inherit',
                        fontSize: '0.9375rem',
                        resize: 'vertical',
                      }}
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                  <button
                    type="submit"
                    className="user-btn user-btn--primary"
                    disabled={sending || !body.trim()}
                  >
                    {sending ? 'Enviando...' : 'Enviar'}
                  </button>
                  {sendResult && !sendResult.ok && (
                    <span className="user-pill user-pill--warn">{sendResult.error}</span>
                  )}
                  {sendResult && sendResult.ok && (
                    <span className="user-pill user-pill--ok">Mensaje enviado</span>
                  )}
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
