import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockRequireUser = vi.hoisted(() => vi.fn());
const mockCreateHabit = vi.hoisted(() => vi.fn());
const mockUpdateHabit = vi.hoisted(() => vi.fn());
const mockRegisterHabitProgress = vi.hoisted(() => vi.fn());
const mockDeleteHabit = vi.hoisted(() => vi.fn());
const mockRevalidatePath = vi.hoisted(() => vi.fn());

vi.mock('@/lib/auth/guard', () => ({ requireUser: mockRequireUser }));
vi.mock('@/services/user/habits.service', () => ({
  createHabit: mockCreateHabit,
  updateHabit: mockUpdateHabit,
  registerHabitProgress: mockRegisterHabitProgress,
  deleteHabit: mockDeleteHabit,
}));
vi.mock('next/cache', () => ({ revalidatePath: mockRevalidatePath }));

import {
  createHabitAction,
  deleteHabitAction,
  registerHabitProgressAction,
  updateHabitAction,
} from './actions';

const activeSession = { id: 'session-user-id', email: 'u@example.com', role: 'USER', status: 'ACTIVE' };

function fd(entries: Record<string, string>) {
  const form = new FormData();
  for (const [k, v] of Object.entries(entries)) form.set(k, v);
  return form;
}

beforeEach(() => {
  vi.resetAllMocks();
  mockRequireUser.mockResolvedValue(activeSession);
  mockCreateHabit.mockResolvedValue({ id: 'h1' });
  mockUpdateHabit.mockResolvedValue({ id: 'h1' });
  mockRegisterHabitProgress.mockResolvedValue({ id: 'h1' });
  mockDeleteHabit.mockResolvedValue({ success: true });
});

describe('habits actions — autorización', () => {
  it('rechaza cuando no está autorizado (rol distinto)', async () => {
    mockRequireUser.mockResolvedValue({ ...activeSession, role: 'PSYCHOLOGIST' });
    const result = await createHabitAction(fd({ title: 'Leer' }));
    expect(result).toEqual({ success: false, message: 'No autorizado' });
    expect(mockCreateHabit).not.toHaveBeenCalled();
  });

  it('rechaza cuando la cuenta no está activa', async () => {
    mockRequireUser.mockResolvedValue({ ...activeSession, status: 'SUSPENDED' });
    const result = await deleteHabitAction(fd({ habitId: 'h1' }));
    expect(result).toEqual({ success: false, message: 'Cuenta no activa' });
    expect(mockDeleteHabit).not.toHaveBeenCalled();
  });
});

describe('habits actions — validación', () => {
  it('rechaza status inválido', async () => {
    const result = await updateHabitAction(fd({ habitId: 'h1', status: 'invalid' }));
    expect(result.success).toBe(false);
    expect(result.message).toContain('active');
    expect(mockUpdateHabit).not.toHaveBeenCalled();
  });

  it('rechaza delta inválido', async () => {
    const result = await registerHabitProgressAction(fd({ habitId: 'h1', delta: '0' }));
    expect(result.success).toBe(false);
    expect(mockRegisterHabitProgress).not.toHaveBeenCalled();

    const result2 = await registerHabitProgressAction(fd({ habitId: 'h1', delta: '101' }));
    expect(result2.success).toBe(false);

    const result3 = await registerHabitProgressAction(fd({ habitId: 'h1', delta: '1.5' }));
    expect(result3.success).toBe(false);
  });
});

describe('habits actions — ownership con session.id', () => {
  it('usa session.id y no un id del formulario al crear/actualizar/eliminar', async () => {
    await createHabitAction(fd({ title: 'Leer', userId: 'otro-id' }));
    expect(mockCreateHabit).toHaveBeenCalledWith('session-user-id', expect.objectContaining({ title: 'Leer' }));

    await updateHabitAction(fd({ habitId: 'h1', status: 'completed', userId: 'otro-id' }));
    expect(mockUpdateHabit).toHaveBeenCalledWith('session-user-id', 'h1', expect.anything());

    await registerHabitProgressAction(fd({ habitId: 'h1', delta: '10', userId: 'otro-id' }));
    expect(mockRegisterHabitProgress).toHaveBeenCalledWith('session-user-id', 'h1', 10);

    await deleteHabitAction(fd({ habitId: 'h1', userId: 'otro-id' }));
    expect(mockDeleteHabit).toHaveBeenCalledWith('session-user-id', 'h1');
  });
});
