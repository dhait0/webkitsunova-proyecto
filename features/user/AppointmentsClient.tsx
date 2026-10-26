'use client';

import { useState, useTransition } from 'react';
import { requestAppointmentAction } from '@/app/(user)/dashboard/citas/actions';
import { getAvailablePsychologistsAction } from '@/app/(user)/dashboard/psicologos/actions';
import Link from 'next/link';

type Session = {
  id: string;
  email: string;
  role: string;
  status: string;
  profile?: { firstName?: string | null; lastName?: string | null; username?: string | null } | null;
};

type AppointmentItem = {
  id: string;
  psychologistUserId: string;
  psychologistName: string;
  startsAt: string;
  endsAt: string;
  type: string;
  status: string;
  reason: string;
  patientNote?: string | null;
};

type AvailabilitySlot = {
  id: string;
  weekday: number;
  startMinutes: number;
  endMinutes: number;
};

type Psychologist = {
  id: string;
  name: string;
  bio: string | null;
  specialties: string[];
  sessionPrice: number | null;
  currency: string;
  availability: AvailabilitySlot[];
};

const WEEKDAY_LABELS = ['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendiente',
  CONFIRMED: 'Confirmada',
  COMPLETED: 'Completada',
  CANCELLED: 'Cancelada',
  NO_SHOW: 'No asistida',
};

function formatDateTime(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return iso;
  }
}

function minutesToTime(m: number) {
  const h = Math.floor(m / 60).toString().padStart(2, '0');
  const min = (m % 60).toString().padStart(2, '0');
  return `${h}:${min}`;
}

export default function AppointmentsClient({
  session,
  initialAppointments,
}: {
  session: Session;
  initialAppointments: { success: boolean; appointments: AppointmentItem[]; pagination: any } | null;
}) {
  const displayName =
    session.profile?.firstName?.trim() || session.profile?.lastName?.trim() || session.profile?.username?.trim() || session.email;

  const [appointments, setAppointments] = useState<AppointmentItem[]>(initialAppointments?.appointments ?? []);
  const [isPending, startTransition] = useTransition();
  const [showBooking, setShowBooking] = useState(false);
  const [psychologists, setPsychologists] = useState<Psychologist[]>([]);
  const [loadingPs, setLoadingPs] = useState(false);
  const [selectedPsych, setSelectedPsych] = useState<Psychologist | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState<{ startMinutes: number } | null>(null);
  const [duration, setDuration] = useState(60);
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const loadPsychologists = () => {
    setLoadingPs(true);
    startTransition(async () => {
      try {
        const data = await getAvailablePsychologistsAction();
        setPsychologists(data as Psychologist[]);
      } catch (e) {
        setMessage({ type: 'err', text: 'No se pudieron cargar los psicólogos' });
      } finally {
        setLoadingPs(false);
      }
    });
  };

  const openBooking = () => {
    setShowBooking(true);
    setMessage(null);
    if (psychologists.length === 0) {
      loadPsychologists();
    }
  };

  const getAvailableDays = () => {
    if (!selectedPsych) return [];
    const days = new Set(selectedPsych.availability.map((s) => s.weekday));
    return Array.from(days).sort();
  };

  const getSlotsForDate = () => {
    if (!selectedPsych || !selectedDate) return [];
    const d = new Date(selectedDate + 'T00:00:00');
    const weekday = ((d.getDay() + 6) % 7) + 1;
    return selectedPsych.availability
      .filter((s) => s.weekday === weekday)
      .map((s) => ({ startMinutes: s.startMinutes, endMinutes: s.endMinutes }))
      .sort((a, b) => a.startMinutes - b.startMinutes);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPsych || !selectedDate || !selectedSlot) {
      setMessage({ type: 'err', text: 'Selecciona psicólogo, fecha y horario' });
      return;
    }

    const d = new Date(selectedDate + 'T00:00:00');
    d.setHours(Math.floor(selectedSlot.startMinutes / 60), selectedSlot.startMinutes % 60, 0, 0);
    if (d <= new Date()) {
      setMessage({ type: 'err', text: 'Selecciona un horario futuro' });
      return;
    }

    const formData = new FormData();
    formData.append('psychologistId', selectedPsych.id);
    formData.append('startsAt', d.toISOString());
    formData.append('durationMinutes', String(duration));
    formData.append('type', 'FIRST_SESSION');
    if (reason.trim()) formData.append('reason', reason.trim());

    startTransition(async () => {
      const res = await requestAppointmentAction(formData);
      if (res.success) {
        setMessage({ type: 'ok', text: 'Solicitud enviada. Pendiente de confirmación por el psicólogo.' });
        setShowBooking(false);
        setSelectedPsych(null);
        setSelectedDate('');
        setSelectedSlot(null);
        setReason('');
        // Refresh appointments list
        try {
          const { getMyAppointmentsAction } = await import('@/app/(user)/dashboard/citas/actions');
          const updated = await getMyAppointmentsAction({ scope: 'upcoming', page: 1, limit: 50 });
          setAppointments(updated.appointments);
        } catch {}
      } else {
        setMessage({ type: 'err', text: res.message || 'No se pudo solicitar la cita' });
      }
    });
  };

  return (
    <section className="user-page">
      <div className="user-page-head">
        <div className="user-page-head-copy">
          <span className="user-eyebrow">Citas</span>
          <h2 className="user-headline">Mis citas con psicólogos</h2>
          <p className="user-lede">
            {displayName}, solicita y gestiona tus sesiones con profesionales activos y aprobados.
          </p>
        </div>
        <div className="user-page-head-meta">
          <button className="user-btn user-btn--primary" type="button" onClick={openBooking} disabled={isPending}>
            Solicitar cita
          </button>
        </div>
      </div>

      {message && (
        <div className={`user-card ${message.type === 'ok' ? 'user-card--accent' : ''}`} style={{ marginBottom: '1rem' }}>
          <p>{message.text}</p>
        </div>
      )}

      {showBooking && (
        <div className="user-card user-card-stack" style={{ marginBottom: '1.5rem' }}>
          <div className="user-panel-head">
            <h3 className="user-title">Nueva solicitud de cita</h3>
          </div>
          {loadingPs ? (
            <p>Cargando psicólogos...</p>
          ) : (
            <form onSubmit={handleSubmit} className="user-form" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="user-label">Psicólogo</label>
                <select
                  className="user-input"
                  value={selectedPsych?.id || ''}
                  onChange={(e) => {
                    const p = psychologists.find((x) => x.id === e.target.value) || null;
                    setSelectedPsych(p);
                    setSelectedDate('');
                    setSelectedSlot(null);
                  }}
                  required
                >
                  <option value="">Selecciona un psicólogo</option>
                  {psychologists.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.specialties.length ? `- ${p.specialties.join(', ')}` : ''}
                    </option>
                  ))}
                </select>
                {selectedPsych && (
                  <div style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
                    {selectedPsych.bio && <p>{selectedPsych.bio}</p>}
                    <p>
                      <strong>Disponibilidad:</strong>{' '}
                      {Array.from(new Set(selectedPsych.availability.map((s) => WEEKDAY_LABELS[s.weekday]))).join(', ')}
                    </p>
                    {selectedPsych.sessionPrice != null && (
                      <p>
                        <strong>Precio sesión:</strong> {selectedPsych.sessionPrice} {selectedPsych.currency}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {selectedPsych && getAvailableDays().length > 0 && (
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
              )}

              {selectedDate && getSlotsForDate().length > 0 && (
                <div>
                  <label className="user-label">Horario disponible</label>
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
                <textarea
                  className="user-input"
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Describe brevemente el motivo de tu consulta"
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button className="user-btn user-btn--primary" type="submit" disabled={isPending}>
                  {isPending ? 'Enviando...' : 'Solicitar cita'}
                </button>
                <button className="user-btn user-btn--quiet" type="button" onClick={() => setShowBooking(false)} disabled={isPending}>
                  Cancelar
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      <div className="user-grid">
        {appointments.length === 0 ? (
          <article className="user-card user-card-stack">
            <div className="user-panel-head">
              <span className="user-eyebrow">Sin citas</span>
              <h2 className="user-title">Aún no tienes citas solicitadas</h2>
            </div>
            <p>Solicita tu primera cita con un psicólogo disponible para comenzar tu acompañamiento.</p>
            <div>
              <button className="user-btn user-btn--primary" type="button" onClick={openBooking}>
                Solicitar cita
              </button>
            </div>
          </article>
        ) : (
          appointments.map((appointment) => (
            <article key={appointment.id} className="user-card user-card-stack user-raise">
              <div className="user-panel-head">
                <span className="user-eyebrow">Cita</span>
                <h2 className="user-title">{appointment.psychologistName}</h2>
              </div>
              <p>
                <strong>Fecha y hora:</strong> {formatDateTime(appointment.startsAt)}
              </p>
              <p>
                <strong>Tipo:</strong> {appointment.type === 'FIRST_SESSION' ? 'Primera sesión' : appointment.type === 'FOLLOW_UP' ? 'Seguimiento' : 'Urgente'}
              </p>
              <p>
                <strong>Motivo:</strong> {appointment.reason}
              </p>
              <span className="user-pill">{STATUS_LABELS[appointment.status] || appointment.status}</span>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
