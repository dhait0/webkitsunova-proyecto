'use server';

import { authorize } from '@/lib/auth/guard';
import { listConversations, listMessages, sendMessage, blockConversation } from '@/services/psy/messaging.service';

export async function getConversationsAction(query: Record<string, unknown>) {
  const session = await authorize(['PSYCHOLOGIST']);
  if (!session) throw new Error('No autorizado');
  return listConversations(session.id, query);
}

export async function getMessagesAction(conversationId: string) {
  const session = await authorize(['PSYCHOLOGIST']);
  if (!session) throw new Error('No autorizado');
  return listMessages(session.id, conversationId);
}

export async function sendMessageAction(conversationId: string, body: string) {
  const session = await authorize(['PSYCHOLOGIST']);
  if (!session) throw new Error('No autorizado');
  return sendMessage(session.id, conversationId, { body });
}

export async function blockConversationAction(conversationId: string) {
  const session = await authorize(['PSYCHOLOGIST']);
  if (!session) throw new Error('No autorizado');
  return blockConversation(session.id, conversationId);
}
