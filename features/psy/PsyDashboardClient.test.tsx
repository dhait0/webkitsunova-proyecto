import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PsyDashboardClient from '@/features/psy/PsyDashboardClient';
import type { PsyDashboard } from '@/lib/api';

const mockRefresh = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: mockRefresh }),
}));

vi.mock('@/lib/api', () => {
  const fail = () => {
    throw new Error('No se debe llamar a lib/api desde el dashboard');
  };
  return new Proxy(
    {},
    {
      get: (_target, prop) => {
        if (prop === '__esModule') return true;
        return fail;
      },
    },
  );
});

const initialData: PsyDashboard = {
  success: true,
  profile: {
    name: 'Dra. Ana Pérez',
    email: 'ana@example.com',
    country: 'CO',
    birthDate: null,
    bio: null,
    specialties: ['Ansiedad'],
    sessionPrice: 50000,
    currency: 'COP',
    isApproved: true,
    isVerified: true,
    isAcceptingNew: true,
    availability: [],
  },
  stats: {
    activePatients: 3,
    pendingMessages: 1,
    sessionsToday: 2,
    upcomingSessions: 4,
    workshops: 1,
    resources: 5,
  },
  nextAppointment: {
    id: 'apt-1',
    patientName: 'Paciente Uno',
    startsAt: '2026-11-10T10:00:00.000Z',
    status: 'CONFIRMED',
    reason: 'Seguimiento',
  },
  todayAppointments: [],
  recentPatients: [
    {
      userId: 'u-1',
      name: 'Paciente Uno',
      email: 'p1@example.com',
      avatarUrl: null,
      country: 'CO',
      mood: 'ESTABLE',
      lastActivityAt: '2026-11-09T08:00:00.000Z',
    },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('PsyDashboardClient', () => {
  it('renderiza datos iniciales sin llamar a ninguna API', () => {
    render(<PsyDashboardClient initialData={initialData} session={{ id: 'psy-1' } as any} />);

    expect(screen.getByText('Dra. Ana Pérez')).toBeInTheDocument();
    expect(screen.getAllByText('Paciente Uno').length).toBeGreaterThan(0);
    expect(screen.getByText('3')).toBeInTheDocument(); // activePatients
    expect(screen.queryByText(/request failed/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/No se debe llamar a lib\/api/i)).not.toBeInTheDocument();
  });

  it('usa router.refresh al recargar', () => {
    render(<PsyDashboardClient initialData={initialData} session={{ id: 'psy-1' } as any} />);

    fireEvent.click(screen.getByRole('button', { name: /actualizar/i }));
    expect(mockRefresh).toHaveBeenCalledTimes(1);
  });
});
