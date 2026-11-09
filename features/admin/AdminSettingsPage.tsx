'use client';

import { useState, useTransition, type FormEvent } from 'react';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AdminToaster from '@/components/admin/AdminToaster';
import { getAdminPageHeading } from '@/components/admin/adminNav';
import { useToasts } from '@/hooks/useToasts';
import {
  changePasswordAction,
  updateProfileAction,
} from '@/app/(user)/dashboard/configuracion/actions';

type Props = {
  initialValues: {
    email: string;
    firstName: string | null;
    lastName: string | null;
    username: string | null;
  };
};

export default function AdminSettingsPage({ initialValues }: Props) {
  const toasts = useToasts();
  const { heading, subtitle } = getAdminPageHeading('/admin/settings');
  const [profilePending, startProfile] = useTransition();
  const [passwordPending, startPassword] = useTransition();
  const [profileError, setProfileError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  function onProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setProfileError(null);
    startProfile(async () => {
      const result = await updateProfileAction(formData);
      if (result.success) toasts.success(result.message);
      else setProfileError(result.message);
    });
  }

  function onPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    setPasswordError(null);
    startPassword(async () => {
      const result = await changePasswordAction(formData);
      if (result.success) {
        toasts.success(result.message);
        form.reset();
      } else {
        setPasswordError(result.message);
      }
    });
  }

  return (
    <div className="admin-page">
      <AdminPageHeader title={heading} subtitle={subtitle} />

      <div className="admin-settings-grid">
        <section className="admin-section admin-settings-card" aria-labelledby="admin-profile-title">
          <div className="admin-section-header">
            <h2 id="admin-profile-title">Datos personales</h2>
          </div>
          <form className="admin-form" onSubmit={onProfile}>
            <label className="field">
              <span>Correo electrónico</span>
              <input type="email" value={initialValues.email} readOnly aria-readonly="true" autoComplete="email" />
            </label>
            <label className="field">
              <span>Nombre</span>
              <input name="firstName" type="text" maxLength={60} defaultValue={initialValues.firstName ?? ''} autoComplete="given-name" />
            </label>
            <label className="field">
              <span>Apellido</span>
              <input name="lastName" type="text" maxLength={60} defaultValue={initialValues.lastName ?? ''} autoComplete="family-name" />
            </label>
            <label className="field">
              <span>Nombre de usuario</span>
              <input
                name="username"
                type="text"
                required
                minLength={3}
                maxLength={30}
                pattern="[a-zA-Z0-9._]+"
                defaultValue={initialValues.username ?? ''}
                autoComplete="username"
              />
            </label>
            {profileError ? <p role="alert" className="admin-form-error">{profileError}</p> : null}
            <div className="admin-modal-actions">
              <button type="submit" className="admin-btn admin-btn-primary" disabled={profilePending}>
                {profilePending ? 'Guardando…' : 'Guardar datos'}
              </button>
            </div>
          </form>
        </section>

        <section className="admin-section admin-settings-card" aria-labelledby="admin-password-title">
          <div className="admin-section-header">
            <h2 id="admin-password-title">Contraseña</h2>
          </div>
          <form className="admin-form" onSubmit={onPassword}>
            <input type="text" name="accountEmail" value={initialValues.email} autoComplete="username" readOnly hidden tabIndex={-1} aria-hidden="true" />
            <label className="field">
              <span>Contraseña actual</span>
              <input name="currentPassword" type="password" required autoComplete="current-password" />
            </label>
            <label className="field">
              <span>Nueva contraseña</span>
              <input name="newPassword" type="password" required minLength={8} autoComplete="new-password" />
            </label>
            <label className="field">
              <span>Confirmar nueva contraseña</span>
              <input name="confirmPassword" type="password" required minLength={8} autoComplete="new-password" />
            </label>
            {passwordError ? <p role="alert" className="admin-form-error">{passwordError}</p> : null}
            <div className="admin-modal-actions">
              <button type="submit" className="admin-btn admin-btn-primary" disabled={passwordPending}>
                {passwordPending ? 'Actualizando…' : 'Cambiar contraseña'}
              </button>
            </div>
          </form>
        </section>
      </div>

      <AdminToaster {...toasts} />
    </div>
  );
}
