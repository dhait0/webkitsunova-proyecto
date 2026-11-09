import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import AppointmentsPage from '@/features/user/AppointmentsPage';

const mockRefresh = vi.fn();
const mockCancel = vi.fn();

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: mockRefresh }) }));
vi.mock('@/app/(user)/dashboard/citas/actions', () => ({
  cancelMyAppointmentAction: (...args: unknown[]) => mockCancel(...args),
}));

beforeEach(() => {
  vi.resetAllMocks();
});

const baseData = {
  appointments: [
    {
      id: 'ap-1',
      psychologistUserId: 'psy-1',
      psychologistName: 'Dra. Laura Gómez',
      startsAt: '2026-02-10T10:00:00.000Z',
      endsAt: '2026-02-10T11:00:00.000Z',
      type: 'FOLLOW_UP',
      status: 'CONFIRMED',
      reason: 'Ansiedad',
    },
    {
      id: 'ap-2',
      psychologistUserId: 'psy-2',
      psychologistName: 'Dr. Andrés Prieto',
      startsAt: '2026-02-12T14:00:00.000Z',
      endsAt: '2026-02-12T15:00:00.000Z',
      type: 'FIRST_SESSION',
      status: 'PENDING',
      reason: 'Sin motivo especificado',
    },
  ],
  pagination: { page: 1, limit: 10, total: 2, totalPages: 1 },
};

describe('AppointmentsPage', () => {
  it('renderiza citas reales con datos públicos únicamente', () => {
    render(<AppointmentsPage data={baseData} error={null} />);

    expect(screen.getByText('Dra. Laura Gómez')).toBeInTheDocument();
    expect(screen.getByText('Dr. Andrés Prieto')).toBeInTheDocument();
    expect(screen.getByText('Ansiedad')).toBeInTheDocument();
    expect(screen.getByText(/10 de febrero de 2026/)).toBeInTheDocument();
    expect(screen.getByText(/12 de febrero de 2026/)).toBeInTheDocument();
    expect(screen.getByText('Confirmada')).toBeInTheDocument();
    expect(screen.getByText('Pendiente')).toBeInTheDocument();
  });

  it('no expone datos privados del psicólogo ni del paciente', () => {
    render(<AppointmentsPage data={baseData} error={null} />);

    const pageContent = screen.getByText('Dra. Laura Gómez').closest('section')?.textContent ?? '';
    expect(pageContent).not.toContain('email');
    expect(pageContent).not.toContain('phone');
    expect(pageContent).not.toContain('password');
    expect(pageContent).not.toContain('twoFactor');
    expect(pageContent).not.toContain('patientNote');
    expect(pageContent).not.toContain('psyNote');
  });

  it('no muestra datos ilustrativos ni sello de ejemplo', () => {
    render(<AppointmentsPage data={baseData} error={null} />);

    expect(screen.queryByText('Ejemplo')).not.toBeInTheDocument();
    expect(screen.queryByText(/datos ilustrativos/)).not.toBeInTheDocument();
  });

  it('muestra estado vacío cuando no hay citas', () => {
    render(
      <AppointmentsPage
        data={{
          appointments: [],
          pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
        }}
        error={null}
      />,
    );

    expect(screen.getByText(/No tienes citas próximas/)).toBeInTheDocument();
    expect(screen.queryByText('Dra. Laura Gómez')).not.toBeInTheDocument();
  });

  it('muestra estado de error cuando la consulta falla', () => {
    render(<AppointmentsPage data={baseData} error='No se pudieron cargar las citas' />);

    expect(screen.getByText('No se pudieron cargar las citas')).toBeInTheDocument();
    expect(screen.getByText('Reintentar')).toBeInTheDocument();
    expect(screen.queryByText('Dra. Laura Gómez')).not.toBeInTheDocument();
  });

  it('renderiza paginación cuando hay más de una página', () => {
    render(
      <AppointmentsPage
        data={{
          appointments: [baseData.appointments[0]],
          pagination: { page: 1, limit: 1, total: 5, totalPages: 5 },
        }}
        error={null}
      />,
    );

    expect(screen.getByText(/Mostrando página 1 de 5 \(5 citas\)/)).toBeInTheDocument();
    expect(screen.getByLabelText('Ir a la página 2')).toBeInTheDocument();
    expect(screen.getByText('Siguiente')).toBeInTheDocument();
  });

  it('no renderiza paginación cuando hay una sola página', () => {
    render(<AppointmentsPage data={baseData} error={null} />);

    expect(screen.queryByText(/Mostrando página/)).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Ir a la página 2')).not.toBeInTheDocument();
  });
});

describe('AppointmentsPage — gestión de la cita por el paciente', () => {
  const inDays = (days: number) => new Date(Date.now() + days * 86_400_000).toISOString();
  const upcoming = (status: string, id = 'ap-future') => ({
    id,
    psychologistUserId: 'psy-1',
    psychologistName: 'Dra. Laura Gómez',
    startsAt: inDays(3),
    endsAt: inDays(3),
    type: 'FOLLOW_UP',
    status,
    reason: 'Ansiedad',
  });
  const pagination = { page: 1, limit: 10, total: 1, totalPages: 1 };

  it('una solicitud pendiente explica que espera respuesta y se puede retirar', () => {
    render(<AppointmentsPage data={{ appointments: [upcoming('PENDING')], pagination }} error={null} />);

    expect(screen.getByText('Esperando la respuesta de tu psicólogo.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Retirar solicitud con Dra\. Laura Gómez/ })).toBeInTheDocument();
  });

  it('una cita confirmada futura se puede cancelar con confirmación y motivo', async () => {
    mockCancel.mockResolvedValue({ ok: true });
    render(<AppointmentsPage data={{ appointments: [upcoming('CONFIRMED')], pagination }} error={null} />);

    fireEvent.click(screen.getByRole('button', { name: /Cancelar cita con/ }));
    expect(mockCancel).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText('Motivo (opcional)'), { target: { value: 'Imprevisto' } });
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar cancelación' }));

    await waitFor(() => expect(mockCancel).toHaveBeenCalledWith('ap-future', 'Imprevisto'));
    await waitFor(() => expect(mockRefresh).toHaveBeenCalled());
  });

  it('muestra el error del servidor si no se puede cancelar', async () => {
    mockCancel.mockResolvedValue({ ok: false, error: 'La cita ya comenzó y no se puede cancelar' });
    render(<AppointmentsPage data={{ appointments: [upcoming('CONFIRMED')], pagination }} error={null} />);

    fireEvent.click(screen.getByRole('button', { name: /Cancelar cita con/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar cancelación' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('ya comenzó');
    expect(mockRefresh).not.toHaveBeenCalled();
  });

  it('no ofrece cancelar citas canceladas, completadas ni pasadas', () => {
    const past = { ...upcoming('CONFIRMED', 'ap-past'), startsAt: '2026-01-01T10:00:00.000Z' };
    render(
      <AppointmentsPage
        data={{ appointments: [upcoming('CANCELLED', 'a'), upcoming('COMPLETED', 'b'), past], pagination: { ...pagination, total: 3 } }}
        error={null}
        scope="past"
      />,
    );

    expect(screen.queryByRole('button', { name: /Cancelar cita|Retirar solicitud/ })).not.toBeInTheDocument();
  });

  it('permite alternar entre próximas e historial', () => {
    render(<AppointmentsPage data={{ appointments: [upcoming('CONFIRMED')], pagination }} error={null} scope="past" />);

    expect(screen.getByRole('link', { name: 'Historial' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Próximas' })).toHaveAttribute('href', '/dashboard/citas?scope=upcoming');
  });
});
