import { describe, expect, it, vi, beforeEach } from 'vitest';

const prisma = {
  user: { findUnique: vi.fn() },
  availabilitySlot: { findFirst: vi.fn() },
  appointment: { findFirst: vi.fn(), create: vi.fn(), findMany: vi.fn(), count: vi.fn() },
  psyPatient: { findUnique: vi.fn(), findFirst: vi.fn(), update: vi.fn(), create: vi.fn(), upsert: vi.fn() },
};

vi.mock('@/lib/db/prisma', () => ({ prisma }));

vi.mock('./notifications.service', () => ({ createNotification: vi.fn() }));
vi.mock('./shared', async () => {
  const actual = await vi.importActual('./shared');
  return {
    ...(actual as any),
    recalculatePatientsCount: vi.fn(),
    parsePagination: () => ({ page: 1, limit: 10, skip: 0 }),
    buildPagination: () => ({ page: 1, limit: 10, total: 0, totalPages: 1 }),
    startOfTodayUtc: () => new Date('2026-01-01T00:00:00Z'),
    endOfTodayUtc: () => new Date('2026-01-02T00:00:00Z'),
    fullName: () => 'Test User',
  };
});

describe('requestAppointmentByUser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rechaza usuario no ACTIVE', async () => {
    prisma.user.findUnique
      .mockResolvedValueOnce({ id: 'u1', role: 'USER', status: 'PENDING' });
    const { requestAppointmentByUser, AppointmentConflictError } = await import('./appointments.service');
    await expect(requestAppointmentByUser('u1', {
      psychologistId: 'p1',
      startsAt: new Date(Date.now() + 3600000),
      durationMinutes: 60,
    })).rejects.toBeInstanceOf(AppointmentConflictError);
  });

  it('rechaza si psicólogo no aprobado', async () => {
    prisma.user.findUnique
      .mockResolvedValueOnce({ id: 'u1', role: 'USER', status: 'ACTIVE' })
      .mockResolvedValueOnce({
        id: 'p1',
        role: 'PSYCHOLOGIST',
        status: 'ACTIVE',
        profile: { id: 'prof1', psychologistProfile: { isApproved: false, isVerified: false } },
      });
    const { requestAppointmentByUser, AppointmentConflictError } = await import('./appointments.service');
    await expect(requestAppointmentByUser('u1', {
      psychologistId: 'p1',
      startsAt: new Date(Date.now() + 3600000),
      durationMinutes: 60,
    })).rejects.toBeInstanceOf(AppointmentConflictError);
  });

  it('rechaza conflicto con cita PENDING/CONFIRMED', async () => {
    prisma.user.findUnique
      .mockResolvedValueOnce({ id: 'u1', role: 'USER', status: 'ACTIVE' })
      .mockResolvedValueOnce({
        id: 'p1',
        role: 'PSYCHOLOGIST',
        status: 'ACTIVE',
        profile: { id: 'prof1', psychologistProfile: { isApproved: true, isVerified: true } },
      });
    prisma.availabilitySlot.findFirst.mockResolvedValue({ id: 'slot1' });
    prisma.appointment.findFirst.mockResolvedValue({ id: 'existing' });
    const { requestAppointmentByUser, AppointmentConflictError } = await import('./appointments.service');
    await expect(requestAppointmentByUser('u1', {
      psychologistId: 'p1',
      startsAt: new Date(Date.now() + 3600000),
      durationMinutes: 60,
    })).rejects.toBeInstanceOf(AppointmentConflictError);
  });

  it('crea cita con estado PENDING si todo válido', async () => {
    prisma.user.findUnique
      .mockResolvedValueOnce({ id: 'u1', role: 'USER', status: 'ACTIVE' })
      .mockResolvedValueOnce({
        id: 'p1',
        role: 'PSYCHOLOGIST',
        status: 'ACTIVE',
        profile: { id: 'prof1', psychologistProfile: { isApproved: true, isVerified: true } },
      });
    prisma.availabilitySlot.findFirst.mockResolvedValue({ id: 'slot1' });
    prisma.appointment.findFirst.mockResolvedValue(null);
    prisma.appointment.create.mockResolvedValue({
      id: 'a1',
      psychologistId: 'p1',
      patientUserId: 'u1',
      status: 'PENDING',
      startsAt: new Date(),
      endsAt: new Date(),
    });
    prisma.psyPatient.findFirst.mockResolvedValue(null);
    prisma.psyPatient.findUnique.mockResolvedValue(null);
    prisma.psyPatient.create.mockResolvedValue({});
    const { requestAppointmentByUser } = await import('./appointments.service');
    const res = await requestAppointmentByUser('u1', {
      psychologistId: 'p1',
      startsAt: new Date(Date.now() + 3600000),
      durationMinutes: 60,
    });
    expect(res.status).toBe('PENDING');
    expect(prisma.appointment.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ status: 'PENDING' }),
    }));
  });
});
