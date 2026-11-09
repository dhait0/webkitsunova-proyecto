import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockRequireUser = vi.hoisted(() => vi.fn());
const mockCreateHabit = vi.hoisted(() => vi.fn());
const mockUpdateHabit = vi.hoisted(() => vi.fn());
const mockSetCompletion = vi.hoisted(() => vi.fn());
const mockDeleteHabit = vi.hoisted(() => vi.fn());
const mockRevalidatePath = vi.hoisted(() => vi.fn());

vi.mock('@/lib/auth/guard', () => ({ requireUser: mockRequireUser }));
vi.mock('@/services/user/habits.service', () => ({
  HABIT_STATUSES: ['active', 'paused', 'completed'],
  createHabit: mockCreateHabit,
  updateHabit: mockUpdateHabit,
  setHabitCompletion: mockSetCompletion,
  deleteHabit: mockDeleteHabit,
}));
vi.mock('next/cache', () => ({ revalidatePath: mockRevalidatePath }));

import {
  createHabitAction,
  deleteHabitAction,
  setHabitCompletionAction,
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
  mockSetCompletion.mockResolvedValue({ date: '2026-11-11', done: true });
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
    expect(await deleteHabitAction(fd({ habitId: 'h1' }))).toEqual({ success: false, message: 'Cuenta no activa' });
    expect(await setHabitCompletionAction('h1', null, true)).toEqual({ success: false, message: 'Cuenta no activa' });
    expect(mockDeleteHabit).not.toHaveBeenCalled();
    expect(mockSetCompletion).not.toHaveBeenCalled();
  });
});

describe('habits actions — validación', () => {
  it('rechaza un estado desconocido', async () => {
    const result = await updateHabitAction(fd({ habitId: 'h1', status: 'archivado' }));
    expect(result.success).toBe(false);
    expect(mockUpdateHabit).not.toHaveBeenCalled();
  });

  it('acepta pausar un hábito', async () => {
    const result = await updateHabitAction(fd({ habitId: 'h1', status: 'paused' }));
    expect(result.success).toBe(true);
    expect(mockUpdateHabit).toHaveBeenCalledWith('session-user-id', 'h1', expect.objectContaining({ status: 'paused' }));
  });

  it('rechaza título vacío o demasiado largo', async () => {
    expect((await createHabitAction(fd({ title: '   ' }))).success).toBe(false);
    expect((await createHabitAction(fd({ title: 'a'.repeat(81) }))).success).toBe(false);
    expect(mockCreateHabit).not.toHaveBeenCalled();
  });

  it('valida la meta semanal entre 1 y 7 días enteros', async () => {
    for (const bad of ['0', '8', '2.5', 'abc']) {
      expect((await createHabitAction(fd({ title: 'Leer', targetPerWeek: bad }))).success).toBe(false);
    }
    expect(mockCreateHabit).not.toHaveBeenCalled();

    const ok = await createHabitAction(fd({ title: 'Leer', targetPerWeek: '3' }));
    expect(ok.success).toBe(true);
    expect(mockCreateHabit).toHaveBeenCalledWith('session-user-id', {
      title: 'Leer',
      description: null,
      targetPerWeek: 3,
    });
  });

  it('usa 7 días por semana cuando no se indica la meta', async () => {
    await createHabitAction(fd({ title: 'Leer' }));
    expect(mockCreateHabit).toHaveBeenCalledWith('session-user-id', expect.objectContaining({ targetPerWeek: 7 }));
  });

  it('rechaza fechas con formato inválido al registrar cumplimientos', async () => {
    for (const bad of ['ayer', '2026-1-1', '11/11/2026']) {
      expect((await setHabitCompletionAction('h1', bad, true)).success).toBe(false);
    }
    expect((await setHabitCompletionAction('', null, true)).success).toBe(false);
    expect(mockSetCompletion).not.toHaveBeenCalled();
  });
});

describe('habits actions — cumplimientos', () => {
  it('registra hoy cuando no se indica fecha, con la identidad de la sesión', async () => {
    const result = await setHabitCompletionAction('h1', null, true);
    expect(result).toEqual({ success: true });
    expect(mockSetCompletion).toHaveBeenCalledWith('session-user-id', 'h1', { date: undefined, done: true });
    expect(mockRevalidatePath).toHaveBeenCalledWith('/dashboard/habitos');
    expect(mockRevalidatePath).toHaveBeenCalledWith('/dashboard');
  });

  it('permite desmarcar un día concreto', async () => {
    await setHabitCompletionAction('h1', '2026-11-10', false);
    expect(mockSetCompletion).toHaveBeenCalledWith('session-user-id', 'h1', { date: '2026-11-10', done: false });
  });

  it('devuelve el mensaje del servicio cuando la regla de negocio falla', async () => {
    mockSetCompletion.mockRejectedValue(new Error('No se puede registrar un día futuro'));
    expect(await setHabitCompletionAction('h1', '2099-01-01', true)).toEqual({
      success: false,
      message: 'No se puede registrar un día futuro',
    });
  });
});

describe('habits actions — identidad', () => {
  it('ignora un userId enviado por el cliente', async () => {
    await createHabitAction(fd({ title: 'Leer', userId: 'otro-id' }));
    expect(mockCreateHabit.mock.calls[0][0]).toBe('session-user-id');

    await deleteHabitAction(fd({ habitId: 'h1', userId: 'otro-id' }));
    expect(mockDeleteHabit).toHaveBeenCalledWith('session-user-id', 'h1');
  });
});
