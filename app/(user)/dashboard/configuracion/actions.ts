'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { authorize } from '@/lib/auth/guard';
import { changeUserPassword, updateUserProfile } from '@/services/user/settings.service';

/** Personal data and password belong to the signed-in account, whatever its role. */
export type SettingsActionResult = { success: boolean; message: string };

const profileSchema = z.object({
  firstName: z.string().trim().max(60, 'El nombre es demasiado largo').optional(),
  lastName: z.string().trim().max(60, 'El apellido es demasiado largo').optional(),
  username: z
    .string()
    .trim()
    .min(3, 'El nombre de usuario debe tener entre 3 y 30 caracteres')
    .max(30, 'El nombre de usuario debe tener entre 3 y 30 caracteres')
    .regex(/^[a-zA-Z0-9._]+$/, 'El nombre de usuario solo puede usar letras, números, punto y guion bajo'),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'La contraseña actual es obligatoria'),
    newPassword: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
    confirmPassword: z.string().min(1, 'Confirma la nueva contraseña'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

export async function updateProfileAction(formData: FormData): Promise<SettingsActionResult> {
  const session = await authorize(['USER', 'PSYCHOLOGIST', 'ADMIN']);
  if (!session) {
    return { success: false, message: 'No autorizado' };
  }

  const parsed = profileSchema.safeParse({
    firstName: typeof formData.get('firstName') === 'string' ? formData.get('firstName') : '',
    lastName: typeof formData.get('lastName') === 'string' ? formData.get('lastName') : '',
    username: typeof formData.get('username') === 'string' ? formData.get('username') : '',
  });

  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  }

  try {
    await updateUserProfile(session.id, {
      firstName: parsed.data.firstName || null,
      lastName: parsed.data.lastName || null,
      username: parsed.data.username,
    });
    revalidatePath('/dashboard/configuracion');
    revalidatePath('/dashboard');
    return { success: true, message: 'Perfil actualizado correctamente' };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'No se pudo actualizar el perfil',
    };
  }
}

export async function changePasswordAction(formData: FormData): Promise<SettingsActionResult> {
  const session = await authorize(['USER', 'PSYCHOLOGIST', 'ADMIN']);
  if (!session) {
    return { success: false, message: 'No autorizado' };
  }

  const parsed = passwordSchema.safeParse({
    currentPassword: typeof formData.get('currentPassword') === 'string' ? formData.get('currentPassword') : '',
    newPassword: typeof formData.get('newPassword') === 'string' ? formData.get('newPassword') : '',
    confirmPassword: typeof formData.get('confirmPassword') === 'string' ? formData.get('confirmPassword') : '',
  });

  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  }

  try {
    await changeUserPassword(session.id, session.email, parsed.data.currentPassword, parsed.data.newPassword);
    return { success: true, message: 'Contraseña actualizada correctamente' };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'No se pudo cambiar la contraseña',
    };
  }
}
