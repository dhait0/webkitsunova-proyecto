import request from 'supertest';
import app from '../src/server/app';

vi.mock('../../src/server/lib/prisma', () => ({
  prisma: {
    user: { findUnique: vi.fn(), findFirst: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn(), updateMany: vi.fn() },
    profile: { findUnique: vi.fn(), update: vi.fn() },
    psychologistProfile: { findUnique: vi.fn(), update: vi.fn(), updateMany: vi.fn() },
    availabilitySlot: { findMany: vi.fn(), deleteMany: vi.fn(), createMany: vi.fn() },
    appointment: { findMany: vi.fn(), count: vi.fn(), findFirst: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
    psyPatient: { findMany: vi.fn(), count: vi.fn(), findFirst: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), updateMany: vi.fn() },
    conversationMember: { findMany: vi.fn(), count: vi.fn(), findFirst: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
    conversation: { findMany: vi.fn(), findFirst: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
    message: { findMany: vi.fn(), create: vi.fn() },
    workshop: { findMany: vi.fn(), count: vi.fn(), findFirst: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
    workshopEnrollment: { count: vi.fn(), findMany: vi.fn() },
    resource: { findMany: vi.fn(), count: vi.fn(), findFirst: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
    patientReport: { findMany: vi.fn(), create: vi.fn() },
    notification: { findMany: vi.fn(), count: vi.fn(), create: vi.fn(), updateMany: vi.fn(), findFirst: vi.fn() },
    notificationPreference: { upsert: vi.fn(), findUnique: vi.fn() },
    psyReferral: { findMany: vi.fn(), count: vi.fn(), findFirst: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
    review: { aggregate: vi.fn() },
    $transaction: vi.fn(),
  },
}));

vi.mock('../../src/server/lib/supabase', () => ({
  supabaseAdmin: {
    auth: {
      getUser: vi.fn(),
      createUser: vi.fn(),
      updateUserById: vi.fn(),
      deleteFactor: vi.fn(),
    },
  },
}));

vi.mock('../../src/server/lib/role', () => ({
  getRole: vi.fn(),
}));

const { supabaseAdmin } = await import('../../src/server/lib/supabase');
const { prisma } = await import('../../src/server/lib/prisma');
const { getRole } = await import('../../src/server/lib/role');

const mockGetUser = vi.mocked(supabaseAdmin.auth.getUser);
const mockPrismaUser = vi.mocked(prisma.user);

const PSY_ID = 'psy-1';
const PATIENT_ID = 'user-1';

function approvedPsychologist() {
  return {
    status: 'ACTIVE',
    profile: { id: 'profile-1', psychologistProfile: { id: 'psyprof-1', isApproved: true } },
  } as any;
}

function pendingPsychologist() {
  return {
    status: 'ACTIVE',
    profile: { id: 'profile-1', psychologistProfile: { id: 'psyprof-1', isApproved: false } },
  } as any;
}

describe('/api/psy', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({
      data: { user: { id: PSY_ID, email: 'psico@example.com' } },
      error: null,
    } as any);
    getRole.mockReturnValue('PSYCHOLOGIST');
  });

  it('returns 401 when no bearer token is sent', async () => {
    const response = await request(app).get('/api/psy/dashboard');

    expect(response.status).toBe(401);
  });

  it('returns 403 when the role is not PSYCHOLOGIST', async () => {
    getRole.mockReturnValue('USER');

    const response = await request(app)
      .get('/api/psy/dashboard')
      .set('Authorization', 'Bearer token');

    expect(response.status).toBe(403);
    expect(response.body.message).toContain('Requiere rol');
  });

  it('returns 403 with PSY_NOT_APPROVED when the profile is pending', async () => {
    mockPrismaUser.findUnique.mockResolvedValueOnce(pendingPsychologist());

    const response = await request(app)
      .get('/api/psy/dashboard')
      .set('Authorization', 'Bearer token');

    expect(response.status).toBe(403);
    expect(response.body.code).toBe('PSY_NOT_APPROVED');
  });

  it('returns 400 when a workshop payload is invalid', async () => {
    mockPrismaUser.findUnique.mockResolvedValueOnce(approvedPsychologist());

    const response = await request(app)
      .post('/api/psy/workshops')
      .set('Authorization', 'Bearer token')
      .send({ title: 'ab' });

    expect(response.status).toBe(400);
  });

  it('creates a workshop in PENDING state, as the admin approval flow requires', async () => {
    mockPrismaUser.findUnique.mockResolvedValueOnce(approvedPsychologist());
    vi.mocked(prisma.workshop.create).mockResolvedValueOnce({
      id: 'w1',
      authorId: PSY_ID,
      title: 'Manejo de la ansiedad',
      description: 'descripción larga',
      coverUrl: null,
      focusArea: 'ANXIETY',
      startsAt: new Date('2026-07-09T20:20:00Z'),
      durationHours: 2,
      capacity: 30,
      priceCents: 0,
      currency: 'COP',
      status: 'PENDING',
      rejectReason: null,
      createdAt: new Date('2026-07-01T00:00:00Z'),
      enrollments: [],
      author: { email: 'psico@example.com', profile: { firstName: 'Leidy', lastName: 'Gomez' } },
    } as any);

    const response = await request(app)
      .post('/api/psy/workshops')
      .set('Authorization', 'Bearer token')
      .send({
        title: 'Manejo de la ansiedad',
        description: 'descripción larga',
        focusArea: 'ANXIETY',
        startsAt: '2026-07-09T20:20:00Z',
        durationHours: 2,
        capacity: 30,
        priceCents: 0,
      });

    expect(response.status).toBe(201);
    expect(prisma.workshop.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'PENDING' }) }),
    );
    expect(response.body.workshop.status).toBe('PENDING');
    expect(response.body.workshop.authorName).toBe('Leidy Gomez');
  });

  it('rejects a workshop the psychologist does not own with 404', async () => {
    mockPrismaUser.findUnique.mockResolvedValueOnce(approvedPsychologist());
    vi.mocked(prisma.workshop.findFirst).mockResolvedValueOnce(null);

    const response = await request(app)
      .get('/api/psy/workshops/other-workshop')
      .set('Authorization', 'Bearer token');

    expect(response.status).toBe(404);
  });

  it('returns 409 when an appointment overlaps another one', async () => {
    mockPrismaUser.findUnique.mockResolvedValueOnce(approvedPsychologist());
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: PATIENT_ID,
      role: 'USER',
      status: 'ACTIVE',
    } as any);
    vi.mocked(prisma.appointment.findFirst).mockResolvedValueOnce({ id: 'existing' } as any);

    const response = await request(app)
      .post('/api/psy/appointments')
      .set('Authorization', 'Bearer token')
      .send({
        patientUserId: PATIENT_ID,
        type: 'FIRST_SESSION',
        startsAt: '2026-07-10T09:00:00Z',
        durationMinutes: 60,
      });

    expect(response.status).toBe(409);
    expect(response.body.message).toBe('El horario ya está ocupado');
  });

  it('closes the previous psychologist link when a new one is created (decision D2)', async () => {
    mockPrismaUser.findUnique.mockResolvedValueOnce(approvedPsychologist());
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: PATIENT_ID,
      role: 'USER',
      status: 'ACTIVE',
    } as any);
    vi.mocked(prisma.appointment.findFirst).mockResolvedValueOnce(null);
    vi.mocked(prisma.appointment.create).mockResolvedValueOnce({
      id: 'a1',
      patientUserId: PATIENT_ID,
      startsAt: new Date('2026-07-10T09:00:00Z'),
      endsAt: new Date('2026-07-10T10:00:00Z'),
      type: 'FIRST_SESSION',
      status: 'CONFIRMED',
      reason: null,
    } as any);
    vi.mocked(prisma.psyPatient.findFirst).mockResolvedValueOnce({
      id: 'link-old',
    } as any);

    const response = await request(app)
      .post('/api/psy/appointments')
      .set('Authorization', 'Bearer token')
      .send({
        patientUserId: PATIENT_ID,
        type: 'FIRST_SESSION',
        startsAt: '2026-07-10T09:00:00Z',
        durationMinutes: 60,
      });

    expect(response.status).toBe(201);
    expect(prisma.psyPatient.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'link-old' },
        data: expect.objectContaining({ status: 'ENDED' }),
      }),
    );
  });

  it('returns 400 when a referral targets a patient the psychologist does not have', async () => {
    mockPrismaUser.findUnique.mockResolvedValueOnce(approvedPsychologist());
    vi.mocked(prisma.psyPatient.findFirst).mockResolvedValueOnce(null);

    const response = await request(app)
      .post('/api/psy/referrals')
      .set('Authorization', 'Bearer token')
      .send({ toPsychologistId: 'psy-2', patientUserId: PATIENT_ID });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain('Solo puedes derivar');
  });

  it('sends the appointment list scoped to the psychologist', async () => {
    mockPrismaUser.findUnique.mockResolvedValueOnce(approvedPsychologist());
    vi.mocked(prisma.appointment.count).mockResolvedValueOnce(0);
    vi.mocked(prisma.appointment.findMany).mockResolvedValueOnce([]);

    const response = await request(app)
      .get('/api/psy/appointments?scope=today')
      .set('Authorization', 'Bearer token');

    expect(response.status).toBe(200);
    expect(prisma.appointment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ psychologistId: PSY_ID }) }),
    );
  });

  it('returns 403 when the psychologist account is suspended', async () => {
    mockPrismaUser.findUnique.mockResolvedValueOnce({
      ...approvedPsychologist(),
      status: 'SUSPENDED',
    });

    const response = await request(app)
      .get('/api/psy/dashboard')
      .set('Authorization', 'Bearer token');

    expect(response.status).toBe(403);
    expect(response.body.code).toBe('ACCOUNT_SUSPENDED');
  });
});
