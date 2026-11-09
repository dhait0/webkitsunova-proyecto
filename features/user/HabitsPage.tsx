'use client';

import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  createHabitAction,
  deleteHabitAction,
  registerHabitProgressAction,
  updateHabitAction,
} from '@/app/(user)/dashboard/habitos/actions';

type UserHabit = {
  id: string;
  title: string;
  description?: string | null;
  progress: number;
  status: string;
};

type HabitsData = {
  habits: UserHabit[];
};

type Props = {
  data: HabitsData;
  error: string | null;
};

type ActionResult = { success: boolean; message?: string } | void;

function statusLabel(status: string) {
  if (status === 'active') return 'Activo';
  if (status === 'completed') return 'Completado';
  return status;
}

export default function HabitsPage({ data, error }: Props) {
  const { habits } = data;
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const createFormRef = useRef<HTMLFormElement>(null);

  const activeCount = habits.filter((h) => h.status === 'active').length;

  function handleResult(result: ActionResult, successText: string, onSuccess?: () => void) {
    if (result && result.success) {
      setMessage({ type: 'success', text: successText });
      onSuccess?.();
      router.refresh();
    } else if (result && !result.success) {
      setMessage({ type: 'error', text: result.message ?? 'Ocurrió un error' });
    } else {
      setMessage({ type: 'error', text: 'Ocurrió un error' });
    }
  }

  function onCreate(formData: FormData) {
    setMessage(null);
    startTransition(async () => {
      const result = await createHabitAction(formData);
      handleResult(result, 'Hábito creado', () => createFormRef.current?.reset());
    });
  }

  function onProgress(habitId: string) {
    setMessage(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.set('habitId', habitId);
      formData.set('delta', '10');
      const result = await registerHabitProgressAction(formData);
      handleResult(result, 'Progreso registrado');
    });
  }

  function onEditSave(formData: FormData) {
    setMessage(null);
    startTransition(async () => {
      const result = await updateHabitAction(formData);
      handleResult(result, 'Hábito actualizado', () => setEditingId(null));
    });
  }

  function onToggleStatus(habit: UserHabit) {
    setMessage(null);
    startTransition(async () => {
      const next = habit.status === 'active' ? 'completed' : 'active';
      const formData = new FormData();
      formData.set('habitId', habit.id);
      formData.set('status', next);
      const result = await updateHabitAction(formData);
      handleResult(result, next === 'completed' ? 'Hábito completado' : 'Hábito reactivado');
    });
  }

  function onDelete(habitId: string) {
    setMessage(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.set('habitId', habitId);
      const result = await deleteHabitAction(formData);
      handleResult(result, 'Hábito eliminado', () => setConfirmDeleteId(null));
    });
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
              ? 'No tienes hábitos registrados todavía. Empieza a seguir tus rutinas desde esta vista.'
              : 'Seguimiento de tus rutinas y progreso diario.'}
          </p>
        </div>

        {habits.length > 0 && activeCount > 0 ? (
          <div className="user-page-head-meta">
            <div className="user-chip">
              <strong>{activeCount} hábito{activeCount !== 1 ? 's' : ''} activo{activeCount !== 1 ? 's' : ''}</strong>
            </div>
          </div>
        ) : null}
      </div>

      <div aria-live="polite" className="user-lede">
        {message ? <p role={message.type === 'error' ? 'alert' : 'status'}>{message.text}</p> : null}
      </div>

      <article className="user-card user-card-stack user-raise">
        <div className="user-panel-head">
          <span className="user-eyebrow">Nuevo</span>
          <h2 className="user-title">Nuevo hábito</h2>
        </div>
        <form ref={createFormRef} action={onCreate} className="user-card-stack">
          <div className="user-card-stack" style={{ gap: 8 }}>
            <label className="user-label" htmlFor="habit-title">Título</label>
            <input
              className="user-input"
              id="habit-title"
              name="title"
              type="text"
              required
              maxLength={80}
              aria-label="Título del nuevo hábito"
            />
          </div>
          <div className="user-card-stack" style={{ gap: 8 }}>
            <label className="user-label" htmlFor="habit-description">Descripción (opcional)</label>
            <input
              className="user-input"
              id="habit-description"
              name="description"
              type="text"
              maxLength={500}
              aria-label="Descripción del nuevo hábito"
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
          <p>No hay hábitos disponibles.</p>
        </div>
      ) : (
        <div className="user-grid">
          {habits.map((habit) => (
            <article key={habit.id} className="user-card user-card-stack user-raise">
              <div className="user-panel-head">
                <span className="user-eyebrow">{habit.title}</span>
                <h2 className="user-title">{statusLabel(habit.status)}</h2>
              </div>

              {editingId === habit.id ? (
                <form action={onEditSave} className="user-card-stack">
                  <input type="hidden" name="habitId" value={habit.id} />
                  <div className="user-card-stack" style={{ gap: 8 }}>
                    <label className="user-label" htmlFor={`edit-title-${habit.id}`}>Título</label>
                    <input
                      className="user-input"
                      id={`edit-title-${habit.id}`}
                      name="title"
                      type="text"
                      required
                      maxLength={80}
                      defaultValue={habit.title}
                      aria-label={`Título de ${habit.title}`}
                    />
                  </div>
                  <div className="user-card-stack" style={{ gap: 8 }}>
                    <label className="user-label" htmlFor={`edit-desc-${habit.id}`}>Descripción</label>
                    <input
                      className="user-input"
                      id={`edit-desc-${habit.id}`}
                      name="description"
                      type="text"
                      maxLength={500}
                      defaultValue={habit.description ?? ''}
                      aria-label={`Descripción de ${habit.title}`}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button className="user-btn user-btn--primary" type="submit" disabled={isPending}>
                      Guardar
                    </button>
                    <button
                      className="user-btn user-btn--quiet"
                      type="button"
                      disabled={isPending}
                      onClick={() => setEditingId(null)}
                      aria-label={`Cancelar edición de ${habit.title}`}
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  {habit.description ? <p>{habit.description}</p> : null}
                  <div
                    className="user-bar"
                    role="progressbar"
                    aria-valuenow={habit.progress}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`Progreso de ${habit.title}`}
                  >
                    <div className="user-bar-fill" style={{ width: `${habit.progress}%` }} />
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button
                      className="user-btn user-btn--primary"
                      type="button"
                      disabled={isPending || habit.progress >= 100}
                      onClick={() => onProgress(habit.id)}
                      aria-label={`Registrar progreso de ${habit.title}${habit.progress >= 100 ? ' (completado)' : ''}`}
                    >
                      {habit.progress >= 100 ? 'Progreso completado' : 'Registrar progreso'}
                    </button>
                    <button
                      className="user-btn user-btn--quiet"
                      type="button"
                      disabled={isPending}
                      onClick={() => setEditingId(habit.id)}
                      aria-label={`Editar ${habit.title}`}
                    >
                      Editar
                    </button>
                    <button
                      className="user-btn user-btn--quiet"
                      type="button"
                      disabled={isPending}
                      onClick={() => onToggleStatus(habit)}
                      aria-label={`${habit.status === 'active' ? 'Completar' : 'Reactivar'} ${habit.title}`}
                    >
                      {habit.status === 'active' ? 'Completar' : 'Reactivar'}
                    </button>
                    {confirmDeleteId === habit.id ? (
                      <>
                        <button
                          className="user-btn user-btn--primary"
                          type="button"
                          disabled={isPending}
                          onClick={() => onDelete(habit.id)}
                          aria-label={`Confirmar eliminación de ${habit.title}`}
                        >
                          Confirmar eliminación
                        </button>
                        <button
                          className="user-btn user-btn--quiet"
                          type="button"
                          disabled={isPending}
                          onClick={() => setConfirmDeleteId(null)}
                          aria-label={`Cancelar eliminación de ${habit.title}`}
                        >
                          Cancelar
                        </button>
                      </>
                    ) : (
                      <button
                        className="user-btn user-btn--quiet"
                        type="button"
                        disabled={isPending}
                        onClick={() => setConfirmDeleteId(habit.id)}
                        aria-label={`Eliminar ${habit.title}`}
                      >
                        Eliminar
                      </button>
                    )}
                  </div>
                </>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
