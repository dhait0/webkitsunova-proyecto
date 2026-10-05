'use client';

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import LoginForm from '@/features/auth/LoginForm';
import { createClient } from '@/lib/supabase/browser';

vi.mock('@/app/(auth)/actions', () => ({
  registerUser: vi.fn(),
}));

const push = vi.fn();
const replace = vi.fn();
const refresh = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, replace, refresh }),
}));

const supabase = createClient();

const supabaseUser = (appMetadata: Record<string, unknown> = {}) => ({
  id: 'user-1',
  email: 'test@example.com',
  app_metadata: appMetadata,
  user_metadata: {},
});

describe('LoginForm', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders the login form', async () => {
    render(<LoginForm />);

    expect(screen.getByLabelText('Correo electrónico')).toBeInTheDocument();
    expect(screen.getByLabelText('Contraseña')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /continuar con google/i })).toBeInTheDocument();
  });

  it('renders both auth modes as tabs', () => {
    render(<LoginForm />);

    expect(screen.getByRole('tab', { name: /iniciar sesión/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /crear cuenta/i })).toBeInTheDocument();
  });

  it('submits credentials and refreshes the server session', async () => {
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      data: {
        session: {
          access_token: 'token',
          refresh_token: 'refresh',
          expires_at: 9999,
          user: supabaseUser(),
        },
        user: supabaseUser(),
      },
      error: null,
    } as never);

    vi.mocked(supabase.auth.mfa.getAuthenticatorAssuranceLevel).mockResolvedValue({
      data: { currentLevel: 'aal1', nextLevel: 'aal1' },
    } as never);

    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByLabelText('Correo electrónico'), 'test@example.com');
    await user.type(screen.getByLabelText('Contraseña'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Entrar' }));

    await waitFor(() => {
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    // The session now lives in cookies, so the server has to re-read them.
    await waitFor(() => {
      expect(refresh).toHaveBeenCalled();
    });
    expect(push).toHaveBeenCalledWith('/dashboard');
  });

  it('routes a PSYCHOLOGIST to their own area after login', async () => {
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      data: {
        session: {
          access_token: 'token',
          refresh_token: 'refresh',
          expires_at: 9999,
          user: supabaseUser({ role: 'PSYCHOLOGIST' }),
        },
        user: supabaseUser({ role: 'PSYCHOLOGIST' }),
      },
      error: null,
    } as never);

    vi.mocked(supabase.auth.mfa.getAuthenticatorAssuranceLevel).mockResolvedValue({
      data: { currentLevel: 'aal1', nextLevel: 'aal1' },
    } as never);

    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByLabelText('Correo electrónico'), 'test@example.com');
    await user.type(screen.getByLabelText('Contraseña'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Entrar' }));

    await waitFor(() => {
      expect(push).toHaveBeenCalledWith('/psy');
    });
  });

  // Regression: a session at aal1 that can reach aal2 must be sent to MFA
  // verification instead of straight into its area.
  it('sends a session awaiting aal2 to the MFA step', async () => {
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      data: {
        session: {
          access_token: 'token',
          refresh_token: 'refresh',
          expires_at: 9999,
          user: supabaseUser({ role: 'ADMIN' }),
        },
        user: supabaseUser({ role: 'ADMIN' }),
      },
      error: null,
    } as never);

    vi.mocked(supabase.auth.mfa.getAuthenticatorAssuranceLevel).mockResolvedValue({
      data: { currentLevel: 'aal1', nextLevel: 'aal2' },
    } as never);

    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByLabelText('Correo electrónico'), 'test@example.com');
    await user.type(screen.getByLabelText('Contraseña'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Entrar' }));

    await waitFor(() => {
      expect(push).toHaveBeenCalledWith('/mfa/verify?from=%2Fadmin');
    });
  });

  it('renders the Google button and starts the OAuth flow', async () => {
    vi.mocked(supabase.auth.signInWithOAuth).mockResolvedValue({
      data: { url: 'https://accounts.google.com/o/oauth2/auth' },
      error: null,
    } as never);

    const user = userEvent.setup();
    render(<LoginForm />);

    await user.click(screen.getByRole('button', { name: /continuar con google/i }));

    await waitFor(() => {
      expect(supabase.auth.signInWithOAuth).toHaveBeenCalled();
    });
  });

  it('toggles password visibility', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    const password = screen.getByLabelText('Contraseña');
    expect(password).toHaveAttribute('type', 'password');

    await user.click(screen.getByRole('button', { name: /mostrar contraseña/i }));

    expect(password).toHaveAttribute('type', 'text');
  });

  it('shows the register fields after switching tabs', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.click(screen.getByRole('tab', { name: /crear cuenta/i }));

    await waitFor(() => {
      expect(screen.getByLabelText('Nombre de usuario')).toBeInTheDocument();
    });

    expect(screen.getByLabelText('Confirmar contraseña')).toBeInTheDocument();
  });

  it('blocks registration when the passwords do not match', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.click(screen.getByRole('tab', { name: /crear cuenta/i }));

    await waitFor(() => {
      expect(screen.getByLabelText('Nombre de usuario')).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText('Correo electrónico'), 'test@example.com');
    await user.type(screen.getByLabelText('Nombre de usuario'), 'usuario');
    await user.type(screen.getByLabelText('Contraseña'), 'password123');
    await user.type(screen.getByLabelText('Confirmar contraseña'), 'otra12345');
    await user.click(screen.getByRole('button', { name: 'Crear mi cuenta' }));

    await waitFor(() => {
      expect(screen.getByText('Las contraseñas no coinciden')).toBeInTheDocument();
    });

    expect(supabase.auth.signUp).not.toHaveBeenCalled();
  });
});
