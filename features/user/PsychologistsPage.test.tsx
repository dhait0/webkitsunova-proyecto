import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import PsychologistsPage from '@/features/user/PsychologistsPage';

const baseData = {
  psychologists: [
    {
      id: 'psy-1',
      name: 'Dra. Laura Gómez',
      username: 'laura',
      avatarUrl: 'https://example.com/laura.png',
      bio: 'Psicóloga clínica especializada en ansiedad.',
      specialties: ['Ansiedad', 'Hábitos'],
      sessionPrice: 80000,
      currency: 'COP',
      isVerified: true,
      isAcceptingNew: true,
      rating: 4.8,
      reviewsCount: 12,
      patientsCount: 5,
    },
    {
      id: 'psy-2',
      name: 'Dr. Andrés Prieto',
      username: null,
      avatarUrl: null,
      bio: null,
      specialties: [],
      sessionPrice: null,
      currency: 'COP',
      isVerified: false,
      isAcceptingNew: true,
      rating: 0,
      reviewsCount: 0,
      patientsCount: 0,
    },
  ],
  pagination: { page: 1, limit: 10, total: 2, totalPages: 1 },
};

describe('PsychologistsPage', () => {
  it('renderiza psicólogos reales con campos públicos únicamente', () => {
    render(<PsychologistsPage data={baseData} error={null} />);

    expect(screen.getByText('Dra. Laura Gómez')).toBeInTheDocument();
    expect(screen.getByText('Dr. Andrés Prieto')).toBeInTheDocument();
    expect(screen.getByText('Psicóloga clínica especializada en ansiedad.')).toBeInTheDocument();
    expect(screen.getByText('Ansiedad, Hábitos')).toBeInTheDocument();
    expect(screen.getByText('80.000 COP / sesión')).toBeInTheDocument();
    expect(screen.getByText('Verificado')).toBeInTheDocument();
    expect(screen.getAllByText('Aceptando pacientes')).toHaveLength(2);
  });

  it('no expone campos privados de los psicólogos', () => {
    render(<PsychologistsPage data={baseData} error={null} />);

    const pageContent = screen.getByText('Dra. Laura Gómez').closest('section')?.textContent ?? '';
    expect(pageContent).not.toContain('email');
    expect(pageContent).not.toContain('password');
    expect(pageContent).not.toContain('twoFactor');
  });

  it('no muestra datos ilustrativos ni sello de ejemplo', () => {
    render(<PsychologistsPage data={baseData} error={null} />);

    expect(screen.queryByText('Ejemplo')).not.toBeInTheDocument();
    expect(screen.queryByText('datos ilustrativos')).not.toBeInTheDocument();
    expect(screen.queryByText('Dra. Sofía Herrera')).not.toBeInTheDocument();
    expect(screen.queryByText('Hoy 15:00 - 19:00')).not.toBeInTheDocument();
  });

  it('muestra estado vacío cuando no hay resultados', () => {
    render(
      <PsychologistsPage
        data={{ psychologists: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } }}
        error={null}
      />,
    );

    expect(screen.getByText(/No se encontraron psicólogos disponibles en este momento/)).toBeInTheDocument();
    expect(screen.queryByText('Dra. Laura Gómez')).not.toBeInTheDocument();
  });

  it('muestra estado de error cuando la consulta falla', () => {
    render(<PsychologistsPage data={baseData} error='No se pudieron cargar los psicólogos' />);

    expect(screen.getByText('No se pudieron cargar los psicólogos')).toBeInTheDocument();
    expect(screen.getByText('Reintentar')).toBeInTheDocument();
    expect(screen.queryByText('Dra. Laura Gómez')).not.toBeInTheDocument();
  });

  it('renderiza paginación cuando hay más de una página', () => {
    render(
      <PsychologistsPage
        data={{
          psychologists: [baseData.psychologists[0]],
          pagination: { page: 1, limit: 1, total: 5, totalPages: 5 },
        }}
        error={null}
      />,
    );

    expect(screen.getByText(/Mostrando página 1 de 5 \(5 profesionales\)/)).toBeInTheDocument();
    expect(screen.getByLabelText('Ir a la página 2')).toBeInTheDocument();
    expect(screen.getByLabelText('Ir a la página 5')).toBeInTheDocument();
    expect(screen.getByText('Siguiente')).toBeInTheDocument();
    expect(screen.getByLabelText('Página siguiente')).toBeInTheDocument();
  });

  it('no renderiza paginación cuando hay una sola página', () => {
    render(<PsychologistsPage data={baseData} error={null} />);

    expect(screen.queryByText(/Mostrando página/)).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Ir a la página 2')).not.toBeInTheDocument();
  });
});
