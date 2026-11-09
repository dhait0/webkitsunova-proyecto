import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

const authorize = vi.hoisted(() => vi.fn());

const prisma = vi.hoisted(() => ({
  user: {
    findUnique: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
    findMany: vi.fn(),
  },
  psychologistProfile: {
    findUnique: vi.fn(),
    update: vi.fn(),
    count: vi.fn(),
    findMany: vi.fn(),
  },
  $transaction: vi.fn(),
}));

const supabaseAdminAuth = vi.hoisted(() => ({
  updateUserById: vi.fn(),
  deleteUser: vi.fn(),
}));
const supabaseAuth = vi.hoisted(() => ({
  admin: supabaseAdminAuth,
  resend: vi.fn(),
}));
const createAdminClient = vi.hoisted(() => vi.fn(() => ({ auth: supabaseAuth })));

const resetPasswordForEmail = vi.hoisted(() => vi.fn());
const createAnonClient = vi.hoisted(() =>
  vi.fn(() => ({ auth: { resetPasswordForEmail } })),
);

vi.mock('@/lib/auth/guard', () => ({ authorize }));
vi.mock('@/lib/db/prisma', () => ({ prisma }));
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient }));
vi.mock('@/lib/supabase/anon', () => ({ createAnonClient }));

import * as actions from './actions';

const adminSession = { id: 'admin-1', email: 'admin@example.com', role: 'ADMIN' as const };

const allAsyncActions = Object.entries(actions).filter(
  ([, value]) => typeof value === 'function',
) as [string, (...args: unknown[]) => Promise<unknown>][];

function sampleArgs(name: string): unknown[] {
  switch (name) {
    case 'getAdminUserStats':
    case 'getAdminPsyStats':
      return [];
    case 'getAdminUsers':
    case 'getPsychologists':
      return [{}];
    case 'updateUserStatus':
      return ['user-2', 'SUSPENDED'];
    case 'updateUserRole':
      return ['user-2', 'USER'];
    case 'updateUserProfile':
      return ['user-2', { firstName: 'A' }];
    case 'updatePsychologistProfile':
      return ['psy-1', { bio: 'x' }];
    default:
      return ['user-2'];
  }
}

beforeEach(() => {
  vi.clearAllMocks();
  authorize.mockReset();
  resetPasswordForEmail.mockReset();
  createAnonClient.mockClear();
  createAdminClient.mockClear();
  supabaseAuth.resend.mockReset();
  supabaseAdminAuth.updateUserById.mockReset();
  supabaseAdminAuth.deleteUser.mockReset();
  prisma.user.findUnique.mockReset();
  prisma.user.update.mockReset();
  prisma.user.updateMany.mockReset();
  prisma.user.delete.mockReset();
  prisma.user.count.mockReset();
  prisma.user.findMany.mockReset();
  prisma.psychologistProfile.findUnique.mockReset();
  prisma.psychologistProfile.update.mockReset();
  prisma.psychologistProfile.count.mockReset();
  prisma.psychologistProfile.findMany.mockReset();
});

describe('admin actions - exports', () => {
  it('cubre todas las funciones exportadas async (incluye las 15 esperadas)', () => {
    const names = allAsyncActions.map(([n]) => n).sort();
    for (const expected of [
      'approvePsychologist',
      'approveUser',
      'deleteUser',
      'getAdminPsyStats',
      'getAdminUserStats',
      'getAdminUsers',
      'getPsychologists',
      'rejectPsychologist',
      'resendConfirmationEmail',
      'resetUserPassword',
      'updatePsychologistProfile',
      'updateUserProfile',
      'updateUserRole',
      'updateUserStatus',
    ]) {
      expect(names).toContain(expected);
    }
    expect(allAsyncActions.length).toBeGreaterThanOrEqual(14);
  });
});

describe('admin actions - authorize rechaza (todas)', () => {
  it.each(allAsyncActions.map(([n]) => [n]))(
    '%s: con authorize null no toca prisma/supabase y exige ADMIN',
    async (name) => {
      authorize.mockResolvedValue(null);
      const action = actions[name as keyof typeof actions] as (...args: unknown[]) => Promise<unknown>;
      const result = await action(...sampleArgs(name));

      expect(authorize).toHaveBeenCalledWith(['ADMIN']);
      expect(prisma.user.findUnique).not.toHaveBeenCalled();
      expect(prisma.user.update).not.toHaveBeenCalled();
      expect(prisma.user.updateMany).not.toHaveBeenCalled();
      expect(prisma.user.delete).not.toHaveBeenCalled();
      expect(prisma.user.count).not.toHaveBeenCalled();
      expect(prisma.user.findMany).not.toHaveBeenCalled();
      expect(prisma.psychologistProfile.findUnique).not.toHaveBeenCalled();
      expect(prisma.psychologistProfile.update).not.toHaveBeenCalled();
      expect(prisma.psychologistProfile.count).not.toHaveBeenCalled();
      expect(prisma.psychologistProfile.findMany).not.toHaveBeenCalled();
      expect(createAdminClient).not.toHaveBeenCalled();
      expect(createAnonClient).not.toHaveBeenCalled();
      expect(supabaseAdminAuth.updateUserById).not.toHaveBeenCalled();
      expect(supabaseAdminAuth.deleteUser).not.toHaveBeenCalled();
      expect(supabaseAuth.resend).not.toHaveBeenCalled();
      expect(resetPasswordForEmail).not.toHaveBeenCalled();

      if (
        name === 'getAdminUserStats' ||
        name === 'getAdminPsyStats' ||
        name === 'getAdminUsers' ||
        name === 'getPsychologists'
      ) {
        expect(result).toMatchObject({ success: false });
      } else {
        expect(result).toEqual({ success: false, message: 'No autorizado' });
      }
    },
  );
});

describe('updateUserStatus - protecciones', () => {
  beforeEach(() => authorize.mockResolvedValue(adminSession));

  it('no permite actuar sobre uno mismo', async () => {
    const r = await actions.updateUserStatus('admin-1', 'SUSPENDED');
    expect(r).toEqual({ success: false, message: 'No puedes modificar tu propia cuenta' });
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('no permite actuar sobre otro ADMIN', async () => {
    prisma.user.findUnique.mockResolvedValue({ role: 'ADMIN' });
    const r = await actions.updateUserStatus('user-2', 'SUSPENDED');
    expect(r).toEqual({ success: false, message: 'No puedes suspender a otro administrador' });
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('rechaza status inválido sin escribir', async () => {
    const r = await actions.updateUserStatus('user-2', 'PENDING' as never);
    expect(r).toEqual({ success: false, message: 'Datos no válidos' });
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('rechaza userId vacío sin escribir', async () => {
    const r = await actions.updateUserStatus('', 'ACTIVE');
    expect(r).toEqual({ success: false, message: 'Datos no válidos' });
    expect(prisma.user.update).not.toHaveBeenCalled();
  });
});

describe('deleteUser - protecciones', () => {
  beforeEach(() => authorize.mockResolvedValue(adminSession));

  it('no permite eliminarse a sí mismo', async () => {
    const r = await actions.deleteUser('admin-1');
    expect(r).toEqual({ success: false, message: 'No puedes eliminar tu propia cuenta' });
    expect(prisma.user.delete).not.toHaveBeenCalled();
  });

  it('no permite eliminar a otro ADMIN', async () => {
    prisma.user.findUnique.mockResolvedValue({ role: 'ADMIN' });
    const r = await actions.deleteUser('user-2');
    expect(r).toEqual({ success: false, message: 'No puedes eliminar a otro administrador' });
    expect(prisma.user.delete).not.toHaveBeenCalled();
    expect(supabaseAdminAuth.deleteUser).not.toHaveBeenCalled();
  });

  it('rechaza userId vacío', async () => {
    const r = await actions.deleteUser('  ');
    expect(r).toEqual({ success: false, message: 'Datos no válidos' });
    expect(prisma.user.delete).not.toHaveBeenCalled();
  });
});

describe('updateUserRole - protecciones', () => {
  beforeEach(() => authorize.mockResolvedValue(adminSession));

  it('no permite modificarse el propio rol', async () => {
    const r = await actions.updateUserRole('admin-1', 'USER');
    expect(r).toEqual({ success: false, message: 'No puedes modificar tu propio rol' });
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('no permite actuar sobre otro ADMIN', async () => {
    prisma.user.findUnique.mockResolvedValue({ role: 'ADMIN' });
    const r = await actions.updateUserRole('user-2', 'USER');
    expect(r).toEqual({ success: false, message: 'No puedes modificar a otro administrador' });
    expect(supabaseAdminAuth.updateUserById).not.toHaveBeenCalled();
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('rechaza role ADMIN', async () => {
    const r = await actions.updateUserRole('user-2', 'ADMIN');
    expect(r).toEqual({ success: false, message: 'No está permitido asignar rol administrador' });
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it('rechaza role inválido (FOO) sin escribir', async () => {
    const r = await actions.updateUserRole('user-2', 'FOO' as never);
    expect(r).toEqual({ success: false, message: 'Datos no válidos' });
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
    expect(supabaseAdminAuth.updateUserById).not.toHaveBeenCalled();
  });

  it('rechaza userId vacío', async () => {
    const r = await actions.updateUserRole('', 'USER');
    expect(r).toEqual({ success: false, message: 'Datos no válidos' });
  });
});

describe('updateUserRole - orden y reversión', () => {
  beforeEach(() => {
    authorize.mockResolvedValue(adminSession);
    prisma.user.findUnique.mockResolvedValue({ role: 'USER' });
  });

  it('éxito: actualiza Supabase app_metadata.role antes de Prisma', async () => {
    const order: string[] = [];
    supabaseAdminAuth.updateUserById.mockImplementation(async () => {
      order.push('supabase');
      return { error: null };
    });
    prisma.user.update.mockImplementation(async () => {
      order.push('prisma');
      return {};
    });

    const r = await actions.updateUserRole('user-2', 'PSYCHOLOGIST');
    expect(r).toEqual({ success: true, message: 'Rol actualizado correctamente' });
    expect(supabaseAdminAuth.updateUserById).toHaveBeenCalledWith('user-2', {
      app_metadata: { role: 'PSYCHOLOGIST' },
    });
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-2' },
      data: { role: 'PSYCHOLOGIST' },
    });
    expect(order).toEqual(['supabase', 'prisma']);
  });

  it('si Supabase falla no escribe en Prisma', async () => {
    supabaseAdminAuth.updateUserById.mockResolvedValue({ error: { message: 'boom' } });
    const r = await actions.updateUserRole('user-2', 'PSYCHOLOGIST');
    expect(r.success).toBe(false);
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('si Prisma falla revierte el rol en Supabase al rol anterior', async () => {
    supabaseAdminAuth.updateUserById.mockResolvedValue({ error: null });
    prisma.user.update.mockRejectedValue(new Error('db'));
    const r = await actions.updateUserRole('user-2', 'PSYCHOLOGIST');
    expect(r.success).toBe(false);
    expect(supabaseAdminAuth.updateUserById).toHaveBeenNthCalledWith(1, 'user-2', {
      app_metadata: { role: 'PSYCHOLOGIST' },
    });
    expect(supabaseAdminAuth.updateUserById).toHaveBeenNthCalledWith(2, 'user-2', {
      app_metadata: { role: 'USER' },
    });
  });
});

describe('deleteUser - orden e identidad', () => {
  beforeEach(() => {
    authorize.mockResolvedValue(adminSession);
    prisma.user.findUnique.mockResolvedValue({ role: 'USER' });
  });

  it('borra primero Supabase auth y luego Prisma', async () => {
    const order: string[] = [];
    supabaseAdminAuth.deleteUser.mockImplementation(async () => {
      order.push('supabase');
      return { error: null };
    });
    prisma.user.delete.mockImplementation(async () => {
      order.push('prisma');
      return {};
    });
    const r = await actions.deleteUser('user-2');
    expect(r).toEqual({ success: true, message: 'Usuario eliminado correctamente' });
    expect(order).toEqual(['supabase', 'prisma']);
    expect(supabaseAdminAuth.deleteUser).toHaveBeenCalledWith('user-2');
  });

  it('si Supabase falla (no "not found") no borra en Prisma', async () => {
    supabaseAdminAuth.deleteUser.mockResolvedValue({ error: { message: 'service down' } });
    const r = await actions.deleteUser('user-2');
    expect(r.success).toBe(false);
    expect(prisma.user.delete).not.toHaveBeenCalled();
  });

  it('si Supabase responde "User not found" continúa y borra en Prisma', async () => {
    supabaseAdminAuth.deleteUser.mockResolvedValue({ error: { message: 'User not found' } });
    prisma.user.delete.mockResolvedValue({});
    const r = await actions.deleteUser('user-2');
    expect(r.success).toBe(true);
    expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: 'user-2' } });
  });
});

describe('updateUserProfile - protecciones y email', () => {
  beforeEach(() => authorize.mockResolvedValue(adminSession));

  it('no permite editar a otro ADMIN y no toca Supabase ni Prisma', async () => {
    prisma.user.findUnique.mockResolvedValue({
      email: 'other@x.com',
      role: 'ADMIN',
      profile: { username: null, firstName: null, lastName: null },
    });
    const r = await actions.updateUserProfile('admin-2', { firstName: 'X' });
    expect(r).toEqual({ success: false, message: 'No puedes modificar a otro administrador' });
    expect(supabaseAdminAuth.updateUserById).not.toHaveBeenCalled();
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('permite que un admin se edite a sí mismo', async () => {
    prisma.user.findUnique.mockResolvedValue({
      email: 'admin@example.com',
      role: 'ADMIN',
      profile: { username: 'admin', firstName: 'Admin', lastName: 'User' },
    });
    prisma.user.update.mockResolvedValue({});
    const r = await actions.updateUserProfile('admin-1', { firstName: 'Nuevo' });
    expect(r).toEqual({ success: true, message: 'Usuario actualizado' });
    expect(prisma.user.update).toHaveBeenCalled();
  });

  it('rechaza correo inválido sin escribir', async () => {
    const r = await actions.updateUserProfile('user-2', { email: 'no-es-email' });
    expect(r).toEqual({ success: false, message: 'Datos no válidos' });
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it('rechaza correo ya usado', async () => {
    prisma.user.findUnique
      .mockResolvedValueOnce({
        email: 'old@x.com',
        role: 'USER',
        profile: { username: null, firstName: null, lastName: null },
      })
      .mockResolvedValueOnce({ id: 'other' });
    const r = await actions.updateUserProfile('user-2', { email: 'taken@x.com' });
    expect(r).toEqual({ success: false, message: 'Ese correo ya está en uso' });
    expect(supabaseAdminAuth.updateUserById).not.toHaveBeenCalled();
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('si cambia el correo sincroniza con Supabase updateUserById({email,email_confirm:true})', async () => {
    prisma.user.findUnique
      .mockResolvedValueOnce({
        email: 'old@x.com',
        role: 'USER',
        profile: { username: null, firstName: null, lastName: null },
      })
      .mockResolvedValueOnce(null);
    supabaseAdminAuth.updateUserById.mockResolvedValue({ error: null });
    prisma.user.update.mockResolvedValue({});
    const r = await actions.updateUserProfile('user-2', { email: 'new@x.com' });
    expect(r.success).toBe(true);
    expect(supabaseAdminAuth.updateUserById).toHaveBeenCalledWith('user-2', {
      email: 'new@x.com',
      email_confirm: true,
    });
  });

  it('si Prisma falla tras cambio de correo restaura el correo anterior en Supabase', async () => {
    prisma.user.findUnique
      .mockResolvedValueOnce({
        email: 'old@x.com',
        role: 'USER',
        profile: { username: null, firstName: null, lastName: null },
      })
      .mockResolvedValueOnce(null);
    supabaseAdminAuth.updateUserById.mockResolvedValue({ error: null });
    prisma.user.update.mockRejectedValue(new Error('db'));
    const r = await actions.updateUserProfile('user-2', { email: 'new@x.com' });
    expect(r.success).toBe(false);
    expect(supabaseAdminAuth.updateUserById).toHaveBeenNthCalledWith(1, 'user-2', {
      email: 'new@x.com',
      email_confirm: true,
    });
    expect(supabaseAdminAuth.updateUserById).toHaveBeenNthCalledWith(2, 'user-2', {
      email: 'old@x.com',
      email_confirm: true,
    });
  });
});

describe('resetUserPassword', () => {
  beforeEach(() => authorize.mockResolvedValue(adminSession));

  it('usa createAnonClient().auth.resetPasswordForEmail con el email de Prisma (no del cliente)', async () => {
    prisma.user.findUnique.mockResolvedValue({ email: 'db@x.com', role: 'USER' });
    resetPasswordForEmail.mockResolvedValue({ error: null });
    const r = await actions.resetUserPassword('user-2');
    expect(r).toEqual({ success: true, message: 'Correo de restablecimiento enviado' });
    expect(createAnonClient).toHaveBeenCalled();
    expect(resetPasswordForEmail).toHaveBeenCalledWith('db@x.com');
    expect(createAdminClient).not.toHaveBeenCalled();
  });

  it('rechaza a otro ADMIN', async () => {
    prisma.user.findUnique.mockResolvedValue({ email: 'a@x.com', role: 'ADMIN' });
    const r = await actions.resetUserPassword('admin-2');
    expect(r).toEqual({ success: false, message: 'No puedes modificar a otro administrador' });
    expect(createAnonClient).not.toHaveBeenCalled();
    expect(resetPasswordForEmail).not.toHaveBeenCalled();
  });
});

describe('approveUser', () => {
  beforeEach(() => authorize.mockResolvedValue(adminSession));

  it('usa updateMany con where {id, status:"PENDING"}', async () => {
    prisma.user.updateMany.mockResolvedValue({ count: 1 });
    const r = await actions.approveUser('user-2');
    expect(r).toEqual({ success: true, message: 'Usuario aprobado correctamente' });
    expect(prisma.user.updateMany).toHaveBeenCalledWith({
      where: { id: 'user-2', status: 'PENDING' },
      data: { status: 'ACTIVE' },
    });
  });

  it('si count 0 y existe devuelve "El usuario no está pendiente de aprobación" (no reactiva suspendidos)', async () => {
    prisma.user.updateMany.mockResolvedValue({ count: 0 });
    prisma.user.findUnique.mockResolvedValue({ id: 'user-2' });
    const r = await actions.approveUser('user-2');
    expect(r).toEqual({ success: false, message: 'El usuario no está pendiente de aprobación' });
  });

  it('si count 0 y no existe devuelve "Usuario no encontrado"', async () => {
    prisma.user.updateMany.mockResolvedValue({ count: 0 });
    prisma.user.findUnique.mockResolvedValue(null);
    const r = await actions.approveUser('user-2');
    expect(r).toEqual({ success: false, message: 'Usuario no encontrado' });
  });
});

describe('getAdminUsers / getPsychologists - paginación y filtros', () => {
  beforeEach(() => authorize.mockResolvedValue(adminSession));

  it('getAdminUsers: limit se acota a 100 y page negativa -> 1', async () => {
    prisma.user.findMany.mockResolvedValue([]);
    prisma.user.count.mockResolvedValue(0);
    await actions.getAdminUsers({ page: -5, limit: 100000 });
    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 0, take: 100 }),
    );
  });

  it('getAdminUsers: status inválido no llega como string arbitrario (se normaliza)', async () => {
    prisma.user.findMany.mockResolvedValue([]);
    prisma.user.count.mockResolvedValue(0);
    await actions.getAdminUsers({ status: 'BOGUS' });
    const call = prisma.user.findMany.mock.calls[0][0] as { where: Record<string, unknown> };
    expect(call.where.status).not.toBe('BOGUS');
    expect(['ACTIVE', 'SUSPENDED', 'PENDING']).toContain(call.where.status);
  });

  it('getAdminUsers: role inválido no llega como string arbitrario (se normaliza)', async () => {
    prisma.user.findMany.mockResolvedValue([]);
    prisma.user.count.mockResolvedValue(0);
    await actions.getAdminUsers({ role: 'SUPERADMIN' });
    const call = prisma.user.findMany.mock.calls[0][0] as { where: Record<string, unknown> };
    expect(call.where.role).not.toBe('SUPERADMIN');
    expect(['USER', 'PSYCHOLOGIST', 'ADMIN']).toContain(call.where.role);
  });

  it('getPsychologists: limit se acota a 100 y page negativa -> 1', async () => {
    prisma.psychologistProfile.findMany.mockResolvedValue([]);
    prisma.psychologistProfile.count.mockResolvedValue(0);
    await actions.getPsychologists({ page: -1, limit: 9999 });
    expect(prisma.psychologistProfile.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 0, take: 100 }),
    );
  });
});

describe('updatePsychologistProfile - validación y email', () => {
  beforeEach(() => authorize.mockResolvedValue(adminSession));

  const baseProfile = {
    id: 'psy-1',
    profile: { user: { id: 'u-psy', email: 'psy@x.com' } },
  };

  it('rechaza sessionPrice negativo sin escribir', async () => {
    const r = await actions.updatePsychologistProfile('psy-1', { sessionPrice: -1 });
    expect(r).toEqual({ success: false, message: 'Datos no válidos' });
    expect(prisma.psychologistProfile.findUnique).not.toHaveBeenCalled();
    expect(prisma.psychologistProfile.update).not.toHaveBeenCalled();
  });

  it('rechaza specialties demasiado largo (array > 20) sin escribir', async () => {
    const specialties = Array.from({ length: 21 }, (_, i) => `s${i}`);
    const r = await actions.updatePsychologistProfile('psy-1', { specialties });
    expect(r).toEqual({ success: false, message: 'Datos no válidos' });
    expect(prisma.psychologistProfile.update).not.toHaveBeenCalled();
  });

  it('rechaza specialty item demasiado largo (> 60) sin escribir', async () => {
    const r = await actions.updatePsychologistProfile('psy-1', { specialties: ['x'.repeat(61)] });
    expect(r).toEqual({ success: false, message: 'Datos no válidos' });
    expect(prisma.psychologistProfile.update).not.toHaveBeenCalled();
  });

  it('correo cambiado se sincroniza con Supabase (updateUserById del auth user)', async () => {
    prisma.psychologistProfile.findUnique.mockResolvedValue(baseProfile);
    prisma.user.findUnique.mockResolvedValue(null);
    supabaseAdminAuth.updateUserById.mockResolvedValue({ error: null });
    prisma.psychologistProfile.update.mockResolvedValue({});
    const r = await actions.updatePsychologistProfile('psy-1', { email: 'newpsy@x.com' });
    expect(r.success).toBe(true);
    expect(supabaseAdminAuth.updateUserById).toHaveBeenCalledWith('u-psy', {
      email: 'newpsy@x.com',
      email_confirm: true,
    });
  });
});
