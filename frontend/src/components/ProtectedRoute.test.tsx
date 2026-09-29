import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import ProtectedRoute from '@/components/ProtectedRoute';

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: vi.fn(),
  };
});

const mockUseNavigate = vi.mocked(useNavigate);

describe('ProtectedRoute', () => {
  const mockNavigate = vi.fn();

  beforeEach(() => {
    mockUseNavigate.mockReturnValue(mockNavigate);
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
    } as any);
    vi.mocked(supabase.auth.mfa.getAuthenticatorAssuranceLevel).mockResolvedValue({
      data: { currentLevel: 'aal2', nextLevel: null },
    } as any);
  });

  afterEach(() => {
    vi.resetAllMocks();
    mockNavigate.mockClear();
  });

  it('shows checking message while session loads', () => {
    const sessionPromise = new Promise(() => {});
    vi.mocked(supabase.auth.getSession).mockReturnValue(sessionPromise as any);

    render(
      <MemoryRouter>
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <div>Protected content</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Verificando sesión...')).toBeInTheDocument();
  });

  it('redirects to /login when no session', async () => {
    render(
      <MemoryRouter>
        <Routes>
          <Route path="/login" element={<div>Login page</div>} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <div>Protected content</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Login page')).toBeInTheDocument();
    });
  });

  it('renders children when session exists', async () => {
    const mockSession = {
      user: {
        id: 'user-1',
        email: 'test@example.com',
        app_metadata: { role: 'ADMIN' },
        user_metadata: {},
      },
    };

    vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
      data: { session: mockSession },
    } as any);

    render(
      <MemoryRouter>
        <ProtectedRoute>
          <div data-testid="protected-content">Protected content</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });
  });

  it('calls children render function with session', async () => {
    const mockSession = {
      user: {
        id: 'user-1',
        email: 'test@example.com',
        app_metadata: { role: 'USER' },
        user_metadata: { first_name: 'Jane' },
      },
    };

    vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
      data: { session: mockSession },
    } as any);

    vi.mocked(supabase.auth.mfa.getAuthenticatorAssuranceLevel).mockResolvedValue({
      data: { currentLevel: 'aal1', nextLevel: 'aal2' },
    } as any);

    const renderFn = vi.fn(() => <div>MFA content</div>);

    render(
      <MemoryRouter>
        <ProtectedRoute>{renderFn}</ProtectedRoute>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(renderFn).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'user-1',
          email: 'test@example.com',
          role: 'USER',
        })
      );
    });
  });
});
