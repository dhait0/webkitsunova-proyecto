import { requireUser } from '@/lib/auth/guard';
import { listPatientAppointments } from '@/services/psy/appointments.service';
import AppointmentsPage from '@/features/user/AppointmentsPage';

export default async function AppointmentsRoute({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    limit?: string;
    scope?: string;
    status?: string;
  }>;
}) {
  const session = await requireUser();
  const params = await searchParams;

  let data;
  let error: string | null = null;

  try {
    data = await listPatientAppointments(session.id, {
      page: params.page ?? '1',
      limit: params.limit ?? '10',
      scope: params.scope ?? 'upcoming',
      status: params.status ?? '',
    });
  } catch (caught) {
    error = caught instanceof Error ? caught.message : 'No se pudieron cargar las citas';
    data = {
      appointments: [],
      pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
    };
  }

  return <AppointmentsPage data={data} error={error} />;
}
