import { prisma } from '@/lib/db/prisma';

export type UserDashboardSummary = {
  activeHabits: number;
  averageProgress: number;
  nextHabit: { title: string; progress: number } | null;
  nextAppointment: { startsAt: Date; psychologistName: string } | null;
  pendingAppointments: number;
  memberSince: Date;
};

function resolvePsychologistName(psychologist: {
  email: string;
  profile: { firstName: string | null; lastName: string | null; username: string | null } | null;
}): string {
  const first = psychologist.profile?.firstName?.trim();
  const last = psychologist.profile?.lastName?.trim();
  const fullName = [first, last].filter(Boolean).join(' ');
  if (fullName) return fullName;
  if (psychologist.profile?.username?.trim()) return psychologist.profile.username.trim();
  return psychologist.email;
}

export async function getUserDashboardSummary(userId: string): Promise<UserDashboardSummary> {
  const now = new Date();

  const [activeHabitRows, nextHabit, nextAppointmentRow, pendingAppointments, user] = await Promise.all([
    prisma.habit.findMany({
      where: { userId, status: 'active' },
      select: { progress: true },
    }),
    prisma.habit.findFirst({
      where: { userId, status: 'active' },
      orderBy: { progress: 'asc' },
      select: { title: true, progress: true },
    }),
    prisma.appointment.findFirst({
      where: {
        patientUserId: userId,
        status: { in: ['PENDING', 'CONFIRMED'] },
        startsAt: { gte: now },
      },
      orderBy: { startsAt: 'asc' },
      select: {
        startsAt: true,
        psychologist: {
          select: {
            email: true,
            profile: {
              select: { firstName: true, lastName: true, username: true },
            },
          },
        },
      },
    }),
    prisma.appointment.count({
      where: { patientUserId: userId, status: 'PENDING' },
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { createdAt: true },
    }),
  ]);

  const activeHabits = activeHabitRows.length;
  const averageProgress =
    activeHabits === 0
      ? 0
      : Math.round(activeHabitRows.reduce((sum, h) => sum + h.progress, 0) / activeHabits);

  return {
    activeHabits,
    averageProgress,
    nextHabit: nextHabit ? { title: nextHabit.title, progress: nextHabit.progress } : null,
    nextAppointment: nextAppointmentRow
      ? {
          startsAt: nextAppointmentRow.startsAt,
          psychologistName: resolvePsychologistName(nextAppointmentRow.psychologist),
        }
      : null,
    pendingAppointments,
    memberSince: user?.createdAt ?? now,
  };
}
