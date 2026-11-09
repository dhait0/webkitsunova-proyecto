import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PsyNotificationPreferencesPage from '@/features/psy/PsyNotificationPreferencesPage';
import type { PsyPreferences } from '@/lib/api';

const mockUpdatePreferencesAction = vi.fn();

vi.mock('@/app/(psychologist)/psy/notificaciones/preferencias/actions', () => ({
  updatePreferencesAction: (...args: unknown[]) => mockUpdatePreferencesAction(...args),
}));

vi.mock('@/lib/api', () => {
  const fail = () => {
    throw new Error('No se debe llamar a lib/api desde preferencias');
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

const initialPreferences: PsyPreferences = {
  newAppointments: true,
  newMessages: true,
  patientReports: false,
  moodAlerts: true,
  platformNews: false,
};

beforeEach(() => {
  vi.resetAllMocks();
});

describe('PsyNotificationPreferencesPage', () => {
  it('renderiza preferencias iniciales del servidor', () => {
    render(<PsyNotificationPreferencesPage initialPreferences={initialPreferences} />);

    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes).toHaveLength(5);
    expect(screen.getByLabelText('Nuevas citas agendadas')).toBeChecked();
    expect(screen.getByLabelText('Reportes de pacientes')).not.toBeChecked();
  });

  it('guarda vía server action y muestra mensaje', async () => {
    mockUpdatePreferencesAction.mockResolvedValue({
      success: true,
      preferences: { ...initialPreferences, patientReports: true },
    });

    render(<PsyNotificationPreferencesPage initialPreferences={initialPreferences} />);

    fireEvent.click(screen.getByLabelText('Reportes de pacientes'));

    await waitFor(() => expect(mockUpdatePreferencesAction).toHaveBeenCalled());
    expect(mockUpdatePreferencesAction).toHaveBeenCalledWith({ patientReports: true });
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Preferencias guardadas'));
  });

  it('muestra error y revierte al fallar la action', async () => {
    mockUpdatePreferencesAction.mockRejectedValue(new Error('Fallo de red'));

    render(<PsyNotificationPreferencesPage initialPreferences={initialPreferences} />);

    const toggle = screen.getByLabelText('Nuevas citas agendadas'); // starts checked
    fireEvent.click(toggle);

    await waitFor(() => expect(mockUpdatePreferencesAction).toHaveBeenCalled());
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Fallo de red'));
    expect(screen.getByLabelText('Nuevas citas agendadas')).toBeChecked();
  });
});
