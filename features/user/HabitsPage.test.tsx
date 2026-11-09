import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import HabitsPage from '@/features/user/HabitsPage';
import { computeHabitStats } from '@/services/user/habit-stats';
import { summarizeHabits, type HabitsOverview, type UserHabit } from '@/services/user/habits.service';

// summarizeHabits lives next to the Prisma queries; the page tests only need the pure helper.
vi.mock('@/lib/db/prisma', () => ({ prisma: {} }));

const mockRefresh = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: mockRefresh }),
}));

const mockCreate = vi.fn();
const mockUpdate = vi.fn();
const mockSetCompletion = vi.fn();
const mockDelete = vi.fn();

vi.mock('@/app/(user)/dashboard/habitos/actions', () => ({
  createHabitAction: (...args: unknown[]) => mockCreate(...args),
  updateHabitAction: (...args: unknown[]) => mockUpdate(...args),
  setHabitCompletionAction: (...args: unknown[]) => mockSetCompletion(...args),
  deleteHabitAction: (...args: unknown[]) => mockDelete(...args),
}));

const TODAY = '2026-11-11';

function habit(over: Partial<UserHabit> & { logged?: string[] } = {}): UserHabit {
  const target = over.targetPerWeek ?? 7;
  return {
    id: 'h1',
    title: 'Caminar',
    description: 'Veinte minutos al día',
    status: 'active',
    targetPerWeek: target,
    createdAt: '2026-10-01T00:00:00.000Z',
    stats: computeHabitStats(over.logged ?? [], target, TODAY),
    ...over,
  } as UserHabit;
}

function overview(habits: UserHabit[]): HabitsOverview {
  return { today: TODAY, habits, summary: summarizeHabits(habits) };
}

beforeEach(() => {
  vi.resetAllMocks();
  mockSetCompletion.mockResolvedValue({ success: true });
  mockUpdate.mockResolvedValue({ success: true });
  mockCreate.mockResolvedValue({ success: true });
  mockDelete.mockResolvedValue({ success: true });
});

describe('HabitsPage', () => {
  it('muestra un estado vacío sin cifras inventadas', () => {
    render(<HabitsPage data={overview([])} error={null} />);

    expect(screen.getByText(/No tienes hábitos registrados todavía/)).toBeInTheDocument();
    expect(screen.queryByLabelText('Resumen de hábitos')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Crear hábito' })).toBeInTheDocument();
  });

  it('muestra el error cuando falla la carga', () => {
    render(<HabitsPage data={overview([])} error="No se pudieron cargar los hábitos" />);
    expect(screen.getByRole('alert')).toHaveTextContent('No se pudieron cargar los hábitos');
  });

  it('presenta racha, constancia y resumen calculados con los registros', () => {
    const data = overview([habit({ logged: [TODAY, '2026-11-10', '2026-11-09'] })]);
    render(<HabitsPage data={data} error={null} />);

    const summary = screen.getByLabelText('Resumen de hábitos');
    expect(summary).toHaveTextContent('1/1'); // hoy
    expect(summary).toHaveTextContent('Todo registrado hoy');
    expect(screen.getByText('Racha').nextElementSibling).toHaveTextContent('3 días');
    expect(screen.getByText('Mejor racha').nextElementSibling).toHaveTextContent('3 días');
    expect(screen.getByRole('progressbar', { name: 'Constancia de Caminar' })).toHaveAttribute('aria-valuenow', '11');
  });

  it('marca hoy con la fecha del día del usuario y refresca', async () => {
    render(<HabitsPage data={overview([habit()])} error={null} />);

    fireEvent.click(screen.getByRole('button', { name: 'Marcar hoy' }));

    await waitFor(() => expect(mockSetCompletion).toHaveBeenCalledWith('h1', TODAY, true));
    await waitFor(() => expect(mockRefresh).toHaveBeenCalled());
    expect(await screen.findByText(/Registraste "Caminar" hoy/)).toBeInTheDocument();
  });

  it('deshace el registro de hoy cuando ya estaba hecho', async () => {
    render(<HabitsPage data={overview([habit({ logged: [TODAY] })])} error={null} />);

    const button = screen.getByRole('button', { name: /Hecho hoy/ });
    expect(button).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(button);

    await waitFor(() => expect(mockSetCompletion).toHaveBeenCalledWith('h1', TODAY, false));
  });

  it('permite marcar un día anterior desde la tira de siete días', async () => {
    render(<HabitsPage data={overview([habit()])} error={null} />);

    const strip = screen.getByRole('group', { name: 'Últimos 7 días de Caminar' });
    expect(strip.querySelectorAll('button')).toHaveLength(7);

    fireEvent.click(screen.getByRole('button', { name: /martes, 10 de noviembre.*sin registrar/ }));
    await waitFor(() => expect(mockSetCompletion).toHaveBeenCalledWith('h1', '2026-11-10', true));
  });

  it('no deja registrar días de un hábito pausado', () => {
    render(<HabitsPage data={overview([habit({ status: 'paused' })])} error={null} />);

    expect(screen.queryByRole('button', { name: 'Marcar hoy' })).not.toBeInTheDocument();
    expect(screen.getByText(/Hábito en pausa/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reactivar Caminar' })).toBeEnabled();
  });

  it('muestra el mensaje del servidor cuando el registro falla', async () => {
    mockSetCompletion.mockResolvedValue({ success: false, message: 'No se puede registrar un día futuro' });
    render(<HabitsPage data={overview([habit()])} error={null} />);

    fireEvent.click(screen.getByRole('button', { name: 'Marcar hoy' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('No se puede registrar un día futuro');
    expect(mockRefresh).not.toHaveBeenCalled();
  });

  it('crea un hábito con su meta semanal', async () => {
    render(<HabitsPage data={overview([])} error={null} />);

    fireEvent.change(screen.getByLabelText('Título'), { target: { value: 'Leer' } });
    fireEvent.change(screen.getByLabelText('Meta semanal'), { target: { value: '3' } });
    fireEvent.click(screen.getByRole('button', { name: 'Crear hábito' }));

    await waitFor(() => expect(mockCreate).toHaveBeenCalled());
    const form = mockCreate.mock.calls[0][0] as FormData;
    expect(form.get('title')).toBe('Leer');
    expect(form.get('targetPerWeek')).toBe('3');
  });

  it('pausa y termina un hábito mediante el estado', async () => {
    render(<HabitsPage data={overview([habit()])} error={null} />);

    fireEvent.click(screen.getByRole('button', { name: 'Pausar Caminar' }));
    await waitFor(() => expect(mockUpdate).toHaveBeenCalledTimes(1));
    expect((mockUpdate.mock.calls[0][0] as FormData).get('status')).toBe('paused');
    await waitFor(() => expect(screen.getByRole('button', { name: 'Terminar Caminar' })).toBeEnabled());

    fireEvent.click(screen.getByRole('button', { name: 'Terminar Caminar' }));
    await waitFor(() => expect(mockUpdate).toHaveBeenCalledTimes(2));
    expect((mockUpdate.mock.calls[1][0] as FormData).get('status')).toBe('completed');
  });

  it('edita título y meta, y cancela sin guardar', async () => {
    render(<HabitsPage data={overview([habit()])} error={null} />);

    fireEvent.click(screen.getByRole('button', { name: 'Editar Caminar' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(mockUpdate).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Editar Caminar' }));
    fireEvent.change(screen.getByLabelText('Título', { selector: '#edit-title-h1' }), { target: { value: 'Caminar más' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    await waitFor(() => expect(mockUpdate).toHaveBeenCalled());
    const form = mockUpdate.mock.calls[0][0] as FormData;
    expect(form.get('habitId')).toBe('h1');
    expect(form.get('title')).toBe('Caminar más');
  });

  it('pide confirmación antes de eliminar y avisa de que se borra el historial', async () => {
    render(<HabitsPage data={overview([habit()])} error={null} />);

    fireEvent.click(screen.getByRole('button', { name: 'Eliminar Caminar' }));
    expect(mockDelete).not.toHaveBeenCalled();
    expect(screen.getByRole('note')).toHaveTextContent('todo su historial');

    fireEvent.click(screen.getByRole('button', { name: 'Confirmar eliminación de Caminar' }));
    await waitFor(() => expect(mockDelete).toHaveBeenCalled());
    expect((mockDelete.mock.calls[0][0] as FormData).get('habitId')).toBe('h1');
  });

  it('despliega el historial de 28 días', () => {
    render(<HabitsPage data={overview([habit({ logged: [TODAY] })])} error={null} />);

    expect(screen.queryByRole('img', { name: /Historial de 28 días/ })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Ver historial' }));
    const heat = screen.getByRole('img', { name: 'Historial de 28 días de Caminar' });
    expect(heat.querySelectorAll('.user-heat-cell')).toHaveLength(28);
    expect(heat.querySelectorAll('.is-done')).toHaveLength(1);
  });
});
