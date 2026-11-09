import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

const authorize = vi.hoisted(() => vi.fn());

vi.mock('@/lib/auth/guard', () => ({ authorize }));
vi.mock('@/lib/db/prisma', () => ({ prisma: {} }));

const modules = {
  citas: () => import('./citas/actions'),
  derivaciones: () => import('./derivaciones/actions'),
  mensajes: () => import('./mensajes/actions'),
  notificaciones: () => import('./notificaciones/actions'),
  preferencias: () => import('./notificaciones/preferencias/actions'),
  pacientes: () => import('./pacientes/actions'),
  pacienteDetalle: () => import('./pacientes/[userId]/actions'),
  perfil: () => import('./perfil/actions'),
  recursos: () => import('./recursos/actions'),
  sesiones: () => import('./sesiones/actions'),
  talleres: () => import('./talleres/actions'),
};

beforeEach(() => {
  authorize.mockReset();
});

describe.each(Object.entries(modules))('acciones de psicólogo: %s', (_name, load) => {
  it('rechaza toda acción cuando authorize no admite la sesión', async () => {
    authorize.mockResolvedValue(null);
    const actions = Object.entries(await load()).filter(([, value]) => typeof value === 'function');

    expect(actions.length).toBeGreaterThan(0);

    for (const [name, action] of actions) {
      await expect((action as (...args: unknown[]) => Promise<unknown>)('x', 'y'), name).rejects.toThrow(
        'No autorizado',
      );
    }
  });

  it('exige el rol PSYCHOLOGIST en cada llamada', async () => {
    authorize.mockResolvedValue(null);
    const actions = Object.entries(await load()).filter(([, value]) => typeof value === 'function');

    for (const [, action] of actions) {
      await (action as (...args: unknown[]) => Promise<unknown>)('x', 'y').catch(() => undefined);
    }

    expect(authorize).toHaveBeenCalledTimes(actions.length);
    for (const call of authorize.mock.calls) {
      expect(call[0]).toEqual(['PSYCHOLOGIST']);
    }
  });
});
