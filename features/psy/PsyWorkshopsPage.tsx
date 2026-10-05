'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { getWorkshopsAction, createWorkshopAction } from '@/app/(psychologist)/psy/talleres/actions';
import { useAsync } from '@/hooks/useAsync';
import { EmptyState, ErrorBlock, LoadingBlock, Panel, StatCard, PsyBadge } from '@/components/psy/PsyUi';
import { formatDateTime, formatMoney } from '@/lib/utils/format';
import { psyContentStatusLabels, psyFocusAreaLabels } from '@/content/siteContent';
import type { PsyWorkshop } from '@/lib/api';

const focusAreaOptions = Object.entries(psyFocusAreaLabels);

const emptyForm = {
  title: '',
  description: '',
  focusArea: 'ANXIETY' as const,
  startsAt: '',
  durationHours: '2',
  capacity: '30',
  price: '0'
};

type Props = {
  initialData: {
    workshops: PsyWorkshop[];
    stats: { total: number; enrollments: number; occupancyRate: number; upcoming: number };
  };
};

function PsyWorkshopsPage({ initialData }: Props) {
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [focusArea, setFocusArea] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const { data, loading, error, reload } = useAsync(
    () => getWorkshopsAction({ search: appliedSearch, focusArea, limit: 50 }),
    [appliedSearch, focusArea]
  );

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setFormError(null);

    try {
      await createWorkshopAction({
        title: form.title.trim(),
        description: form.description.trim(),
        focusArea: form.focusArea,
        startsAt: new Date(form.startsAt),
        durationHours: Number(form.durationHours),
        capacity: Number(form.capacity),
        priceCents: Number(form.price)
      });
      setForm(emptyForm);
      setShowForm(false);
      await reload();
    } catch (caught) {
      setFormError(caught instanceof Error ? caught.message : 'No se pudo crear el taller');
    } finally {
      setSaving(false);
    }
  }

  const workshops = data ?? initialData;

  return (
    <>
      <Panel eyebrow="Gestión" title="Gestión de Talleres">
        <p className="psy-hint">
          Crea, gestiona y monitorea tus talleres terapéuticos. Se crean en estado pendiente y
          solo son visibles para los usuarios después de la aprobación del administrador.
        </p>

        <div className="psy-stats-grid">
          <StatCard label="Total talleres" value={workshops?.stats.total ?? 0} />
          <StatCard label="Inscripciones totales" value={workshops?.stats.enrollments ?? 0} />
          <StatCard label="Tasa de ocupación" value={`${workshops?.stats.occupancyRate ?? 0}%`} />
          <StatCard label="Próximos talleres" value={workshops?.stats.upcoming ?? 0} />
        </div>

        <form
          className="psy-filters"
          onSubmit={(event) => {
            event.preventDefault();
            setAppliedSearch(search.trim());
          }}
        >
          <input
            type="search"
            placeholder="Buscar talleres por título..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label="Buscar talleres"
          />

          <select
            value={focusArea}
            onChange={(event) => setFocusArea(event.target.value)}
            aria-label="Filtrar por área de enfoque"
          >
            <option value="">Todas las áreas</option>
            {focusAreaOptions.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>

          <button type="submit" className="primary-btn">
            Buscar
          </button>

          <button
            type="button"
            className="secondary-btn"
            onClick={() => setShowForm((prev) => !prev)}
          >
            {showForm ? 'Ocultar formulario' : 'Crear taller'}
          </button>
        </form>

        {showForm ? (
          <form className="psy-form" onSubmit={handleSubmit}>
            {formError ? <ErrorBlock message={formError} /> : null}

            <label className="field">
              <span>Título del taller</span>
              <input
                type="text"
                value={form.title}
                onChange={(event) => setForm({ ...form, title: event.target.value })}
                placeholder="Ej: Manejo de la ansiedad"
                required
                minLength={3}
                maxLength={140}
              />
            </label>

            <label className="field">
              <span>Descripción</span>
              <textarea
                value={form.description}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
                placeholder="Describe el contenido del taller..."
                rows={4}
                required
                minLength={10}
                maxLength={4000}
              />
            </label>

            <label className="field">
              <span>Fecha y hora</span>
              <input
                type="datetime-local"
                value={form.startsAt}
                onChange={(event) => setForm({ ...form, startsAt: event.target.value })}
                required
              />
            </label>

            <label className="field">
              <span>Duración (horas)</span>
              <input
                type="number"
                min={0.5}
                max={24}
                step={0.5}
                value={form.durationHours}
                onChange={(event) => setForm({ ...form, durationHours: event.target.value })}
                required
              />
            </label>

            <label className="field">
              <span>Cupos máximos</span>
              <input
                type="number"
                min={1}
                max={1000}
                value={form.capacity}
                onChange={(event) => setForm({ ...form, capacity: event.target.value })}
                required
              />
            </label>

            <label className="field">
              <span>Precio (0 para gratis)</span>
              <input
                type="number"
                min={0}
                value={form.price}
                onChange={(event) => setForm({ ...form, price: event.target.value })}
                required
              />
            </label>

            <label className="field">
              <span>Área de enfoque</span>
              <select
                value={form.focusArea}
                onChange={(event) => setForm({ ...form, focusArea: event.target.value as typeof emptyForm.focusArea })}
              >
                {focusAreaOptions.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <button type="submit" className="primary-btn" disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar taller'}
            </button>
          </form>
        ) : null}

        {loading && !data ? <LoadingBlock label="Cargando talleres..." /> : null}
        {error ? <ErrorBlock message={error} /> : null}

        {!loading && !error && (workshops?.workshops.length ?? 0) === 0 ? (
          <EmptyState
            title="No hay talleres creados"
            text="Haz clic en 'Crear taller' para comenzar."
          />
        ) : null}

        {workshops && workshops.workshops.length > 0 ? (
          <div className="psy-card-grid">
            {workshops.workshops.map((workshop) => (
              <article key={workshop.id} className="psy-content-card">
                <PsyBadge
                  status={workshop.status}
                  label={psyContentStatusLabels[workshop.status] ?? workshop.status}
                />
                <h3>{workshop.title}</h3>
                <p>{workshop.description}</p>
                <dl className="psy-meta">
                  <div>
                    <dt>Fecha</dt>
                    <dd>{formatDateTime(workshop.startsAt)}</dd>
                  </div>
                  <div>
                    <dt>Duración</dt>
                    <dd>{workshop.durationHours} horas</dd>
                  </div>
                  <div>
                    <dt>Área</dt>
                    <dd>{psyFocusAreaLabels[workshop.focusArea] ?? workshop.focusArea}</dd>
                  </div>
                  <div>
                    <dt>Precio</dt>
                    <dd>
                      {workshop.priceCents === 0
                        ? 'Gratis'
                        : formatMoney(workshop.priceCents, workshop.currency)}
                    </dd>
                  </div>
                  <div>
                    <dt>Inscripciones</dt>
                    <dd>
                      {workshop.enrolled}/{workshop.capacity} cupos
                    </dd>
                  </div>
                </dl>
                <Link href={`/psy/talleres/${workshop.id}`} className="secondary-btn">
                  Ver detalles
                </Link>
              </article>
            ))}
          </div>
        ) : null}
      </Panel>
    </>
  );
}

export default PsyWorkshopsPage;
