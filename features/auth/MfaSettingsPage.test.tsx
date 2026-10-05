'use client';

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import MfaSettings from '@/features/auth/MfaSettingsPage';
import { createClient } from '@/lib/supabase/browser';

const push = vi.fn();
const refresh = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, replace: vi.fn(), refresh }),
}));

const supabase = createClient();

const enabled = { mfaEnabled: true, mfaType: 'totp' as const, factorId: 'factor-1' };
const disabled = { mfaEnabled: false, mfaType: null, factorId: null };

/**
 * The status is read in the Server Component and handed down as a prop, so
 * these tests only cover the client island: rendering and the unenrol flow.
 */
describe('MfaSettings', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('shows the enabled state with a disable control', () => {
    render(<MfaSettings status={enabled} roleHome="/dashboard" />);

    expect(screen.getByText('Activo')).toHaveClass('badge-ok');
    expect(screen.getByRole('button', { name: 'Desactivar' })).toBeInTheDocument();
  });

  it('shows the activate control when MFA is disabled', () => {
    render(<MfaSettings status={disabled} roleHome="/dashboard" />);

    expect(screen.getByRole('button', { name: 'Activar' })).toBeInTheDocument();
    expect(screen.queryByText('Activo')).not.toBeInTheDocument();
  });

  it('sends the user to enrolment when Activar is clicked', async () => {
    const user = userEvent.setup();
    render(<MfaSettings status={disabled} roleHome="/dashboard" />);

    await user.click(screen.getByRole('button', { name: 'Activar' }));

    expect(push).toHaveBeenCalledWith('/mfa/enroll');
  });

  it('requires a second click before unenrolling', async () => {
    vi.mocked(supabase.auth.mfa.listFactors).mockResolvedValue({
      data: {
        totp: [{ id: 'factor-1', factor_type: 'totp', friendly_name: 'Authenticator' }],
      },
    } as never);
    vi.mocked(supabase.auth.mfa.unenroll).mockResolvedValue({ error: null } as never);

    const user = userEvent.setup();
    render(<MfaSettings status={enabled} roleHome="/dashboard" />);

    await user.click(screen.getByRole('button', { name: 'Desactivar' }));

    // First click only asks for confirmation; nothing is unenrolled yet.
    expect(
      screen.getByText('Confirma haciendo clic de nuevo en "Confirmar desactivación".')
    ).toBeInTheDocument();
    expect(supabase.auth.mfa.unenroll).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Confirmar desactivación' }));

    await waitFor(() => {
      expect(supabase.auth.mfa.unenroll).toHaveBeenCalledWith({ factorId: 'factor-1' });
    });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Activar' })).toBeInTheDocument();
    });
    expect(refresh).toHaveBeenCalled();
  });

  it('surfaces the error when unenrol fails', async () => {
    vi.mocked(supabase.auth.mfa.listFactors).mockResolvedValue({
      data: {
        totp: [{ id: 'factor-1', factor_type: 'totp', friendly_name: 'Authenticator' }],
      },
    } as never);
    vi.mocked(supabase.auth.mfa.unenroll).mockResolvedValue({
      error: { message: 'No se pudo eliminar el factor' },
    } as never);

    const user = userEvent.setup();
    render(<MfaSettings status={enabled} roleHome="/dashboard" />);

    await user.click(screen.getByRole('button', { name: 'Desactivar' }));
    await user.click(screen.getByRole('button', { name: 'Confirmar desactivación' }));

    await waitFor(() => {
      expect(screen.getByText('No se pudo eliminar el factor')).toBeInTheDocument();
    });
  });
});
