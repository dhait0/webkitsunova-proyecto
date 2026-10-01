import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ConfirmDialog from './ConfirmDialog';

const defaultProps = {
  open: true,
  title: 'Eliminar usuario',
  message: 'Esta acción no se puede deshacer.',
  onConfirm: vi.fn(),
  onCancel: vi.fn(),
};

describe('ConfirmDialog', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when closed', () => {
    const { container } = render(<ConfirmDialog {...defaultProps} open={false} />);

    expect(container).toBeEmptyDOMElement();
  });

  it('renders the title and message with dialog semantics', () => {
    render(<ConfirmDialog {...defaultProps} />);

    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    expect(screen.getByText('Eliminar usuario')).toBeInTheDocument();
    expect(screen.getByText('Esta acción no se puede deshacer.')).toBeInTheDocument();
  });

  it('focuses the confirm button on open', () => {
    render(<ConfirmDialog {...defaultProps} confirmLabel="Eliminar definitivamente" />);

    expect(screen.getByRole('button', { name: 'Eliminar definitivamente' })).toHaveFocus();
  });

  it('calls onConfirm when the confirm button is clicked', async () => {
    const user = userEvent.setup();
    render(<ConfirmDialog {...defaultProps} />);

    await user.click(screen.getByRole('button', { name: 'Confirmar' }));

    expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when the cancel button is clicked', async () => {
    const user = userEvent.setup();
    render(<ConfirmDialog {...defaultProps} />);

    await user.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);
  });

  it('closes on Escape', async () => {
    const user = userEvent.setup();
    render(<ConfirmDialog {...defaultProps} />);

    await user.keyboard('{Escape}');

    expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);
  });

  it('disables both actions while busy', () => {
    render(<ConfirmDialog {...defaultProps} busy />);

    expect(screen.getByRole('button', { name: 'Procesando...' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled();
  });
});
