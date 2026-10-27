import { prisma } from '@/lib/db/prisma';

export type UserHabit = {
  id: string;
  title: string;
  description?: string | null;
  progress: number;
  status: string;
};

export type HabitsData = {
  habits: UserHabit[];
};

/**
 * Lista los hábitos de un usuario, aislados por titular.
 * Solo expone campos públicos (id, title, description, progress, status).
 * Migración propuesta en supabase/migrations/20240101000002_habits_module.sql
 * (no aplicada; el modelo Habit no existe en BD hasta que se aplique).
 */
export async function listUserHabits(userId: string): Promise<{
  success: boolean;
  habits: UserHabit[];
} | { success: boolean; error: string }> {
  try {
    const habits = await prisma.habit.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });

    return {
      success: true as const,
      habits: habits.map((habit) => ({
        id: habit.id,
        title: habit.title,
        description: habit.description,
        progress: habit.progress,
        status: habit.status,
      })),
    };
  } catch (caught) {
    return {
      success: false as const,
      error: caught instanceof Error ? caught.message : 'No se pudieron cargar los hábitos',
    };
  }
}

export async function createHabit(userId: string, input: { title: string; description?: string | null }) {
  if (!input.title || input.title.trim().length === 0) {
    throw new Error('El título es obligatorio');
  }
  const habit = await prisma.habit.create({
    data: {
      userId,
      title: input.title.trim(),
      description: input.description?.trim() || null,
      progress: 0,
      status: 'active',
    },
  });
  return habit;
}

export async function updateHabit(userId: string, habitId: string, input: { title?: string; description?: string | null; status?: string }) {
  const existing = await prisma.habit.findFirst({
    where: { id: habitId, userId },
  });
  if (!existing) {
    throw new Error('Hábito no encontrado');
  }
  const habit = await prisma.habit.update({
    where: { id: habitId },
    data: {
      title: input.title?.trim(),
      description: input.description === undefined ? undefined : input.description?.trim() || null,
      status: input.status,
    },
  });
  return habit;
}

export async function registerHabitProgress(userId: string, habitId: string, delta: number = 10) {
  const existing = await prisma.habit.findFirst({
    where: { id: habitId, userId },
  });
  if (!existing) {
    throw new Error('Hábito no encontrado');
  }
  const progress = Math.min(100, Math.max(0, (existing.progress || 0) + delta));
  const habit = await prisma.habit.update({
    where: { id: habitId },
    data: { progress, updatedAt: new Date() },
  });
  return habit;
}

export async function deleteHabit(userId: string, habitId: string) {
  const existing = await prisma.habit.findFirst({
    where: { id: habitId, userId },
  });
  if (!existing) {
    throw new Error('Hábito no encontrado');
  }
  await prisma.habit.delete({
    where: { id: habitId },
  });
  return { success: true };
}
