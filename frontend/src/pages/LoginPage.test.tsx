import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import LoginPage from '@/pages/LoginPage';
import { supabase } from '@/lib/supabase';

describe('LoginPage', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('shows verifying message while checking session', () => {
    const sessionPromise = new Promise(() => {});
    vi.mocked(supabase.auth.getSession).mockReturnValue(sessionPromise as any);

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    expect(screen.getByText('Verificando sesión...')).toBeInTheDocument();
  });

  it('renders login form when no session', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
      data: { session: null },
    } as any);

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Accede a tus hábitos y a tu red de apoyo')).toBeInTheDocument();
    });

    expect(screen.getByLabelText('Correo electrónico')).toBeInTheDocument();
    expect(screen.getByLabelText('Contraseña')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Iniciar sesión' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /continuar con google/i })).toBeInTheDocument();
  });

  it('renders both auth modes as tabs', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
    } as any);

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /iniciar sesión/i })).toBeInTheDocument();
    });

    expect(screen.getByRole('tab', { name: /registrarse/i })).toBeInTheDocument();
  });

  it('submits form with email and password', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
      data: { session: null },
    } as any);

    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      data: {
        session: { access_token: 'token', refresh_token: 'refresh', expires_at: 9999 },
        user: { id: 'user-1', email: 'test@example.com', app_metadata: {}, user_metadata: {} },
      },
      error: null,
    } as any);

    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: {
        session: {
          access_token: 'token',
          refresh_token: 'refresh',
          expires_at: 9999,
          user: { id: 'user-1', email: 'test@example.com', app_metadata: {}, user_metadata: {} },
        },
      },
    } as any);

    vi.mocked(supabase.auth.mfa.getAuthenticatorAssuranceLevel).mockResolvedValue({
      data: { currentLevel: 'aal1', nextLevel: 'aal2' },
    } as any);

    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByLabelText('Correo electrónico')).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText('Correo electrónico'), 'test@example.com');
    await user.type(screen.getByLabelText('Contraseña'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }));

    await waitFor(() => {
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    await waitFor(() => {
      expect(supabase.auth.mfa.getAuthenticatorAssuranceLevel).toHaveBeenCalled();
    });
  });

  it('redirects to the psychologist home when the session role is PSYCHOLOGIST', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
      data: { session: null },
    } as any);

    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      data: { session: {}, user: {} },
      error: null,
    } as any);

    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: {
        session: {
          user: {
            id: 'psy-1',
            email: 'psy@example.com',
            app_metadata: { role: 'PSYCHOLOGIST' },
            user_metadata: {},
          },
        },
      },
    } as any);

    vi.mocked(supabase.auth.mfa.getAuthenticatorAssuranceLevel).mockResolvedValue({
      data: { currentLevel: 'aal1', nextLevel: null },
    } as any);

    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByLabelText('Correo electrónico')).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText('Correo electrónico'), 'psy@example.com');
    await user.type(screen.getByLabelText('Contraseña'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }));

    await waitFor(() => {
      expect(supabase.auth.mfa.getAuthenticatorAssuranceLevel).toHaveBeenCalled();
    });
  });

  it('renders Google login button and calls signInWithOAuth', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
    } as any);

    vi.mocked(supabase.auth.signInWithOAuth).mockResolvedValue({
      data: { url: 'https://google.com/oauth', provider: 'google' },
      error: null,
    } as any);

    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /continuar con google/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /continuar con google/i }));

    await waitFor(() => {
      expect(supabase.auth.signInWithOAuth).toHaveBeenCalledWith(
        expect.objectContaining({
          provider: 'google',
        })
      );
    });
  });

  it('toggles password visibility', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
    } as any);

    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByLabelText('Contraseña')).toBeInTheDocument();
    });

    const passwordInput = screen.getByLabelText('Contraseña') as HTMLInputElement;
    expect(passwordInput.type).toBe('password');

    await user.click(screen.getByRole('button', { name: 'Mostrar contraseña' }));
    expect(passwordInput.type).toBe('text');

    await user.click(screen.getByRole('button', { name: 'Ocultar contraseña' }));
    expect(passwordInput.type).toBe('password');
  });

  it('shows register fields after switching to register tab', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
    } as any);

    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /registrarse/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('tab', { name: /registrarse/i }));

    await waitFor(() => {
      expect(screen.getByLabelText('Nombre de usuario')).toBeInTheDocument();
    });

    expect(screen.getByLabelText('Confirmar contraseña')).toBeInTheDocument();
    expect(screen.queryByLabelText('Nombre de usuario')).toBeInTheDocument();
  });

  it('shows error when passwords do not match', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
    } as any);

    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /registrarse/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('tab', { name: /registrarse/i }));

    await waitFor(() => {
      expect(screen.getByLabelText('Nombre de usuario')).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText('Correo electrónico'), 'test@example.com');
    await user.type(screen.getByLabelText('Nombre de usuario'), 'usuario');
    await user.type(screen.getByLabelText('Contraseña'), 'password123');
    await user.type(screen.getByLabelText('Confirmar contraseña'), 'otra12345');
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }));

    await waitFor(() => {
      expect(screen.getByText('Las contraseñas no coinciden')).toBeInTheDocument();
    });

    expect(supabase.auth.signUp).not.toHaveBeenCalled();
  });
});
