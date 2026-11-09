import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import SettingsPage from '@/features/user/SettingsPage';

vi.mock('@/app/(user)/dashboard/configuracion/actions', () => ({
  updateProfileAction: vi.fn(),
  changePasswordAction: vi.fn(),
}));

const initialValues = {
  email: 'ana@example.com',
  firstName: 'Ana',
  lastName: 'Ruiz',
  username: 'ana_ruiz',
};

describe('SettingsPage', () => {
  it('incluye un campo de usuario oculto en el formulario de contraseña', () => {
    const { container } = render(<SettingsPage initialValues={initialValues} />);

    const passwordForm = container
      .querySelector('#currentPassword')!
      .closest('form') as HTMLFormElement;
    const hidden = passwordForm.querySelector('input[autocomplete="username"]') as HTMLInputElement;

    expect(hidden).not.toBeNull();
    expect(hidden.hidden).toBe(true);
    expect(hidden.value).toBe('ana@example.com');
    expect(passwordForm.querySelector('#currentPassword')).toHaveAttribute(
      'autocomplete',
      'current-password',
    );
    expect(passwordForm.querySelector('#newPassword')).toHaveAttribute('autocomplete', 'new-password');
    expect(passwordForm.querySelector('#confirmPassword')).toHaveAttribute(
      'autocomplete',
      'new-password',
    );
  });

  it('renderiza valores iniciales y correo de solo lectura', () => {
    render(<SettingsPage initialValues={initialValues} />);

    expect(screen.getByLabelText('Correo electrónico')).toHaveValue('ana@example.com');
    expect(screen.getByDisplayValue('Ana')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Ruiz')).toBeInTheDocument();
    expect(screen.getByDisplayValue('ana_ruiz')).toBeInTheDocument();

    const emailInput = screen.getByLabelText('Correo electrónico') as HTMLInputElement;
    expect(emailInput.readOnly).toBe(true);
  });

  it('muestra formularios de perfil y cambio de contraseña con labels accesibles', () => {
    render(<SettingsPage initialValues={initialValues} />);

    expect(screen.getByLabelText('Nombre')).toBeInTheDocument();
    expect(screen.getByLabelText('Apellido')).toBeInTheDocument();
    expect(screen.getByLabelText('Nombre de usuario')).toBeInTheDocument();
    expect(screen.getByLabelText('Contraseña actual')).toBeInTheDocument();
    expect(screen.getByLabelText('Nueva contraseña')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirmar nueva contraseña')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Guardar perfil' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Cambiar contraseña' })).toBeEnabled();
  });
});
