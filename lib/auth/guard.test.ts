import { describe, expect, it, vi } from 'vitest';
import { authorize, getSessionUser } from './guard';

vi.mock('server-only', () => ({}));

const getUser = vi.hoisted(() => vi.fn());

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    auth: { getUser },
  })),
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

describe('authorize()', () => {
  it('rechaza sesión anónima (sin usuario)', async () => {
    getUser.mockResolvedValue({ data: { user: null } });

    const result = await authorize(['ADMIN']);

    expect(result).toBeNull();
  });

  it('rechaza usuario con rol USER para acciones de ADMIN', async () => {
    getUser.mockResolvedValue({ data: { user: userSession } });

    const result = await authorize(['ADMIN']);

    expect(result).toBeNull();
  });

  it('admite usuario con rol ADMIN para acciones de ADMIN', async () => {
    getUser.mockResolvedValue({ data: { user: adminSession } });

    const result = await authorize(['ADMIN']);

    expect(result).toEqual(expectedAdminUser);
    expect(result?.role).toBe('ADMIN');
  });

  it('devuelve la sesión sin restricción cuando no se pasan roles', async () => {
    getUser.mockResolvedValue({ data: { user: userSession } });

    const result = await authorize();

    expect(result).toEqual(expectedUserUser);
  });

  it('rechaza sesión anónima incluso sin roles especificados', async () => {
    getUser.mockResolvedValue({ data: { user: null } });

    const result = await authorize();

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

    const result = await getSessionUser();

    expect(result?.id).toBe('psy-1');
    expect(result?.role).toBe('PSYCHOLOGIST');
    expect(result?.profile?.firstName).toBe('Ana');
    expect(result?.profile?.lastName).toBe('Ruiz');
    expect(result?.profile?.username).toBe('ana');
    expect(result?.status).toBe('ACTIVE');
  });
});

describe('estado de cuenta', () => {
  it('no rechaza cuentas con estado no activo (bloqueo: requiere rediseño para consultar Prisma)', async () => {
    getUser.mockResolvedValue({ data: { user: userSession } });

    const result = await getSessionUser();

    // El guard hardcodea status: 'ACTIVE' y nunca consulta el estado real
    // de la cuenta en Prisma. Una cuenta PENDING o SUSPENDED no es rechazada.
    // Rechazar cuentas no activas requiere leer el estado desde Prisma dentro
    // de getSessionUser() o authorize(): cambio de arquitectura, no ajuste aislado.
    expect(result?.status).toBe('ACTIVE');
  });
});

describe('MFA (flujo directo)', () => {
  it('no requiere MFA en el guard (bloqueo: requiere rediseño para integrar getMfaStatus)', async () => {
    getUser.mockResolvedValue({ data: { user: userSession } });

    const result = await authorize(['USER']);

    // authorize() nunca verifica si el usuario tiene MFA habilitado.
    // getMfaStatus() existe en lib/auth/mfa.ts pero no se integra al guard.
    // Requerir MFA para acciones sensibles requiere rediseño del guard.
    expect(result).not.toBeNull();
    expect(result?.role).toBe('USER');
  });
});
