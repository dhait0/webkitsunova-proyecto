import { requireUser } from '@/lib/auth/guard';
import { listUserHabits, type UserHabit } from '@/services/user/habits.service';
import HabitsPage from '@/features/user/HabitsPage';

export default async function HabitsRoute() {
  const session = await requireUser();

  let data: { habits: UserHabit[] };
  let error: string | null = null;

  try {
    const result = await listUserHabits(session.id);

    if ('habits' in result) {
      data = { habits: result.habits };
    } else {
      error = result.error;
      data = { habits: [] };
    }
  } catch (caught) {
    error = caught instanceof Error ? caught.message : 'No se pudieron cargar los hábitos';
    data = { habits: [] };
  }

  return <HabitsPage data={data} error={error} />;
}
