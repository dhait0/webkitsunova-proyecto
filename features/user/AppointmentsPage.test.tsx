import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import AppointmentsClient from './AppointmentsClient';

vi.mock('@/app/(user)/dashboard/citas/actions', () => ({
  requestAppointmentAction: vi.fn(),
}));

vi.mock('@/app/(user)/dashboard/psicologos/actions', () => ({
  getAvailablePsychologistsAction: vi.fn(),
}));

describe('AppointmentsClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('muestra listado vacío cuando no hay citas', () => {
    render(
      <AppointmentsClient
        session={{ id: 'u1', email: 'user@test.com', role: 'USER', status: 'ACTIVE' }}
        initialAppointments={{ success: true, appointments: [], pagination: { page: 1, limit: 50, total: 0, totalPages: 1 } }}
      />
    );

    expect(screen.getByText('Aún no tienes citas solicitadas')).toBeInTheDocument();
  });

  it('muestra citas reales cuando existen', () => {
    render(
      <AppointmentsClient
        session={{ id: 'u1', email: 'user@test.com', role: 'USER', status: 'ACTIVE' }}
        initialAppointments={{
          success: true,
          appointments: [
            {
              id: 'a1',
              psychologistUserId: 'p1',
              psychologistName: 'Dra. Test',
              startsAt: '2026-10-27T10:00:00.000Z',
              endsAt: '2026-10-27T11:00:00.000Z',
              type: 'FIRST_SESSION',
              status: 'PENDING',
              reason: 'Ansiedad',
            },
          ],
          pagination: { page: 1, limit: 50, total: 1, totalPages: 1 },
        }}
      />
    );

    expect(screen.getByText('Dra. Test')).toBeInTheDocument();
    expect(screen.getByText('Pendiente')).toBeInTheDocument();
  });
});
