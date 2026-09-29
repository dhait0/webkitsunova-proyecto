import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
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
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Google' })).toBeInTheDocument();
  });

  it('submits form with email and password', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
    } as any);

    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      data: {
        session: { access_token: 'token', refresh_token: 'refresh', expires_at: 9999 },
        user: { id: 'user-1', email: 'test@example.com', app_metadata: {}, user_metadata: {} },
      },
      error: null,
    } as any);

    vi.mocked(supabase.auth.mfa.getAuthenticatorAssuranceLevel).mockResolvedValue({
      data: { currentLevel: 'aal1', nextLevel: 'aal2' },
    } as any);

    const user = userEvent.setup();
    const { container } = render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByLabelText('Correo electrónico')).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText('Correo electrónico'), 'test@example.com');
    await user.type(screen.getByLabelText('Contraseña'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Entrar' }));

    await waitFor(() => {
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
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
      expect(screen.getByRole('button', { name: 'Google' })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Google' }));

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

    await user.click(screen.getByRole('button', { name: 'Mostrar' }));
    expect(passwordInput.type).toBe('text');

    await user.click(screen.getByRole('button', { name: 'Ocultar' }));
    expect(passwordInput.type).toBe('password');
  });

  it('shows link to create new account', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
    } as any);

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Crear una cuenta nueva')).toBeInTheDocument();
    });
  });
});
