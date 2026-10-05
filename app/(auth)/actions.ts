'use server';

import { prisma } from '@/lib/db/prisma';
import { createAdminClient } from '@/lib/supabase/admin';

export type RegisterUserPayload = {
  email: string;
  password: string;
  username?: string;
};

export type RegisterUserResult =
  | { success: true; message: string; needsConfirmation: boolean }
  | { success: false; message: string };

export async function registerUser(
  payload: RegisterUserPayload
): Promise<RegisterUserResult> {
  const supabase = createAdminClient();

  const { data, error } = await supabase.auth.admin.createUser({
    email: payload.email,
    password: payload.password,
    email_confirm: false,
    user_metadata: {
      username: payload.username,
    },
  });

  if (error || !data.user) {
    return { success: false, message: error?.message ?? 'No se pudo crear la cuenta' };
  }

  try {
    await prisma.user.create({
      data: {
        id: data.user.id,
        email: payload.email,
        passwordHash: '',
        status: 'PENDING',
        profile: {
          create: {
            username: payload.username ?? null,
          },
        },
      },
    });
  } catch {
    await supabase.auth.admin.deleteUser(data.user.id);
    return { success: false, message: 'No se pudo crear el perfil local' };
  }

  return {
    success: true,
    message: 'Cuenta creada. Revisa tu correo para confirmar el acceso.',
    needsConfirmation: true,
  };
}
