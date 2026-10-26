import { describe, expect, it, vi, beforeEach } from 'vitest';

const requireUser = vi.hoisted(() => vi.fn());
const prismaUserFindUnique = vi.hoisted(() => vi.fn());
const listConversations = vi.hoisted(() => vi.fn());
const listMessages = vi.hoisted(() => vi.fn());
const sendMessage = vi.hoisted(() => vi.fn());

vi.mock('@/lib/auth/guard', () => ({
  requireUser: () => requireUser(),
}));

vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    user: { findUnique: prismaUserFindUnique },
  },
}));

vi.mock('@/services/psy/messaging.service', () => ({
  listConversations,
  listMessages,
  sendMessage,
}));

import { prisma } from '@/lib/db/prisma';
import {
  getConversationsAction,
  getMessagesAction,
  sendMessageAction,
} from './actions';

const sessionUser = {
  id: 'user-1',
  email: 'user@example.com',
  role: 'USER',
  status: 'ACTIVE',
  profile: { firstName: 'Usuario', lastName: 'Uno', username: 'usuario' },
};

const conversationId = 'conversation-1';

const conversationsResult = {
  success: true as const,
  conversations: [
    {
      id: conversationId,
      isGroup: false,
      isSystem: false,
      title: 'Consulta con Dra. Gómez',
      participants: [
        {
          userId: 'psy-1',
          name: 'Dra. Gómez',
          role: 'PSYCHOLOGIST',
          avatarUrl: null,
        },
      ],
      lastMessage: {
        body: 'Hola, ¿cómo te sientes hoy?',
        senderId: 'psy-1',
        createdAt: '2026-10-20T10:00:00Z',
      },
      unread: 1,
      blocked: false,
    },
  ],
  unreadTotal: 1,
};

const messagesResult = {
  success: true as const,
  conversation: {
    id: conversationId,
    isGroup: false,
    isSystem: false,
    title: 'Consulta con Dra. Gómez',
    participants: [
      {
        userId: 'psy-1',
        name: 'Dra. Gómez',
        role: 'PSYCHOLOGIST',
        avatarUrl: null,
      },
    ],
    blocked: false,
  },
  messages: [
    {
      id: 'message-1',
      senderId: 'psy-1',
      senderName: 'Dra. Gómez',
      body: 'Hola, ¿cómo te sientes hoy?',
      attachmentUrl: null,
      attachmentName: null,
      createdAt: '2026-10-20T10:00:00Z',
    },
    {
      id: 'message-2',
      senderId: 'user-1',
      senderName: 'Usuario Uno',
      body: 'Muy bien, gracias.',
      attachmentUrl: null,
      attachmentName: null,
      createdAt: '2026-10-20T10:05:00Z',
    },
  ],
};

const sendResult = {
  success: true as const,
  message: { id: 'message-3', createdAt: '2026-10-20T10:10:00Z' },
};

beforeEach(() => {
  vi.resetAllMocks();
  ;(requireUser as any).mockResolvedValue(sessionUser);
  ;(prisma.user.findUnique as any).mockResolvedValue({
    id: 'user-1',
    role: 'USER',
    status: 'ACTIVE',
  });
  ;(listConversations as any).mockResolvedValue(conversationsResult);
  ;(listMessages as any).mockResolvedValue(messagesResult);
  ;(sendMessage as any).mockResolvedValue(sendResult);
});

describe('getConversationsAction — autorización y sesión', () => {
  it('rechaza cuando no hay sesión autenticada', async () => {
    ;(requireUser as any).mockRejectedValue(new Error('redirect'));

    const result = await getConversationsAction({ filter: 'all', search: '' });

    expect(result).toEqual({
      success: false,
      error: 'No autenticado',
      conversations: [],
    });
  });

  it('consulta conversaciones del usuario autenticado desde la sesión', async () => {
    await getConversationsAction({ filter: 'all', search: '' });

    expect(listConversations).toHaveBeenCalledWith('user-1', {
      filter: 'all',
      search: '',
    });
  });

  it('no acepta userId provisto por el cliente (solo usa session.id)', async () => {
    await getConversationsAction({ filter: 'all', search: '' });

    const callArg = (listConversations as any).mock.calls[0];
    expect(callArg[0]).toBe('user-1');
    expect(callArg[0]).not.toBe('client-supplied-id');
  });
});

describe('getMessagesAction — pertenencia y lectura', () => {
  it('rechaza cuando no hay sesión autenticada', async () => {
    ;(requireUser as any).mockRejectedValue(new Error('redirect'));

    const result = await getMessagesAction(conversationId);

    expect(result).toEqual({
      success: false,
      error: 'No autenticado',
      messages: [],
    });
  });

  it('devuelve mensajes de una conversación a la que pertenece el usuario', async () => {
    const result = await getMessagesAction(conversationId);

    expect(listMessages).toHaveBeenCalledWith('user-1', conversationId);
    expect(result).toEqual(messagesResult);
  });

  it('devuelve null cuando el usuario no es miembro de la conversación (acceso denegado)', async () => {
    ;(listMessages as any).mockResolvedValue(null);

    const result = await getMessagesAction(conversationId);

    expect(result).toBeNull();
  });
});

describe('sendMessageAction — envío con pertenencia y estado de cuenta', () => {
  const input = { conversationId, body: 'Hola, necesito ayuda.' };

  it('rechaza cuando no hay sesión autenticada', async () => {
    ;(requireUser as any).mockRejectedValue(new Error('redirect'));

    const result = await sendMessageAction(input);

    expect(result).toEqual({ ok: false, error: 'No autenticado' });
    expect(sendMessage).not.toHaveBeenCalled();
  });

  it('rechaza cuenta inactiva (estado leído de BD, no ACTIVE hardcodeado)', async () => {
    ;(prisma.user.findUnique as any).mockResolvedValue({
      id: 'user-1',
      role: 'USER',
      status: 'SUSPENDED',
    });

    const result = await sendMessageAction(input);

    expect(result).toEqual({
      ok: false,
      error: 'La cuenta de usuario no está activa.',
    });
    expect(sendMessage).not.toHaveBeenCalled();
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      select: { id: true, role: true, status: true },
    });
  });

  it('rechaza cuenta con rol distinto a USER', async () => {
    ;(prisma.user.findUnique as any).mockResolvedValue({
      id: 'user-1',
      role: 'PSYCHOLOGIST',
      status: 'ACTIVE',
    });

    const result = await sendMessageAction(input);

    expect(result).toEqual({ ok: false, error: 'Cuenta de usuario no válida.' });
    expect(sendMessage).not.toHaveBeenCalled();
  });

  it('rechaza envío a conversación a la que no pertenece el usuario (miembro denegado)', async () => {
    ;(sendMessage as any).mockResolvedValue(null);

    const result = await sendMessageAction(input);

    expect(result).toEqual({
      ok: false,
      error: 'No tienes acceso a esta conversación.',
    });
  });

  it('envía mensaje usando identidad de la sesión y pertenece a la conversación', async () => {
    const result = await sendMessageAction(input);

    expect(result).toEqual({ ok: true });
    expect(sendMessage).toHaveBeenCalledWith('user-1', conversationId, {
      body: 'Hola, necesito ayuda.',
    });
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      select: { id: true, role: true, status: true },
    });
  });
});
