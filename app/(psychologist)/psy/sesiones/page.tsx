import { requireRole } from '@/lib/auth/guard';
import { listAppointments } from '@/services/psy/appointments.service';
import { PsyUpcomingSessionsPage } from '@/features/psy/SessionPages';

export default async function PsyUpcomingSessions() {
  const session = await requireRole('PSYCHOLOGIST');
  const initialData = await listAppointments(session.id, { scope: 'upcoming', limit: 50 });

  return <PsyUpcomingSessionsPage initialAppointments={{ appointments: initialData.appointments }} />;
}
