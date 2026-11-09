'use server';

import { authorize } from '@/lib/auth/guard';
import { z } from 'zod';
import {
  AppointmentConflictError,
  listAppointments,
  updateAppointmentStatus,
} from '@/services/psy/appointments.service';

const statusInputSchema = z.object({
  id: z.string().trim().min(1),
  status: z.enum(['CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW']),
  cancelReason: z.string().trim().max(300).nullish(),
});

export type AppointmentStatusResult = { ok: true } | { ok: false; error: string };

export async function getAppointmentsAction(query: Record<string, unknown>) {
  const session = await authorize(['PSYCHOLOGIST']);
  if (!session) throw new Error('No autorizado');
  return listAppointments(session.id, query);
}

/**
 * Changes the status of one of the signed-in psychologist's appointments.
 * Business refusals come back as `{ ok: false, error }` because production masks
 * the message of an error thrown from a Server Action.
 */
export async function updateAppointmentStatusAction(
  id: string,
  status: 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW',
  cancelReason?: string | null
): Promise<AppointmentStatusResult> {
  const session = await authorize(['PSYCHOLOGIST']);
  if (!session) throw new Error('No autorizado');

  const parsed = statusInputSchema.safeParse({ id, status, cancelReason });
  if (!parsed.success) return { ok: false, error: 'Datos no válidos' };

  try {
    const updated = await updateAppointmentStatus(
      session.id,
      parsed.data.id,
      parsed.data.status,
      parsed.data.cancelReason ?? null,
    );
    return updated ? { ok: true } : { ok: false, error: 'Sesión no encontrada' };
  } catch (error) {
    if (error instanceof AppointmentConflictError) {
      return { ok: false, error: error.message };
    }
    throw error;
  }
}
