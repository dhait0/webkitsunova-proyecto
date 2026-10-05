import { requireRole } from '@/lib/auth/guard';
import { listMessages } from '@/services/psy/messaging.service';
import { PsyChatDetailPage } from '@/features/psy/PsyChatsPage';

export default async function PsyChatDetail({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const session = await requireRole('PSYCHOLOGIST');
  const { conversationId } = await params;
  const initialData = await listMessages(session.id, conversationId);

  if (!initialData) {
    return null;
  }

  return <PsyChatDetailPage conversationId={conversationId} initialData={initialData} />;
}
