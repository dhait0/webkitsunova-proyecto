import { Link, useParams } from 'react-router-dom';
import { getPsyResource, type PsyResource } from '@/lib/api';
import { useAsync } from '@/hooks/useAsync';
import { ErrorBlock, LoadingBlock, Panel, PsyBadge } from '@/components/psy/PsyUi';
import { formatShortDate } from '@/utils/format';
import { psyContentStatusLabels, psyFocusAreaLabels, psyResourceTypeLabels } from '@/content/siteContent';

function PsyResourceDetailPage() {
  const { id = '' } = useParams();
  const { data, loading, error } = useAsync<{ resource: PsyResource }>(() => getPsyResource(id), [id]);

  if (loading) return <LoadingBlock label="Cargando recurso..." />;
  if (error) return <ErrorBlock message={error} />;
  if (!data) return <ErrorBlock message="Recurso no encontrado" />;

  const { resource } = data;

  return (
    <Panel eyebrow="Recurso" title={resource.title}>
      <PsyBadge
        status={resource.status}
        label={psyContentStatusLabels[resource.status] ?? resource.status}
      />

      {resource.status === 'REJECTED' && resource.rejectReason ? (
        <ErrorBlock message={`Motivo del rechazo: ${resource.rejectReason}`} />
      ) : null}

      <p>{resource.description}</p>

      <dl className="psy-detail-list">
        <div>
          <dt>Tipo</dt>
          <dd>{psyResourceTypeLabels[resource.type] ?? resource.type}</dd>
        </div>
        <div>
          <dt>Área</dt>
          <dd>
            {resource.focusArea
              ? (psyFocusAreaLabels[resource.focusArea] ?? resource.focusArea)
              : 'Sin área definida'}
          </dd>
        </div>
        <div>
          <dt>Tiempo de lectura</dt>
          <dd>{resource.readingMins ? `${resource.readingMins} minutos` : 'No aplica'}</dd>
        </div>
        <div>
          <dt>Autor</dt>
          <dd>{resource.authorName}</dd>
        </div>
        <div>
          <dt>Creado</dt>
          <dd>{formatShortDate(resource.createdAt)}</dd>
        </div>
        {resource.fileUrl ? (
          <div>
            <dt>Archivo</dt>
            <dd>
              <a href={resource.fileUrl} target="_blank" rel="noreferrer" className="psy-table-link">
                {resource.fileName ?? 'Abrir archivo'}
              </a>
            </dd>
          </div>
        ) : null}
      </dl>

      <div className="psy-panel-actions">
        <Link to="/psy/recursos" className="secondary-btn">
          Volver a recursos
        </Link>
      </div>
    </Panel>
  );
}

export default PsyResourceDetailPage;
