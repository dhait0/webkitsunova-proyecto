import { prisma } from '@/lib/db/prisma';
import { getHabitsOverview, type HabitsOverview } from './habits.service';

export type UserDashboardSummary = {
  /** Habits with statistics derived from the days they were completed. */
  habits: HabitsOverview;
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

  const [habits, nextAppointmentRow, pendingAppointments, user] = await Promise.all([
    getHabitsOverview(userId),
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

  return {
    habits,
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
