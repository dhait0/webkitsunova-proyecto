import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import AdminRoute from '@/components/AdminRoute';

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: vi.fn() };
});

function renderAt(path: string, role: string | undefined) {
  vi.mocked(supabase.auth.getSession).mockResolvedValue({
    data: {
      session: role
        ? {
            user: {
              id: 'user-1',
              email: 'test@example.com',
              app_metadata: { role },
              user_metadata: {},
            },
          }
        : null,
    },
  } as any);

  vi.mocked(supabase.auth.mfa.getAuthenticatorAssuranceLevel).mockResolvedValue({
    data: { currentLevel: 'aal2', nextLevel: null },
  } as any);

  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route
          path="/admin"
          element={<AdminRoute>{(session) => <div data-testid="admin-panel">Admin panel ({session.role})</div>}</AdminRoute>}
        />
        <Route path="/dashboard" element={<div>Panel de usuario</div>} />
        <Route path="/psy" element={<div>Panel del psicólogo</div>} />
        <Route path="/login" element={<div>Login</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('AdminRoute', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders the admin area for an ADMIN session', async () => {
    renderAt('/admin', 'ADMIN');

    await waitFor(() => {
      expect(screen.getByText('Admin panel (ADMIN)')).toBeInTheDocument();
    });
  });

  it('sends a USER to their own home', async () => {
    renderAt('/admin', 'USER');

    await waitFor(() => {
      expect(screen.getByText('Panel de usuario')).toBeInTheDocument();
    });
  });

  it('sends a PSYCHOLOGIST to their own home', async () => {
    renderAt('/admin', 'PSYCHOLOGIST');

    await waitFor(() => {
      expect(screen.getByText('Panel del psicólogo')).toBeInTheDocument();
    });
  });

  it('sends an unknown role to the user area', async () => {
    renderAt('/admin', 'admin' as never);

    await waitFor(() => {
      expect(screen.getByText('Panel de usuario')).toBeInTheDocument();
    });
  });

  it('treats a missing role as USER and sends to the user area', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: {
        session: {
          user: {
            id: 'user-1',
            email: 'test@example.com',
            app_metadata: {},
            user_metadata: {},
          },
        },
      },
    } as any);

    vi.mocked(supabase.auth.mfa.getAuthenticatorAssuranceLevel).mockResolvedValue({
      data: { currentLevel: 'aal2', nextLevel: null },
    } as any);

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route
            path="/admin"
            element={<AdminRoute>{() => <div>Admin panel</div>}</AdminRoute>}
          />
          <Route path="/dashboard" element={<div>Panel de usuario</div>} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Panel de usuario')).toBeInTheDocument();
    });
  });

  it('sends anonymous visitors to login', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({ data: { session: null } } as any);

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route
            path="/admin"
            element={<AdminRoute>{() => <div>Admin panel</div>}</AdminRoute>}
          />
          <Route path="/login" element={<div>Login</div>} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Login')).toBeInTheDocument();
    });
  });
});
