import { prisma } from '@/lib/db/prisma';
import {
  addDays,
  clampTarget,
  computeHabitStats,
  isDateKey,
  todayKey,
  type DateKey,
  type HabitStats,
} from './habit-stats';

export const HABIT_STATUSES = ['active', 'paused', 'completed'] as const;
export type HabitStatus = (typeof HABIT_STATUSES)[number];

/** How far back a missed day can still be marked. */
export const HABIT_BACKFILL_DAYS = 30;

export type UserHabit = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  targetPerWeek: number;
  createdAt: string;
  stats: HabitStats;
};

export type HabitsSummary = {
  active: number;
  paused: number;
  completed: number;
  /** Active habits already done today. */
  doneToday: number;
  /** Active habits still to do today. */
  pendingToday: number;
  /** Longest current run among active habits, with its unit. */
  bestCurrentStreak: { value: number; unit: 'days' | 'weeks' } | null;
  /** Mean rolling-7-day progress of the active habits; null when there are none. */
  averageProgress: number | null;
};

export type HabitsOverview = {
  today: DateKey;
  habits: UserHabit[];
  summary: HabitsSummary;
};

const toKey = (date: Date): DateKey => date.toISOString().slice(0, 10);
const toDbDate = (key: DateKey): Date => new Date(`${key}T00:00:00.000Z`);

async function timeZoneOf(userId: string): Promise<string | null> {
  const profile = await prisma.profile.findUnique({ where: { userId }, select: { timezone: true } });
  return profile?.timezone ?? null;
}

export function summarizeHabits(habits: UserHabit[]): HabitsSummary {
  const active = habits.filter((h) => h.status === 'active');
  const streakOf = (h: UserHabit) => ({ value: h.stats.streak, unit: h.stats.streakUnit });
  const best = active
    .map(streakOf)
    .filter((s) => s.value > 0)
    // Days and weeks are not comparable: prefer the longer run in calendar time.
    .sort((a, b) => b.value * (b.unit === 'weeks' ? 7 : 1) - a.value * (a.unit === 'weeks' ? 7 : 1))[0];

  return {
    active: active.length,
    paused: habits.filter((h) => h.status === 'paused').length,
    completed: habits.filter((h) => h.status === 'completed').length,
    doneToday: active.filter((h) => h.stats.loggedToday).length,
    pendingToday: active.filter((h) => !h.stats.loggedToday).length,
    bestCurrentStreak: best ?? null,
    averageProgress:
      active.length === 0
        ? null
        : Math.round(active.reduce((sum, h) => sum + h.stats.progress7, 0) / active.length),
  };
}

/**
 * Habits of one user with statistics derived from the days they were done.
 * Scoped to the owner; exposes no other user's data.
 */
export async function getHabitsOverview(userId: string): Promise<HabitsOverview> {
  const today = todayKey(await timeZoneOf(userId));

  const [habits, logs] = await Promise.all([
    prisma.habit.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } }),
    prisma.habitLog.findMany({ where: { userId }, select: { habitId: true, date: true } }),
  ]);

  const daysByHabit = new Map<string, DateKey[]>();
  for (const log of logs) {
    const list = daysByHabit.get(log.habitId) ?? [];
    list.push(toKey(log.date));
    daysByHabit.set(log.habitId, list);
  }

  const views: UserHabit[] = habits.map((habit) => ({
    id: habit.id,
    title: habit.title,
    description: habit.description,
    status: habit.status,
    targetPerWeek: clampTarget(habit.targetPerWeek),
    createdAt: habit.createdAt.toISOString(),
    stats: computeHabitStats(daysByHabit.get(habit.id) ?? [], habit.targetPerWeek, today),
  }));

  return { today, habits: views, summary: summarizeHabits(views) };
}

export async function listUserHabits(
  userId: string,
): Promise<{ success: true; overview: HabitsOverview } | { success: false; error: string }> {
  try {
    return { success: true, overview: await getHabitsOverview(userId) };
  } catch (caught) {
    return {
      success: false,
      error: caught instanceof Error ? caught.message : 'No se pudieron cargar los hábitos',
    };
  }
}

export type HabitInput = {
  title: string;
  description?: string | null;
  targetPerWeek?: number;
};

export async function createHabit(userId: string, input: HabitInput) {
  const title = input.title?.trim();
  if (!title) {
    throw new Error('El título es obligatorio');
  }

  return prisma.habit.create({
    data: {
      userId,
      title,
      description: input.description?.trim() || null,
      targetPerWeek: clampTarget(input.targetPerWeek ?? 7),
      status: 'active',
    },
  });
}

export async function updateHabit(
  userId: string,
  habitId: string,
  input: {
    title?: string;
    description?: string | null;
    status?: string;
    targetPerWeek?: number;
  },
) {
  const existing = await prisma.habit.findFirst({ where: { id: habitId, userId } });
  if (!existing) {
    throw new Error('Hábito no encontrado');
  }

  if (input.status !== undefined && !HABIT_STATUSES.includes(input.status as HabitStatus)) {
    throw new Error('Estado de hábito no válido');
  }

  return prisma.habit.update({
    where: { id: habitId },
    data: {
      title: input.title?.trim(),
      description: input.description === undefined ? undefined : input.description?.trim() || null,
      status: input.status,
      targetPerWeek: input.targetPerWeek === undefined ? undefined : clampTarget(input.targetPerWeek),
    },
  });
}

/**
 * Marks or unmarks a habit as done on a day of the user's own calendar.
 * One row per habit and day (unique in the database), so repeating the call is
 * harmless. Only active habits can be logged, never a future day, and never
 * further back than HABIT_BACKFILL_DAYS.
 */
export async function setHabitCompletion(
  userId: string,
  habitId: string,
  input: { date?: string; done: boolean },
) {
  const habit = await prisma.habit.findFirst({ where: { id: habitId, userId } });
  if (!habit) {
    throw new Error('Hábito no encontrado');
  }

  const today = todayKey(await timeZoneOf(userId));
  const date = input.date ?? today;

  if (!isDateKey(date)) {
    throw new Error('Fecha no válida');
  }
  if (date > today) {
    throw new Error('No se puede registrar un día futuro');
  }
  if (date < addDays(today, -HABIT_BACKFILL_DAYS)) {
    throw new Error(`Solo se pueden registrar los últimos ${HABIT_BACKFILL_DAYS} días`);
  }

  if (!input.done) {
    await prisma.habitLog.deleteMany({ where: { habitId, userId, date: toDbDate(date) } });
    return { date, done: false as const };
  }

  if (habit.status !== 'active') {
    throw new Error('Reactiva el hábito para registrar cumplimientos');
  }

  await prisma.habitLog.upsert({
    where: { habitId_date: { habitId, date: toDbDate(date) } },
    create: { habitId, userId, date: toDbDate(date) },
    update: {},
  });
  return { date, done: true as const };
}

export async function deleteHabit(userId: string, habitId: string) {
  const existing = await prisma.habit.findFirst({ where: { id: habitId, userId } });
  if (!existing) {
    throw new Error('Hábito no encontrado');
  }
  await prisma.habit.delete({ where: { id: habitId } });
  return { success: true };
}
