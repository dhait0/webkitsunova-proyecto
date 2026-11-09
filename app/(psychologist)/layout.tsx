import { requireRole } from '@/lib/auth/guard';
import PsyLayout from '@/features/PsyLayout';
import PsyAdminNotice from '@/features/psy/PsyAdminNotice';
import { toAppRole } from '@/lib/auth/roles';

/**
 * `requireRole` admits ADMIN as well, so an administrator can open the
 * psychologist area. Its Server Actions still refuse non-psychologists (an
 * administrator has no psychologist data), so instead of rendering screens that
 * would throw `No autorizado` during the server render, an administrator gets a
 * notice with the way to the admin panel.
 */
export default async function PsychologistLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireRole('PSYCHOLOGIST');

  const isAdmin = toAppRole(session.role) === 'ADMIN';

  return <PsyLayout session={session}>{isAdmin ? <PsyAdminNotice /> : children}</PsyLayout>;
}
