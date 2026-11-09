'use server';

import { requireUser } from '@/lib/auth/guard';
import {
  HABIT_STATUSES,
  createHabit,
  deleteHabit,
  setHabitCompletion,
  updateHabit,
} from '@/services/user/habits.service';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const habitTitleSchema = z.string().trim().min(1, 'El título es obligatorio').max(80, 'El título debe tener máximo 80 caracteres');
const habitDescriptionSchema = z.string().max(500, 'La descripción debe tener máximo 500 caracteres').optional();
const habitStatusSchema = z.enum(HABIT_STATUSES, {
  errorMap: () => ({ message: 'El estado no es válido' }),
});
const targetSchema = z.coerce
  .number({ invalid_type_error: 'La meta semanal debe ser un número' })
  .int('La meta semanal debe ser un número entero')
  .min(1, 'La meta semanal debe estar entre 1 y 7 días')
  .max(7, 'La meta semanal debe estar entre 1 y 7 días');
const habitIdSchema = z.string().trim().min(1, 'Identificador de hábito no válido');
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha no válida');

export type HabitActionResult = { success: boolean; message?: string };

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

function text(formData: FormData, name: string): string | undefined {
  const value = formData.get(name);
  return typeof value === 'string' ? value : undefined;
}

function failure(error: unknown, fallback: string): HabitActionResult {
  return { success: false, message: error instanceof Error ? error.message : fallback };
}

const refresh = () => {
  revalidatePath('/dashboard/habitos');
  revalidatePath('/dashboard');
};

export async function createHabitAction(formData: FormData): Promise<HabitActionResult> {
  const auth = await requireActiveUser();
  if (!auth.success) return { success: false, message: auth.message };

  const parsed = z
    .object({ title: habitTitleSchema, description: habitDescriptionSchema, targetPerWeek: targetSchema })
    .safeParse({
      title: formData.get('title'),
      description: text(formData, 'description'),
      targetPerWeek: text(formData, 'targetPerWeek') ?? '7',
    });
  if (!parsed.success) return { success: false, message: zodMessage(parsed.error) };

  try {
    await createHabit(auth.session.id, {
      title: parsed.data.title,
      description: parsed.data.description?.trim() || null,
      targetPerWeek: parsed.data.targetPerWeek,
    });
    refresh();
    return { success: true };
  } catch (error) {
    return failure(error, 'No se pudo crear el hábito');
  }
}

export async function updateHabitAction(formData: FormData): Promise<HabitActionResult> {
  const auth = await requireActiveUser();
  if (!auth.success) return { success: false, message: auth.message };

  const habitId = habitIdSchema.safeParse(formData.get('habitId'));
  if (!habitId.success) return { success: false, message: zodMessage(habitId.error) };

  const title = text(formData, 'title');
  const description = text(formData, 'description');
  const status = text(formData, 'status');
  const target = text(formData, 'targetPerWeek');

  if (title !== undefined) {
    const parsed = habitTitleSchema.safeParse(title);
    if (!parsed.success) return { success: false, message: zodMessage(parsed.error) };
  }
  if (description !== undefined) {
    const parsed = habitDescriptionSchema.safeParse(description);
    if (!parsed.success) return { success: false, message: zodMessage(parsed.error) };
  }
  if (status !== undefined) {
    const parsed = habitStatusSchema.safeParse(status);
    if (!parsed.success) return { success: false, message: zodMessage(parsed.error) };
  }
  if (target !== undefined) {
    const parsed = targetSchema.safeParse(target);
    if (!parsed.success) return { success: false, message: zodMessage(parsed.error) };
  }

  try {
    await updateHabit(auth.session.id, habitId.data, {
      title: title?.trim(),
      description: description === undefined ? undefined : description.trim() || null,
      status,
      targetPerWeek: target === undefined ? undefined : Number(target),
    });
    refresh();
    return { success: true };
  } catch (error) {
    return failure(error, 'No se pudo actualizar el hábito');
  }
}

/** Marks (done=true) or unmarks (done=false) a habit on a day; today when `date` is omitted. */
export async function setHabitCompletionAction(
  habitId: string,
  date: string | null,
  done: boolean,
): Promise<HabitActionResult> {
  const auth = await requireActiveUser();
  if (!auth.success) return { success: false, message: auth.message };

  const parsed = z
    .object({ habitId: habitIdSchema, date: dateSchema.nullable(), done: z.boolean() })
    .safeParse({ habitId, date, done });
  if (!parsed.success) return { success: false, message: zodMessage(parsed.error) };

  try {
    await setHabitCompletion(auth.session.id, parsed.data.habitId, {
      date: parsed.data.date ?? undefined,
      done: parsed.data.done,
    });
    refresh();
    return { success: true };
  } catch (error) {
    return failure(error, 'No se pudo registrar el cumplimiento');
  }
}

export async function deleteHabitAction(formData: FormData): Promise<HabitActionResult> {
  const auth = await requireActiveUser();
  if (!auth.success) return { success: false, message: auth.message };

  const habitId = habitIdSchema.safeParse(formData.get('habitId'));
  if (!habitId.success) return { success: false, message: zodMessage(habitId.error) };

  try {
    await deleteHabit(auth.session.id, habitId.data);
    refresh();
    return { success: true };
  } catch (error) {
    return failure(error, 'No se pudo eliminar el hábito');
  }
}
