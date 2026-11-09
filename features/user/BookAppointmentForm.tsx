'use client';

import Link from 'next/link';
import { useMemo, useState, useTransition } from 'react';
import { createAppointmentAction } from '@/app/(user)/dashboard/citas/actions';
import type { PsychologistProfilePublic } from '@/services/psy/psychologists.service';

type Props = {
  profile: PsychologistProfilePublic;
};

function toTomorrowDateValue() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** JS getDay(): 0=Sun..6=Sat. Modelo: 1=Lunes..7=Domingo. */
function jsDayToModelWeekday(jsDay: number) {
  return jsDay === 0 ? 7 : jsDay;
}

function hoursForDate(dateValue: string, profile: PsychologistProfilePublic): string[] {
  if (!dateValue) return [];
  const [y, m, d] = dateValue.split('-').map(Number);
  const jsDay = new Date(y, m - 1, d).getDay();
  const weekday = jsDayToModelWeekday(jsDay);
  const slots = profile.availability.filter((s) => s.weekday === weekday);
  const hours: string[] = [];
  for (const slot of slots) {
    const [sh, sm] = slot.start.split(':').map(Number);
    const [eh, em] = slot.end.split(':').map(Number);
    const endMinutes = eh * 60 + em;
    // Cada hora completa que empiece dentro de la franja y quepa antes del cierre.
    for (let h = Math.ceil((sh * 60 + sm) / 60); (h + 1) * 60 <= endMinutes; h++) {
      hours.push(`${String(h).padStart(2, '0')}:00`);
    }
  }
  // dedupe and sort
  return Array.from(new Set(hours)).sort();
}

export default function BookAppointmentForm({ profile }: Props) {
  const [isPending, startTransition] = useTransition();
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [type, setType] = useState<'FIRST_SESSION' | 'FOLLOW_UP'>('FIRST_SESSION');
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState<
    { kind: 'success' | 'error'; text: string } | null
  >(null);

  const minDate = useMemo(() => toTomorrowDateValue(), []);
  const hourOptions = useMemo(() => hoursForDate(date, profile), [date, profile]);
  const noAvailability = profile.availability.length === 0;

  function onDateChange(value: string) {
    setDate(value);
    setTime('');
    setMessage(null);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    if (!date || !time) {
      setMessage({ kind: 'error', text: 'Selecciona fecha y hora.' });
      return;
    }
    const [y, m, d] = date.split('-').map(Number);
    const [hh, mm] = time.split(':').map(Number);
    const startsAt = new Date(y, m - 1, d, hh, mm, 0, 0).toISOString();

    startTransition(async () => {
      const result = await createAppointmentAction({
        psychologistId: profile.id,
        startsAt,
        durationMinutes: 60,
        type,
        reason: reason.trim() ? reason.trim() : null,
      });
      if (result.ok) {
        setMessage({
          kind: 'success',
          text: 'Cita reservada. Quedó confirmada en tu agenda.',
        });
        setDate('');
        setTime('');
        setReason('');
      } else {
        setMessage({ kind: 'error', text: result.error });
      }
    });
  }

  return (
    <div className="user-card user-raise">
      <div className="user-panel-head">
        <span className="user-eyebrow">Reserva</span>
        <h2 className="user-title">Solicitar cita</h2>
      </div>

      {noAvailability ? (
        <p className="user-lede" role="status">
          Este profesional no tiene horarios de disponibilidad publicados por ahora.
        </p>
      ) : (
        <form onSubmit={onSubmit} className="user-card-stack">
          <div className="user-field">
            <label className="user-label" htmlFor="booking-date">Fecha</label>
            <input
              className="user-input"
              id="booking-date"
              name="date"
              type="date"
              min={minDate}
              value={date}
              onChange={(e) => onDateChange(e.target.value)}
              required
              disabled={isPending}
            />
          </div>

          <div className="user-field">
            <label className="user-label" htmlFor="booking-time">Hora</label>
            <select
              className="user-input"
              id="booking-time"
              name="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              required
              disabled={isPending || !date || hourOptions.length === 0}
            >
              <option value="">
                {!date
                  ? 'Selecciona una fecha primero'
                  : hourOptions.length === 0
                    ? 'Sin horarios para ese día'
                    : 'Selecciona una hora'}
              </option>
              {hourOptions.map((h) => (
                <option key={h} value={h}>{h}</option>
              ))}
            </select>
            {date && hourOptions.length === 0 ? (
              <p className="user-lede" role="status">
                No hay horarios disponibles para la fecha seleccionada.
              </p>
            ) : null}
          </div>

          <div className="user-field">
            <label className="user-label" htmlFor="booking-type">Tipo de sesión</label>
            <select
              className="user-input"
              id="booking-type"
              name="type"
              value={type}
              onChange={(e) => setType(e.target.value as 'FIRST_SESSION' | 'FOLLOW_UP')}
              disabled={isPending}
            >
              <option value="FIRST_SESSION">Primera sesión</option>
              <option value="FOLLOW_UP">Seguimiento</option>
            </select>
          </div>

          <div className="user-field">
            <label className="user-label" htmlFor="booking-reason">Motivo (opcional)</label>
            <textarea
              className="user-input"
              id="booking-reason"
              name="reason"
              maxLength={500}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={isPending}
              rows={3}
            />
          </div>

          <div aria-live="polite" aria-atomic="true">
            {message ? (
              <p role={message.kind === 'error' ? 'alert' : 'status'} className="user-lede">
                {message.text}
                {message.kind === 'success' ? (
                  <>
                    {' '}
                    <Link href="/dashboard/citas">Ver mis citas</Link>
                  </>
                ) : null}
              </p>
            ) : null}
          </div>

          <div>
            <button className="user-btn user-btn--primary" type="submit" disabled={isPending}>
              {isPending ? 'Enviando…' : 'Solicitar cita'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
