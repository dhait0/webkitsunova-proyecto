'use client';

import { useState, useTransition } from 'react';
import { createHabitAction, deleteHabitAction, registerHabitProgressAction } from '@/app/(user)/dashboard/habitos/actions';

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

export default function HabitsPage({ data, error }: Props) {
  const { habits } = data;
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const handleCreate = (formData: FormData) => {
    setMessage(null);
    startTransition(async () => {
      const result = await createHabitAction(formData);
      if (result.success) {
        setMessage('Hábito creado');
      } else {
        setMessage(result.message || 'Error');
      }
    });
  };

  const handleProgress = (habitId: string) => {
    setMessage(null);
    const formData = new FormData();
    formData.append('habitId', habitId);
    formData.append('delta', '10');
    startTransition(async () => {
      const result = await registerHabitProgressAction(formData);
      if (!result.success && result.message) {
        setMessage(result.message);
      }
    });
  };

  const handleDelete = (habitId: string) => {
    setMessage(null);
    const formData = new FormData();
    formData.append('habitId', habitId);
    startTransition(async () => {
      const result = await deleteHabitAction(formData);
      if (!result.success && result.message) {
        setMessage(result.message);
      }
    });
  };

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
          <p className="user-lede">Seguimiento de tus rutinas y progreso diario.</p>
        </div>
        <div className="user-page-head-meta">
          <div className="user-chip">
            <strong>{habits.length} hábito{habits.length !== 1 ? 's' : ''}</strong>
          </div>
        </div>
      </div>

      <div className="user-card user-raise">
        <div className="user-panel-head">
          <span className="user-eyebrow">Nuevo hábito</span>
          <h2 className="user-title">Crear hábito</h2>
        </div>
        <form action={handleCreate} className="user-form">
          <label className="user-field">
            <span>Título</span>
            <input name="title" className="user-input" required maxLength={100} />
          </label>
          <label className="user-field">
            <span>Descripción (opcional)</span>
            <input name="description" className="user-input" maxLength={200} />
          </label>
          <button className="user-btn user-btn--primary" disabled={isPending} type="submit">
            {isPending ? 'Guardando...' : 'Crear hábito'}
          </button>
        </form>
        {message ? <p className="user-hint">{message}</p> : null}
      </div>

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
                <h2 className="user-title">{habit.status}</h2>
              </div>
              {habit.description && <p>{habit.description}</p>}
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
              <div className="user-actions">
                <button className="user-btn" disabled={isPending} onClick={() => handleProgress(habit.id)}>
                  Registrar +10%
                </button>
                <button className="user-btn user-btn--ghost" disabled={isPending} onClick={() => handleDelete(habit.id)}>
                  Eliminar
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
