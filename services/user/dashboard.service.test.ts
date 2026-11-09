import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    habit: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },
    appointment: {
      findFirst: vi.fn(),
      count: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
  },
}));

import { prisma } from '@/lib/db/prisma';
import { getUserDashboardSummary } from './dashboard.service';

const userId = 'user-123';
const memberSince = new Date('2026-03-15T10:00:00Z');
const nextStartsAt = new Date('2026-11-20T14:00:00Z');

beforeEach(() => {
  vi.resetAllMocks();
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-11-09T12:00:00Z'));

  (prisma.habit.findMany as any).mockResolvedValue([]);
  (prisma.habit.findFirst as any).mockResolvedValue(null);
  (prisma.appointment.findFirst as any).mockResolvedValue(null);
  (prisma.appointment.count as any).mockResolvedValue(0);
  (prisma.user.findUnique as any).mockResolvedValue({ createdAt: memberSince });
});

describe('getUserDashboardSummary', () => {
  it('calcula promedio de progreso de hábitos activos (redondeado)', async () => {
    (prisma.habit.findMany as any).mockResolvedValue([
      { progress: 10 },
      { progress: 20 },
      { progress: 31 },
    ]);
    (prisma.habit.findFirst as any).mockResolvedValue({ title: 'Respirar', progress: 10 });

    const result = await getUserDashboardSummary(userId);

    expect(result.activeHabits).toBe(3);
    expect(result.averageProgress).toBe(20); // (10+20+31)/3 = 20.33 -> 20
    expect(result.nextHabit).toEqual({ title: 'Respirar', progress: 10 });
  });

  it('devuelve ceros/null cuando no hay hábitos ni citas', async () => {
    const result = await getUserDashboardSummary(userId);

    expect(result.activeHabits).toBe(0);
    expect(result.averageProgress).toBe(0);
    expect(result.nextHabit).toBeNull();
    expect(result.nextAppointment).toBeNull();
    expect(result.pendingAppointments).toBe(0);
    expect(result.memberSince).toEqual(memberSince);
  });

  it('filtra todas las consultas por el userId del titular (ownership)', async () => {
    await getUserDashboardSummary(userId);

    expect(prisma.habit.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId, status: 'active' } }),
    );
    expect(prisma.habit.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId, status: 'active' } }),
    );
    expect(prisma.appointment.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ patientUserId: userId }),
      }),
    );
    expect(prisma.appointment.count).toHaveBeenCalledWith(
      expect.objectContaining({ where: { patientUserId: userId, status: 'PENDING' } }),
    );
    expect(prisma.user.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: userId } }),
    );
  });

  it('devuelve la próxima cita con nombre del psicólogo (profile o username o email)', async () => {
    (prisma.appointment.findFirst as any).mockResolvedValue({
      startsAt: nextStartsAt,
      psychologist: {
        email: 'psy@example.com',
        profile: { firstName: 'Ana', lastName: 'Ruiz', username: 'ana' },
      },
    });
    (prisma.appointment.count as any).mockResolvedValue(2);

    const result = await getUserDashboardSummary(userId);

    expect(result.nextAppointment).toEqual({
      startsAt: nextStartsAt,
      psychologistName: 'Ana Ruiz',
    });
    expect(result.pendingAppointments).toBe(2);
    expect(prisma.appointment.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          patientUserId: userId,
          status: { in: ['PENDING', 'CONFIRMED'] },
          startsAt: { gte: new Date('2026-11-09T12:00:00Z') },
        }),
        orderBy: { startsAt: 'asc' },
      }),
    );
  });
});
