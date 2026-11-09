'use server';

import { requireUser } from '@/lib/auth/guard';
import { createHabit, deleteHabit, registerHabitProgress, updateHabit } from '@/services/user/habits.service';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const habitTitleSchema = z.string().trim().min(1, 'El título es obligatorio').max(80, 'El título debe tener máximo 80 caracteres');
const habitDescriptionSchema = z.string().max(500, 'La descripción debe tener máximo 500 caracteres').optional();
const habitStatusSchema = z.enum(['active', 'completed'], {
  errorMap: () => ({ message: "El estado debe ser 'active' o 'completed'" }),
});
const habitDeltaSchema = z.number().int('El progreso debe ser un número entero').min(1, 'El progreso debe ser entre 1 y 100').max(100, 'El progreso debe ser entre 1 y 100');
const habitIdSchema = z.string().trim().min(1, 'Identificador de hábito no válido');

async function requireActiveUser() {
  const session = await requireUser();
  if (session.role !== 'USER') {
    return { success: false as const, message: 'No autorizado' };
  }
  if (session.status !== 'ACTIVE') {
    return { success: false as const, message: 'Cuenta no activa' };
  }
  return { success: true as const, session };
}

function zodMessage(error: z.ZodError) {
  return error.errors[0]?.message ?? 'Datos no válidos';
}

export async function createHabitAction(formData: FormData) {
  const auth = await requireActiveUser();
  if (!auth.success) return { success: false, message: auth.message };

  const parsed = z
    .object({
      title: habitTitleSchema,
      description: habitDescriptionSchema,
    })
    .safeParse({
      title: formData.get('title'),
      description: typeof formData.get('description') === 'string' ? (formData.get('description') as string) : undefined,
    });
  if (!parsed.success) return { success: false, message: zodMessage(parsed.error) };

  try {
    await createHabit(auth.session.id, {
      title: parsed.data.title,
      description: parsed.data.description?.trim() || null,
    });
    revalidatePath('/dashboard/habitos');
    return { success: true };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, message: error.message };
    }
    return { success: false, message: 'No se pudo crear el hábito' };
  }
}

export async function updateHabitAction(formData: FormData) {
  const auth = await requireActiveUser();
  if (!auth.success) return { success: false, message: auth.message };

  const habitIdParsed = habitIdSchema.safeParse(formData.get('habitId'));
  if (!habitIdParsed.success) return { success: false, message: zodMessage(habitIdParsed.error) };

  const titleRaw = formData.get('title');
  const descriptionRaw = formData.get('description');
  const statusRaw = formData.get('status');

  if (statusRaw !== null && typeof statusRaw === 'string') {
    const statusParsed = habitStatusSchema.safeParse(statusRaw);
    if (!statusParsed.success) return { success: false, message: zodMessage(statusParsed.error) };
  }
  if (titleRaw !== null && typeof titleRaw === 'string') {
    const titleParsed = habitTitleSchema.safeParse(titleRaw);
    if (!titleParsed.success) return { success: false, message: zodMessage(titleParsed.error) };
  }
  if (descriptionRaw !== null && typeof descriptionRaw === 'string') {
    const descParsed = habitDescriptionSchema.safeParse(descriptionRaw);
    if (!descParsed.success) return { success: false, message: zodMessage(descParsed.error) };
  }

  const status = statusRaw !== null && typeof statusRaw === 'string' ? statusRaw : undefined;
  const title = titleRaw !== null && typeof titleRaw === 'string' ? titleRaw.trim() : undefined;
  const description =
    descriptionRaw === null
      ? undefined
      : typeof descriptionRaw === 'string'
        ? descriptionRaw.trim() || null
        : undefined;

  try {
    await updateHabit(auth.session.id, habitIdParsed.data, {
      title,
      description,
      status,
    });
    revalidatePath('/dashboard/habitos');
    return { success: true };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, message: error.message };
    }
    return { success: false, message: 'No se pudo actualizar el hábito' };
  }
}

export async function registerHabitProgressAction(formData: FormData) {
  const auth = await requireActiveUser();
  if (!auth.success) return { success: false, message: auth.message };

  const habitIdParsed = habitIdSchema.safeParse(formData.get('habitId'));
  if (!habitIdParsed.success) return { success: false, message: zodMessage(habitIdParsed.error) };

  const deltaRaw = formData.get('delta');
  const deltaNum = deltaRaw === null || deltaRaw === '' ? 10 : Number(deltaRaw);
  const deltaParsed = habitDeltaSchema.safeParse(deltaNum);
  if (!deltaParsed.success) return { success: false, message: zodMessage(deltaParsed.error) };

  try {
    await registerHabitProgress(auth.session.id, habitIdParsed.data, deltaParsed.data);
    revalidatePath('/dashboard/habitos');
    return { success: true };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, message: error.message };
    }
    return { success: false, message: 'No se pudo registrar el progreso' };
  }
}

export async function deleteHabitAction(formData: FormData) {
  const auth = await requireActiveUser();
  if (!auth.success) return { success: false, message: auth.message };

  const habitIdParsed = habitIdSchema.safeParse(formData.get('habitId'));
  if (!habitIdParsed.success) return { success: false, message: zodMessage(habitIdParsed.error) };

  try {
    await deleteHabit(auth.session.id, habitIdParsed.data);
    revalidatePath('/dashboard/habitos');
    return { success: true };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, message: error.message };
    }
    return { success: false, message: 'No se pudo eliminar el hábito' };
  }
}
