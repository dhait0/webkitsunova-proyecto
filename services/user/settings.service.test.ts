import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

const mockPrisma = vi.hoisted(() => ({
  profile: {
    findUnique: vi.fn(),
    upsert: vi.fn(),
  },
}));

const mockAdmin = vi.hoisted(() => ({
  auth: { admin: { updateUserById: vi.fn() } },
}));

const mockAnon = vi.hoisted(() => ({
  auth: { signInWithPassword: vi.fn() },
}));

vi.mock('@/lib/db/prisma', () => ({ prisma: mockPrisma }));
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: () => mockAdmin }));
vi.mock('@/lib/supabase/anon', () => ({ createAnonClient: () => mockAnon }));

import { changeUserPassword, getUserSettings, updateUserProfile } from './settings.service';

const userId = 'user-123';
const email = 'user@example.com';

beforeEach(() => {
  vi.resetAllMocks();
  mockPrisma.profile.findUnique.mockResolvedValue(null);
  mockPrisma.profile.upsert.mockResolvedValue({
    userId,
    username: 'nuevo',
    firstName: null,
    lastName: null,
  });
  mockAdmin.auth.admin.updateUserById.mockResolvedValue({ error: null });
  mockAnon.auth.signInWithPassword.mockResolvedValue({ data: { session: {} }, error: null });
});

describe('getUserSettings', () => {
  it('devuelve email y datos del perfil', async () => {
    mockPrisma.profile.findUnique.mockResolvedValue({
      firstName: 'Ana',
      lastName: 'Ruiz',
      username: 'ana',
    });

    const result = await getUserSettings(userId, email);

    expect(result).toEqual({ email, firstName: 'Ana', lastName: 'Ruiz', username: 'ana' });
    expect(mockPrisma.profile.findUnique).toHaveBeenCalledWith({
      where: { userId },
      select: { firstName: true, lastName: true, username: true },
    });
  });

  it('devuelve nulls cuando no hay perfil', async () => {
    const result = await getUserSettings(userId, email);
    expect(result).toEqual({ email, firstName: null, lastName: null, username: null });
  });
});

describe('updateUserProfile', () => {
  it('hace upsert del perfil y actualiza user_metadata con session.id (no id del formulario)', async () => {
    await updateUserProfile(userId, { firstName: 'Ana', lastName: 'Ruiz', username: 'ana_ruiz' });

    expect(mockPrisma.profile.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId },
        create: expect.objectContaining({
          userId,
          username: 'ana_ruiz',
          firstName: 'Ana',
          lastName: 'Ruiz',
        }),
        update: expect.objectContaining({ username: 'ana_ruiz' }),
      }),
    );
    expect(mockAdmin.auth.admin.updateUserById).toHaveBeenCalledWith(userId, {
      user_metadata: { first_name: 'Ana', last_name: 'Ruiz', username: 'ana_ruiz' },
    });
  });

  it('lanza mensaje claro cuando el username ya existe (P2002)', async () => {
    mockPrisma.profile.upsert.mockRejectedValue({ code: 'P2002' });

    await expect(updateUserProfile(userId, { username: 'duplicado' })).rejects.toThrow(
      'Ese nombre de usuario ya está en uso',
    );
    expect(mockAdmin.auth.admin.updateUserById).not.toHaveBeenCalled();
  });
});

describe('changeUserPassword', () => {
  it('verifica contraseña actual y luego cambia con admin', async () => {
    await changeUserPassword(userId, email, 'actual123', 'nueva12345');

    expect(mockAnon.auth.signInWithPassword).toHaveBeenCalledWith({
      email,
      password: 'actual123',
    });
    expect(mockAdmin.auth.admin.updateUserById).toHaveBeenCalledWith(userId, {
      password: 'nueva12345',
    });
  });

  it('rechaza cuando la contraseña actual es incorrecta', async () => {
    mockAnon.auth.signInWithPassword.mockResolvedValue({
      data: { session: null },
      error: { message: 'Invalid login credentials' },
    });

    await expect(changeUserPassword(userId, email, 'mala', 'nueva12345')).rejects.toThrow(
      'La contraseña actual no es correcta',
    );
    expect(mockAdmin.auth.admin.updateUserById).not.toHaveBeenCalled();
  });
});
