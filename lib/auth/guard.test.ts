import { describe, expect, it, vi, beforeEach } from 'vitest';
import { authorize, getSessionUser } from './guard';

vi.mock('server-only', () => ({}));

const getUser = vi.hoisted(() => vi.fn());
const prismaUserFindUnique = vi.hoisted(() => vi.fn());

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    auth: { getUser },
  })),
}));

vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    user: { findUnique: prismaUserFindUnique },
  },
}));

const adminSession = {
  id: 'admin-1',
  email: 'admin@example.com',
  app_metadata: { role: 'ADMIN' },
  user_metadata: { first_name: 'Admin', last_name: 'User', username: 'admin' },
};

const userSession = {
  id: 'user-1',
  email: 'user@example.com',
  app_metadata: { role: 'USER' },
  user_metadata: { first_name: 'User', last_name: 'One', username: 'user' },
};

const expectedAdminUser = {
  id: 'admin-1',
  email: 'admin@example.com',
  role: 'ADMIN',
  status: 'ACTIVE',
  profile: { firstName: 'Admin', lastName: 'User', username: 'admin' },
};

const expectedUserUser = {
  id: 'user-1',
  email: 'user@example.com',
  role: 'USER',
  status: 'ACTIVE',
  profile: { firstName: 'User', lastName: 'One', username: 'user' },
};

beforeEach(() => {
  vi.clearAllMocks();
  getUser.mockReset();
  prismaUserFindUnique.mockReset();
});

describe('authorize()', () => {
  it('rechaza sesión anónima (sin usuario)', async () => {
    getUser.mockResolvedValue({ data: { user: null } });

    const result = await authorize(['ADMIN']);

    expect(result).toBeNull();
  });

  it('rechaza usuario con rol USER para acciones de ADMIN', async () => {
    getUser.mockResolvedValue({ data: { user: userSession } });
    prismaUserFindUnique.mockResolvedValue({ status: 'ACTIVE' });

    const result = await authorize(['ADMIN']);

    expect(result).toBeNull();
  });

  it('admite usuario ACTIVE con rol ADMIN para acciones de ADMIN', async () => {
    getUser.mockResolvedValue({ data: { user: adminSession } });
    prismaUserFindUnique.mockResolvedValue({ status: 'ACTIVE' });

    const result = await authorize(['ADMIN']);

    expect(result).toEqual(expectedAdminUser);
    expect(result?.role).toBe('ADMIN');
  });

  it('devuelve la sesión ACTIVE sin restricción cuando no se pasan roles', async () => {
    getUser.mockResolvedValue({ data: { user: userSession } });
    prismaUserFindUnique.mockResolvedValue({ status: 'ACTIVE' });

    const result = await authorize();

    expect(result).toEqual(expectedUserUser);
  });

  it('rechaza sesión anónima incluso sin roles especificados', async () => {
    getUser.mockResolvedValue({ data: { user: null } });

    const result = await authorize();

    expect(result).toBeNull();
  });

  it('rechaza cuenta PENDING aunque el rol coincida', async () => {
    getUser.mockResolvedValue({ data: { user: userSession } });
    prismaUserFindUnique.mockResolvedValue({ status: 'PENDING' });

    const result = await authorize(['USER']);

    expect(result).toBeNull();
  });

  it('rechaza cuenta SUSPENDED aunque el rol coincida', async () => {
    getUser.mockResolvedValue({ data: { user: userSession } });
    prismaUserFindUnique.mockResolvedValue({ status: 'SUSPENDED' });

    const result = await authorize(['USER']);

    expect(result).toBeNull();
  });

  it('rechaza usuario existente en Supabase pero ausente en Prisma', async () => {
    getUser.mockResolvedValue({ data: { user: userSession } });
    prismaUserFindUnique.mockResolvedValue(null);

    const result = await authorize(['USER']);

    expect(result).toBeNull();
  });
});

describe('getSessionUser()', () => {
  it('devuelve null cuando no hay usuario autenticado', async () => {
    getUser.mockResolvedValue({ data: { user: null } });

    const result = await getSessionUser();

    expect(result).toBeNull();
  });

  it('mapea app_metadata.role a AppRole del usuario autenticado', async () => {
    getUser.mockResolvedValue({
      data: {
        user: {
          id: 'psy-1',
          email: 'psy@example.com',
          app_metadata: { role: 'PSYCHOLOGIST' },
          user_metadata: { first_name: 'Ana', last_name: 'Ruiz', username: 'ana' },
        },
      },
    });
    prismaUserFindUnique.mockResolvedValue({ status: 'ACTIVE' });

    const result = await getSessionUser();

    expect(result?.id).toBe('psy-1');
    expect(result?.role).toBe('PSYCHOLOGIST');
    expect(result?.profile?.firstName).toBe('Ana');
    expect(result?.profile?.lastName).toBe('Ruiz');
    expect(result?.profile?.username).toBe('ana');
    expect(result?.status).toBe('ACTIVE');
  });

  it('devuelve el estado real PENDING leído de Prisma', async () => {
    getUser.mockResolvedValue({
      data: {
        user: {
          id: 'user-2',
          email: 'pending@example.com',
          app_metadata: { role: 'USER' },
          user_metadata: {},
        },
      },
    });
    prismaUserFindUnique.mockResolvedValue({ status: 'PENDING' });

    const result = await getSessionUser();

    expect(result?.status).toBe('PENDING');
    expect(result?.id).toBe('user-2');
  });

  it('devuelve el estado real SUSPENDED leído de Prisma', async () => {
    getUser.mockResolvedValue({
      data: {
        user: {
          id: 'user-3',
          email: 'suspended@example.com',
          app_metadata: { role: 'USER' },
          user_metadata: {},
        },
      },
    });
    prismaUserFindUnique.mockResolvedValue({ status: 'SUSPENDED' });

    const result = await getSessionUser();

    expect(result?.status).toBe('SUSPENDED');
    expect(result?.id).toBe('user-3');
  });

  it('devuelve null cuando el usuario no existe en Prisma', async () => {
    getUser.mockResolvedValue({ data: { user: userSession } });
    prismaUserFindUnique.mockResolvedValue(null);

    const result = await getSessionUser();

    expect(result).toBeNull();
  });

  it('consulta Prisma por el id del usuario de Supabase', async () => {
    getUser.mockResolvedValue({ data: { user: userSession } });
    prismaUserFindUnique.mockResolvedValue({ status: 'ACTIVE' });

    await getSessionUser();

    expect(prismaUserFindUnique).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      select: { status: true },
    });
  });
});
