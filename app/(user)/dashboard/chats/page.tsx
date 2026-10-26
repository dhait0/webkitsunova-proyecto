import { requireUser } from '@/lib/auth/guard';
import { getConversationsAction, getMessagesAction } from '@/app/(user)/dashboard/mensajes/actions';
import ChatsPage from '@/features/user/ChatsPage';

type ConversationSummary = {
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

type ConversationsResult = {
  success: boolean;
  conversations: ConversationSummary[];
  unreadTotal: number;
  error?: string;
};

export default async function ChatsRoute({
  searchParams,
}: {
  searchParams: Promise<{ conversationId?: string }>;
}) {
  const session = await requireUser();
  const params = await searchParams;

  let conversations: ConversationsResult;
  let error: string | null = null;

  try {
    const result = await getConversationsAction({ filter: 'all', search: '' });
    if (!result.success) {
      error = result.error ?? 'No se pudieron cargar las conversaciones';
      conversations = {
        success: false,
        error: result.error ?? '',
        conversations: [],
        unreadTotal: 0,
      };
    } else {
      conversations = {
        success: true,
        conversations: result.conversations,
        unreadTotal: result.unreadTotal,
      };
    }
  } catch {
    error = 'No se pudieron cargar las conversaciones';
    conversations = {
      success: false,
      error,
      conversations: [],
      unreadTotal: 0,
    };
  }

  let messages = null;
  if (params.conversationId && conversations.success) {
    const result = await getMessagesAction(params.conversationId);
    messages = result && result.success ? result : null;
  }

  return (
    <ChatsPage
      conversations={conversations}
      messages={messages}
      error={error}
      conversationId={params.conversationId}
    />
  );
}
