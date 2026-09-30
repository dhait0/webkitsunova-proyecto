import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import PsyRoute from '@/components/PsyRoute';

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: vi.fn() };
});

function renderAt(path: string, role: string) {
  vi.mocked(supabase.auth.getSession).mockResolvedValue({
    data: {
      session: {
        user: {
          id: 'user-1',
          email: 'test@example.com',
          app_metadata: { role },
          user_metadata: {},
        },
      },
    },
  } as any);

  vi.mocked(supabase.auth.mfa.getAuthenticatorAssuranceLevel).mockResolvedValue({
    data: { currentLevel: 'aal2', nextLevel: null },
  } as any);

  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route
          path="/psy"
          element={<PsyRoute>{() => <div>Panel del psicólogo</div>}</PsyRoute>}
        />
        <Route path="/dashboard" element={<div>Panel de usuario</div>} />
        <Route path="/admin" element={<div>Panel admin</div>} />
        <Route path="/login" element={<div>Login</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('PsyRoute', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders the psychologist area for a PSYCHOLOGIST session', async () => {
    renderAt('/psy', 'PSYCHOLOGIST');

    await waitFor(() => {
      expect(screen.getByText('Panel del psicólogo')).toBeInTheDocument();
    });
  });

  it('sends a USER to their own home', async () => {
    renderAt('/psy', 'USER');

    await waitFor(() => {
      expect(screen.getByText('Panel de usuario')).toBeInTheDocument();
    });
  });

  it('lets an ADMIN inspect the psychologist area', async () => {
    // The switcher sends administrators here, so the gate has to admit them.
    // Access to the psy API is still enforced by the backend.
    renderAt('/psy', 'ADMIN');

    await waitFor(() => {
      expect(screen.getByText('Panel del psicólogo')).toBeInTheDocument();
    });
  });

  it('sends an unknown role to the user area', async () => {
    renderAt('/psy', 'admin');

    await waitFor(() => {
      expect(screen.getByText('Panel de usuario')).toBeInTheDocument();
    });
  });

  it('sends anonymous visitors to login', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({ data: { session: null } } as any);

    render(
      <MemoryRouter initialEntries={['/psy']}>
        <Routes>
          <Route
            path="/psy"
            element={<PsyRoute>{() => <div>Panel del psicólogo</div>}</PsyRoute>}
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
