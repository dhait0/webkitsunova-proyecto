import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { createPsyResource, getPsyResources, type PsyResource } from '@/lib/api';
import { useAsync } from '@/hooks/useAsync';
import { EmptyState, ErrorBlock, LoadingBlock, Panel, StatCard, PsyBadge } from '@/components/psy/PsyUi';
import { formatShortDate } from '@/utils/format';
import { psyContentStatusLabels, psyFocusAreaLabels, psyResourceTypeLabels } from '@/content/siteContent';

const typeOptions = Object.entries(psyResourceTypeLabels);
const focusAreaOptions = Object.entries(psyFocusAreaLabels);

const emptyForm = {
  type: 'ARTICLE',
  title: '',
  description: '',
  readingMins: '',
  focusArea: '',
  fileUrl: ''
};

function PsyResourcesPage() {
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const { data, loading, error, reload } = useAsync<{
    resources: PsyResource[];
    stats: { total: number; articles: number; pdfs: number; videos: number };
  }>(() => getPsyResources({ search: appliedSearch, type: typeFilter, limit: 50 }), [appliedSearch, typeFilter]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setFormError(null);

    try {
      await createPsyResource({
        type: form.type,
        title: form.title.trim(),
        description: form.description.trim(),
        readingMins: form.readingMins ? Number(form.readingMins) : null,
        focusArea: form.focusArea || null,
        fileUrl: form.fileUrl.trim() || null
      });
      setForm(emptyForm);
      setShowForm(false);
      await reload();
    } catch (caught) {
      setFormError(caught instanceof Error ? caught.message : 'No se pudo crear el recurso');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Panel eyebrow="Gestión" title="Gestión de Recursos">
      <p className="psy-hint">
        Crea y publica artículos, PDFs, ejercicios y videos para tus pacientes. Se crean en estado
        pendiente y solo son visibles después de la aprobación del administrador.
      </p>

      <div className="psy-stats-grid">
        <StatCard label="Total recursos" value={data?.stats.total ?? 0} />
        <StatCard label="Artículos" value={data?.stats.articles ?? 0} />
        <StatCard label="PDFs" value={data?.stats.pdfs ?? 0} />
        <StatCard label="Videos" value={data?.stats.videos ?? 0} />
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
          placeholder="Buscar recursos por título..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          aria-label="Buscar recursos"
        />

        <select
          value={typeFilter}
          onChange={(event) => setTypeFilter(event.target.value)}
          aria-label="Filtrar por tipo"
        >
          <option value="">Todos</option>
          {typeOptions.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>

        <button type="submit" className="primary-btn">
          Buscar
        </button>

        <button type="button" className="secondary-btn" onClick={() => setShowForm((prev) => !prev)}>
          {showForm ? 'Ocultar formulario' : 'Crear recurso'}
        </button>
      </form>

      {showForm ? (
        <form className="psy-form" onSubmit={handleSubmit}>
          {formError ? <ErrorBlock message={formError} /> : null}

          <fieldset className="psy-radio-group">
            <legend>Tipo de recurso</legend>
            {typeOptions.map(([value, label]) => (
              <label key={value}>
                <input
                  type="radio"
                  name="resource-type"
                  value={value}
                  checked={form.type === value}
                  onChange={() => setForm({ ...form, type: value })}
                />
                {label}
              </label>
            ))}
          </fieldset>

          <label className="field">
            <span>Título del recurso</span>
            <input
              type="text"
              value={form.title}
              onChange={(event) => setForm({ ...form, title: event.target.value })}
              placeholder="Ej: Guía para manejar la ansiedad"
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
              placeholder="Describe brevemente el contenido de este recurso..."
              rows={4}
              required
              minLength={10}
              maxLength={4000}
            />
          </label>

          <label className="field">
            <span>Área de enfoque</span>
            <select
              value={form.focusArea}
              onChange={(event) => setForm({ ...form, focusArea: event.target.value })}
              >
            <option value="">Sin área definida</option>
            {focusAreaOptions.map(([value, label]) => (
            <option key={value} value={value}>
            {label}
            </option>
            ))}
            </select>
          </label>

          <label className="field">
            <span>Tiempo de lectura (minutos)</span>
            <input
              type="number"
              min={1}
              max={6000}
              value={form.readingMins}
              onChange={(event) => setForm({ ...form, readingMins: event.target.value })}
            />
          </label>

          {form.type !== 'ARTICLE' ? (
            <label className="field">
              <span>URL del archivo</span>
              <input
                type="url"
                value={form.fileUrl}
                onChange={(event) => setForm({ ...form, fileUrl: event.target.value })}
                placeholder="https://..."
              />
            </label>
          ) : null}

          <button type="submit" className="primary-btn" disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar recurso'}
          </button>
        </form>
      ) : null}

      {loading ? <LoadingBlock label="Cargando recursos..." /> : null}
      {error ? <ErrorBlock message={error} /> : null}

      {!loading && !error && (data?.resources.length ?? 0) === 0 ? (
        <EmptyState
          title="No hay recursos creados"
          text="Haz clic en 'Crear recurso' para publicar tu primer recurso."
        />
      ) : null}

      {data && data.resources.length > 0 ? (
        <div className="psy-card-grid">
          {data.resources.map((resource) => (
            <article key={resource.id} className="psy-content-card">
              <PsyBadge
                status={resource.status}
                label={psyContentStatusLabels[resource.status] ?? resource.status}
              />
              <span className="psy-tag">
                {psyResourceTypeLabels[resource.type] ?? resource.type}
              </span>
              <h3>{resource.title}</h3>
              <p>{resource.description}</p>
              <dl className="psy-meta">
                {resource.readingMins ? (
                  <div>
                    <dt>Tiempo</dt>
                    <dd>{resource.readingMins} min de lectura</dd>
                  </div>
                ) : null}
                <div>
                  <dt>Área</dt>
                  <dd>
                    {resource.focusArea
                      ? (psyFocusAreaLabels[resource.focusArea] ?? resource.focusArea)
                      : 'Sin área'}
                  </dd>
                </div>
                <div>
                  <dt>Publicado</dt>
                  <dd>{formatShortDate(resource.createdAt)}</dd>
                </div>
              </dl>
              <Link to={`/psy/recursos/${resource.id}`} className="secondary-btn">
                Ver detalles
              </Link>
            </article>
          ))}
        </div>
      ) : null}
    </Panel>
  );
}

export default PsyResourcesPage;
