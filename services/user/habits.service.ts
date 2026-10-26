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
