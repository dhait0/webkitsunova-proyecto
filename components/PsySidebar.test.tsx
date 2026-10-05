'use client';

import { vi } from 'vitest';

vi.mock('next/navigation', () => ({
  usePathname: () => '/psy',
}));

import { render, screen } from '@testing-library/react';
import PsySidebar from '@/components/PsySidebar';
import type { SessionUser } from '@/lib/auth/types';

const session: SessionUser = {
  id: 'psy-1',
  email: 'psico@example.com',
  role: 'PSYCHOLOGIST',
  status: 'ACTIVE',
  profile: { firstName: 'Leidy', lastName: 'Gomez', username: null },
};

function renderSidebar(badges?: { mensajes?: number }) {
  return render(
    <PsySidebar
      session={session}
      displayName="Leidy Gomez"
      onLogout={vi.fn()}
      loggingOut={false}
      sidebarCollapsed={false}
      toggleSidebar={vi.fn()}
      badges={badges}
    />
  );
}

describe('PsySidebar', () => {
  it('renders the five psychologist sections from the mockup', () => {
    renderSidebar();

    for (const label of ['Inicio', 'Talleres', 'Recursos', 'Mensajes', 'Configuración']) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it('does not render the end-user sections', () => {
    renderSidebar();

    expect(screen.queryByText('Hábitos')).not.toBeInTheDocument();
    expect(screen.queryByText('Psicólogos')).not.toBeInTheDocument();
  });

  it('shows the psychologist role label and display name', () => {
    renderSidebar();

    expect(screen.getByText('Leidy Gomez')).toBeInTheDocument();
    expect(screen.getByText('Psicólogo')).toBeInTheDocument();
  });

  it('shows the unread message badge when provided', () => {
    renderSidebar({ mensajes: 4 });

    expect(screen.getByText('4')).toBeInTheDocument();
  });

  it('renders the logout action', () => {
    renderSidebar();

    expect(screen.getByText('Cerrar sesión')).toBeInTheDocument();
  });
});
