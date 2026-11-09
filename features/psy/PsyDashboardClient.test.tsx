import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PsyDashboardClient from '@/features/psy/PsyDashboardClient';
import type { PsyDashboard } from '@/lib/api';

const mockRefresh = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: mockRefresh }),
}));

const mockUpdateStatus = vi.fn();
vi.mock('@/app/(psychologist)/psy/citas/actions', () => ({
  updateAppointmentStatusAction: (...args: unknown[]) => mockUpdateStatus(...args),
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
    pendingRequests: 1,
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
  pendingRequests: [
    {
      id: 'req-1',
      patientName: 'Paciente Dos',
      startsAt: '2026-11-12T15:00:00.000Z',
      status: 'PENDING',
      reason: 'Segunda opinión',
    },
  ],
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

describe('PsyDashboardClient — solicitudes de cita', () => {
  it('muestra las solicitudes pendientes y su contador', () => {
    render(<PsyDashboardClient initialData={initialData} session={{ id: 'u', email: 'a@b.c', role: 'PSYCHOLOGIST' }} />);

    expect(screen.getByText('Solicitudes de cita')).toBeInTheDocument();
    expect(screen.getByText('Citas por responder')).toBeInTheDocument();
    expect(screen.getByText('Paciente Dos')).toBeInTheDocument();
    expect(screen.getByText(/Segunda opinión/)).toBeInTheDocument();
  });

  it('confirma una solicitud y refresca', async () => {
    mockUpdateStatus.mockResolvedValue({ ok: true });
    render(<PsyDashboardClient initialData={initialData} session={{ id: 'u', email: 'a@b.c', role: 'PSYCHOLOGIST' }} />);

    fireEvent.click(screen.getByRole('button', { name: 'Confirmar solicitud de Paciente Dos' }));

    await waitFor(() => expect(mockUpdateStatus).toHaveBeenCalledWith('req-1', 'CONFIRMED', undefined));
    await waitFor(() => expect(mockRefresh).toHaveBeenCalled());
  });

  it('rechaza una solicitud con un motivo por defecto', async () => {
    mockUpdateStatus.mockResolvedValue({ ok: true });
    render(<PsyDashboardClient initialData={initialData} session={{ id: 'u', email: 'a@b.c', role: 'PSYCHOLOGIST' }} />);

    fireEvent.click(screen.getByRole('button', { name: 'Rechazar solicitud de Paciente Dos' }));

    await waitFor(() =>
      expect(mockUpdateStatus).toHaveBeenCalledWith('req-1', 'CANCELLED', expect.stringContaining('no pudo aceptar')),
    );
  });

  it('muestra el error cuando el servidor rechaza el cambio', async () => {
    mockUpdateStatus.mockResolvedValue({ ok: false, error: 'La sesión ya no admite cambios de estado' });
    render(<PsyDashboardClient initialData={initialData} session={{ id: 'u', email: 'a@b.c', role: 'PSYCHOLOGIST' }} />);

    fireEvent.click(screen.getByRole('button', { name: 'Confirmar solicitud de Paciente Dos' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('ya no admite cambios');
  });

  it('no muestra el panel cuando no hay solicitudes', () => {
    render(
      <PsyDashboardClient
        initialData={{ ...initialData, pendingRequests: [] }}
        session={{ id: 'u', email: 'a@b.c', role: 'PSYCHOLOGIST' }}
      />,
    );
    expect(screen.queryByText('Citas por responder')).not.toBeInTheDocument();
  });
});
