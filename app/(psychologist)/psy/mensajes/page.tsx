import { requireRole } from '@/lib/auth/guard';
import { listConversations } from '@/services/psy/messaging.service';
import { PsyChatsPage } from '@/features/psy/PsyChatsPage';

export default async function PsyChats() {
  const session = await requireRole('PSYCHOLOGIST');
  const initialData = await listConversations(session.id, { filter: 'all', search: '' });

  return <PsyChatsPage initialData={initialData} />;
}
