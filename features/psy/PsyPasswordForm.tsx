'use client';

import { useState, useTransition, type FormEvent } from 'react';
import { changePasswordAction } from '@/app/(user)/dashboard/configuracion/actions';

export default function PsyPasswordForm() {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    setResult(null);
    startTransition(async () => {
      const outcome = await changePasswordAction(formData);
      setResult(outcome);
      if (outcome.success) form.reset();
    });
  }

  return (
    <form className="psy-form" onSubmit={onSubmit} aria-label="Cambiar contraseña">
      <input type="text" name="accountEmail" autoComplete="username" hidden readOnly tabIndex={-1} aria-hidden="true" />
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
      {result ? (
        <p role={result.success ? 'status' : 'alert'} className={result.success ? 'psy-success' : 'psy-error'}>
          {result.message}
        </p>
      ) : null}
      <button type="submit" className="primary-btn" disabled={isPending}>
        {isPending ? 'Actualizando…' : 'Cambiar contraseña'}
      </button>
    </form>
  );
}
