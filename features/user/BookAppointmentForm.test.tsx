import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BookAppointmentForm from './BookAppointmentForm';

const createAppointmentAction = vi.hoisted(() => vi.fn());

vi.mock('@/app/(user)/dashboard/citas/actions', () => ({
  createAppointmentAction: (...args: unknown[]) => createAppointmentAction(...args),
}));

const profile = {
  id: 'psy-1',
  name: 'Dra. Laura Gómez',
  username: 'laura',
  avatarUrl: null,
  bio: null,
  specialties: [],
  sessionPrice: null,
  currency: 'COP',
  isVerified: true,
  isAcceptingNew: true,
  rating: 0,
  reviewsCount: 0,
  patientsCount: 0,
  availability: [
    { weekday: 1, weekdayLabel: 'Lunes', start: '09:00', end: '12:00' },
    { weekday: 3, weekdayLabel: 'Miércoles', start: '14:00', end: '16:00' },
  ],
};

function nextDateForWeekday(targetWeekday: number) {
  // targetWeekday model: 1=Mon..7=Sun
  const d = new Date();
  d.setDate(d.getDate() + 1);
  for (let i = 0; i < 14; i++) {
    const js = d.getDay();
    const model = js === 0 ? 7 : js;
    if (model === targetWeekday) {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    }
    d.setDate(d.getDate() + 1);
  }
  throw new Error('no date');
}

describe('BookAppointmentForm', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('muestra opciones de hora según el día elegido', async () => {
    render(<BookAppointmentForm profile={profile} />);

    const dateInput = screen.getByLabelText(/Fecha/i);
    fireEvent.change(dateInput, { target: { value: nextDateForWeekday(1) } });

    const timeSelect = screen.getByLabelText(/Hora/i) as HTMLSelectElement;
    const options = Array.from(timeSelect.options).map((o) => o.value).filter(Boolean);
    expect(options).toEqual(['09:00', '10:00', '11:00']);
  });

  it('muestra mensaje claro y formulario deshabilitado sin disponibilidad', () => {
    render(<BookAppointmentForm profile={{ ...profile, availability: [] }} />);

    expect(
      screen.getByText(/no tiene horarios de disponibilidad publicados/i),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText(/Fecha/i)).not.toBeInTheDocument();
  });

  it('envía la solicitud y muestra éxito con enlace a citas', async () => {
    createAppointmentAction.mockResolvedValue({
      ok: true,
      appointment: { id: 'a1', status: 'PENDING', startsAt: '2026-11-10T09:00:00.000Z' },
    });
    const user = userEvent.setup();
    render(<BookAppointmentForm profile={profile} />);

    fireEvent.change(screen.getByLabelText(/Fecha/i), {
      target: { value: nextDateForWeekday(1) },
    });
    await user.selectOptions(screen.getByLabelText(/Hora/i), '09:00');
    await user.click(screen.getByRole('button', { name: /Solicitar cita/i }));

    expect(createAppointmentAction).toHaveBeenCalledWith(
      expect.objectContaining({
        psychologistId: 'psy-1',
        durationMinutes: 60,
        type: 'FIRST_SESSION',
      }),
    );
    expect(
      await screen.findByText(/Solicitud enviada\. Tu psicólogo la revisará/i),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Ver mis citas/i })).toHaveAttribute(
      'href',
      '/dashboard/citas',
    );
  });

  it('muestra error del servidor tal cual', async () => {
    createAppointmentAction.mockResolvedValue({ ok: false, error: 'El horario ya está ocupado' });
    const user = userEvent.setup();
    render(<BookAppointmentForm profile={profile} />);

    fireEvent.change(screen.getByLabelText(/Fecha/i), {
      target: { value: nextDateForWeekday(1) },
    });
    await user.selectOptions(screen.getByLabelText(/Hora/i), '09:00');
    await user.click(screen.getByRole('button', { name: /Solicitar cita/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('El horario ya está ocupado');
  });

  it('no envía si falta fecha u hora', async () => {
    const user = userEvent.setup();
    render(<BookAppointmentForm profile={profile} />);

    // submit without selecting date/time
    await user.click(screen.getByRole('button', { name: /Solicitar cita/i }));

    expect(createAppointmentAction).not.toHaveBeenCalled();
  });
});
