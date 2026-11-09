'use client';

import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  createHabitAction,
  deleteHabitAction,
  setHabitCompletionAction,
  updateHabitAction,
  type HabitActionResult,
} from '@/app/(user)/dashboard/habitos/actions';
import type { HabitsOverview, UserHabit } from '@/services/user/habits.service';

type Props = {
  data: HabitsOverview;
  error: string | null;
};

const STATUS_LABELS: Record<string, string> = {
  active: 'Activo',
  paused: 'Pausado',
  completed: 'Terminado',
};

const WEEKDAY_INITIALS = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];

function goalLabel(target: number) {
  return target === 7 ? 'Todos los días' : `${target} ${target === 1 ? 'día' : 'días'} por semana`;
}

function streakLabel(stats: UserHabit['stats']) {
  const unit = stats.streakUnit === 'days' ? 'día' : 'semana';
  return `${stats.streak} ${unit}${stats.streak === 1 ? '' : 's'}`;
}

function bestStreakLabel(stats: UserHabit['stats']) {
  const unit = stats.streakUnit === 'days' ? 'día' : 'semana';
  return `${stats.bestStreak} ${unit}${stats.bestStreak === 1 ? '' : 's'}`;
}

/** Day of week (0 = Sunday) of a YYYY-MM-DD key, independent of the browser zone. */
function weekdayOf(key: string) {
  return new Date(`${key}T00:00:00Z`).getUTCDay();
}

function formatDay(key: string) {
  return new Intl.DateTimeFormat('es-CO', {
    timeZone: 'UTC',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date(`${key}T00:00:00Z`));
}

function TargetSelect({ id, defaultValue }: { id: string; defaultValue: number }) {
  return (
    <select className="user-input" id={id} name="targetPerWeek" defaultValue={String(defaultValue)}>
      {[7, 6, 5, 4, 3, 2, 1].map((n) => (
        <option key={n} value={n}>
          {goalLabel(n)}
        </option>
      ))}
    </select>
  );
}

export default function HabitsPage({ data, error }: Props) {
  const { habits, summary, today } = data;
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [historyOpenId, setHistoryOpenId] = useState<string | null>(null);
  const createFormRef = useRef<HTMLFormElement>(null);

  function handleResult(result: HabitActionResult | void, successText: string, onSuccess?: () => void) {
    if (result && result.success) {
      setMessage({ type: 'success', text: successText });
      onSuccess?.();
      router.refresh();
    } else {
      setMessage({ type: 'error', text: (result && result.message) || 'Ocurrió un error' });
    }
  }

  function run(task: () => Promise<HabitActionResult | void>, successText: string, onSuccess?: () => void) {
    setMessage(null);
    startTransition(async () => {
      handleResult(await task(), successText, onSuccess);
    });
  }

  function onCreate(formData: FormData) {
    run(() => createHabitAction(formData), 'Hábito creado', () => createFormRef.current?.reset());
  }

  function onToggleDay(habit: UserHabit, date: string, done: boolean) {
    run(
      () => setHabitCompletionAction(habit.id, date, done),
      done
        ? date === today
          ? `¡Bien! Registraste "${habit.title}" hoy.`
          : `Registraste "${habit.title}" el ${formatDay(date)}.`
        : `Quitaste el registro de "${habit.title}" del ${formatDay(date)}.`,
    );
  }

  function onEditSave(formData: FormData) {
    run(() => updateHabitAction(formData), 'Hábito actualizado', () => setEditingId(null));
  }

  function onSetStatus(habit: UserHabit, status: 'active' | 'paused' | 'completed') {
    const text =
      status === 'paused' ? 'Hábito pausado' : status === 'completed' ? 'Hábito terminado' : 'Hábito reactivado';
    run(() => {
      const formData = new FormData();
      formData.set('habitId', habit.id);
      formData.set('status', status);
      return updateHabitAction(formData);
    }, text);
  }

  function onDelete(habitId: string) {
    run(() => {
      const formData = new FormData();
      formData.set('habitId', habitId);
      return deleteHabitAction(formData);
    }, 'Hábito eliminado', () => setConfirmDeleteId(null));
  }

  if (error) {
    return (
      <section className="user-page">
        <div className="user-page-head">
          <div className="user-page-head-copy">
            <span className="user-eyebrow">Hábitos</span>
            <h2 className="user-headline">Tus hábitos</h2>
          </div>
        </div>
        <div className="user-card user-raise" role="alert">
          <p>{error}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="user-page">
      <div className="user-page-head">
        <div className="user-page-head-copy">
          <span className="user-eyebrow">Hábitos</span>
          <h2 className="user-headline">Tus hábitos</h2>
          <p className="user-lede">
            {habits.length === 0
              ? 'No tienes hábitos registrados todavía. Crea el primero y marca cada día que lo cumplas.'
              : 'Marca los días que cumples cada hábito. Tu constancia se calcula con esos registros.'}
          </p>
        </div>
      </div>

      <div aria-live="polite" className="user-form-feedback">
        {message ? (
          <p role={message.type === 'error' ? 'alert' : 'status'} className={`user-notice user-notice--${message.type}`}>
            {message.text}
          </p>
        ) : null}
      </div>

      {habits.length > 0 ? (
        <div className="user-habit-summary" aria-label="Resumen de hábitos">
          <div className="user-card user-habit-summary-item">
            <span className="user-eyebrow">Hoy</span>
            <span className="user-numeral">
              {summary.doneToday}
              <small>/{summary.active}</small>
            </span>
            <p>
              {summary.active === 0
                ? 'Sin hábitos activos'
                : summary.pendingToday === 0
                  ? 'Todo registrado hoy'
                  : `${summary.pendingToday} por registrar`}
            </p>
          </div>
          <div className="user-card user-habit-summary-item">
            <span className="user-eyebrow">Racha actual</span>
            <span className="user-numeral">{summary.bestCurrentStreak ? summary.bestCurrentStreak.value : 0}</span>
            <p>
              {summary.bestCurrentStreak
                ? summary.bestCurrentStreak.unit === 'days'
                  ? 'días seguidos en tu mejor hábito'
                  : 'semanas cumpliendo la meta'
                : 'Aún sin racha'}
            </p>
          </div>
          <div className="user-card user-habit-summary-item">
            <span className="user-eyebrow">Últimos 7 días</span>
            <span className="user-numeral">
              {summary.averageProgress === null ? '—' : `${summary.averageProgress}%`}
            </span>
            <p>
              {summary.averageProgress === null
                ? 'Sin hábitos activos'
                : 'Cumplimiento medio de tus metas'}
            </p>
          </div>
          <div className="user-card user-habit-summary-item">
            <span className="user-eyebrow">Hábitos</span>
            <span className="user-numeral">{summary.active}</span>
            <p>
              activo{summary.active === 1 ? '' : 's'}
              {summary.paused > 0 ? ` · ${summary.paused} en pausa` : ''}
              {summary.completed > 0 ? ` · ${summary.completed} terminado${summary.completed === 1 ? '' : 's'}` : ''}
            </p>
          </div>
        </div>
      ) : null}

      <article className="user-card user-card-stack user-raise">
        <div className="user-panel-head">
          <span className="user-eyebrow">Nuevo</span>
          <h2 className="user-title">Nuevo hábito</h2>
        </div>
        <form ref={createFormRef} action={onCreate} className="user-card-stack">
          <div className="user-form-row">
            <div className="user-field">
              <label className="user-label" htmlFor="habit-title">Título</label>
              <input
                className="user-input"
                id="habit-title"
                name="title"
                type="text"
                required
                maxLength={80}
                placeholder="Ej. Caminar 20 minutos"
                autoComplete="off"
              />
            </div>
            <div className="user-field">
              <label className="user-label" htmlFor="habit-target">Meta semanal</label>
              <TargetSelect id="habit-target" defaultValue={7} />
            </div>
          </div>
          <div className="user-field">
            <label className="user-label" htmlFor="habit-description">Descripción (opcional)</label>
            <input
              className="user-input"
              id="habit-description"
              name="description"
              type="text"
              maxLength={500}
              placeholder="Cuándo y cómo lo harás"
              autoComplete="off"
            />
          </div>
          <div>
            <button className="user-btn user-btn--primary" type="submit" disabled={isPending}>
              {isPending ? 'Guardando…' : 'Crear hábito'}
            </button>
          </div>
        </form>
      </article>

      {habits.length === 0 ? (
        <div className="user-card user-raise">
          <p>Cuando crees un hábito aparecerá aquí con su calendario semanal, tu racha y tu historial.</p>
        </div>
      ) : (
        <div className="user-habit-list">
          {habits.map((habit) => {
            const active = habit.status === 'active';
            const { stats } = habit;
            const isEditing = editingId === habit.id;

            return (
              <article
                key={habit.id}
                className={`user-card user-habit user-raise${active ? '' : ' user-habit--idle'}`}
                aria-label={habit.title}
              >
                <header className="user-habit-head">
                  <div className="user-habit-title">
                    <h3 className="user-title">{habit.title}</h3>
                    <span className="user-eyebrow">{goalLabel(habit.targetPerWeek)}</span>
                  </div>
                  <span className={`user-pill ${active ? 'user-pill--ok' : 'user-pill--warn'}`}>
                    {STATUS_LABELS[habit.status] ?? habit.status}
                  </span>
                </header>

                {habit.description ? <p className="user-habit-desc">{habit.description}</p> : null}

                {isEditing ? (
                  <form action={onEditSave} className="user-card-stack">
                    <input type="hidden" name="habitId" value={habit.id} />
                    <div className="user-form-row">
                      <div className="user-field">
                        <label className="user-label" htmlFor={`edit-title-${habit.id}`}>Título</label>
                        <input
                          className="user-input"
                          id={`edit-title-${habit.id}`}
                          name="title"
                          type="text"
                          required
                          maxLength={80}
                          defaultValue={habit.title}
                        />
                      </div>
                      <div className="user-field">
                        <label className="user-label" htmlFor={`edit-target-${habit.id}`}>Meta semanal</label>
                        <TargetSelect id={`edit-target-${habit.id}`} defaultValue={habit.targetPerWeek} />
                      </div>
                    </div>
                    <div className="user-field">
                      <label className="user-label" htmlFor={`edit-desc-${habit.id}`}>Descripción</label>
                      <input
                        className="user-input"
                        id={`edit-desc-${habit.id}`}
                        name="description"
                        type="text"
                        maxLength={500}
                        defaultValue={habit.description ?? ''}
                      />
                    </div>
                    <div className="user-habit-actions">
                      <button className="user-btn user-btn--primary" type="submit" disabled={isPending}>
                        Guardar
                      </button>
                      <button className="user-btn user-btn--quiet" type="button" onClick={() => setEditingId(null)}>
                        Cancelar
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    {active || stats.loggedToday ? (
                      <button
                        type="button"
                        className={`user-btn user-habit-today ${stats.loggedToday ? 'user-btn--done' : 'user-btn--primary'}`}
                        aria-pressed={stats.loggedToday}
                        disabled={isPending || (!active && !stats.loggedToday)}
                        onClick={() => onToggleDay(habit, today, !stats.loggedToday)}
                      >
                        {stats.loggedToday ? '✓ Hecho hoy · deshacer' : 'Marcar hoy'}
                      </button>
                    ) : (
                      <p className="user-habit-note">
                        {habit.status === 'paused'
                          ? 'Hábito en pausa: reactívalo para volver a registrar días.'
                          : 'Hábito terminado: reactívalo si quieres seguir registrándolo.'}
                      </p>
                    )}

                    <div className="user-daystrip" role="group" aria-label={`Últimos 7 días de ${habit.title}`}>
                      {stats.recent.map((day) => (
                        <button
                          key={day.date}
                          type="button"
                          className={`user-daybtn${day.done ? ' is-done' : ''}${day.date === today ? ' is-today' : ''}`}
                          aria-pressed={day.done}
                          aria-label={`${formatDay(day.date)}: ${day.done ? 'hecho' : 'sin registrar'}`}
                          disabled={isPending || (!active && !day.done)}
                          onClick={() => onToggleDay(habit, day.date, !day.done)}
                        >
                          <span>{WEEKDAY_INITIALS[weekdayOf(day.date)]}</span>
                          <strong>{Number(day.date.slice(8))}</strong>
                        </button>
                      ))}
                    </div>

                    <dl className="user-habit-stats">
                      <div>
                        <dt>Racha</dt>
                        <dd>{streakLabel(stats)}</dd>
                      </div>
                      <div>
                        <dt>Mejor racha</dt>
                        <dd>{bestStreakLabel(stats)}</dd>
                      </div>
                      <div>
                        <dt>Últimos 7 días</dt>
                        <dd>
                          {stats.last7} {stats.last7 === 1 ? 'día' : 'días'} · meta {habit.targetPerWeek}
                        </dd>
                      </div>
                      <div>
                        <dt>Total</dt>
                        <dd>{stats.total} {stats.total === 1 ? 'día' : 'días'}</dd>
                      </div>
                    </dl>

                    <div className="user-habit-consistency">
                      <div className="user-habit-consistency-top">
                        <span className="user-eyebrow">Constancia · últimas 4 semanas</span>
                        <strong>{stats.consistency4w}%</strong>
                      </div>
                      <div
                        className="user-bar"
                        role="progressbar"
                        aria-label={`Constancia de ${habit.title}`}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={stats.consistency4w}
                      >
                        <span className="user-bar-fill" style={{ width: `${stats.consistency4w}%`, display: 'block' }} />
                      </div>
                    </div>

                    {historyOpenId === habit.id ? (
                      <div className="user-heat" role="img" aria-label={`Historial de 28 días de ${habit.title}`}>
                        {stats.history.map((day) => (
                          <span
                            key={day.date}
                            className={`user-heat-cell${day.done ? ' is-done' : ''}`}
                            title={`${formatDay(day.date)}: ${day.done ? 'hecho' : 'sin registrar'}`}
                          />
                        ))}
                      </div>
                    ) : null}

                    <div className="user-habit-actions">
                      <button
                        type="button"
                        className="user-btn user-btn--quiet"
                        aria-expanded={historyOpenId === habit.id}
                        onClick={() => setHistoryOpenId(historyOpenId === habit.id ? null : habit.id)}
                      >
                        {historyOpenId === habit.id ? 'Ocultar historial' : 'Ver historial'}
                      </button>
                      <button
                        type="button"
                        className="user-btn user-btn--quiet"
                        disabled={isPending}
                        onClick={() => setEditingId(habit.id)}
                        aria-label={`Editar ${habit.title}`}
                      >
                        Editar
                      </button>
                      {active ? (
                        <button
                          type="button"
                          className="user-btn user-btn--quiet"
                          disabled={isPending}
                          onClick={() => onSetStatus(habit, 'paused')}
                          aria-label={`Pausar ${habit.title}`}
                        >
                          Pausar
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="user-btn user-btn--quiet"
                          disabled={isPending}
                          onClick={() => onSetStatus(habit, 'active')}
                          aria-label={`Reactivar ${habit.title}`}
                        >
                          Reactivar
                        </button>
                      )}
                      {active ? (
                        <button
                          type="button"
                          className="user-btn user-btn--quiet"
                          disabled={isPending}
                          onClick={() => onSetStatus(habit, 'completed')}
                          aria-label={`Terminar ${habit.title}`}
                        >
                          Terminar
                        </button>
                      ) : null}
                      {confirmDeleteId === habit.id ? (
                        <>
                          <button
                            type="button"
                            className="user-btn user-btn--danger"
                            disabled={isPending}
                            onClick={() => onDelete(habit.id)}
                            aria-label={`Confirmar eliminación de ${habit.title}`}
                          >
                            Confirmar eliminación
                          </button>
                          <button
                            type="button"
                            className="user-btn user-btn--quiet"
                            disabled={isPending}
                            onClick={() => setConfirmDeleteId(null)}
                            aria-label={`Cancelar eliminación de ${habit.title}`}
                          >
                            Cancelar
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          className="user-btn user-btn--quiet"
                          disabled={isPending}
                          onClick={() => setConfirmDeleteId(habit.id)}
                          aria-label={`Eliminar ${habit.title}`}
                        >
                          Eliminar
                        </button>
                      )}
                    </div>
                    {confirmDeleteId === habit.id ? (
                      <p className="user-habit-warn" role="note">
                        Se borrará el hábito y todo su historial. No se puede deshacer.
                      </p>
                    ) : null}
                  </>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
