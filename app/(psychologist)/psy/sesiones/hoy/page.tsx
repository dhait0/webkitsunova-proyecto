import { requireRole } from '@/lib/auth/guard';
import { listAppointments } from '@/services/psy/appointments.service';
import { PsyTodaySessionsPage } from '@/features/psy/SessionPages';

export default async function PsyTodaySessions() {
  const session = await requireRole('PSYCHOLOGIST');
  const initialData = await listAppointments(session.id, { scope: 'today', limit: 50 });

  return <PsyTodaySessionsPage initialAppointments={{ appointments: initialData.appointments }} />;
}
