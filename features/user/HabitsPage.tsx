'use client';

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

  if (habits.length === 0) {
    return (
      <section className="user-page">
        <div className="user-page-head">
          <div className="user-page-head-copy">
            <span className="user-eyebrow">Hábitos</span>
            <h2 className="user-headline">Tus hábitos</h2>
            <p className="user-lede">
              No tienes hábitos registrados todavía. Empieza a seguir tus rutinas
              desde esta vista.
            </p>
          </div>
        </div>
        <div className="user-card user-raise">
          <p>No hay hábitos disponibles.</p>
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
            Seguimiento de tus rutinas y progreso diario.
          </p>
        </div>

        <div className="user-page-head-meta">
          <div className="user-chip">
            <strong>{habits.length} hábito{habits.length !== 1 ? 's' : ''} activo{habits.length !== 1 ? 's' : ''}</strong>
          </div>
        </div>
      </div>

      <div className="user-grid">
        {habits.map((habit) => (
          <article key={habit.id} className="user-card user-card-stack user-raise">
            <div className="user-panel-head">
              <span className="user-eyebrow">{habit.title}</span>
              <h2 className="user-title">{habit.status}</h2>
            </div>
            {habit.description && (
              <p>{habit.description}</p>
            )}
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
          </article>
        ))}
      </div>
    </section>
  );
}
