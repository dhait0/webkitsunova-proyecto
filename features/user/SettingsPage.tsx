'use client';

import { useState, useTransition } from 'react';
import { changePasswordAction, updateProfileAction, type SettingsActionResult } from '@/app/(user)/dashboard/configuracion/actions';

type Props = {
  initialValues: {
    email: string;
    firstName: string | null;
    lastName: string | null;
    username: string | null;
  };
};

function FormMessage({ result }: { result: SettingsActionResult | null }) {
  if (!result) return null;
  return (
    <p className="user-lede" role={result.success ? 'status' : 'alert'} aria-live="polite">
      {result.message}
    </p>
  );
}

export default function SettingsPage({ initialValues }: Props) {
  const [profilePending, startProfile] = useTransition();
  const [passwordPending, startPassword] = useTransition();
  const [profileResult, setProfileResult] = useState<SettingsActionResult | null>(null);
  const [passwordResult, setPasswordResult] = useState<SettingsActionResult | null>(null);

  function onProfileSubmit(formData: FormData) {
    setProfileResult(null);
    startProfile(async () => {
      const result = await updateProfileAction(formData);
      setProfileResult(result);
    });
  }

  function onPasswordSubmit(formData: FormData) {
    setPasswordResult(null);
    startPassword(async () => {
      const result = await changePasswordAction(formData);
      setPasswordResult(result);
    });
  }

  return (
    <section className="user-page">
      <div className="user-page-head">
        <div className="user-page-head-copy">
          <span className="user-eyebrow">Configuración</span>
          <h2 className="user-headline">Tu cuenta</h2>
          <p className="user-lede">Actualiza tus datos de perfil y tu contraseña.</p>
        </div>
      </div>

      <div className="user-grid user-grid--duo">
        <article className="user-card user-card-stack user-raise">
          <div className="user-panel-head">
            <span className="user-eyebrow">Perfil</span>
            <h2 className="user-title">Datos personales</h2>
          </div>

          <form action={onProfileSubmit} className="user-card-stack">
            <div className="user-field">
              <label className="user-label" htmlFor="email">Correo electrónico</label>
              <input
                className="user-input"
                id="email"
                name="email"
                type="email"
                value={initialValues.email}
                readOnly
                aria-readonly="true"
                autoComplete="email"
              />
            </div>

            <div className="user-field">
              <label className="user-label" htmlFor="firstName">Nombre</label>
              <input
                className="user-input"
                id="firstName"
                name="firstName"
                type="text"
                maxLength={60}
                defaultValue={initialValues.firstName ?? ''}
                autoComplete="given-name"
              />
            </div>

            <div className="user-field">
              <label className="user-label" htmlFor="lastName">Apellido</label>
              <input
                className="user-input"
                id="lastName"
                name="lastName"
                type="text"
                maxLength={60}
                defaultValue={initialValues.lastName ?? ''}
                autoComplete="family-name"
              />
            </div>

            <div className="user-field">
              <label className="user-label" htmlFor="username">Nombre de usuario</label>
              <input
                className="user-input"
                id="username"
                name="username"
                type="text"
                required
                minLength={3}
                maxLength={30}
                pattern="[a-zA-Z0-9._]+"
                defaultValue={initialValues.username ?? ''}
                autoComplete="username"
              />
            </div>

            <FormMessage result={profileResult} />

            <div>
              <button className="user-btn user-btn--primary" type="submit" disabled={profilePending}>
                {profilePending ? 'Guardando…' : 'Guardar perfil'}
              </button>
            </div>
          </form>
        </article>

        <article className="user-card user-card-stack user-raise">
          <div className="user-panel-head">
            <span className="user-eyebrow">Seguridad</span>
            <h2 className="user-title">Cambiar contraseña</h2>
          </div>

          <form action={onPasswordSubmit} className="user-card-stack">
            {/* Lets password managers tie the new password to this account. */}
            <input
              type="text"
              name="accountEmail"
              value={initialValues.email}
              autoComplete="username"
              readOnly
              hidden
              tabIndex={-1}
              aria-hidden="true"
            />

            <div className="user-field">
              <label className="user-label" htmlFor="currentPassword">Contraseña actual</label>
              <input
                className="user-input"
                id="currentPassword"
                name="currentPassword"
                type="password"
                required
                autoComplete="current-password"
              />
            </div>

            <div className="user-field">
              <label className="user-label" htmlFor="newPassword">Nueva contraseña</label>
              <input
                className="user-input"
                id="newPassword"
                name="newPassword"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
              />
            </div>

            <div className="user-field">
              <label className="user-label" htmlFor="confirmPassword">Confirmar nueva contraseña</label>
              <input
                className="user-input"
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
              />
            </div>

            <FormMessage result={passwordResult} />

            <div>
              <button className="user-btn user-btn--primary" type="submit" disabled={passwordPending}>
                {passwordPending ? 'Actualizando…' : 'Cambiar contraseña'}
              </button>
            </div>
          </form>
        </article>
      </div>
    </section>
  );
}
