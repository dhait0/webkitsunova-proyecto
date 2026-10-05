'use client';

import { vi } from 'vitest';

vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
}));

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DashboardSidebar from '@/components/DashboardSidebar';
import type { SessionUser } from '@/lib/auth/types';

const mockSession: SessionUser = {
  id: 'user-1',
  email: 'test@example.com',
  role: 'USER',
  profile: {
    firstName: 'Jane',
    lastName: 'Doe',
    username: 'jane',
  },
};

const defaultProps = {
  onLogout: vi.fn(),
  loggingOut: false,
  session: mockSession,
  sidebarCollapsed: false,
  toggleSidebar: vi.fn(),
};

function renderSidebar(props = {}) {
  return render(<DashboardSidebar {...defaultProps} {...props} />);
}

describe('DashboardSidebar', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders sidebar with brand and menu items', () => {
    renderSidebar();

    expect(screen.getByText('Kitsunova')).toBeInTheDocument();
    expect(screen.getAllByRole('link')).toHaveLength(6);
    expect(screen.getByText('Inicio')).toBeInTheDocument();
    expect(screen.getByText('Hábitos')).toBeInTheDocument();
    expect(screen.getByText('Chats')).toBeInTheDocument();
    expect(screen.getByText('Citas')).toBeInTheDocument();
    expect(screen.getByText('Psicólogos')).toBeInTheDocument();
  });

  it('shows user display name and role label', () => {
    renderSidebar();

    expect(screen.getByText('Jane')).toBeInTheDocument();
    expect(screen.getByText('Usuario activo')).toBeInTheDocument();
  });

  it('shows "Administrador" when role is ADMIN', () => {
    renderSidebar({
      session: { ...mockSession, role: 'ADMIN' },
    });

    expect(screen.getByText('Administrador')).toBeInTheDocument();
  });

  it('shows "Psicólogo" when role is PSYCHOLOGIST', () => {
    renderSidebar({
      session: { ...mockSession, role: 'PSYCHOLOGIST' },
    });

    expect(screen.getByText('Psicólogo')).toBeInTheDocument();
  });

  it('calls toggleSidebar when toggle button is clicked', async () => {
    const user = userEvent.setup();
    renderSidebar();

    const toggleBtn = screen.getByRole('button', { name: 'Colapsar menú' });
    await user.click(toggleBtn);

    expect(defaultProps.toggleSidebar).toHaveBeenCalledTimes(1);
  });

  it('applies collapsed class when sidebarCollapsed is true', () => {
    renderSidebar({ sidebarCollapsed: true });

    const aside = screen.getByRole('complementary');
    expect(aside).toHaveClass('collapsed');
    expect(screen.getByRole('button', { name: 'Expandir menú' })).toBeInTheDocument();
  });

  it('shows "Cerrando..." on logout button when loggingOut is true', () => {
    renderSidebar({ loggingOut: true });

    expect(screen.getByText('Cerrando...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cerrando...' })).toBeDisabled();
  });
});
