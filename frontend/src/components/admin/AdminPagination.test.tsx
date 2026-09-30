import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AdminPagination from './AdminPagination';

const pagination = { page: 2, limit: 10, total: 42, totalPages: 5 };
const base = { onPageChange: vi.fn(), noun: 'usuarios' };

describe('AdminPagination', () => {
  it('renders nothing when there is a single page', () => {
    const { container } = render(
      <AdminPagination
        {...base}
        pagination={{ ...pagination, page: 1, total: 3, totalPages: 1 }}
      />
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when pagination is null', () => {
    const { container } = render(<AdminPagination {...base} pagination={null} />);

    expect(container).toBeEmptyDOMElement();
  });

  it('shows the visible range and total', () => {
    render(<AdminPagination {...base} pagination={pagination} />);

    expect(screen.getByText('Mostrando 11-20 de 42 usuarios')).toBeInTheDocument();
  });

  it('marks the current page as active', () => {
    render(<AdminPagination {...base} pagination={pagination} />);

    expect(screen.getByRole('button', { name: 'Ir a la página 2' })).toHaveAttribute(
      'aria-current',
      'page'
    );
  });

  it('disables previous on the first page and next on the last page', () => {
    const onPageChange = vi.fn();
    const { unmount } = render(
      <AdminPagination onPageChange={onPageChange} noun="usuarios" pagination={{ ...pagination, page: 1 }} />
    );

    expect(screen.getByRole('button', { name: /Anterior/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Siguiente/ })).toBeEnabled();
    unmount();

    render(
      <AdminPagination
        onPageChange={onPageChange}
        noun="usuarios"
        pagination={{ ...pagination, page: 5, total: 50 }}
      />
    );

    expect(screen.getByRole('button', { name: /Siguiente/ })).toBeDisabled();
  });

  it('emits the requested page number', async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    render(<AdminPagination {...base} onPageChange={onPageChange} pagination={pagination} />);

    await user.click(screen.getByRole('button', { name: 'Ir a la página 3' }));

    expect(onPageChange).toHaveBeenCalledWith(3);
  });
});
