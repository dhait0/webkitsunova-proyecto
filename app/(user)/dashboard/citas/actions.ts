'use server';

import { requireUser } from '@/lib/auth/guard';
import { prisma } from '@/lib/db/prisma';
import {
  AppointmentConflictError,
  createAppointment,
} from '@/services/psy/appointments.service';
import { getPsychologistProfile } from '@/services/psy/psychologists.service';

export type CreateAppointmentActionInput = {
  psychologistId: string;
  startsAt: string | Date;
  durationMinutes: number;
  type: 'FIRST_SESSION' | 'FOLLOW_UP' | 'URGENT';
  reason?: string | null;
};

type OkResult = {
  ok: true;
  appointment: {
    id: string;
    status: string;
    startsAt: string;
  };
};

type FailResult = {
  ok: false;
  error: string;
};

export type CreateAppointmentActionResult = OkResult | FailResult;

/**
 * Crea una reserva desde el área de Usuario.
 *
 * Reglas de seguridad (S09):
 * - El paciente se identifica exclusivamente desde la sesión autenticada
 *   (`requireUser()`); nunca se acepta un `patientId` del cliente.
 * - Se valida la elegibilidad actual del psicólogo (rol PSYCHOLOGIST,
   status ACTIVE, psychologistProfile.isApproved = true) reutilizando
   `getPsychologistProfile`, que solo expone campos públicos.
 * - Se valida el estado real del paciente leyéndolo de Prisma (no del
   `ACTIVE` hardcodeado del guard).
 * - La colisión de horario se rechaza mediante el servicio existente
   `createAppointment` (`AppointmentConflictError`).
 * - El resultado expone solo campos públicos de la cita; nunca datos
   privados del profesional ni del paciente.
 *
 * Nota: la prevención de doble asignación se basa en la detección de
   conflicto existente del servicio (check-then-act). No se afirma como
   una garantía atómica sin una restricción de base de datos; esa
   limitación se preserva sin rediseñar la aplicación.
 */
export async function createAppointmentAction(
  input: CreateAppointmentActionInput,
): Promise<CreateAppointmentActionResult> {
  let session: Awaited<ReturnType<typeof requireUser>>;

  try {
    session = await requireUser();
  } catch {
    return { ok: false, error: 'No autenticado' };
  }

  const patientUserId = session.id;

  // Elegibilidad actual del psicólogo (solo campos públicos).
  const psychologist = await getPsychologistProfile(input.psychologistId);
  if (!psychologist) {
    return {
      ok: false,
      error: 'El psicólogo no está disponible para reservas.',
    };
  }

  // Estado real del paciente leído de la base de datos.
  const patient = await prisma.user.findUnique({
    where: { id: patientUserId },
    select: { id: true, role: true, status: true },
  });

  if (!patient || patient.role !== 'USER') {
    return { ok: false, error: 'Cuenta de paciente no válida.' };
  }

  if (patient.status !== 'ACTIVE') {
    return { ok: false, error: 'La cuenta del paciente no está activa.' };
  }

  const startsAt =
    typeof input.startsAt === 'string' ? new Date(input.startsAt) : input.startsAt;
  const now = new Date();

  if (!Number.isFinite(startsAt.getTime()) || startsAt <= now) {
    return { ok: false, error: 'El horario solicitado no es válido.' };
  }

  try {
    const appointment = await createAppointment(input.psychologistId, {
      patientUserId,
      type: input.type,
      startsAt,
      durationMinutes: input.durationMinutes,
      reason: input.reason ?? null,
    });

    return {
      ok: true,
      appointment: {
        id: appointment.id,
        status: appointment.status,
        startsAt: appointment.startsAt.toISOString(),
      },
    };
  } catch (error) {
    if (error instanceof AppointmentConflictError) {
      return { ok: false, error: error.message };
    }
    throw error;
  }
}
