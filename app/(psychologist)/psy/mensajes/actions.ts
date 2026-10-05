'use server';

import { getSessionUser } from '@/lib/auth/guard';
import { listConversations, listMessages, sendMessage, blockConversation } from '@/services/psy/messaging.service';

export async function getConversationsAction(query: Record<string, unknown>) {
  const session = await getSessionUser();
  if (!session) throw new Error('No autenticado');
  return listConversations(session.id, query);
}

export async function getMessagesAction(conversationId: string) {
  const session = await getSessionUser();
  if (!session) throw new Error('No autenticado');
  return listMessages(session.id, conversationId);
}

export async function sendMessageAction(conversationId: string, body: string) {
  const session = await getSessionUser();
  if (!session) throw new Error('No autenticado');
  return sendMessage(session.id, conversationId, { body });
}

export async function blockConversationAction(conversationId: string) {
  const session = await getSessionUser();
  if (!session) throw new Error('No autenticado');
  return blockConversation(session.id, conversationId);
}
