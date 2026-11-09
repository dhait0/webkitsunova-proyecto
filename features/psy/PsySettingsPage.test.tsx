import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import PsySettingsPage from '@/features/psy/PsySettingsPage';

const mockGetProfile = vi.fn();
const mockUpdateProfile = vi.fn();
const mockUpdateAvailability = vi.fn();

// The password form shares the account settings action, which imports the server-only guard.
vi.mock('@/app/(user)/dashboard/configuracion/actions', () => ({ changePasswordAction: vi.fn() }));

vi.mock('@/app/(psychologist)/psy/perfil/actions', () => ({
  getProfileAction: (...args: unknown[]) => mockGetProfile(...args),
  updateProfileAction: (...args: unknown[]) => mockUpdateProfile(...args),
  updateAvailabilityAction: (...args: unknown[]) => mockUpdateAvailability(...args),
}));

const data = {
  profile: {
    firstName: 'Laura',
    lastName: 'Martínez',
    phone: null,
    country: null,
    birthDate: null,
    bio: null,
    specialties: [],
    sessionPrice: null,
    email: 'l@x.test',
    name: 'Laura Martínez',
    accountStatus: 'ACTIVE',
    currency: 'COP',
    isApproved: true,
    isVerified: true,
    isAcceptingNew: true,
    avatarUrl: null,
    rating: 0,
    reviewsCount: 0,
    patientsCount: 0,
  },
  availability: [{ id: 's1', weekday: 1, start: '09:00', end: '17:00' }],
  specialtyCatalog: [],
};

beforeEach(() => {
  vi.resetAllMocks();
  mockGetProfile.mockResolvedValue(data);
  mockUpdateAvailability.mockResolvedValue([]);
});

describe('PsySettingsPage — horarios de atención', () => {
  it('guarda un día nuevo como activo (antes se descartaba por no tener id)', async () => {
    render(<PsySettingsPage initialData={data as never} />);

    fireEvent.click(await screen.findByRole('checkbox', { name: /Sábado/ }));
    fireEvent.change(screen.getByLabelText(/Hora de inicio del Sábado/), { target: { value: '09:00' } });
    fireEvent.change(screen.getByLabelText(/Hora de fin del Sábado/), { target: { value: '11:00' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar horarios' }));

    await waitFor(() => expect(mockUpdateAvailability).toHaveBeenCalled());
    expect(mockUpdateAvailability.mock.calls[0][0]).toEqual([
      { weekday: 1, start: '09:00', end: '17:00', enabled: true },
      { weekday: 6, start: '09:00', end: '11:00', enabled: true },
    ]);
  });

  it('quita un día desmarcándolo', async () => {
    render(<PsySettingsPage initialData={data as never} />);

    fireEvent.click(await screen.findByRole('checkbox', { name: /Lunes/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Guardar horarios' }));

    await waitFor(() => expect(mockUpdateAvailability).toHaveBeenCalledWith([]));
  });

  it('no envía horarios cuyo fin no es posterior al inicio', async () => {
    render(<PsySettingsPage initialData={data as never} />);

    fireEvent.change(await screen.findByLabelText(/Hora de fin del Lunes/), { target: { value: '08:00' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar horarios' }));

    expect(await screen.findByText(/hora de fin debe ser posterior/)).toBeInTheDocument();
    expect(mockUpdateAvailability).not.toHaveBeenCalled();
  });
});
