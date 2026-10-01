import request from 'supertest';
import app from '../../src/server/app.js';

vi.mock('../../src/server/lib/prisma', () => ({
  prisma: {
    user: { findUnique: vi.fn(), findMany: vi.fn(), count: vi.fn(), update: vi.fn(), delete: vi.fn() },
    profile: { findUnique: vi.fn() },
    psychologistProfile: { count: vi.fn(), update: vi.fn() },
    resource: {},
    workshop: {},
    notification: { create: vi.fn() },
  },
}));

vi.mock('../../src/server/lib/supabase', () => ({
  supabaseAdmin: {
    auth: {
      getUser: vi.fn(),
      createUser: vi.fn(),
      updateUser: vi.fn(),
      admin: { updateUserById: vi.fn() },
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
const mockUpdateUserById = vi.mocked(supabaseAdmin.auth.admin.updateUserById);
const mockPrismaUser = vi.mocked(prisma.user);
const mockGetRole = vi.mocked(getRole);

const ADMIN_ID = 'admin-1';
const TARGET_ID = 'user-1';
const AUTH = 'Bearer test-token';

describe('/api/admin PATCH /users/:id/role', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({
      data: { user: { id: ADMIN_ID, email: 'admin@example.com' } },
      error: null,
    } as any);
    mockGetRole.mockReturnValue('ADMIN');
    mockUpdateUserById.mockResolvedValue({ data: {}, error: null } as any);
    mockPrismaUser.update.mockResolvedValue({} as any);
  });

  it('updates app_metadata in Supabase and the role in Prisma', async () => {
    const res = await request(app)
      .patch(`/api/admin/users/${TARGET_ID}/role`)
      .set('Authorization', AUTH)
      .send({ role: 'ADMIN' });

    expect(res.status).toBe(200);
    expect(mockUpdateUserById).toHaveBeenCalledWith(TARGET_ID, {
      app_metadata: { role: 'ADMIN' },
    });
    expect(mockPrismaUser.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: TARGET_ID },
        data: expect.objectContaining({ role: 'ADMIN' }),
      }),
    );
  });

  it('refuses to change the caller own role', async () => {
    const res = await request(app)
      .patch(`/api/admin/users/${ADMIN_ID}/role`)
      .set('Authorization', AUTH)
      .send({ role: 'USER' });

    expect(res.status).toBe(400);
    expect(mockUpdateUserById).not.toHaveBeenCalled();
    expect(mockPrismaUser.update).not.toHaveBeenCalled();
  });

  it('rejects a role outside the allowed set with 400', async () => {
    const res = await request(app)
      .patch(`/api/admin/users/${TARGET_ID}/role`)
      .set('Authorization', AUTH)
      .send({ role: 'SUPERADMIN' });

    expect(res.status).toBe(400);
    expect(mockUpdateUserById).not.toHaveBeenCalled();
  });

  it('does not touch Prisma when Supabase has no such user', async () => {
    mockUpdateUserById.mockResolvedValue({ data: null, error: { message: 'User not found' } } as any);

    const res = await request(app)
      .patch(`/api/admin/users/${TARGET_ID}/role`)
      .set('Authorization', AUTH)
      .send({ role: 'PSYCHOLOGIST' });

    expect(res.status).toBe(404);
    expect(mockPrismaUser.update).not.toHaveBeenCalled();
  });

  it('requires the ADMIN role', async () => {
    mockGetRole.mockReturnValue('USER');

    const res = await request(app)
      .patch(`/api/admin/users/${TARGET_ID}/role`)
      .set('Authorization', AUTH)
      .send({ role: 'ADMIN' });

    expect(res.status).toBe(403);
    expect(mockUpdateUserById).not.toHaveBeenCalled();
  });

  it('requires a session', async () => {
    const res = await request(app)
      .patch(`/api/admin/users/${TARGET_ID}/role`)
      .send({ role: 'ADMIN' });

    expect(res.status).toBe(401);
  });
});
