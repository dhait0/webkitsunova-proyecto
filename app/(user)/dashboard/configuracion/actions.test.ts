import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockAuthorize = vi.hoisted(() => vi.fn());
const mockUpdateUserProfile = vi.hoisted(() => vi.fn());
const mockChangeUserPassword = vi.hoisted(() => vi.fn());
const mockRevalidatePath = vi.hoisted(() => vi.fn());

vi.mock('@/lib/auth/guard', () => ({ authorize: mockAuthorize }));
vi.mock('@/services/user/settings.service', () => ({
  updateUserProfile: mockUpdateUserProfile,
  changeUserPassword: mockChangeUserPassword,
}));
vi.mock('next/cache', () => ({ revalidatePath: mockRevalidatePath }));

import { changePasswordAction, updateProfileAction } from './actions';

const session = { id: 'session-user-id', email: 'u@example.com', role: 'USER', status: 'ACTIVE' };

function fd(entries: Record<string, string>) {
  const form = new FormData();
  for (const [k, v] of Object.entries(entries)) form.set(k, v);
  return form;
}

beforeEach(() => {
  vi.resetAllMocks();
  mockAuthorize.mockResolvedValue(session);
  mockUpdateUserProfile.mockResolvedValue(undefined);
  mockChangeUserPassword.mockResolvedValue(undefined);
});

describe('updateProfileAction', () => {
  it('rechaza cuando no está autorizado', async () => {
    mockAuthorize.mockResolvedValue(null);
    const result = await updateProfileAction(fd({ username: 'valido1' }));
    expect(result).toEqual({ success: false, message: 'No autorizado' });
    expect(mockUpdateUserProfile).not.toHaveBeenCalled();
  });

  it('valida username inválido', async () => {
    const result = await updateProfileAction(fd({ username: 'ab' }));
    expect(result.success).toBe(false);
    expect(mockUpdateUserProfile).not.toHaveBeenCalled();
  });

  it('reporta username duplicado', async () => {
    mockUpdateUserProfile.mockRejectedValue(new Error('Ese nombre de usuario ya está en uso'));
    const result = await updateProfileAction(fd({ username: 'duplicado' }));
    expect(result).toEqual({ success: false, message: 'Ese nombre de usuario ya está en uso' });
  });

  it('usa session.id y no un id del formulario', async () => {
    await updateProfileAction(
      fd({ username: 'valido1', firstName: 'A', lastName: 'B', userId: 'otro-id', role: 'ADMIN' }),
    );
    expect(mockUpdateUserProfile).toHaveBeenCalledWith('session-user-id', {
      firstName: 'A',
      lastName: 'B',
      username: 'valido1',
    });
  });

  it('actualiza perfil con éxito y revalida rutas', async () => {
    const result = await updateProfileAction(fd({ username: 'valido1' }));
    expect(result).toEqual({ success: true, message: 'Perfil actualizado correctamente' });
    expect(mockRevalidatePath).toHaveBeenCalledWith('/dashboard/configuracion');
    expect(mockRevalidatePath).toHaveBeenCalledWith('/dashboard');
  });
});

describe('changePasswordAction', () => {
  it('rechaza cuando no está autorizado', async () => {
    mockAuthorize.mockResolvedValue(null);
    const result = await changePasswordAction(
      fd({ currentPassword: 'x', newPassword: '12345678', confirmPassword: '12345678' }),
    );
    expect(result).toEqual({ success: false, message: 'No autorizado' });
  });

  it('valida contraseñas distintas', async () => {
    const result = await changePasswordAction(
      fd({ currentPassword: 'actual123', newPassword: '12345678', confirmPassword: '87654321' }),
    );
    expect(result.success).toBe(false);
    expect(result.message).toContain('no coinciden');
    expect(mockChangeUserPassword).not.toHaveBeenCalled();
  });

  it('reporta contraseña actual incorrecta', async () => {
    mockChangeUserPassword.mockRejectedValue(new Error('La contraseña actual no es correcta'));
    const result = await changePasswordAction(
      fd({ currentPassword: 'mala1234', newPassword: '12345678', confirmPassword: '12345678' }),
    );
    expect(result).toEqual({ success: false, message: 'La contraseña actual no es correcta' });
  });

  it('cambia contraseña con éxito usando session.id y session.email', async () => {
    const result = await changePasswordAction(
      fd({ currentPassword: 'actual123', newPassword: '12345678', confirmPassword: '12345678' }),
    );
    expect(result).toEqual({ success: true, message: 'Contraseña actualizada correctamente' });
    expect(mockChangeUserPassword).toHaveBeenCalledWith(
      'session-user-id',
      'u@example.com',
      'actual123',
      '12345678',
    );
  });
});
