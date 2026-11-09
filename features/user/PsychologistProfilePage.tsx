'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { PsychologistProfilePublic } from '@/services/psy/psychologists.service';
import { startConversationFromPsychologistAction } from '@/app/(user)/dashboard/mensajes/actions';
import BookAppointmentForm from './BookAppointmentForm';

type Props = {
  profile: PsychologistProfilePublic | null;
  error: string | null;
};

function MessagePsychologistButton({ psychologistUserId }: { psychologistUserId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [msgError, setMsgError] = useState<string | null>(null);

  function onClick() {
    setMsgError(null);
    startTransition(async () => {
      const result = await startConversationFromPsychologistAction(psychologistUserId);
      if (result.success) {
        router.push(`/dashboard/chats?conversationId=${result.conversationId}`);
      } else {
        setMsgError(result.error ?? 'No se pudo iniciar la conversación.');
      }
    });
  }

  return (
    <div className="user-card-stack">
      <button
        className="user-btn user-btn--primary"
        type="button"
        onClick={onClick}
        disabled={isPending}
      >
        {isPending ? 'Abriendo chat…' : 'Enviar mensaje'}
      </button>
      <div aria-live="polite" aria-atomic="true">
        {msgError ? <p role="alert" className="user-lede">{msgError}</p> : null}
      </div>
    </div>
  );
}

export default function PsychologistProfilePage({ profile, error }: Props) {
  if (error) {
    return (
      <section className="user-page">
        <div className="user-page-head">
          <div className="user-page-head-copy">
            <span className="user-eyebrow">Perfil del psicólogo</span>
            <h2 className="user-headline">Perfil no disponible</h2>
          </div>
        </div>
        <div className="user-card user-raise" role="alert">
          <p>{error}</p>
        </div>
      </section>
    );
  }

  if (!profile) {
    return (
      <section className="user-page">
        <div className="user-page-head">
          <div className="user-page-head-copy">
            <span className="user-eyebrow">Perfil del psicólogo</span>
            <h2 className="user-headline">Perfil no encontrado</h2>
          </div>
        </div>
        <div className="user-card user-raise">
          <p>
            No se encontró un psicólogo público con ese identificador o el
            perfil no está disponible en este momento.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="user-page">
      <div className="user-page-head">
        <div className="user-page-head-copy">
          <span className="user-eyebrow">Perfil del psicólogo</span>
          <h2 className="user-headline">{profile.name}</h2>
          {profile.bio ? <p className="user-lede">{profile.bio}</p> : null}
        </div>
        <div className="user-page-head-meta">
          {profile.avatarUrl ? (
            <img
              alt={`Avatar de ${profile.name}`}
              className="user-avatar"
              src={profile.avatarUrl}
            />
          ) : null}
          {profile.isVerified ? (
            <span className="user-pill user-pill--ok">Verificado</span>
          ) : null}
          {profile.isAcceptingNew ? (
            <span className="user-pill user-pill--ok">Aceptando pacientes</span>
          ) : null}
          <MessagePsychologistButton psychologistUserId={profile.id} />
        </div>
      </div>

      <div className="user-card user-raise">
        <div className="user-panel-head">
          {profile.specialties.length > 0 ? (
            <span className="user-eyebrow">Especialidades</span>
          ) : null}
          <h2 className="user-title">Sobre el profesional</h2>
        </div>
        <div className="user-profile-rows">
          {profile.specialties.length > 0 && (
            <div className="user-profile-row">
              <span className="user-eyebrow">Especialidades</span>
              <strong>{profile.specialties.join(', ')}</strong>
            </div>
          )}
          {profile.sessionPrice != null && (
            <div className="user-profile-row">
              <span className="user-eyebrow">Precio por sesión</span>
              <strong>
                {profile.sessionPrice.toLocaleString('es-CO')} {profile.currency}
              </strong>
            </div>
          )}
          <div className="user-profile-row">
            <span className="user-eyebrow">Pacientes activos</span>
            <strong>{profile.patientsCount}</strong>
          </div>
          <div className="user-profile-row">
            <span className="user-eyebrow">Reseñas</span>
            <strong>{profile.reviewsCount}</strong>
          </div>
          <div className="user-profile-row">
            <span className="user-eyebrow">Calificación</span>
            <strong>{profile.rating.toFixed(1)}</strong>
          </div>
        </div>
      </div>

      {profile.availability.length > 0 && (
        <div className="user-card user-raise">
          <div className="user-panel-head">
            <span className="user-eyebrow">Disponibilidad semanal</span>
            <h2 className="user-title">Horarios de atención</h2>
          </div>
          <div className="user-list">
            {profile.availability.map((slot) => (
              <div key={`${slot.weekday}-${slot.start}`} className="user-list-item">
                <strong>{slot.weekdayLabel}</strong>
                <p>{slot.start} – {slot.end}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <BookAppointmentForm profile={profile} />
    </section>
  );
}
