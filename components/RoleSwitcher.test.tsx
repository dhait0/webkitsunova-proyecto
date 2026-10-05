'use client';

import { vi } from 'vitest';

vi.mock('next/navigation', () => ({
  usePathname: () => '/admin',
}));

import { render, screen } from '@testing-library/react';
import RoleSwitcher from '@/components/RoleSwitcher';
import type { SessionUser } from '@/lib/auth/types';

function sessionFor(role: string): SessionUser {
  return {
    id: 'user-1',
    email: 'test@example.com',
    role,
    status: 'ACTIVE',
    profile: { firstName: null, lastName: null, username: null },
  } as SessionUser;
}

function renderFor(role: string) {
  return render(<RoleSwitcher session={sessionFor(role)} />);
}

describe('RoleSwitcher', () => {
  it('offers the three areas to an administrator', () => {
    renderFor('ADMIN');

    expect(screen.getByRole('link', { name: 'Administración' })).toHaveAttribute('href', '/admin');
    expect(screen.getByRole('link', { name: 'Psicólogo' })).toHaveAttribute('href', '/psy');
    expect(screen.getByRole('link', { name: 'Usuario' })).toHaveAttribute('href', '/dashboard');
  });

  it('offers only two areas to a psychologist', () => {
    renderFor('PSYCHOLOGIST');

    expect(screen.getByRole('link', { name: 'Psicólogo' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Usuario' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Administración' })).not.toBeInTheDocument();
  });

  it('renders nothing for a plain user', () => {
    const { container } = renderFor('USER');

    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when the role is missing or malformed', () => {
    expect(renderFor('admin').container).toBeEmptyDOMElement();
    expect(renderFor('').container).toBeEmptyDOMElement();
  });
});
