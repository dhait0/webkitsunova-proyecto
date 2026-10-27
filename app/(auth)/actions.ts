'use server';

import { prisma } from '@/lib/db/prisma';
import { createAdminClient } from '@/lib/supabase/admin';

export type RegisterUserPayload = {
  email: string;
  password: string;
  username?: string;
  role?: 'USER' | 'PSYCHOLOGIST';
};

export type RegisterUserResult =
  | { success: true; message: string; needsConfirmation: boolean }
  | { success: false; message: string };

export async function registerUser(
  payload: RegisterUserPayload
): Promise<RegisterUserResult> {
  if ((payload as any).role === 'ADMIN') {
    return { success: false, message: 'No está permitido registrar cuentas de administrador' };
  }

  const role: 'USER' | 'PSYCHOLOGIST' = payload.role === 'PSYCHOLOGIST' ? 'PSYCHOLOGIST' : 'USER';

  const supabase = createAdminClient();

  const { data, error } = await supabase.auth.admin.createUser({
    email: payload.email,
    password: payload.password,
    email_confirm: false,
    app_metadata: { role },
    user_metadata: {
      username: payload.username,
      role,
    },
  });

  if (error || !data.user) {
    return { success: false, message: error?.message ?? 'No se pudo crear la cuenta' };
  }

  try {
    if (role === 'PSYCHOLOGIST') {
      const user = await prisma.user.create({
        data: {
          id: data.user.id,
          email: payload.email,
          passwordHash: '',
          role: 'PSYCHOLOGIST',
          status: 'PENDING',
          profile: {
            create: {
              username: payload.username ?? null,
            },
          },
        },
      });
      const profile = await prisma.profile.findUnique({ where: { userId: user.id } });
      if (profile) {
        await prisma.psychologistProfile.create({
          data: {
            profileId: profile.id,
            isApproved: false,
            isVerified: false,
          },
        });
      }
    } else {
      await prisma.user.create({
        data: {
          id: data.user.id,
          email: payload.email,
          passwordHash: '',
          role: 'USER',
          status: 'PENDING',
          profile: {
            create: {
              username: payload.username ?? null,
            },
          },
        },
      });
    }
  } catch {
    await supabase.auth.admin.deleteUser(data.user.id);
    return { success: false, message: 'No se pudo crear el perfil local' };
  }

  if (role === 'PSYCHOLOGIST') {
    return {
      success: true,
      message: 'Cuenta de psicólogo creada. Revisa tu correo para confirmar el acceso. Tu perfil quedará pendiente de aprobación.',
      needsConfirmation: true,
    };
  }

  return {
    success: true,
    message: 'Cuenta creada. Revisa tu correo para confirmar el acceso.',
    needsConfirmation: true,
  };
}
