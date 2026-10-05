'use client';

import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AdminDashboardPage from './AdminDashboardPage';
import AdminLayout from '@/features/AdminLayout';
import AdminNotFoundPage from './AdminNotFoundPage';
import type { SessionUser } from '@/lib/auth/types';

const getAdminUserStats = vi.fn();
const getAdminPsyStats = vi.fn();

vi.mock('@/app/(admin)/admin/actions', () => ({
  getAdminUserStats: (...args: unknown[]) => getAdminUserStats(...args),
  getAdminPsyStats: (...args: unknown[]) => getAdminPsyStats(...args),
}));

const session: SessionUser = {
  id: 'a1',
  email: 'admin@example.com',
  role: 'ADMIN',
  profile: { firstName: 'Ada', username: 'ada' },
};

function mockStats() {
  getAdminUserStats.mockResolvedValue({
    success: true,
    stats: { total: 120, active: 100, suspended: 15, pending: 5 },
  });
  getAdminPsyStats.mockResolvedValue({
    success: true,
    stats: { total: 30, approved: 20, pending: 8, suspended: 2 },
  });
}

// The App Router layout takes `children` instead of rendering an <Outlet>,
// and the current path comes from a mocked `usePathname`.
let currentPath = '/admin';

vi.mock('next/navigation', () => ({
  usePathname: () => currentPath,
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
}));

function renderAt(path: string, element: React.ReactNode) {
  currentPath = path;
  return render(
    <AdminLayout session={session}>{element}</AdminLayout>
  );
}

describe('AdminDashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStats();
  });

  it('shows the greeting with the admin name and role', async () => {
    renderAt('/admin', <AdminDashboardPage />);

    expect(await screen.findByRole('heading', { name: 'Panel de control' })).toBeInTheDocument();

    const subtitle = screen.getByText(/Bienvenido/);
    expect(subtitle).toHaveTextContent('Ada');
    expect(subtitle).toHaveTextContent('Administrador');
  });

  it('renders the user and psychologist totals', async () => {
    renderAt('/admin', <AdminDashboardPage />);

    await waitFor(() => expect(getAdminUserStats).toHaveBeenCalled());
    expect(await screen.findByText('120')).toBeInTheDocument();
    expect(screen.getByText('30')).toBeInTheDocument();
  });

  it('shows the error state when stats fail', async () => {
    getAdminUserStats.mockRejectedValue(new Error('Sin conexión'));
    getAdminPsyStats.mockRejectedValue(new Error('Sin conexión'));

    renderAt('/admin', <AdminDashboardPage />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Sin conexión');
  });
});

describe('AdminLayout', () => {
  it('marks pending modules as non-navigable', async () => {
    renderAt('/admin', <div />);

    const foro = screen.getByText('Foro').closest('li') as HTMLElement;
    expect(foro.querySelector('a')).toBeNull();
    expect(within(foro).getByText('Pronto')).toBeInTheDocument();
  });

  it('keeps implemented modules navigable', async () => {
    renderAt('/admin', <div />);

    expect(screen.getByRole('link', { name: /Usuarios/ })).toHaveAttribute('href', '/admin/users');
    expect(screen.getByRole('link', { name: /Psicólogos/ })).toHaveAttribute(
      'href',
      '/admin/psychologists'
    );
  });

  it('shows the current page title in the topbar', async () => {
    const { container } = renderAt('/admin/users', <div />);

    await screen.findByRole('link', { name: /Usuarios/ });
    expect(container.querySelector('.admin-page-title')).toHaveTextContent('Usuarios');
  });

  it('falls back to a generic topbar title on unknown routes', async () => {
    const { container } = renderAt('/admin/inexistente', <div />);

    await screen.findByRole('link', { name: /Inicio/ });
    expect(container.querySelector('.admin-page-title')).toHaveTextContent(
      'Panel de administración'
    );
  });

  it('toggles the sidebar', async () => {
    const user = userEvent.setup();
    renderAt('/admin', <div />);

    await user.click(screen.getByRole('button', { name: 'Colapsar menú' }));

    expect(screen.getByRole('complementary')).toHaveClass('collapsed');
    expect(screen.getByRole('button', { name: 'Expandir menú' })).toBeInTheDocument();
  });

  it('toggles the sidebar from the topbar control', async () => {
    const user = userEvent.setup();
    renderAt('/admin', <div />);

    await user.click(screen.getByRole('button', { name: 'Colapsar barra lateral' }));

    expect(screen.getByRole('complementary')).toHaveClass('collapsed');
  });
});

describe('AdminNotFoundPage', () => {
  it('explains the section does not exist and links to valid pages', async () => {
    render(<AdminNotFoundPage />);

    expect(screen.getByText('404')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Usuarios/ })).toHaveAttribute('href', '/admin/users');
    expect(screen.getByRole('link', { name: /Inicio/ })).toHaveAttribute('href', '/admin');
  });

  it('does not link to modules that are still pending', async () => {
    render(<AdminNotFoundPage />);

    expect(screen.queryByRole('link', { name: /Foro/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Reportes/ })).not.toBeInTheDocument();
  });
});
