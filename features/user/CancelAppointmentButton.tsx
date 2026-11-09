'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { cancelMyAppointmentAction } from '@/app/(user)/dashboard/citas/actions';

type Props = {
  appointmentId: string;
  psychologistName: string;
  pending: boolean;
};

export default function CancelAppointmentButton({ appointmentId, psychologistName, pending }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  function confirm() {
    setError(null);
    startTransition(async () => {
      const result = await cancelMyAppointmentAction(appointmentId, reason.trim() || null);
      if (result.ok) {
        setOpen(false);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        className="user-btn user-btn--quiet"
        onClick={() => setOpen(true)}
        aria-label={`${pending ? 'Retirar solicitud' : 'Cancelar cita'} con ${psychologistName}`}
      >
        {pending ? 'Retirar solicitud' : 'Cancelar cita'}
      </button>
    );
  }

  return (
    <div className="user-cancel-box">
      <div className="user-field">
        <label className="user-label" htmlFor={`cancel-reason-${appointmentId}`}>
          Motivo (opcional)
        </label>
        <input
          id={`cancel-reason-${appointmentId}`}
          className="user-input"
          type="text"
          maxLength={300}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="Para que tu psicólogo lo sepa"
        />
      </div>
      {error ? (
        <p role="alert" className="user-notice user-notice--error">
          {error}
        </p>
      ) : null}
      <div className="user-habit-actions">
        <button type="button" className="user-btn user-btn--danger" disabled={isPending} onClick={confirm}>
          {isPending ? 'Cancelando…' : 'Confirmar cancelación'}
        </button>
        <button type="button" className="user-btn user-btn--quiet" disabled={isPending} onClick={() => setOpen(false)}>
          Volver
        </button>
      </div>
    </div>
  );
}
