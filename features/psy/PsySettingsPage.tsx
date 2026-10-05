'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { getProfileAction, updateProfileAction, updateAvailabilityAction } from '@/app/(psychologist)/psy/perfil/actions';
import { useAsync } from '@/hooks/useAsync';
import { ErrorBlock, LoadingBlock, Panel, PsyBadge, SuccessBlock } from '@/components/psy/PsyUi';
import { psyWeekdayLabels } from '@/content/siteContent';
import type { PsyProfile, PsyAvailabilitySlot } from '@/lib/api';

type ProfileResponse = {
  profile: PsyProfile;
  availability: PsyAvailabilitySlot[];
  specialtyCatalog: Array<{ value: string; label: string }>;
};

type Props = {
  initialData: ProfileResponse;
};

const weekdays = [1, 2, 3, 4, 5, 6, 7];

function PsySettingsPage({ initialData }: Props) {
  const { data, loading, error, reload } = useAsync(() => getProfileAction(), []);
  const [form, setForm] = useState<Record<string, string> | null>(null);
  const [specialties, setSpecialties] = useState<string[] | null>(null);
  const [customSpecialty, setCustomSpecialty] = useState('');
  const [availability, setAvailability] = useState<PsyAvailabilitySlot[] | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingAvailability, setSavingAvailability] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const profileData = data ?? initialData;

  const currentForm = form ?? {
    firstName: profileData.profile.firstName ?? '',
    lastName: profileData.profile.lastName ?? '',
    phone: profileData.profile.phone ?? '',
    country: profileData.profile.country ?? '',
    birthDate: profileData.profile.birthDate ? profileData.profile.birthDate.slice(0, 10) : '',
    bio: profileData.profile.bio ?? '',
    sessionPrice: profileData.profile.sessionPrice === null ? '' : String(profileData.profile.sessionPrice ?? '')
  };

  const currentSpecialties = specialties ?? profileData.profile.specialties ?? [];
  const currentAvailability = availability ?? profileData.availability ?? [];

  const catalog = profileData.specialtyCatalog ?? [];

  async function handleProfileSubmit(event: FormEvent) {
    event.preventDefault();
    setSavingProfile(true);
    setFormError(null);
    setMessage(null);

    try {
      await updateProfileAction({
        firstName: currentForm.firstName?.trim() || undefined,
        lastName: currentForm.lastName?.trim() || undefined,
        phone: currentForm.phone?.trim() || null,
        country: currentForm.country?.trim() || null,
        birthDate: currentForm.birthDate ? new Date(currentForm.birthDate) : null,
        bio: currentForm.bio?.trim() || null,
        specialties: currentSpecialties,
        sessionPrice: currentForm.sessionPrice ? Number(currentForm.sessionPrice) : null
      });
      setMessage('Perfil actualizado');
      await reload();
    } catch (caught) {
      setFormError(caught instanceof Error ? caught.message : 'No se pudo guardar el perfil');
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleAvailabilitySubmit(event: FormEvent) {
    event.preventDefault();
    setSavingAvailability(true);
    setFormError(null);
    setMessage(null);

    try {
      await updateAvailabilityAction(
        currentAvailability.map((slot) => ({
          weekday: slot.weekday,
          start: slot.start,
          end: slot.end,
          enabled: Boolean(slot.id)
        }))
      );
      setAvailability(null);
      setMessage('Horarios actualizados');
      await reload();
    } catch (caught) {
      setFormError(caught instanceof Error ? caught.message : 'No se pudieron guardar los horarios');
    } finally {
      setSavingAvailability(false);
    }
  }

  function toggleSpecialty(value: string) {
    setSpecialties(
      currentSpecialties.includes(value)
        ? currentSpecialties.filter((item) => item !== value)
        : [...currentSpecialties, value]
    );
  }

  function toggleWeekday(weekday: number) {
    setAvailability(
      currentAvailability.some((slot) => slot.weekday === weekday)
        ? currentAvailability.filter((slot) => slot.weekday !== weekday)
        : [
            ...currentAvailability,
            { weekday, start: '09:00', end: '17:00' }
          ].sort((a, b) => a.weekday - b.weekday)
    );
  }

  function updateSlot(weekday: number, field: 'start' | 'end', value: string) {
    setAvailability(
      currentAvailability.map((slot) => (slot.weekday === weekday ? { ...slot, [field]: value } : slot))
    );
  }

  if (loading && !data) return <LoadingBlock label="Cargando configuración..." />;
  if (error && !data) return <ErrorBlock message={error} />;

  return (
    <>
      {formError ? <ErrorBlock message={formError} /> : null}
      {message ? <SuccessBlock message={message} /> : null}

      <Panel eyebrow="Cuenta" title="Información profesional">
        <p>
          Gestiona tu información de acceso y tu presentación profesional.
        </p>

        <form className="psy-form" onSubmit={handleProfileSubmit}>
          <div className="form-grid">
            <label className="field">
              <span>Nombre</span>
              <input
                type="text"
                value={currentForm.firstName ?? ''}
                onChange={(event) => setForm({ ...currentForm, firstName: event.target.value })}
              />
            </label>

            <label className="field">
              <span>Apellido</span>
              <input
                type="text"
                value={currentForm.lastName ?? ''}
                onChange={(event) => setForm({ ...currentForm, lastName: event.target.value })}
              />
            </label>

            <label className="field">
              <span>Teléfono</span>
              <input
                type="tel"
                value={currentForm.phone ?? ''}
                onChange={(event) => setForm({ ...currentForm, phone: event.target.value })}
              />
            </label>

            <label className="field">
              <span>País</span>
              <input
                type="text"
                value={currentForm.country ?? ''}
                onChange={(event) => setForm({ ...currentForm, country: event.target.value })}
              />
            </label>

            <label className="field">
              <span>Fecha de nacimiento</span>
              <input
                type="date"
                value={currentForm.birthDate ?? ''}
                onChange={(event) => setForm({ ...currentForm, birthDate: event.target.value })}
              />
            </label>

            <label className="field">
              <span>Tarifa por sesión ({profileData.profile.currency})</span>
              <input
                type="number"
                min={0}
                value={currentForm.sessionPrice ?? ''}
                onChange={(event) => setForm({ ...currentForm, sessionPrice: event.target.value })}
              />
            </label>
          </div>

          <label className="field">
            <span>Biografía profesional</span>
            <textarea
              value={currentForm.bio ?? ''}
              maxLength={500}
              rows={4}
              onChange={(event) => setForm({ ...currentForm, bio: event.target.value })}
              placeholder="Describe tu enfoque y experiencia..."
              />
            <small>{(currentForm.bio ?? '').length}/500</small>
          </label>

          <fieldset className="psy-checkbox-group">
            <legend>Especialidades</legend>
            {catalog.map((entry) => (
              <label key={entry.value}>
                <input
                  type="checkbox"
                  checked={currentSpecialties.includes(entry.value)}
                  onChange={() => toggleSpecialty(entry.value)}
                />
                {entry.label}
              </label>
            ))}
          </fieldset>

          <div className="psy-inline-form">
            <label className="field">
              <span>¿No está tu especialidad? Agrégala:</span>
              <input
                type="text"
                value={customSpecialty}
                placeholder="Ej: Terapia de pareja"
                onChange={(event) => setCustomSpecialty(event.target.value)}
              />
            </label>
            <button
              type="button"
              className="secondary-btn"
              onClick={() => {
                const value = customSpecialty.trim();
                if (value && !currentSpecialties.includes(value)) {
                  setSpecialties([...currentSpecialties, value]);
                }
                setCustomSpecialty('');
              }}
            >
              Agregar
            </button>
          </div>

          <label className="psy-switch">
            <input
              type="checkbox"
              checked={profileData.profile.isAcceptingNew}
              onChange={(event) =>
                void updateProfileAction({ isAcceptingNew: event.target.checked })
              }
            />
            Disponible para nuevas citas
          </label>

          <button type="submit" className="primary-btn" disabled={savingProfile}>
            {savingProfile ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </form>
      </Panel>

      <Panel eyebrow="Agenda" title="Horarios de atención">
        <p>Activa los días y ajusta tu horario de atención.</p>

        <form className="psy-form" onSubmit={handleAvailabilitySubmit}>
          <ul className="psy-availability-list">
            {weekdays.map((weekday) => {
              const slot = currentAvailability.find((item) => item.weekday === weekday);

              return (
                <li key={weekday}>
                  <label className="psy-switch">
                    <input
                      type="checkbox"
                      checked={Boolean(slot)}
                      onChange={() => toggleWeekday(weekday)}
                    />
                    {psyWeekdayLabels[weekday]}
                  </label>

                  {slot ? (
                    <div className="psy-inline-form">
                      <input
                        type="time"
                        value={slot.start}
                        onChange={(event) => updateSlot(weekday, 'start', event.target.value)}
                        aria-label={`Hora de inicio del ${psyWeekdayLabels[weekday]}`}
                      />
                      <span>a</span>
                      <input
                        type="time"
                        value={slot.end}
                        onChange={(event) => updateSlot(weekday, 'end', event.target.value)}
                        aria-label={`Hora de fin del ${psyWeekdayLabels[weekday]}`}
                      />
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>

          <button type="submit" className="primary-btn" disabled={savingAvailability}>
            {savingAvailability ? 'Guardando...' : 'Guardar horarios'}
          </button>
        </form>
      </Panel>

      <Panel eyebrow="Cuenta" title="Seguridad">
        <ul className="psy-list">
          <li>
            <span>Cambiar contraseña</span>
            <Link href="/mfa/settings" className="psy-table-link">
              Administrar seguridad
            </Link>
          </li>
          <li>
            <span>Correo electrónico</span>
            <strong>{profileData.profile.email}</strong>
          </li>
          <li>
            <span>Estado de la cuenta</span>
            <PsyBadge
              status={profileData.profile.isApproved ? 'ACTIVE' : 'PENDING'}
              label={profileData.profile.isApproved ? 'Aprobado' : 'Pendiente de aprobación'}
            />
          </li>
        </ul>
      </Panel>
    </>
  );
}

export default PsySettingsPage;
