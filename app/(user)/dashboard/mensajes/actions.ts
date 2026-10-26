'use server';

import { requireUser } from '@/lib/auth/guard';
import { prisma } from '@/lib/db/prisma';
import { listConversations, listMessages, sendMessage } from '@/services/psy/messaging.service';

export type SendMessageActionInput = {
  conversationId: string;
  body: string;
};

type OkResult = {
  ok: true;
};

type FailResult = {
  ok: false;
  error: string;
};

export type SendMessageActionResult = OkResult | FailResult;

/**
 * Acceso a mensajería desde el área de Usuario (S11).
 *
 * Reglas de seguridad:
 * - La identidad se obtiene exclusivamente de la sesión autenticada
 *   (`requireUser()`); nunca se acepta un `userId` del cliente.
 * - El servicio de mensajería verifica pertenencia a la conversación
 *   (`assertMembership`) antes de permitir lectura o envío: un usuario
 *   ajeno no puede leer ni escribir en conversaciones ajenas.
 * - Para el envío (operación sensible) se comprueba el estado real de
 *   la cuenta en base de datos (no el `ACTIVE` hardcodeado del guard).
 * - No se exponen conversaciones ajenas ni datos clínicos privados.
 */
export async function getConversationsAction(query: Record<string, unknown>) {
  let session: Awaited<ReturnType<typeof requireUser>>;

  try {
    session = await requireUser();
  } catch {
    return { success: false as const, error: 'No autenticado', conversations: [] };
  }

  return listConversations(session.id, query);
}

export async function getMessagesAction(conversationId: string) {
  let session: Awaited<ReturnType<typeof requireUser>>;

  try {
    session = await requireUser();
  } catch {
    return { success: false as const, error: 'No autenticado', messages: [] };
  }

  return listMessages(session.id, conversationId);
}

export async function sendMessageAction(
  input: SendMessageActionInput,
): Promise<SendMessageActionResult> {
  let session: Awaited<ReturnType<typeof requireUser>>;

  try {
    session = await requireUser();
  } catch {
    return { ok: false, error: 'No autenticado' };
  }

  // Estado real de la cuenta leído de la base de datos (operación sensible: escritura).
  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: { id: true, role: true, status: true },
  });

  if (!user || user.role !== 'USER') {
    return { ok: false, error: 'Cuenta de usuario no válida.' };
  }

  if (user.status !== 'ACTIVE') {
    return { ok: false, error: 'La cuenta de usuario no está activa.' };
  }

  const result = await sendMessage(session.id, input.conversationId, {
    body: input.body,
  });

  if (!result) {
    return { ok: false, error: 'No tienes acceso a esta conversación.' };
  }

  return { ok: true };
}
