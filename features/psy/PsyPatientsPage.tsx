'use client';

import { useState } from 'react';
import Link from 'next/link';
import { getPatientsAction } from '@/app/(psychologist)/psy/pacientes/actions';
import { useAsync } from '@/hooks/useAsync';
import { EmptyState, ErrorBlock, LoadingBlock, Panel, PsyBadge } from '@/components/psy/PsyUi';
import { formatRelative, moodLabels } from '@/lib/utils/format';
import type { PsyPatientSummary } from '@/lib/api';

const linkStatusLabels: Record<string, string> = {
  ACTIVE: 'Activo',
  PAUSED: 'En pausa',
  ENDED: 'Finalizado'
};

type Props = {
  initialData: { patients: PsyPatientSummary[] };
};

function PsyPatientsPage({ initialData }: Props) {
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [status, setStatus] = useState('');

  const { data, loading, error, reload } = useAsync<{ patients: PsyPatientSummary[] }>(
    () => getPatientsAction({ search: appliedSearch, status, limit: 50 }),
    [appliedSearch, status]
  );

  return (
    <>
      <Panel eyebrow="Vínculos" title="Mis pacientes">
        <form
          className="psy-filters"
          onSubmit={(event) => {
            event.preventDefault();
            setAppliedSearch(search.trim());
          }}
        >
          <input
            type="search"
            placeholder="Buscar por nombre o correo..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label="Buscar pacientes"
          />

          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            aria-label="Filtrar por estado del vínculo"
          >
            <option value="">Todos los vínculos</option>
            <option value="ACTIVE">Activos</option>
            <option value="PAUSED">En pausa</option>
            <option value="ENDED">Finalizados</option>
          </select>

          <button type="submit" className="primary-btn">
            Buscar
          </button>
        </form>

        {loading && !data ? <LoadingBlock label="Cargando pacientes..." /> : null}
        {error ? <ErrorBlock message={error} /> : null}

        {!loading && !error && (data?.patients.length ?? 0) === 0 ? (
          <EmptyState
            title="Aún no tienes pacientes activos"
            text="El vínculo se crea al confirmar la primera sesión de un paciente."
          />
        ) : null}

        {data && data.patients.length > 0 ? (
          <div className="psy-table-wrapper">
            <table className="psy-table">
              <thead>
                <tr>
                  <th>Paciente</th>
                  <th>Vínculo</th>
                  <th>Estado emocional</th>
                  <th>Última sesión</th>
                  <th>Próxima sesión</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {data.patients.map((patient) => (
                  <tr key={patient.userId}>
                    <td>
                      <strong>{patient.name}</strong>
                      <br />
                      <small>{patient.email}</small>
                    </td>
                    <td>
                      <PsyBadge
                        status={patient.status ?? 'ACTIVE'}
                        label={linkStatusLabels[patient.status ?? 'ACTIVE'] ?? patient.status ?? ''}
                      />
                    </td>
                    <td>
                      <PsyBadge
                        status={patient.mood}
                        label={moodLabels[patient.mood] ?? patient.mood}
                      />
                    </td>
                    <td>{formatRelative(patient.lastSessionAt)}</td>
                    <td>{formatRelative(patient.nextSessionAt)}</td>
                    <td>
                      <Link href={`/psy/pacientes/${patient.userId}`} className="psy-table-link">
                        Ver perfil
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </Panel>

      <div className="psy-panel-actions">
        <button type="button" className="secondary-btn" onClick={() => void reload()}>
          Actualizar
        </button>
      </div>
    </>
  );
}

export default PsyPatientsPage;
