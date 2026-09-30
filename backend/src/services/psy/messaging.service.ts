import { prisma } from '../../lib/prisma.js';
import { fullName } from './shared.js';
import { createNotification } from './notifications.service.js';

export type ConversationFilter = 'all' | 'unread' | 'groups';

async function assertMembership(conversationId: string, userId: string) {
  const membership = await prisma.conversationMember.findUnique({
    where: { conversationId_userId: { conversationId, userId } },
  });

  return membership ?? null;
}

export async function listConversations(userId: string, query: Record<string, unknown>) {
  const filter = (typeof query.filter === 'string' ? query.filter : 'all') as ConversationFilter;
  const search = typeof query.search === 'string' ? query.search.trim() : '';

  const memberships = await prisma.conversationMember.findMany({
    where: { userId },
    include: {
      conversation: {
        include: {
          members: { include: { user: { include: { profile: true } } } },
          messages: { orderBy: { createdAt: 'desc' }, take: 1 },
        },
      },
    },
    orderBy: { conversation: { updatedAt: 'desc' } },
  });

  const visible = memberships
    .filter((membership) => membership.conversation.blockedByUserId === null)
    .map((membership) => {
      const others = membership.conversation.members.filter((member) => member.userId !== userId);
      const lastMessage = membership.conversation.messages[0] ?? null;
      const unreadCount = lastMessage && lastMessage.senderId !== userId && membership.lastReadAt === null
        ? 1
        : 0;

      return {
        id: membership.conversation.id,
        isGroup: membership.conversation.isGroup,
        isSystem: membership.conversation.isSystem,
        title:
          membership.conversation.title ||
          (others.length === 1
            ? fullName(others[0].user.profile) || 'Participante'
            : `${others.length + 1} participantes`),
        participants: others.map((member) => ({
          userId: member.userId,
          name: fullName(member.user.profile) || member.user.email,
          role: member.role,
          avatarUrl: member.user.profile?.avatarUrl ?? null,
        })),
        lastMessage: lastMessage
          ? {
              body: lastMessage.body,
              senderId: lastMessage.senderId,
              createdAt: lastMessage.createdAt.toISOString(),
            }
          : null,
        lastMessageAt: lastMessage?.createdAt.toISOString() ?? membership.conversation.createdAt.toISOString(),
        unread: unreadCount,
        blocked: membership.conversation.blockedByUserId !== null,
      };
    });

  const filtered = visible.filter((conversation) => {
    if (filter === 'unread' && conversation.unread === 0) return false;
    if (filter === 'groups' && !conversation.isGroup) return false;
    if (search && !conversation.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return {
    success: true as const,
    conversations: filtered,
    unreadTotal: visible.reduce((acc, conversation) => acc + conversation.unread, 0),
  };
}

export async function listMessages(userId: string, conversationId: string) {
  const membership = await assertMembership(conversationId, userId);

  if (!membership) {
    return null;
  }

  const [conversation, messages] = await Promise.all([
    prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { members: { include: { user: { include: { profile: true } } } } },
    }),
    prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      take: 200,
      include: { sender: { include: { profile: true } } },
    }),
  ]);

  if (!conversation) {
    return null;
  }

  const now = new Date();
  await prisma.conversationMember.update({
    where: { id: membership.id },
    data: { lastReadAt: now },
  });

  return {
    success: true as const,
    conversation: {
      id: conversation.id,
      isGroup: conversation.isGroup,
      isSystem: conversation.isSystem,
      title:
        conversation.title ||
        fullName(
          conversation.members.find((member) => member.userId !== userId)?.user.profile,
        ) ||
        'Participante',
      participants: conversation.members
        .filter((member) => member.userId !== userId)
        .map((member) => ({
          userId: member.userId,
          name: fullName(member.user.profile) || member.user.email,
          role: member.role,
          avatarUrl: member.user.profile?.avatarUrl ?? null,
        })),
      blocked: conversation.blockedByUserId !== null,
    },
    messages: messages.map((message) => ({
      id: message.id,
      senderId: message.senderId,
      senderName: fullName(message.sender.profile) || 'Participante',
      body: message.body,
      attachmentUrl: message.attachmentUrl,
      attachmentName: message.attachmentName,
      createdAt: message.createdAt.toISOString(),
    })),
  };
}

export async function sendMessage(
  userId: string,
  conversationId: string,
  input: { body: string; attachmentUrl?: string | null; attachmentName?: string | null },
) {
  const membership = await assertMembership(conversationId, userId);

  if (!membership) {
    return null;
  }

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: { blockedByUserId: true },
  });

  if (conversation?.blockedByUserId) {
    throw new Error('La conversación está bloqueada');
  }

  const message = await prisma.message.create({
    data: {
      conversationId,
      senderId: userId,
      body: input.body,
      attachmentUrl: input.attachmentUrl ?? null,
      attachmentName: input.attachmentName ?? null,
    },
  });

  await prisma.conversation.update({
    where: { id: conversationId },
    data: { updatedAt: new Date() },
  });

  await prisma.conversationMember.update({
    where: { id: membership.id },
    data: { lastReadAt: new Date() },
  });

  const recipients = await prisma.conversationMember.findMany({
    where: { conversationId, NOT: { userId } },
    select: { userId: true },
  });

  for (const recipient of recipients) {
    await createNotification({
      userId: recipient.userId,
      kind: 'message',
      title: 'Nuevo mensaje',
      body: input.body.slice(0, 120),
      link: `/psy/mensajes/${conversationId}`,
    });
  }

  return { success: true as const, message: { id: message.id, createdAt: message.createdAt.toISOString() } };
}

/** Mockup Psy 16 "Crear grupo" — psychologists may open a group chat. */
export async function createGroupConversation(userId: string, title: string, participantIds: string[]) {
  const participants = await prisma.user.findMany({
    where: { id: { in: participantIds }, role: 'USER', status: 'ACTIVE' },
    select: { id: true },
  });

  if (participants.length !== participantIds.length) {
    throw new Error('Uno o más participantes no son válidos');
  }

  return prisma.conversation.create({
    data: {
      isGroup: true,
      title,
      createdById: userId,
      members: {
        create: [
          { userId, role: 'PSYCHOLOGIST' },
          ...participants.map((participant) => ({ userId: participant.id, role: 'USER' as const })),
        ],
      },
    },
  });
}

export async function startDirectConversation(userId: string, participantId: string) {
  if (userId === participantId) {
    throw new Error('No puedes abrir un chat contigo mismo');
  }

  const participant = await prisma.user.findUnique({
    where: { id: participantId },
    select: { id: true, role: true, status: true },
  });

  if (!participant || participant.status !== 'ACTIVE') {
    throw new Error('El participante no está disponible');
  }

  const existing = await prisma.conversation.findFirst({
    where: {
      isGroup: false,
      AND: [
        { members: { some: { userId } } },
        { members: { some: { userId: participantId } } },
      ],
    },
    select: { id: true },
  });

  if (existing) {
    return existing;
  }

  return prisma.conversation.create({
    data: {
      isGroup: false,
      createdById: userId,
      members: {
        create: [
          { userId, role: 'PSYCHOLOGIST' },
          { userId: participantId, role: participant.role },
        ],
      },
    },
  });
}

export async function blockConversation(userId: string, conversationId: string) {
  const membership = await assertMembership(conversationId, userId);

  if (!membership) {
    return false;
  }

  await prisma.conversation.update({
    where: { id: conversationId },
    data: { blockedByUserId: userId },
  });

  return true;
}
