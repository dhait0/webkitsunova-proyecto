import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import MfaSettingsPage from '@/pages/MfaSettingsPage';
import { supabase } from '@/lib/supabase';
import { getMfaStatus } from '@/lib/api';

vi.mock('@/lib/api', () => ({
  getMfaStatus: vi.fn(),
}));

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: vi.fn(),
  };
});

const mockUseNavigate = vi.mocked(useNavigate);
const mockGetMfaStatus = vi.mocked(getMfaStatus);

describe('MfaSettingsPage', () => {
  const mockNavigate = vi.fn();

  beforeEach(() => {
    mockUseNavigate.mockReturnValue(mockNavigate);
  });

  afterEach(() => {
    vi.resetAllMocks();
    mockNavigate.mockClear();
  });

  it('shows loading message while fetching status', () => {
    const sessionPromise = new Promise(() => {});
    vi.mocked(supabase.auth.getSession).mockReturnValue(sessionPromise as any);

    render(
      <MemoryRouter>
        <MfaSettingsPage />
      </MemoryRouter>
    );

    expect(screen.getByText('Cargando configuración de seguridad...')).toBeInTheDocument();
  });

  it('redirects to /login when no session', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
      data: { session: null },
    } as any);

    render(
      <MemoryRouter>
        <MfaSettingsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true });
    });
  });

  it('shows "Activo" badge and disable button when MFA is enabled', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
      data: { session: { user: { id: 'user-1' } } },
    } as any);

    mockGetMfaStatus.mockResolvedValueOnce({
      success: true,
      mfaEnabled: true,
      mfaType: 'totp',
      factorId: 'factor-1',
    });

    render(
      <MemoryRouter>
        <MfaSettingsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Seguridad')).toBeInTheDocument();
    });

    expect(screen.getByText('Activo')).toHaveClass('badge-ok');
    expect(screen.getByRole('button', { name: 'Desactivar' })).toBeInTheDocument();
  });

  it('shows "Activar" button when MFA is disabled', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
      data: { session: { user: { id: 'user-1' } } },
    } as any);

    mockGetMfaStatus.mockResolvedValueOnce({
      success: true,
      mfaEnabled: false,
      mfaType: null,
      factorId: null,
    });

    render(
      <MemoryRouter>
        <MfaSettingsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Activar' })).toBeInTheDocument();
    });
  });

  it('navigates to /mfa/enroll when "Activar" is clicked', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
      data: { session: { user: { id: 'user-1' } } },
    } as any);

    mockGetMfaStatus.mockResolvedValueOnce({
      success: true,
      mfaEnabled: false,
      mfaType: null,
      factorId: null,
    });

    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <MfaSettingsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Activar' })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Activar' }));

    expect(mockNavigate).toHaveBeenCalledWith('/mfa/enroll');
  });

  it('disables MFA after confirmation flow', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
      data: { session: { user: { id: 'user-1' } } },
    } as any);

    mockGetMfaStatus.mockResolvedValueOnce({
      success: true,
      mfaEnabled: true,
      mfaType: 'totp',
      factorId: 'factor-1',
    });

    vi.mocked(supabase.auth.mfa.listFactors).mockResolvedValue({
      data: {
        totp: [{ id: 'factor-1', factor_type: 'totp', friendly_name: 'Authenticator' } as any],
      },
    } as any);

    vi.mocked(supabase.auth.mfa.unenroll).mockResolvedValue({
      error: null,
    } as any);

    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <MfaSettingsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Desactivar' })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Desactivar' }));

    await waitFor(() => {
      expect(screen.getByText('Confirma haciendo clic de nuevo en "Confirmar desactivación".')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Confirmar desactivación' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Activar' })).toBeInTheDocument();
    });
  });
});
