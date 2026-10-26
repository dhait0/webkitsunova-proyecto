import { requireUser } from '@/lib/auth/guard';
import AppointmentsClient from '@/features/user/AppointmentsClient';
import { getMyAppointmentsAction } from './actions';

export default async function Appointments() {
  const session = await requireUser();
  let appointments: Awaited<ReturnType<typeof getMyAppointmentsAction>> | null = null;
  try {
    appointments = await getMyAppointmentsAction({ scope: 'upcoming', page: 1, limit: 50 });
  } catch (error) {
    appointments = null;
  }

  return <AppointmentsClient session={{ ...session, status: session.status ?? 'PENDING' } as any} initialAppointments={appointments} />;
}
