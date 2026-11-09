import { requireUser } from '@/lib/auth/guard';
import { listUserHabits, type HabitsOverview } from '@/services/user/habits.service';
import { todayKey } from '@/services/user/habit-stats';
import HabitsPage from '@/features/user/HabitsPage';

const EMPTY: HabitsOverview = {
  today: todayKey(null),
  habits: [],
  summary: {
    active: 0,
    paused: 0,
    completed: 0,
    doneToday: 0,
    pendingToday: 0,
    bestCurrentStreak: null,
    averageProgress: null,
  },
};

export default async function HabitsRoute() {
  const session = await requireUser();
  const result = await listUserHabits(session.id);

  if (!result.success) {
    return <HabitsPage data={EMPTY} error={result.error} />;
  }

  return <HabitsPage data={result.overview} error={null} />;
}
