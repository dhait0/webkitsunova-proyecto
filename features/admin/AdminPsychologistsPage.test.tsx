import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AdminPsychologistsPage from './AdminPsychologistsPage';
import type { AdminPsychologist } from '@/app/(admin)/admin/actions';

const getPsychologists = vi.fn();
const approvePsychologist = vi.fn();

vi.mock('@/app/(admin)/admin/actions', () => ({
  getPsychologists: (...args: unknown[]) => getPsychologists(...args),
  approvePsychologist: (...args: unknown[]) => approvePsychologist(...args),
}));

function makePsy(overrides: Partial<AdminPsychologist> = {}): AdminPsychologist {
  return {
    id: 'p1',
    email: 'ana@example.com',
    name: 'Ana Ruiz',
    specialty: 'Terapia cognitivo-conductual',
    specialties: ['Terapia cognitivo-conductual', 'Ansiedad'],
    status: 'revision',
    verified: false,
    patients: 12,
    rating: 4.5,
    reviews: 8,
    sessionPrice: 60,
    country: 'España',
    phone: '+34 600 000 000',
    bio: 'Psicóloga con diez años de experiencia clínica.',
    createdAt: '2026-01-10T10:00:00.000Z',
    updatedAt: '2026-01-10T10:00:00.000Z',
    ...overrides,
  };
}

function mockList(psychologists: AdminPsychologist[]) {
  getPsychologists.mockResolvedValue({
    success: true,
    psychologists,
    pagination: { page: 1, limit: 10, total: psychologists.length, totalPages: 1 },
  });
}

describe('AdminPsychologistsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lists psychologists with status and verification', async () => {
    mockList([
      makePsy(),
      makePsy({
        id: 'p2',
        name: 'Luis Paz',
        email: 'luis@example.com',
        status: 'activo',
        verified: true,
      }),
    ]);

    render(<AdminPsychologistsPage />);

    expect(await screen.findByText('Ana Ruiz')).toBeInTheDocument();
    expect(screen.getByText('ana@example.com')).toBeInTheDocument();

    const anaRow = (await screen.findByText('Ana Ruiz')).closest('tr') as HTMLElement;
    expect(within(anaRow).getByText('En revisión')).toBeInTheDocument();
    expect(within(anaRow).getByText('Pendiente')).toBeInTheDocument();

    const luisRow = (await screen.findByText('Luis Paz')).closest('tr') as HTMLElement;
    expect(within(luisRow).getByText('Verificado')).toBeInTheDocument();
  });

  it('shows the empty state when there are no psychologists', async () => {
    mockList([]);

    render(<AdminPsychologistsPage />);

    expect(await screen.findByText('No se encontraron psicólogos')).toBeInTheDocument();
  });

  it('shows the error state and retries on demand', async () => {
    const user = userEvent.setup();
    getPsychologists.mockRejectedValueOnce(new Error('Fallo de red'));
    render(<AdminPsychologistsPage />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Fallo de red');

    mockList([makePsy()]);
    await user.click(screen.getByRole('button', { name: 'Reintentar' }));

    expect(await screen.findByText('Ana Ruiz')).toBeInTheDocument();
  });

  it('approves a psychologist in review and marks them active and verified', async () => {
    const user = userEvent.setup();
    approvePsychologist.mockResolvedValue({ success: true, message: 'ok' });
    mockList([makePsy()]);
    render(<AdminPsychologistsPage />);

    const row = (await screen.findByText('Ana Ruiz')).closest('tr') as HTMLElement;
    await user.click(within(row).getByRole('button', { name: /Aprobar/ }));

    expect(approvePsychologist).toHaveBeenCalledWith('p1');
    expect(await screen.findByText('Psicólogo aprobado correctamente')).toBeInTheDocument();

    const updated = (await screen.findByText('Ana Ruiz')).closest('tr') as HTMLElement;
    expect(within(updated).getByText('Verificado')).toBeInTheDocument();
    expect(within(updated).getByText('Activo')).toBeInTheDocument();
  });

  it('offers re-verification for an already approved psychologist', async () => {
    const user = userEvent.setup();
    approvePsychologist.mockResolvedValue({ success: true, message: 'ok' });
    mockList([makePsy({ status: 'activo', verified: true })]);
    render(<AdminPsychologistsPage />);

    const row = (await screen.findByText('Ana Ruiz')).closest('tr') as HTMLElement;
    expect(within(row).getByRole('button', { name: /Re-verificar/ })).toBeInTheDocument();

    await user.click(within(row).getByRole('button', { name: /Re-verificar/ }));

    expect(approvePsychologist).toHaveBeenCalledWith('p1');
    expect(await screen.findByText('Verificación renovada')).toBeInTheDocument();
  });

  it('never offers approval for a suspended psychologist', async () => {
    mockList([makePsy({ status: 'suspendido', verified: false })]);
    render(<AdminPsychologistsPage />);

    const row = (await screen.findByText('Ana Ruiz')).closest('tr') as HTMLElement;
    expect(within(row).getByText('Suspendido')).toBeInTheDocument();
    expect(within(row).queryByRole('button', { name: /Aprobar/ })).not.toBeInTheDocument();
    expect(within(row).queryByRole('button', { name: /Re-verificar/ })).not.toBeInTheDocument();
  });

  it('still allows viewing a suspended psychologist profile', async () => {
    const user = userEvent.setup();
    mockList([makePsy({ status: 'suspendido', verified: true })]);
    render(<AdminPsychologistsPage />);

    const row = (await screen.findByText('Ana Ruiz')).closest('tr') as HTMLElement;
    await user.click(within(row).getByRole('button', { name: /Ver/ }));

    expect(await screen.findByRole('dialog', { name: 'Perfil del psicólogo' })).toBeInTheDocument();
  });

  it('keeps the row and shows a toast when approval fails', async () => {
    const user = userEvent.setup();
    approvePsychologist.mockRejectedValue(new Error('Ya aprobado'));
    mockList([makePsy()]);
    render(<AdminPsychologistsPage />);

    const row = (await screen.findByText('Ana Ruiz')).closest('tr') as HTMLElement;
    await user.click(within(row).getByRole('button', { name: /Aprobar/ }));

    expect(await screen.findByText('Ya aprobado')).toBeInTheDocument();
    expect(screen.getByText('Pendiente')).toBeInTheDocument();
  });

  it('opens the profile detail modal with the full record', async () => {
    const user = userEvent.setup();
    mockList([makePsy()]);
    render(<AdminPsychologistsPage />);

    const row = (await screen.findByText('Ana Ruiz')).closest('tr') as HTMLElement;
    await user.click(within(row).getByRole('button', { name: /Ver/ }));

    const dialog = await screen.findByRole('dialog', { name: 'Perfil del psicólogo' });
    expect(within(dialog).getByText('España')).toBeInTheDocument();
    expect(within(dialog).getByText('+34 600 000 000')).toBeInTheDocument();
    expect(within(dialog).getByText('60 COP')).toBeInTheDocument();
    expect(within(dialog).getByText('Ansiedad')).toBeInTheDocument();
    expect(within(dialog).getByText('Psicóloga con diez años de experiencia clínica.')).toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: 'Cerrar' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('falls back to a placeholder when a rating is missing', async () => {
    mockList([makePsy({ rating: 0, reviews: 0 })]);

    render(<AdminPsychologistsPage />);

    await screen.findByText('Ana Ruiz');
    expect(screen.getAllByText('—').length).toBeGreaterThan(0);
  });

  it('passes the selected status filter to the API', async () => {
    const user = userEvent.setup();
    mockList([makePsy()]);
    render(<AdminPsychologistsPage />);
    await screen.findByText('Ana Ruiz');
    getPsychologists.mockClear();

    await user.selectOptions(screen.getByLabelText('Estado'), 'active');

    await waitFor(() =>
      expect(getPsychologists).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'active', page: 1 })
      )
    );
  });
});
