import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    habit: {
      findFirst: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

import { prisma } from '@/lib/db/prisma';
import { deleteHabit, registerHabitProgress, updateHabit } from './habits.service';

const userId = 'user-123';
const otherHabitId = 'habit-other';

beforeEach(() => {
  vi.resetAllMocks();
  (prisma.habit.update as any).mockResolvedValue({ id: otherHabitId, progress: 10 });
  (prisma.habit.delete as any).mockResolvedValue({});
});

describe('habits.service — ownership por titular', () => {
  it('updateHabit lanza "Hábito no encontrado" si pertenece a otro usuario', async () => {
    (prisma.habit.findFirst as any).mockResolvedValue(null);

    await expect(updateHabit(userId, otherHabitId, { title: 'X' })).rejects.toThrow('Hábito no encontrado');
    expect(prisma.habit.findFirst).toHaveBeenCalledWith({ where: { id: otherHabitId, userId } });
    expect(prisma.habit.update).not.toHaveBeenCalled();
  });

  it('registerHabitProgress lanza "Hábito no encontrado" si pertenece a otro usuario', async () => {
    (prisma.habit.findFirst as any).mockResolvedValue(null);

    await expect(registerHabitProgress(userId, otherHabitId, 10)).rejects.toThrow('Hábito no encontrado');
    expect(prisma.habit.findFirst).toHaveBeenCalledWith({ where: { id: otherHabitId, userId } });
    expect(prisma.habit.update).not.toHaveBeenCalled();
  });

  it('deleteHabit lanza "Hábito no encontrado" si pertenece a otro usuario', async () => {
    (prisma.habit.findFirst as any).mockResolvedValue(null);

    await expect(deleteHabit(userId, otherHabitId)).rejects.toThrow('Hábito no encontrado');
    expect(prisma.habit.findFirst).toHaveBeenCalledWith({ where: { id: otherHabitId, userId } });
    expect(prisma.habit.delete).not.toHaveBeenCalled();
  });
});
