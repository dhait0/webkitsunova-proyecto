import { requireRole } from '@/lib/auth/guard';
import { getProfessionalProfile } from '@/services/psy/profile.service';
import Link from 'next/link';
import { Panel, PsyBadge, StatCard } from '@/components/psy/PsyUi';
import { formatDate, formatMoney } from '@/lib/utils/format';
import { psyWeekdayLabels } from '@/content/siteContent';

export default async function PsyPublicProfile() {
  const session = await requireRole('PSYCHOLOGIST');
  const data = await getProfessionalProfile(session.id);
  const { profile, availability } = data;

  return (
    <>
      <Panel eyebrow="Perfil" title="Mi perfil profesional">
        <PsyBadge
          status={profile.isApproved ? 'ACTIVE' : 'PENDING'}
          label={profile.isApproved ? 'Perfil visible en el directorio' : 'Pendiente de aprobación'}
        />

        <dl className="psy-detail-list">
          <div>
            <dt>Nombre completo</dt>
            <dd>{profile.name}</dd>
          </div>
          <div>
            <dt>Correo electrónico</dt>
            <dd>{profile.email}</dd>
          </div>
          <div>
            <dt>Ubicación</dt>
            <dd>{profile.country ?? 'Sin definir'}</dd>
          </div>
          <div>
            <dt>Fecha de nacimiento</dt>
            <dd>{profile.birthDate ? formatDate(profile.birthDate) : 'Sin definir'}</dd>
          </div>
          <div>
            <dt>Especialidades</dt>
            <dd>{profile.specialties.length ? profile.specialties.join(', ') : 'Sin definir'}</dd>
          </div>
          <div>
            <dt>Tarifa por sesión</dt>
            <dd>
              {profile.sessionPrice === null
                ? 'Sin definir'
                : formatMoney(profile.sessionPrice, profile.currency)}
            </dd>
          </div>
        </dl>

        {profile.bio ? <p className="psy-bio">{profile.bio}</p> : null}

        <div className="psy-stats-grid">
          <StatCard label="Pacientes" value={profile.patientsCount} />
          <StatCard
            label="Valoración"
            value={profile.reviewsCount ? `${profile.rating.toFixed(1)} / 5` : 'Sin valoraciones'}
          />
          <StatCard label="Reseñas" value={profile.reviewsCount} />
        </div>
      </Panel>

      <Panel eyebrow="Agenda" title="Horarios de atención">
        {availability.length === 0 ? (
          <p className="psy-hint">
            Aún no has configurado tus horarios. Agrégalos en Configuración para que los usuarios
            puedan solicitar citas.
          </p>
        ) : (
          <ul className="psy-list">
            {availability.map((slot) => (
              <li key={slot.weekday}>
                <span>{psyWeekdayLabels[slot.weekday] ?? slot.weekdayLabel}</span>
                <strong>
                  {slot.start} — {slot.end}
                </strong>
              </li>
            ))}
          </ul>
        )}

        <div className="psy-panel-actions">
          <Link href="/psy/configuracion" className="primary-btn">
            Editar horarios
          </Link>
        </div>
      </Panel>
    </>
  );
}
