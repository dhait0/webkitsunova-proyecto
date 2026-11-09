import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import HabitsPage from '@/features/user/HabitsPage';

const mockRefresh = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: mockRefresh }),
}));

const mockCreateHabitAction = vi.fn();
const mockUpdateHabitAction = vi.fn();
const mockRegisterHabitProgressAction = vi.fn();
const mockDeleteHabitAction = vi.fn();

vi.mock('@/app/(user)/dashboard/habitos/actions', () => ({
  createHabitAction: (...args: unknown[]) => mockCreateHabitAction(...args),
  updateHabitAction: (...args: unknown[]) => mockUpdateHabitAction(...args),
  registerHabitProgressAction: (...args: unknown[]) => mockRegisterHabitProgressAction(...args),
  deleteHabitAction: (...args: unknown[]) => mockDeleteHabitAction(...args),
}));

beforeEach(() => {
  vi.resetAllMocks();
});

const baseData = {
  habits: [
    {
      id: 'hab-1',
      title: 'Sueño',
      description: 'Bloquea pantallas antes de dormir y completa tu rutina nocturna.',
      progress: 82,
      status: 'Estable',
    },
    {
      id: 'hab-2',
      title: 'Movimiento',
      description: 'Camina 20 minutos y registra pausas activas durante el día.',
      progress: 64,
      status: 'En curso',
    },
    {
      id: 'hab-3',
      title: 'Respiración',
      description: 'Usa la herramienta de pausa guiada cuando suba el nivel de estrés.',
      progress: 91,
      status: 'Muy bien',
    },
  ],
};

describe('HabitsPage', () => {
  it('renderiza hábitos reales con datos públicos únicamente', () => {
    render(<HabitsPage data={baseData} error={null} />);

    expect(screen.getByText('Sueño')).toBeInTheDocument();
    expect(screen.getByText('Movimiento')).toBeInTheDocument();
    expect(screen.getByText('Respiración')).toBeInTheDocument();
    expect(screen.getByText('Bloquea pantallas antes de dormir y completa tu rutina nocturna.')).toBeInTheDocument();
    expect(screen.getByText('Camina 20 minutos y registra pausas activas durante el día.')).toBeInTheDocument();
    expect(screen.getByText('Usa la herramienta de pausa guiada cuando suba el nivel de estrés.')).toBeInTheDocument();
    expect(screen.getByText('Estable')).toBeInTheDocument();
    expect(screen.getByText('En curso')).toBeInTheDocument();
    expect(screen.getByText('Muy bien')).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: 'Progreso de Sueño' })).toHaveAttribute('aria-valuenow', '82');
    expect(screen.getByRole('progressbar', { name: 'Progreso de Movimiento' })).toHaveAttribute('aria-valuenow', '64');
    expect(screen.getByRole('progressbar', { name: 'Progreso de Respiración' })).toHaveAttribute('aria-valuenow', '91');
  });

  it('no expone datos privados del usuario', () => {
    render(<HabitsPage data={baseData} error={null} />);

    const pageContent = screen.getByText('Sueño').closest('section')?.textContent ?? '';
    expect(pageContent).not.toContain('email');
    expect(pageContent).not.toContain('phone');
    expect(pageContent).not.toContain('password');
    expect(pageContent).not.toContain('twoFactor');
    expect(pageContent).not.toContain('userId');
  });

  it('no muestra datos ilustrativos ni sello de ejemplo', () => {
    render(<HabitsPage data={baseData} error={null} />);

    expect(screen.queryByText('Ejemplo')).not.toBeInTheDocument();
    expect(screen.queryByText(/datos ilustrativos/)).not.toBeInTheDocument();
  });

  it('muestra estado vacío cuando no hay hábitos', () => {
    render(
      <HabitsPage
        data={{ habits: [] }}
        error={null}
      />,
    );

    expect(screen.getByText(/No tienes hábitos registrados todavía/)).toBeInTheDocument();
    expect(screen.queryByText('Sueño')).not.toBeInTheDocument();
  });

  it('muestra estado de error cuando la consulta falla', () => {
    render(<HabitsPage data={baseData} error='No se pudieron cargar los hábitos' />);

    expect(screen.getByText('No se pudieron cargar los hábitos')).toBeInTheDocument();
    expect(screen.queryByText('Sueño')).not.toBeInTheDocument();
  });

  it('muestra formulario de nuevo hábito también en estado vacío', () => {
    render(<HabitsPage data={{ habits: [] }} error={null} />);

    expect(screen.getByLabelText('Título del nuevo hábito')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /crear hábito/i })).toBeInTheDocument();
  });

  it('crea un hábito y limpia el formulario al tener éxito', async () => {
    mockCreateHabitAction.mockResolvedValue({ success: true });
    render(<HabitsPage data={{ habits: [] }} error={null} />);

    fireEvent.change(screen.getByLabelText('Título del nuevo hábito'), { target: { value: 'Leer' } });
    fireEvent.change(screen.getByLabelText('Descripción del nuevo hábito'), { target: { value: '10 min' } });
    fireEvent.click(screen.getByRole('button', { name: /crear hábito/i }));

    await waitFor(() => expect(mockCreateHabitAction).toHaveBeenCalled());
    const fd = mockCreateHabitAction.mock.calls[0][0] as FormData;
    expect(fd.get('title')).toBe('Leer');
    expect(fd.get('description')).toBe('10 min');
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Hábito creado'));
    expect((screen.getByLabelText('Título del nuevo hábito') as HTMLInputElement).value).toBe('');
  });

  it('registra progreso (+10) para un hábito', async () => {
    mockRegisterHabitProgressAction.mockResolvedValue({ success: true });
    render(<HabitsPage data={{ habits: [baseData.habits[0]] }} error={null} />);

    fireEvent.click(screen.getByRole('button', { name: /Registrar progreso de Sueño/i }));

    await waitFor(() => expect(mockRegisterHabitProgressAction).toHaveBeenCalled());
    const fd = mockRegisterHabitProgressAction.mock.calls[0][0] as FormData;
    expect(fd.get('habitId')).toBe('hab-1');
    expect(fd.get('delta')).toBe('10');
  });

  it('edita un hábito en línea con Guardar/Cancelar', async () => {
    mockUpdateHabitAction.mockResolvedValue({ success: true });
    render(<HabitsPage data={{ habits: [baseData.habits[0]] }} error={null} />);

    fireEvent.click(screen.getByRole('button', { name: 'Editar Sueño' }));
    const titleInput = screen.getByLabelText('Título de Sueño') as HTMLInputElement;
    fireEvent.change(titleInput, { target: { value: 'Sueño nuevo' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    await waitFor(() => expect(mockUpdateHabitAction).toHaveBeenCalled());
    const fd = mockUpdateHabitAction.mock.calls[0][0] as FormData;
    expect(fd.get('habitId')).toBe('hab-1');
    expect(fd.get('title')).toBe('Sueño nuevo');
  });

  it('completa un hábito activo', async () => {
    mockUpdateHabitAction.mockResolvedValue({ success: true });
    const activeHabit = { ...baseData.habits[0], status: 'active' };
    render(<HabitsPage data={{ habits: [activeHabit] }} error={null} />);

    fireEvent.click(screen.getByRole('button', { name: 'Completar Sueño' }));

    await waitFor(() => expect(mockUpdateHabitAction).toHaveBeenCalled());
    const fd = mockUpdateHabitAction.mock.calls[0][0] as FormData;
    expect(fd.get('habitId')).toBe('hab-1');
    expect(fd.get('status')).toBe('completed');
  });

  it('elimina con confirmación en la UI (sin window.confirm)', async () => {
    mockDeleteHabitAction.mockResolvedValue({ success: true });
    const confirmSpy = vi.spyOn(window, 'confirm');
    render(<HabitsPage data={{ habits: [baseData.habits[0]] }} error={null} />);

    fireEvent.click(screen.getByRole('button', { name: 'Eliminar Sueño' }));
    expect(mockDeleteHabitAction).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Confirmar eliminación de Sueño' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancelar eliminación de Sueño' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Confirmar eliminación de Sueño' }));
    await waitFor(() => expect(mockDeleteHabitAction).toHaveBeenCalled());
    const fd = mockDeleteHabitAction.mock.calls[0][0] as FormData;
    expect(fd.get('habitId')).toBe('hab-1');
    expect(confirmSpy).not.toHaveBeenCalled();
    confirmSpy.mockRestore();
  });
});
