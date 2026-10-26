import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import PsychologistProfilePage from '@/features/user/PsychologistProfilePage';

const baseProfile = {
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
  availability: [
    { weekday: 1, weekdayLabel: 'Lunes', start: '09:00', end: '12:00' },
    { weekday: 3, weekdayLabel: 'Miércoles', start: '14:00', end: '18:00' },
  ],
};

describe('PsychologistProfilePage', () => {
  it('renderiza perfil real con campos públicos únicamente', () => {
    render(<PsychologistProfilePage profile={baseProfile} error={null} />);

    expect(screen.getByText('Dra. Laura Gómez')).toBeInTheDocument();
    expect(screen.getByText('Psicóloga clínica especializada en ansiedad.')).toBeInTheDocument();
    expect(screen.getByText('Ansiedad, Hábitos')).toBeInTheDocument();
    expect(screen.getByText('80.000 COP')).toBeInTheDocument();
    expect(screen.getByText('Verificado')).toBeInTheDocument();
    expect(screen.getByText('Aceptando pacientes')).toBeInTheDocument();
  });

  it('muestra disponibilidad semanal ordenada', () => {
    render(<PsychologistProfilePage profile={baseProfile} error={null} />);

    expect(screen.getByText('Lunes')).toBeInTheDocument();
    expect(screen.getByText('Miércoles')).toBeInTheDocument();
    expect(screen.getByText('09:00 – 12:00')).toBeInTheDocument();
    expect(screen.getByText('14:00 – 18:00')).toBeInTheDocument();
  });

  it('no expone campos privados del psicólogo', () => {
    render(<PsychologistProfilePage profile={baseProfile} error={null} />);

    const pageContent = screen.getByText('Dra. Laura Gómez').closest('section')?.textContent ?? '';
    expect(pageContent).not.toContain('email');
    expect(pageContent).not.toContain('phone');
    expect(pageContent).not.toContain('password');
    expect(pageContent).not.toContain('twoFactor');
  });

  it('no muestra datos ilustrativos ni sello de ejemplo', () => {
    render(<PsychologistProfilePage profile={baseProfile} error={null} />);

    expect(screen.queryByText('Ejemplo')).not.toBeInTheDocument();
    expect(screen.queryByText('datos ilustrativos')).not.toBeInTheDocument();
  });

  it('muestra estado no encontrado cuando no hay perfil', () => {
    render(<PsychologistProfilePage profile={null} error={null} />);

    expect(screen.getByText(/Perfil no encontrado/)).toBeInTheDocument();
    expect(screen.queryByText('Dra. Laura Gómez')).not.toBeInTheDocument();
  });

  it('muestra estado de error cuando la consulta falla', () => {
    render(<PsychologistProfilePage profile={null} error='No se pudo cargar el perfil' />);

    expect(screen.getByText('No se pudo cargar el perfil')).toBeInTheDocument();
    expect(screen.queryByText('Dra. Laura Gómez')).not.toBeInTheDocument();
  });
});
