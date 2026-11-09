import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    profile: { findUnique: vi.fn() },
    habit: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    habitLog: {
      findMany: vi.fn(),
      upsert: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));

import { prisma } from '@/lib/db/prisma';
import {
  createHabit,
  deleteHabit,
  getHabitsOverview,
  setHabitCompletion,
  summarizeHabits,
  updateHabit,
  type UserHabit,
} from './habits.service';
import { computeHabitStats } from './habit-stats';

const userId = 'user-123';
const habitId = 'habit-1';
const NOW = new Date('2026-11-11T15:00:00Z'); // 10:00 in Bogotá, Wednesday

const habitRow = (over: Record<string, unknown> = {}) => ({
  id: habitId,
  userId,
  title: 'Caminar',
  description: null,
  progress: 0,
  status: 'active',
  targetPerWeek: 7,
  createdAt: new Date('2026-10-01T00:00:00Z'),
  ...over,
});

beforeEach(() => {
  vi.resetAllMocks();
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
  (prisma.profile.findUnique as any).mockResolvedValue({ timezone: 'America/Bogota' });
  (prisma.habit.findFirst as any).mockResolvedValue(habitRow());
  (prisma.habit.update as any).mockResolvedValue(habitRow());
  (prisma.habit.create as any).mockResolvedValue(habitRow());
  (prisma.habit.delete as any).mockResolvedValue({});
  (prisma.habitLog.upsert as any).mockResolvedValue({});
  (prisma.habitLog.deleteMany as any).mockResolvedValue({ count: 1 });
});

describe('habits.service — titularidad', () => {
  it('updateHabit, setHabitCompletion y deleteHabit rechazan un hábito ajeno', async () => {
    (prisma.habit.findFirst as any).mockResolvedValue(null);

    await expect(updateHabit(userId, habitId, { title: 'X' })).rejects.toThrow('Hábito no encontrado');
    await expect(setHabitCompletion(userId, habitId, { done: true })).rejects.toThrow('Hábito no encontrado');
    await expect(deleteHabit(userId, habitId)).rejects.toThrow('Hábito no encontrado');

    expect(prisma.habit.findFirst).toHaveBeenCalledWith({ where: { id: habitId, userId } });
    expect(prisma.habit.update).not.toHaveBeenCalled();
    expect(prisma.habitLog.upsert).not.toHaveBeenCalled();
    expect(prisma.habit.delete).not.toHaveBeenCalled();
  });
});

describe('createHabit / updateHabit', () => {
  it('crea con meta semanal acotada y estado activo', async () => {
    await createHabit(userId, { title: '  Leer  ', description: ' 15 min ', targetPerWeek: 12 });
    expect(prisma.habit.create).toHaveBeenCalledWith({
      data: { userId, title: 'Leer', description: '15 min', targetPerWeek: 7, status: 'active' },
    });
  });

  it('rechaza un título vacío', async () => {
    await expect(createHabit(userId, { title: '  ' })).rejects.toThrow('El título es obligatorio');
  });

  it('rechaza un estado que no existe', async () => {
    await expect(updateHabit(userId, habitId, { status: 'archivado' })).rejects.toThrow('Estado de hábito no válido');
    expect(prisma.habit.update).not.toHaveBeenCalled();
  });

  it('permite pausar y cambiar la meta', async () => {
    await updateHabit(userId, habitId, { status: 'paused', targetPerWeek: 3 });
    expect(prisma.habit.update).toHaveBeenCalledWith({
      where: { id: habitId },
      data: expect.objectContaining({ status: 'paused', targetPerWeek: 3 }),
    });
  });
});

describe('setHabitCompletion', () => {
  it('marca hoy con la fecha del día del usuario, no la del servidor', async () => {
    // 03:30Z del día 12 sigue siendo el 11 en Bogotá.
    vi.setSystemTime(new Date('2026-11-12T03:30:00Z'));

    const result = await setHabitCompletion(userId, habitId, { done: true });

    expect(result).toEqual({ date: '2026-11-11', done: true });
    expect(prisma.habitLog.upsert).toHaveBeenCalledWith({
      where: { habitId_date: { habitId, date: new Date('2026-11-11T00:00:00.000Z') } },
      create: { habitId, userId, date: new Date('2026-11-11T00:00:00.000Z') },
      update: {},
    });
  });

  it('es idempotente: repetir el mismo día usa upsert, no inserta duplicados', async () => {
    await setHabitCompletion(userId, habitId, { done: true });
    await setHabitCompletion(userId, habitId, { done: true });
    expect(prisma.habitLog.upsert).toHaveBeenCalledTimes(2);
    expect((prisma.habitLog.upsert as any).mock.calls[0][0].where).toEqual(
      (prisma.habitLog.upsert as any).mock.calls[1][0].where,
    );
  });

  it('desmarca un día borrando solo el registro de ese hábito y usuario', async () => {
    const result = await setHabitCompletion(userId, habitId, { date: '2026-11-10', done: false });
    expect(result).toEqual({ date: '2026-11-10', done: false });
    expect(prisma.habitLog.deleteMany).toHaveBeenCalledWith({
      where: { habitId, userId, date: new Date('2026-11-10T00:00:00.000Z') },
    });
  });

  it('rechaza días futuros, fechas inválidas y más antiguas que la ventana', async () => {
    await expect(setHabitCompletion(userId, habitId, { date: '2026-11-12', done: true })).rejects.toThrow('futuro');
    await expect(setHabitCompletion(userId, habitId, { date: '2026-02-30', done: true })).rejects.toThrow('Fecha no válida');
    await expect(setHabitCompletion(userId, habitId, { date: '2026-09-01', done: true })).rejects.toThrow('últimos 30 días');
    expect(prisma.habitLog.upsert).not.toHaveBeenCalled();
  });

  it('acepta el día más antiguo permitido', async () => {
    await expect(setHabitCompletion(userId, habitId, { date: '2026-10-12', done: true })).resolves.toBeDefined();
  });

  it('no registra cumplimientos de un hábito pausado o completado, pero sí permite desmarcar', async () => {
    (prisma.habit.findFirst as any).mockResolvedValue(habitRow({ status: 'paused' }));
    await expect(setHabitCompletion(userId, habitId, { done: true })).rejects.toThrow('Reactiva');
    await expect(setHabitCompletion(userId, habitId, { done: false })).resolves.toBeDefined();
  });
});

describe('getHabitsOverview', () => {
  it('calcula las estadísticas a partir de los registros persistidos', async () => {
    (prisma.habit.findMany as any).mockResolvedValue([habitRow(), habitRow({ id: 'habit-2', title: 'Leer', targetPerWeek: 3 })]);
    (prisma.habitLog.findMany as any).mockResolvedValue([
      { habitId, date: new Date('2026-11-11T00:00:00Z') },
      { habitId, date: new Date('2026-11-10T00:00:00Z') },
      { habitId: 'habit-2', date: new Date('2026-11-09T00:00:00Z') },
    ]);

    const overview = await getHabitsOverview(userId);

    expect(overview.today).toBe('2026-11-11');
    const [walk, read] = overview.habits;
    expect(walk.stats).toEqual(computeHabitStats(['2026-11-11', '2026-11-10'], 7, '2026-11-11'));
    expect(walk.stats.streak).toBe(2);
    expect(walk.stats.loggedToday).toBe(true);
    expect(read.stats.last7).toBe(1);
    expect(read.stats.loggedToday).toBe(false);
    expect(prisma.habitLog.findMany).toHaveBeenCalledWith({
      where: { userId },
      select: { habitId: true, date: true },
    });
  });

  it('devuelve un resumen vacío, sin porcentajes inventados, cuando no hay hábitos', async () => {
    (prisma.habit.findMany as any).mockResolvedValue([]);
    (prisma.habitLog.findMany as any).mockResolvedValue([]);

    const { summary } = await getHabitsOverview(userId);

    expect(summary).toEqual({
      active: 0, paused: 0, completed: 0, doneToday: 0, pendingToday: 0,
      bestCurrentStreak: null, averageProgress: null,
    });
  });
});

describe('summarizeHabits', () => {
  const view = (over: Partial<UserHabit> & { logged?: string[]; target?: number }): UserHabit => {
    const target = over.target ?? 7;
    return {
      id: 'x', title: 't', description: null, status: 'active', targetPerWeek: target,
      createdAt: '2026-10-01T00:00:00.000Z',
      stats: computeHabitStats(over.logged ?? [], target, '2026-11-11'),
      ...over,
    } as UserHabit;
  };

  it('cuenta solo hábitos activos para el hoy y el promedio', () => {
    const summary = summarizeHabits([
      view({ logged: ['2026-11-11', '2026-11-10'] }),
      view({ logged: [] }),
      view({ status: 'paused', logged: ['2026-11-11'] }),
      view({ status: 'completed' }),
    ]);

    expect(summary).toMatchObject({ active: 2, paused: 1, completed: 1, doneToday: 1, pendingToday: 1 });
    expect(summary.averageProgress).toBe(Math.round((29 + 0) / 2));
    expect(summary.bestCurrentStreak).toEqual({ value: 2, unit: 'days' });
  });
});
