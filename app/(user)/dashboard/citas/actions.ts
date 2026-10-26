'use server';

import { getSessionUser, requireUser } from '@/lib/auth/guard';
import {
  listPatientAppointments,
  requestAppointmentByUser,
  AppointmentConflictError,
} from '@/services/psy/appointments.service';
import { z } from 'zod';

const requestSchema = z.object({
  psychologistId: z.string().min(1),
  startsAt: z.string().datetime(),
  durationMinutes: z.coerce.number().int().min(30).max(120),
  type: z.enum(['FIRST_SESSION', 'FOLLOW_UP', 'URGENT']).optional(),
  reason: z.string().max(500).optional().nullable(),
  patientNote: z.string().max(500).optional().nullable(),
});

export async function getMyAppointmentsAction(query: Record<string, unknown> = {}) {
  const session = await getSessionUser();
  if (!session) throw new Error('No autenticado');
  if (session.role !== 'USER') throw new Error('No autorizado');
  if (session.status !== 'ACTIVE') throw new Error('Cuenta no activa');
  return listPatientAppointments(session.id, query);
}

export async function requestAppointmentAction(formData: FormData) {
  const session = await requireUser();
  if (session.role !== 'USER') {
    return { success: false, message: 'No autorizado' };
  }
  if (session.status !== 'ACTIVE') {
    return { success: false, message: 'Cuenta no activa' };
  }

  const raw = {
    psychologistId: formData.get('psychologistId'),
    startsAt: formData.get('startsAt'),
    durationMinutes: formData.get('durationMinutes'),
    type: formData.get('type') || undefined,
    reason: formData.get('reason') || null,
    patientNote: formData.get('patientNote') || null,
  };

  const parsed = requestSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, message: 'Datos inválidos' };
  }

  try {
    const appointment = await requestAppointmentByUser(session.id, {
      psychologistId: parsed.data.psychologistId,
      startsAt: new Date(parsed.data.startsAt),
      durationMinutes: parsed.data.durationMinutes,
      type: parsed.data.type,
      reason: parsed.data.reason,
      patientNote: parsed.data.patientNote,
    });
    return { success: true, appointmentId: appointment.id };
  } catch (error) {
    if (error instanceof AppointmentConflictError) {
      return { success: false, message: error.message };
    }
    return { success: false, message: 'No se pudo solicitar la cita' };
  }
}
