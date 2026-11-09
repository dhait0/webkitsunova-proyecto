import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PsychologistProfilePage from '@/features/user/PsychologistProfilePage';

const push = vi.hoisted(() => vi.fn());
const startConversationFromPsychologistAction = vi.hoisted(() => vi.fn());
const createAppointmentAction = vi.hoisted(() => vi.fn());

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}));

vi.mock('@/app/(user)/dashboard/mensajes/actions', () => ({
  startConversationFromPsychologistAction: (...args: unknown[]) =>
    startConversationFromPsychologistAction(...args),
}));

vi.mock('@/app/(user)/dashboard/citas/actions', () => ({
  createAppointmentAction: (...args: unknown[]) => createAppointmentAction(...args),
}));

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
  beforeEach(() => {
    vi.resetAllMocks();
  });
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
    expect(screen.queryByRole('button', { name: /Enviar mensaje/i })).not.toBeInTheDocument();
  });

  it('muestra estado de error cuando la consulta falla', () => {
    render(<PsychologistProfilePage profile={null} error='No se pudo cargar el perfil' />);

    expect(screen.getByText('No se pudo cargar el perfil')).toBeInTheDocument();
    expect(screen.queryByText('Dra. Laura Gómez')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Enviar mensaje/i })).not.toBeInTheDocument();
  });

  it('navega al chat al enviar mensaje con éxito', async () => {
    startConversationFromPsychologistAction.mockResolvedValue({
      success: true,
      conversationId: 'conv-123',
    });
    const user = userEvent.setup();
    render(<PsychologistProfilePage profile={baseProfile} error={null} />);

    await user.click(screen.getByRole('button', { name: /Enviar mensaje/i }));

    expect(startConversationFromPsychologistAction).toHaveBeenCalledWith('psy-1');
    expect(push).toHaveBeenCalledWith('/dashboard/chats?conversationId=conv-123');
  });

  it('muestra error cuando falla el envío de mensaje', async () => {
    startConversationFromPsychologistAction.mockResolvedValue({
      success: false,
      error: 'No se pudo iniciar la conversación',
    });
    const user = userEvent.setup();
    render(<PsychologistProfilePage profile={baseProfile} error={null} />);

    await user.click(screen.getByRole('button', { name: /Enviar mensaje/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No se pudo iniciar la conversación',
    );
    expect(push).not.toHaveBeenCalled();
  });
});
