import { requireRole } from '@/lib/auth/guard';
import PsyLayout from '@/features/PsyLayout';

/**
 * `requireRole` admits ADMIN as well, so an administrator can inspect the
 * psychologist area. The psy services still refuse non-psychologists.
 */
export default async function PsychologistLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireRole('PSYCHOLOGIST');

  return <PsyLayout session={session}>{children}</PsyLayout>;
}
