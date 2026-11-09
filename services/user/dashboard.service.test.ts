import { describe, expect, it, vi, beforeEach } from 'vitest';

const getHabitsOverview = vi.hoisted(() => vi.fn());

vi.mock('./habits.service', () => ({ getHabitsOverview }));

vi.mock('@/lib/db/prisma', () => ({
  prisma: {
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
const emptyOverview = {
  today: '2026-11-09',
  habits: [],
  summary: {
    active: 0, paused: 0, completed: 0, doneToday: 0, pendingToday: 0,
    bestCurrentStreak: null, averageProgress: null,
  },
};
const nextStartsAt = new Date('2026-11-20T14:00:00Z');

beforeEach(() => {
  vi.resetAllMocks();
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-11-09T12:00:00Z'));

  getHabitsOverview.mockResolvedValue(emptyOverview);
  (prisma.appointment.findFirst as any).mockResolvedValue(null);
  (prisma.appointment.count as any).mockResolvedValue(0);
  (prisma.user.findUnique as any).mockResolvedValue({ createdAt: memberSince });
});

describe('getUserDashboardSummary', () => {
  it('incluye los hábitos calculados a partir de los registros, sin recalcularlos', async () => {
    const overview = {
      ...emptyOverview,
      habits: [{ id: 'h1', title: 'Respirar' }],
      summary: { ...emptyOverview.summary, active: 1, averageProgress: 43 },
    };
    getHabitsOverview.mockResolvedValue(overview);

    const result = await getUserDashboardSummary(userId);

    expect(result.habits).toBe(overview);
    expect(getHabitsOverview).toHaveBeenCalledWith(userId);
  });

  it('devuelve ceros/null cuando no hay hábitos ni citas', async () => {
    const result = await getUserDashboardSummary(userId);

    expect(result.habits.summary.active).toBe(0);
    expect(result.habits.summary.averageProgress).toBeNull();
    expect(result.nextAppointment).toBeNull();
    expect(result.pendingAppointments).toBe(0);
    expect(result.memberSince).toEqual(memberSince);
  });

  it('filtra todas las consultas por el userId del titular (ownership)', async () => {
    await getUserDashboardSummary(userId);

    expect(getHabitsOverview).toHaveBeenCalledWith(userId);
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
