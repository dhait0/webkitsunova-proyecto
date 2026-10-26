import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import AppointmentsPage from '@/features/user/AppointmentsPage';

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
    expect(screen.getByText('CONFIRMED')).toBeInTheDocument();
    expect(screen.getByText('PENDING')).toBeInTheDocument();
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

    expect(screen.getByText(/No tienes citas agendadas en este momento/)).toBeInTheDocument();
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
