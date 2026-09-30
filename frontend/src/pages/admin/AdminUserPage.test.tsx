import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AdminUserPage from './AdminUserPage';
import type { AdminUser } from '@/lib/api';

const getAdminUsers = vi.fn();
const updateUserStatus = vi.fn();
const deleteUser = vi.fn();

vi.mock('@/lib/api', () => ({
  getAdminUsers: (...args: unknown[]) => getAdminUsers(...args),
  updateUserStatus: (...args: unknown[]) => updateUserStatus(...args),
  deleteUser: (...args: unknown[]) => deleteUser(...args),
}));

const users: AdminUser[] = [
  {
    id: 'u1',
    email: 'jane@example.com',
    firstName: 'Jane',
    lastName: 'Doe',
    username: 'jane',
    status: 'ACTIVE',
    twoFactorEnabled: true,
    createdAt: '2026-01-15T10:00:00.000Z',
    updatedAt: '2026-01-15T10:00:00.000Z',
  },
  {
    id: 'u2',
    email: 'john@example.com',
    firstName: 'John',
    lastName: 'Roe',
    username: 'john',
    status: 'SUSPENDED',
    twoFactorEnabled: false,
    createdAt: '2026-02-20T10:00:00.000Z',
    updatedAt: '2026-02-20T10:00:00.000Z',
  },
];

function mockList(rows: AdminUser[] = users, totalPages = 1) {
  getAdminUsers.mockResolvedValue({
    success: true,
    users: rows,
    pagination: { page: 1, limit: 10, total: rows.length, totalPages },
  });
}

describe('AdminUserPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockList();
  });

  it('shows a loading state before the request resolves', () => {
    getAdminUsers.mockReturnValue(new Promise(() => {}));

    render(<AdminUserPage />);

    expect(screen.getByText('Cargando usuarios...')).toBeInTheDocument();
  });

  it('lists users with their status and MFA state', async () => {
    render(<AdminUserPage />);

    expect(await screen.findByText('Jane Doe')).toBeInTheDocument();
    expect(screen.getByText('jane@example.com')).toBeInTheDocument();
    expect(screen.getByText('John Roe')).toBeInTheDocument();

    const janeRow = (await screen.findByText('Jane Doe')).closest('tr') as HTMLElement;
    expect(within(janeRow).getByText('Activo')).toBeInTheDocument();
    expect(within(janeRow).getByText('Activado')).toBeInTheDocument();

    const johnRow = (await screen.findByText('John Roe')).closest('tr') as HTMLElement;
    expect(within(johnRow).getByText('Suspendido')).toBeInTheDocument();
    expect(within(johnRow).getByText('Sin MFA')).toBeInTheDocument();
  });

  it('shows the empty state when there are no results', async () => {
    mockList([], 0);

    render(<AdminUserPage />);

    expect(await screen.findByText('No se encontraron usuarios')).toBeInTheDocument();
  });

  it('shows the error state and retries on demand', async () => {
    const user = userEvent.setup();
    getAdminUsers.mockRejectedValueOnce(new Error('Sesión expirada'));
    render(<AdminUserPage />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Sesión expirada');

    mockList();
    await user.click(screen.getByRole('button', { name: 'Reintentar' }));

    expect(await screen.findByText('Jane Doe')).toBeInTheDocument();
  });

  it('sends the search term after the debounce delay', async () => {
    const user = userEvent.setup();
    render(<AdminUserPage />);
    await screen.findByText('Jane Doe');
    getAdminUsers.mockClear();

    await user.type(screen.getByLabelText('Buscar usuarios'), 'ja');

    await waitFor(
      () => expect(getAdminUsers).toHaveBeenCalledWith(expect.objectContaining({ search: 'ja' })),
      { timeout: 2000 }
    );
  });

  it('does not issue an unfiltered request while the search is still debouncing', async () => {
    const user = userEvent.setup();
    mockList(users, 5);
    render(<AdminUserPage />);
    await screen.findByText('Jane Doe');

    await user.click(screen.getByRole('button', { name: 'Ir a la página 3' }));
    await waitFor(() =>
      expect(getAdminUsers).toHaveBeenCalledWith(expect.objectContaining({ page: 3 }))
    );

    getAdminUsers.mockClear();
    await user.type(screen.getByLabelText('Buscar usuarios'), 'j');
    await new Promise((resolve) => setTimeout(resolve, 900));

    const queries = getAdminUsers.mock.calls.map(([query]) => query);
    expect(queries).toHaveLength(1);
    expect(queries[0]).toEqual(expect.objectContaining({ search: 'j', page: 1 }));
  });

  it('omits the status filter when "all" is selected', async () => {
    const user = userEvent.setup();
    render(<AdminUserPage />);
    await screen.findByText('Jane Doe');
    getAdminUsers.mockClear();

    await user.selectOptions(screen.getByLabelText('Estado'), 'SUSPENDED');

    await waitFor(() =>
      expect(getAdminUsers).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'SUSPENDED', page: 1 })
      )
    );
  });

  it('resets to the first page when filters are cleared', async () => {
    const user = userEvent.setup();
    render(<AdminUserPage />);
    await screen.findByText('Jane Doe');

    await user.selectOptions(screen.getByLabelText('Estado'), 'SUSPENDED');
    await screen.findByText('Limpiar');
    getAdminUsers.mockClear();
    await user.click(screen.getByRole('button', { name: /Limpiar/ }));

    await waitFor(() =>
      expect(getAdminUsers).toHaveBeenCalledWith(
        expect.objectContaining({ status: undefined, search: undefined, page: 1 })
      )
    );
  });

  it('suspends an active user and updates the row', async () => {
    const user = userEvent.setup();
    updateUserStatus.mockResolvedValue({ success: true, message: 'ok' });
    render(<AdminUserPage />);

    const janeRow = (await screen.findByText('Jane Doe')).closest('tr') as HTMLElement;
    await user.click(within(janeRow).getByRole('button', { name: /Suspender/ }));

    expect(updateUserStatus).toHaveBeenCalledWith('u1', 'SUSPENDED', 'Acción de administrador');
    expect(await screen.findByText('Usuario suspendido')).toBeInTheDocument();

    const updatedRow = (await screen.findByText('Jane Doe')).closest('tr') as HTMLElement;
    expect(within(updatedRow).getByText('Suspendido')).toBeInTheDocument();
  });

  it('reactivates a suspended user', async () => {
    const user = userEvent.setup();
    updateUserStatus.mockResolvedValue({ success: true, message: 'ok' });
    render(<AdminUserPage />);

    const johnRow = (await screen.findByText('John Roe')).closest('tr') as HTMLElement;
    await user.click(within(johnRow).getByRole('button', { name: /Activar/ }));

    expect(updateUserStatus).toHaveBeenCalledWith('u2', 'ACTIVE', 'Acción de administrador');
    expect(await screen.findByText('Usuario reactivado')).toBeInTheDocument();
  });

  it('surfaces a failure without changing the row', async () => {
    const user = userEvent.setup();
    updateUserStatus.mockRejectedValue(new Error('No autorizado'));
    render(<AdminUserPage />);

    const janeRow = (await screen.findByText('Jane Doe')).closest('tr') as HTMLElement;
    await user.click(within(janeRow).getByRole('button', { name: /Suspender/ }));

    expect(await screen.findByText('No autorizado')).toBeInTheDocument();
    const row = (await screen.findByText('Jane Doe')).closest('tr') as HTMLElement;
    expect(within(row).getByText('Activo')).toBeInTheDocument();
  });

  it('asks for confirmation before deleting', async () => {
    const user = userEvent.setup();
    deleteUser.mockResolvedValue({ success: true, message: 'ok' });
    render(<AdminUserPage />);

    const janeRow = (await screen.findByText('Jane Doe')).closest('tr') as HTMLElement;
    await user.click(within(janeRow).getByRole('button', { name: /Eliminar/ }));

    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    expect(deleteUser).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Eliminar definitivamente' }));

    await waitFor(() => expect(deleteUser).toHaveBeenCalledWith('u1'));
    await waitFor(() => expect(screen.queryByText('Jane Doe')).not.toBeInTheDocument());
    expect(screen.getByText('Usuario eliminado')).toBeInTheDocument();
  });

  it('does not delete when the confirmation is dismissed', async () => {
    const user = userEvent.setup();
    render(<AdminUserPage />);

    const janeRow = (await screen.findByText('Jane Doe')).closest('tr') as HTMLElement;
    await user.click(within(janeRow).getByRole('button', { name: /Eliminar/ }));
    await user.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(deleteUser).not.toHaveBeenCalled();
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('keeps the row when deletion fails', async () => {
    const user = userEvent.setup();
    deleteUser.mockRejectedValue(new Error('Usuario con citas activas'));
    render(<AdminUserPage />);

    const janeRow = (await screen.findByText('Jane Doe')).closest('tr') as HTMLElement;
    await user.click(within(janeRow).getByRole('button', { name: /Eliminar/ }));
    await user.click(screen.getByRole('button', { name: 'Eliminar definitivamente' }));

    expect(await screen.findByText('Usuario con citas activas')).toBeInTheDocument();
    expect(screen.getByRole('alertdialog')).toHaveTextContent('Jane Doe');
    expect(within(screen.getByRole('table')).getByText('Jane Doe')).toBeInTheDocument();
  });

  it('renders pagination controls when there are several pages', async () => {
    mockList(users, 5);
    const user = userEvent.setup();
    render(<AdminUserPage />);

    await screen.findByText('Jane Doe');
    await user.click(screen.getByRole('button', { name: 'Ir a la página 2' }));

    await waitFor(() => expect(getAdminUsers).toHaveBeenCalledWith(expect.objectContaining({ page: 2 })));
  });

  it('returns to the previous page when the last row of the last page is deleted', async () => {
    const user = userEvent.setup();
    const single = [users[0]];
    getAdminUsers.mockResolvedValue({
      success: true,
      users: single,
      pagination: { page: 3, limit: 10, total: 21, totalPages: 3 },
    });
    deleteUser.mockResolvedValue({ success: true, message: 'ok' });

    render(<AdminUserPage />);
    await screen.findByText('Jane Doe');
    await user.click(screen.getByRole('button', { name: 'Ir a la página 3' }));
    await waitFor(() =>
      expect(getAdminUsers).toHaveBeenCalledWith(expect.objectContaining({ page: 3 }))
    );

    getAdminUsers.mockClear();
    await user.click(screen.getByRole('button', { name: /Eliminar/ }));
    await user.click(screen.getByRole('button', { name: 'Eliminar definitivamente' }));

    await waitFor(() => {
      const queries = getAdminUsers.mock.calls.map(([query]) => query);
      expect(queries[queries.length - 1]).toEqual(expect.objectContaining({ page: 2 }));
    });
  });
});
