'use server';

import { requireUser } from '@/lib/auth/guard';
import { createHabit, deleteHabit, registerHabitProgress, updateHabit } from '@/services/user/habits.service';
import { revalidatePath } from 'next/cache';

export async function createHabitAction(formData: FormData) {
  const session = await requireUser();
  if (session.role !== 'USER') {
    return { success: false, message: 'No autorizado' };
  }
  if (session.status !== 'ACTIVE') {
    return { success: false, message: 'Cuenta no activa' };
  }

  const title = formData.get('title');
  const description = formData.get('description');

  try {
    await createHabit(session.id, {
      title: typeof title === 'string' ? title : '',
      description: typeof description === 'string' ? description : null,
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
  const session = await requireUser();
  if (session.role !== 'USER') {
    return { success: false, message: 'No autorizado' };
  }
  if (session.status !== 'ACTIVE') {
    return { success: false, message: 'Cuenta no activa' };
  }

  const habitId = formData.get('habitId');
  const title = formData.get('title');
  const description = formData.get('description');
  const status = formData.get('status');

  try {
    await updateHabit(session.id, typeof habitId === 'string' ? habitId : '', {
      title: typeof title === 'string' ? title : undefined,
      description: typeof description === 'string' ? description : description === null ? null : undefined,
      status: typeof status === 'string' ? status : undefined,
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
  const session = await requireUser();
  if (session.role !== 'USER') {
    return { success: false, message: 'No autorizado' };
  }
  if (session.status !== 'ACTIVE') {
    return { success: false, message: 'Cuenta no activa' };
  }

  const habitId = formData.get('habitId');
  const deltaRaw = formData.get('delta');
  const delta = deltaRaw ? Number(deltaRaw) : 10;

  try {
    await registerHabitProgress(session.id, typeof habitId === 'string' ? habitId : '', isNaN(delta) ? 10 : delta);
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
  const session = await requireUser();
  if (session.role !== 'USER') {
    return { success: false, message: 'No autorizado' };
  }
  if (session.status !== 'ACTIVE') {
    return { success: false, message: 'Cuenta no activa' };
  }

  const habitId = formData.get('habitId');

  try {
    await deleteHabit(session.id, typeof habitId === 'string' ? habitId : '');
    revalidatePath('/dashboard/habitos');
    return { success: true };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, message: error.message };
    }
    return { success: false, message: 'No se pudo eliminar el hábito' };
  }
}
