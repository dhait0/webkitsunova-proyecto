import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import HabitsPage from '@/features/user/HabitsPage';

const baseData = {
  habits: [
    {
      id: 'hab-1',
      title: 'Sueño',
      description: 'Bloquea pantallas antes de dormir y completa tu rutina nocturna.',
      progress: 82,
      status: 'Estable',
    },
    {
      id: 'hab-2',
      title: 'Movimiento',
      description: 'Camina 20 minutos y registra pausas activas durante el día.',
      progress: 64,
      status: 'En curso',
    },
    {
      id: 'hab-3',
      title: 'Respiración',
      description: 'Usa la herramienta de pausa guiada cuando suba el nivel de estrés.',
      progress: 91,
      status: 'Muy bien',
    },
  ],
};

describe('HabitsPage', () => {
  it('renderiza hábitos reales con datos públicos únicamente', () => {
    render(<HabitsPage data={baseData} error={null} />);

    expect(screen.getByText('Sueño')).toBeInTheDocument();
    expect(screen.getByText('Movimiento')).toBeInTheDocument();
    expect(screen.getByText('Respiración')).toBeInTheDocument();
    expect(screen.getByText('Bloquea pantallas antes de dormir y completa tu rutina nocturna.')).toBeInTheDocument();
    expect(screen.getByText('Camina 20 minutos y registra pausas activas durante el día.')).toBeInTheDocument();
    expect(screen.getByText('Usa la herramienta de pausa guiada cuando suba el nivel de estrés.')).toBeInTheDocument();
    expect(screen.getByText('Estable')).toBeInTheDocument();
    expect(screen.getByText('En curso')).toBeInTheDocument();
    expect(screen.getByText('Muy bien')).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: 'Progreso de Sueño' })).toHaveAttribute('aria-valuenow', '82');
    expect(screen.getByRole('progressbar', { name: 'Progreso de Movimiento' })).toHaveAttribute('aria-valuenow', '64');
    expect(screen.getByRole('progressbar', { name: 'Progreso de Respiración' })).toHaveAttribute('aria-valuenow', '91');
  });

  it('no expone datos privados del usuario', () => {
    render(<HabitsPage data={baseData} error={null} />);

    const pageContent = screen.getByText('Sueño').closest('section')?.textContent ?? '';
    expect(pageContent).not.toContain('email');
    expect(pageContent).not.toContain('phone');
    expect(pageContent).not.toContain('password');
    expect(pageContent).not.toContain('twoFactor');
    expect(pageContent).not.toContain('userId');
  });

  it('no muestra datos ilustrativos ni sello de ejemplo', () => {
    render(<HabitsPage data={baseData} error={null} />);

    expect(screen.queryByText('Ejemplo')).not.toBeInTheDocument();
    expect(screen.queryByText(/datos ilustrativos/)).not.toBeInTheDocument();
  });

  it('muestra estado vacío cuando no hay hábitos', () => {
    render(
      <HabitsPage
        data={{ habits: [] }}
        error={null}
      />,
    );

    expect(screen.getByText(/No tienes hábitos registrados todavía/)).toBeInTheDocument();
    expect(screen.queryByText('Sueño')).not.toBeInTheDocument();
  });

  it('muestra estado de error cuando la consulta falla', () => {
    render(<HabitsPage data={baseData} error='No se pudieron cargar los hábitos' />);

    expect(screen.getByText('No se pudieron cargar los hábitos')).toBeInTheDocument();
    expect(screen.queryByText('Sueño')).not.toBeInTheDocument();
  });
});
