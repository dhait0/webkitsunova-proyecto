'use client';

import { useState, useTransition } from 'react';
import { requestAppointmentAction } from '@/app/(user)/dashboard/citas/actions';

type Psychologist = {
  id: string;
  name: string;
  bio: string | null;
  specialties: string[];
  sessionPrice: number | null;
  currency: string;
  availability: Array<{ weekday: number; startMinutes: number; endMinutes: number }>;
};

const WEEKDAY_LABELS = ['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

function minutesToTime(m: number) {
  const h = Math.floor(m / 60).toString().padStart(2, '0');
  const min = (m % 60).toString().padStart(2, '0');
  return `${h}:${min}`;
}

export default function PsychologistsClient({ psychologists }: { psychologists: Psychologist[] }) {
  const [isPending, startTransition] = useTransition();
  const [selected, setSelected] = useState<Psychologist | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState<{ startMinutes: number } | null>(null);
  const [duration, setDuration] = useState(60);
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const getSlotsForDate = () => {
    if (!selected || !selectedDate) return [];
    const d = new Date(selectedDate + 'T00:00:00');
    const weekday = ((d.getDay() + 6) % 7) + 1;
    return selected.availability
      .filter((s) => s.weekday === weekday)
      .map((s) => ({ startMinutes: s.startMinutes, endMinutes: s.endMinutes }))
      .sort((a, b) => a.startMinutes - b.startMinutes);
  };

  const handleRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected || !selectedDate || !selectedSlot) {
      setMessage({ type: 'err', text: 'Selecciona fecha y horario' });
      return;
    }
    const d = new Date(selectedDate + 'T00:00:00');
    d.setHours(Math.floor(selectedSlot.startMinutes / 60), selectedSlot.startMinutes % 60, 0, 0);
    if (d <= new Date()) {
      setMessage({ type: 'err', text: 'Selecciona un horario futuro' });
      return;
    }

    const formData = new FormData();
    formData.append('psychologistId', selected.id);
    formData.append('startsAt', d.toISOString());
    formData.append('durationMinutes', String(duration));
    formData.append('type', 'FIRST_SESSION');
    if (reason.trim()) formData.append('reason', reason.trim());

    startTransition(async () => {
      const res = await requestAppointmentAction(formData);
      if (res.success) {
        setMessage({ type: 'ok', text: 'Solicitud enviada. Pendiente de confirmación.' });
        setSelected(null);
        setSelectedDate('');
        setSelectedSlot(null);
        setReason('');
      } else {
        setMessage({ type: 'err', text: res.message || 'Error al solicitar cita' });
      }
    });
  };

  return (
    <section className="user-page">
      <div className="user-page-head">
        <div className="user-page-head-copy">
          <span className="user-eyebrow">Psicólogos</span>
          <h2 className="user-headline">Red clínica disponible</h2>
          <p className="user-lede">Profesionales activos, aprobados y con disponibilidad para recibir solicitudes.</p>
        </div>
      </div>

      {message && (
        <div className={`user-card ${message.type === 'ok' ? 'user-card--accent' : ''}`} style={{ marginBottom: '1rem' }}>
          <p>{message.text}</p>
        </div>
      )}

      {selected ? (
        <div className="user-card user-card-stack" style={{ marginBottom: '1.5rem' }}>
          <div className="user-panel-head">
            <h3 className="user-title">Solicitar cita con {selected.name}</h3>
          </div>
          <p>{selected.bio}</p>
          <form onSubmit={handleRequest} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label className="user-label">Fecha</label>
              <input
                type="date"
                className="user-input"
                value={selectedDate}
                min={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setSelectedSlot(null);
                }}
                required
              />
            </div>
            {selectedDate && getSlotsForDate().length > 0 && (
              <div>
                <label className="user-label">Horario</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {getSlotsForDate().map((slot, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className={`user-btn ${selectedSlot?.startMinutes === slot.startMinutes ? 'user-btn--primary' : 'user-btn--quiet'}`}
                      onClick={() => setSelectedSlot({ startMinutes: slot.startMinutes })}
                    >
                      {minutesToTime(slot.startMinutes)} - {minutesToTime(slot.endMinutes)}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div>
              <label className="user-label">Duración (minutos)</label>
              <select className="user-input" value={duration} onChange={(e) => setDuration(Number(e.target.value))}>
                <option value={45}>45</option>
                <option value={60}>60</option>
                <option value={75}>75</option>
                <option value={90}>90</option>
              </select>
            </div>
            <div>
              <label className="user-label">Motivo (opcional)</label>
              <textarea className="user-input" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button className="user-btn user-btn--primary" type="submit" disabled={isPending}>
                {isPending ? 'Enviando...' : 'Enviar solicitud'}
              </button>
              <button className="user-btn user-btn--quiet" type="button" onClick={() => setSelected(null)} disabled={isPending}>
                Volver
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="user-grid">
          {psychologists.length === 0 ? (
            <article className="user-card user-card-stack">
              <div className="user-panel-head">
                <span className="user-eyebrow">Sin psicólogos</span>
                <h2 className="user-title">No hay psicólogos disponibles</h2>
              </div>
              <p>En este momento no hay profesionales activos, aprobados y aceptando nuevos pacientes.</p>
            </article>
          ) : (
            psychologists.map((psychologist) => (
              <article key={psychologist.id} className="user-card user-card-stack user-raise">
                <div className="user-panel-head">
                  <span className="user-eyebrow">Psicólogo</span>
                  <h2 className="user-title">{psychologist.name}</h2>
                </div>
                {psychologist.specialties.length > 0 && (
                  <span className="user-pill">{psychologist.specialties.slice(0, 2).join(', ')}</span>
                )}
                {psychologist.bio && <p>{psychologist.bio}</p>}
                <p>
                  <strong>Disponibilidad:</strong>{' '}
                  {Array.from(new Set(psychologist.availability.map((s) => WEEKDAY_LABELS[s.weekday]))).join(', ') || 'Consultar'}
                </p>
                {psychologist.sessionPrice != null && (
                  <p>
                    <strong>Precio:</strong> {psychologist.sessionPrice} {psychologist.currency}
                  </p>
                )}
                <div>
                  <button className="user-btn user-btn--primary" type="button" onClick={() => setSelected(psychologist)}>
                    Solicitar cita
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      )}
    </section>
  );
}
